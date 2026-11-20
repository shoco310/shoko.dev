import { useEffect, useRef, useState, type FormEvent } from 'react'
import PageLayout, { PageSection } from '../components/PageLayout'
import Turnstile from '../components/Turnstile'
import { operator } from '../data/site'
import { routeHref } from '../router'
import {
  AGE_OPTIONS,
  AREA_MAX,
  BODY_MAX,
  THEME_OPTIONS,
  validateVoice,
  type SubmitResponse,
  type VoiceField,
  type VoiceInput,
} from '../shared/voice'

type Step = 'input' | 'confirm' | 'done'

const empty: VoiceInput = {
  body: '',
  themeHints: [],
  areaHint: '',
  ageRange: '',
  name: '',
  email: '',
  replyOk: false,
  agreed: false,
}

const fieldLabels: Record<VoiceField, string> = {
  body: '困りごと・ご意見',
  themeHints: '近いテーマ',
  areaHint: 'お住まいの地区',
  ageRange: '年代',
  name: 'お名前',
  email: 'メールアドレス',
  replyOk: '返信の希望',
  agreed: 'プライバシーポリシーへの同意',
}

const submitErrors: Record<string, string> = {
  invalid: '入力内容を確認してください。',
  turnstile_failed: '確認（ロボットでないことの確認）が完了していないか、期限が切れました。もう一度お試しください。',
  rate_limited: '短時間に多くの送信があったため、受け付けできませんでした。1時間ほど時間をおいてから、もう一度お送りください。',
  unavailable: '現在、受付を停止しています。時間をおいてからお試しください。',
}

export default function VoicePage() {
  const [step, setStep] = useState<Step>('input')
  const [v, setV] = useState<VoiceInput>(empty)
  const [errors, setErrors] = useState<Partial<Record<VoiceField, string>>>({})
  const [token, setToken] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [receiptNo, setReceiptNo] = useState<string | null>(null)
  const [hp, setHp] = useState('')
  const [attempted, setAttempted] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

  const set = <K extends keyof VoiceInput>(key: K, value: VoiceInput[K]) => setV(prev => ({ ...prev, [key]: value }))
  const toggleTheme = (t: string) =>
    set('themeHints', v.themeHints.includes(t) ? v.themeHints.filter(x => x !== t) : [...v.themeHints, t])

  // After the first attempt, re-check as the sender corrects fields so
  // fixed errors disappear right away.
  useEffect(() => {
    if (attempted) setErrors(validateVoice(v))
  }, [v, attempted])

  const toConfirm = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    const found = validateVoice(v)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setStep('confirm')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const send = async () => {
    if (!token) {
      setSendError(submitErrors.turnstile_failed)
      return
    }
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...v, website: hp, turnstileToken: token }),
      })
      const data = (await res.json().catch(() => null)) as SubmitResponse | null
      if (data?.ok) {
        setReceiptNo(data.receiptNo)
        setStep('done')
        window.scrollTo({ top: 0, behavior: 'instant' })
        return
      }
      setSendError(submitErrors[data?.error ?? ''] ?? '送信できませんでした。時間をおいてからもう一度お試しください。')
    } catch {
      setSendError('通信に失敗しました。インターネット接続を確認して、もう一度お試しください。')
    } finally {
      setSending(false)
      setResetKey(k => k + 1)
    }
  }

  if (step === 'done' && receiptNo) {
    return (
      <PageLayout en="THANK YOU" title="受け付けました">
        <div className="voice-receipt" role="status">
          <p className="voice-receipt__label">受付番号</p>
          <p className="voice-receipt__number">{receiptNo}</p>
          <p className="voice-receipt__hint">お問い合わせの際にお伝えください。この画面を閉じると再表示できないため、控えておいてください。</p>
        </div>
        <PageSection title="このあとの流れ">
          <ol className="voice-flow">
            <li>いただいた内容は公開されません。{operator.name}が目を通します。</li>
            <li>政策づくりの参考にする場合は、個人が特定できる内容を除いて要約したうえで、課題として紹介することがあります。</li>
            <li>すべてのご意見にお返事できるとは限りません。返信を希望された方には、必要に応じてメールでご連絡します。</li>
          </ol>
          <p className="page__more">
            <a href={routeHref({ name: 'home', anchor: null })} className="btn btn--secondary">
              トップページへ →
            </a>
          </p>
        </PageSection>
      </PageLayout>
    )
  }

  const errorEntries = Object.entries(errors) as [VoiceField, string][]
  const describedBy = (field: VoiceField, hint?: boolean) =>
    [hint ? `${field}-hint` : '', errors[field] ? `${field}-error` : ''].filter(Boolean).join(' ') || undefined
  const FieldError = ({ field }: { field: VoiceField }) =>
    errors[field] ? (
      <p className="form-error" id={`${field}-error`}>
        {errors[field]}
      </p>
    ) : null

  return (
    <PageLayout
      en="VOICE"
      title="困りごと・ご意見を送る"
      lead="宇部での暮らしの中の困りごとや、政策へのご意見をお寄せください。政策づくりの参考にします。"
    >
      <div className="policy-detail__note page__notice">
        <p>
          <strong>
            このフォームは{operator.displayName}の政治活動として運営しています。宇部市の公式な相談窓口ではありません。
          </strong>
          市への申請・手続き・正式な相談は、
          <a href="https://www.city.ube.yamaguchi.jp/" target="_blank" rel="noopener noreferrer">
            宇部市公式ウェブサイト
          </a>
          や市の各窓口をご利用ください。
        </p>
        <p>
          <strong>命や安全に関わる緊急のご相談は、110番・119番、または市や県の相談窓口へ直接ご連絡ください。</strong>
          このフォームは緊急の対応ができません。
        </p>
      </div>

      {step === 'input' && (
        <form className="voice-form" onSubmit={toConfirm} noValidate>
          <ul className="voice-points">
            <li>送っていただいた内容は<strong>公開されません</strong>。{operator.name}が目を通します。</li>
            <li>参考にさせていただく場合は、個人が特定できる内容を除いて要約し、課題として紹介することがあります。</li>
            <li>ご自身や他の方の住所・電話番号など、個人が特定できる情報は書かないでください。</li>
            <li>すべてのご意見にお返事できるとは限りません。</li>
          </ul>

          {errorEntries.length > 0 && (
            <div className="form-summary" role="alert" tabIndex={-1} ref={summaryRef}>
              <p>入力内容を確認してください。</p>
              <ul>
                {errorEntries.map(([field, msg]) => (
                  <li key={field}>
                    <a href={`#voice-${field}`} onClick={e => { e.preventDefault(); document.getElementById(`voice-${field}`)?.focus() }}>
                      {fieldLabels[field]}：{msg}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="voice-body">
              困りごと・ご意見 <span className="form-required">必須</span>
            </label>
            <p className="form-hint" id="body-hint">
              どんなことで困っているか、どうなるとよいと思うかを、自由に書いてください。（{BODY_MAX}文字まで）
            </p>
            <textarea
              id="voice-body"
              rows={9}
              value={v.body}
              onChange={e => set('body', e.target.value)}
              aria-invalid={!!errors.body}
              aria-describedby={describedBy('body', true)}
              required
            />
            <p className={`form-count${v.body.trim().length > BODY_MAX ? ' form-count--over' : ''}`} aria-live="polite">
              {v.body.trim().length} / {BODY_MAX}
            </p>
            <FieldError field="body" />
          </div>

          <fieldset className="form-field" id="voice-themeHints" tabIndex={-1}>
            <legend>
              近いテーマ <span className="form-optional">任意・複数選択可</span>
            </legend>
            <p className="form-hint">当てはまるものがなければ、選ばなくてかまいません。</p>
            <div className="form-chips">
              {THEME_OPTIONS.map(t => (
                <label key={t} className="form-chip">
                  <input type="checkbox" checked={v.themeHints.includes(t)} onChange={() => toggleTheme(t)} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <FieldError field="themeHints" />
          </fieldset>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="voice-areaHint">
                お住まいの地区 <span className="form-optional">任意</span>
              </label>
              <p className="form-hint" id="areaHint-hint">
                校区や地区の名前まで（例：東岐波）。住所は書かないでください。
              </p>
              <input
                id="voice-areaHint"
                type="text"
                maxLength={AREA_MAX}
                value={v.areaHint}
                onChange={e => set('areaHint', e.target.value)}
                aria-invalid={!!errors.areaHint}
                aria-describedby={describedBy('areaHint', true)}
              />
              <FieldError field="areaHint" />
            </div>

            <div className="form-field">
              <label htmlFor="voice-ageRange">
                年代 <span className="form-optional">任意</span>
              </label>
              <select
                id="voice-ageRange"
                value={v.ageRange}
                onChange={e => set('ageRange', e.target.value as VoiceInput['ageRange'])}
                aria-invalid={!!errors.ageRange}
                aria-describedby={describedBy('ageRange')}
              >
                <option value="">選択しない</option>
                {AGE_OPTIONS.map(a => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <FieldError field="ageRange" />
            </div>
          </div>

          <fieldset className="form-field form-group">
            <legend>
              連絡先 <span className="form-optional">任意</span>
            </legend>
            <p className="form-hint">
              返信を希望される場合や、内容について確認させていただく場合のためのものです。入力しなくても送れます。連絡先は投稿内容とは分けて保管し、一定期間が過ぎると削除します。
            </p>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="voice-name">お名前</label>
                <input
                  id="voice-name"
                  type="text"
                  autoComplete="name"
                  value={v.name}
                  onChange={e => set('name', e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={describedBy('name')}
                />
                <FieldError field="name" />
              </div>
              <div className="form-field">
                <label htmlFor="voice-email">メールアドレス</label>
                <input
                  id="voice-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={v.email}
                  onChange={e => {
                    set('email', e.target.value)
                    if (!e.target.value.trim()) set('replyOk', false)
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={describedBy('email')}
                />
                <FieldError field="email" />
              </div>
            </div>
            <label className="form-check" htmlFor="voice-replyOk">
              <input
                id="voice-replyOk"
                type="checkbox"
                checked={v.replyOk}
                disabled={!v.email.trim()}
                onChange={e => set('replyOk', e.target.checked)}
                aria-describedby={describedBy('replyOk')}
              />
              <span>メールでの返信を希望する（メールアドレスを入力すると選べます）</span>
            </label>
            <FieldError field="replyOk" />
          </fieldset>

          {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
          <div className="form-hp" aria-hidden="true">
            <label htmlFor="voice-website">website</label>
            <input id="voice-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={e => setHp(e.target.value)} />
          </div>

          <div className="form-field">
            <label className="form-check" htmlFor="voice-agreed">
              <input
                id="voice-agreed"
                type="checkbox"
                checked={v.agreed}
                onChange={e => set('agreed', e.target.checked)}
                aria-invalid={!!errors.agreed}
                aria-describedby={describedBy('agreed')}
              />
              <span>
                <a href={routeHref({ name: 'privacy' })} target="_blank" rel="noopener noreferrer">
                  プライバシーポリシー
                </a>
                に同意します <span className="form-required">必須</span>
              </span>
            </label>
            <FieldError field="agreed" />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary btn--lg">
              入力内容を確認する →
            </button>
          </div>
        </form>
      )}

      {step === 'confirm' && (
        <div className="voice-form">
          <h2 className="policy-detail__heading">入力内容の確認</h2>
          <dl className="info-list info-list--stacked voice-confirm">
            <div>
              <dt>困りごと・ご意見</dt>
              <dd className="voice-confirm__body">{v.body.trim()}</dd>
            </div>
            <div>
              <dt>近いテーマ</dt>
              <dd>{v.themeHints.length ? v.themeHints.join('、') : '選択なし'}</dd>
            </div>
            <div>
              <dt>お住まいの地区</dt>
              <dd>{v.areaHint.trim() || '未入力'}</dd>
            </div>
            <div>
              <dt>年代</dt>
              <dd>{AGE_OPTIONS.find(a => a.value === v.ageRange)?.label ?? '選択なし'}</dd>
            </div>
            <div>
              <dt>連絡先</dt>
              <dd>
                {v.name.trim() || v.email.trim()
                  ? `${v.name.trim() || '（お名前なし）'} / ${v.email.trim() || '（メールなし）'}${v.replyOk ? '／返信を希望する' : ''}`
                  : '入力なし'}
              </dd>
            </div>
          </dl>

          <div className="form-field">
            <p className="form-hint">送信する前に、ロボットでないことの確認をお願いします。</p>
            {siteKey ? (
              <Turnstile siteKey={siteKey} onToken={setToken} resetKey={resetKey} />
            ) : (
              <p className="form-error">現在、受付を停止しています。</p>
            )}
          </div>

          {sendError && (
            <p className="form-error form-error--block" role="alert">
              {sendError}
            </p>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn--secondary btn--lg" onClick={() => setStep('input')} disabled={sending}>
              ← 修正する
            </button>
            <button type="button" className="btn btn--primary btn--lg" onClick={send} disabled={sending || !token}>
              {sending ? '送信しています…' : 'この内容で送信する'}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
