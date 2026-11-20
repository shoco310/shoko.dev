import { useEffect, useRef, useState, type FormEvent } from 'react'
import PageLayout, { PageSection } from '../components/PageLayout'
import Turnstile from '../components/Turnstile'
import { operator, supportersAssociation } from '../data/site'
import { routeHref } from '../router'
import {
  AREA_MAX,
  FREQUENCY_OPTIONS,
  INTEREST_OPTIONS,
  MESSAGE_MAX,
  SKILLS_MAX,
  validateVolunteer,
  type Interest,
  type VolunteerField,
  type VolunteerInput,
} from '../shared/volunteer'

const activities: { key: Interest; num: string; title: string; items: string[] }[] = [
  { key: 'local', num: '01', title: '地域活動のお手伝い', items: ['地域での活動準備', 'チラシの準備・配布', '地域の情報収集'] },
  { key: 'events', num: '02', title: 'イベント運営', items: ['意見交換会などの準備', '会場設営・受付', '当日の運営サポート'] },
  { key: 'media', num: '03', title: 'SNS・広報', items: ['写真・動画撮影', '動画編集・デザイン', 'WebサイトやSNSの運営補助'] },
  { key: 'policy', num: '04', title: '政策づくり', items: ['地域課題の調査', '公開データの整理', '政策に関する意見交換'] },
]

const empty: VolunteerInput = {
  name: '',
  email: '',
  phone: '',
  area: '',
  interests: [],
  frequency: '',
  adult: '',
  skills: '',
  message: '',
  associationInfo: false,
  agreed: false,
}

const labels: Record<VolunteerField, string> = {
  name: 'お名前',
  email: 'メールアドレス',
  phone: '電話番号',
  area: 'お住まいの地域',
  interests: '興味のある活動',
  frequency: '参加できる頻度',
  adult: '年齢',
  skills: '得意なこと・協力できること',
  message: '自由記述',
  associationInfo: '後援会への入会の案内',
  agreed: '個人情報の取り扱いへの同意',
}

const sendErrors: Record<string, string> = {
  invalid: '入力内容を確認してください。',
  turnstile_failed: '確認（ロボットでないことの確認）が完了していないか、期限が切れました。もう一度お試しください。',
  duplicate: 'このメールアドレスでは、すでにご登録を受け付けています。重ねて登録していただく必要はありません。',
  rate_limited: '同じ回線から短時間に多くの送信があったため、受け付けできませんでした。時間をおいてからお試しください。',
  busy: 'ただいま送信が集中しています。時間をおいてからお試しください。',
  unavailable: '現在、受付を停止しています。時間をおいてからお試しください。',
}

export default function JoinPage() {
  const [v, setV] = useState<VolunteerInput>(empty)
  const [errors, setErrors] = useState<Partial<Record<VolunteerField, string>>>({})
  const [attempted, setAttempted] = useState(false)
  const [hp, setHp] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

  const set = <K extends keyof VolunteerInput>(key: K, value: VolunteerInput[K]) => setV(prev => ({ ...prev, [key]: value }))
  const toggleInterest = (i: Interest) =>
    set('interests', v.interests.includes(i) ? v.interests.filter(x => x !== i) : [...v.interests, i])

  useEffect(() => {
    if (attempted) setErrors(validateVolunteer(v))
  }, [v, attempted])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    const found = validateVolunteer(v)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    if (!token) {
      setSendError(sendErrors.turnstile_failed)
      return
    }
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...v, website: hp, turnstileToken: token }),
      })
      const data = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null
      if (data?.ok) {
        setDone(true)
        window.scrollTo({ top: 0, behavior: 'instant' })
        return
      }
      setSendError(sendErrors[data?.error ?? ''] ?? '送信できませんでした。時間をおいてからもう一度お試しください。')
    } catch {
      setSendError('通信に失敗しました。インターネット接続を確認して、もう一度お試しください。')
    } finally {
      setSending(false)
      setResetKey(k => k + 1)
    }
  }

  if (done) {
    return (
      <PageLayout en="THANK YOU" title="ご登録ありがとうございます">
        <div className="voice-receipt" role="status">
          <p className="voice-receipt__number join-done__title">登録を受け付けました</p>
          <p className="voice-receipt__hint">
            {supportersAssociation}（代表：{operator.name}）から、ご登録のメールアドレスあてにご連絡します。
          </p>
        </div>
        <PageSection title="このあとの流れ">
          <ol className="voice-flow">
            <li>活動の予定に合わせて、参加できそうな活動をご案内します。ご案内までお時間をいただくことがあります。</li>
            <li>参加するかどうかは、ご案内を見てから、その都度お決めください。</li>
            <li>登録の取り消しや内容の変更は、{operator.emailDisplay} までメールでご連絡ください。</li>
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

  const describedBy = (f: VolunteerField, hint?: boolean) =>
    [hint ? `join-${f}-hint` : '', errors[f] ? `join-${f}-error` : ''].filter(Boolean).join(' ') || undefined
  const FieldError = ({ f }: { f: VolunteerField }) =>
    errors[f] ? (
      <p className="form-error" id={`join-${f}-error`}>
        {errors[f]}
      </p>
    ) : null
  const errorEntries = Object.entries(errors) as [VolunteerField, string][]

  return (
    <PageLayout en="JOIN US" title="一緒に活動する">
      <section className="join-intro">
        <h2 className="join-intro__title">宇部の未来を、一緒につくりませんか？</h2>
        <p>
          {supportersAssociation}では、地域の課題を知り、政策を考え、日々の活動を支えてくださるボランティアを募集しています。
        </p>
        <p>特別な経験や知識は必要ありません。</p>
        <p>ご自身の得意なことや都合に合わせて、できるときに、できる範囲で参加いただけます。</p>
        <ul className="join-points" aria-label="参加のしかた">
          <li>経験・知識は不要</li>
          <li>できるときに、できる範囲で</li>
          <li>原則無償のボランティア</li>
        </ul>
      </section>

      <PageSection title="募集している活動">
        <ul className="join-cards">
          {activities.map(a => (
            <li className="join-card" key={a.key}>
              <span className="join-card__num" aria-hidden="true">
                {a.num}
              </span>
              <h3 className="join-card__title">{a.title}</h3>
              <ul className="join-card__items">
                {a.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="参加の前に">
        <dl className="info-list info-list--stacked">
          <div>
            <dt>募集しているのは</dt>
            <dd>
              {supportersAssociation}（届出済みの政治団体。代表：{operator.name}）です。後援会の政治活動へのご協力をお願いするもので、政党のスタッフ募集ではありません。
            </dd>
          </div>
          <div>
            <dt>参加のかたち</dt>
            <dd>活動は原則として無償のボランティアです。ご自身の都合に合わせて、できる範囲でご参加いただけます。</dd>
          </div>
          <div>
            <dt>後援会への入会とは別です</dt>
            <dd>
              ボランティアの登録をしても、後援会に入会したことにはなりません。入会については、ご希望の方にだけ別にご案内します。
            </dd>
          </div>
          <div>
            <dt>選挙運動について</dt>
            <dd>
              この登録は、ふだんの後援会活動（政治活動）へのご協力の登録です。選挙期間中の選挙運動にあたる活動には、公職選挙法により、活動できる時期・方法・年齢・報酬や実費弁償などのルールが別に定められています。そのため、この登録とは区別し、必要な場合はルールを確認したうえで改めてご案内します。ご登録が選挙運動への参加のお約束になることはありません。
            </dd>
          </div>
        </dl>
      </PageSection>

      <PageSection title="ボランティア登録">
        <form className="voice-form join-form" onSubmit={submit} noValidate>
          {errorEntries.length > 0 && (
            <div className="form-summary" role="alert" tabIndex={-1} ref={summaryRef}>
              <p>入力内容を確認してください。</p>
              <ul>
                {errorEntries.map(([f, msg]) => (
                  <li key={f}>
                    <a href={`#join-${f}`} onClick={e => { e.preventDefault(); document.getElementById(`join-${f}`)?.focus() }}>
                      {labels[f]}：{msg}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <fieldset className="form-field form-group">
            <legend>ご連絡先</legend>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="join-name">
                  お名前 <span className="form-required">必須</span>
                </label>
                <input id="join-name" type="text" autoComplete="name" value={v.name} onChange={e => set('name', e.target.value)}
                  aria-invalid={!!errors.name} aria-describedby={describedBy('name')} required />
                <FieldError f="name" />
              </div>
              <div className="form-field">
                <label htmlFor="join-email">
                  メールアドレス <span className="form-required">必須</span>
                </label>
                <input id="join-email" type="email" inputMode="email" autoComplete="email" value={v.email}
                  onChange={e => set('email', e.target.value)} aria-invalid={!!errors.email} aria-describedby={describedBy('email')} required />
                <FieldError f="email" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="join-phone">
                  電話番号 <span className="form-optional">任意</span>
                </label>
                <input id="join-phone" type="tel" inputMode="tel" autoComplete="tel" value={v.phone}
                  onChange={e => set('phone', e.target.value)} aria-invalid={!!errors.phone} aria-describedby={describedBy('phone')} />
                <FieldError f="phone" />
              </div>
              <div className="form-field">
                <label htmlFor="join-area">
                  お住まいの地域 <span className="form-optional">任意</span>
                </label>
                <p className="form-hint" id="join-area-hint">市内の地区名まで（例：東岐波）。詳しい住所は不要です。</p>
                <input id="join-area" type="text" maxLength={AREA_MAX} value={v.area} onChange={e => set('area', e.target.value)}
                  aria-invalid={!!errors.area} aria-describedby={describedBy('area', true)} />
                <FieldError f="area" />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-field" id="join-interests" tabIndex={-1}>
            <legend>
              興味のある活動 <span className="form-optional">任意・複数選択可</span>
            </legend>
            <div className="form-chips">
              {INTEREST_OPTIONS.map(o => (
                <label key={o.value} className="form-chip">
                  <input type="checkbox" checked={v.interests.includes(o.value)} onChange={() => toggleInterest(o.value)} />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
            <FieldError f="interests" />
          </fieldset>

          <fieldset className="form-field" id="join-frequency" tabIndex={-1} aria-describedby={describedBy('frequency')}>
            <legend>
              参加できる頻度 <span className="form-required">必須</span>
            </legend>
            <div className="form-radios">
              {FREQUENCY_OPTIONS.map(o => (
                <label key={o.value} className="form-check">
                  <input type="radio" name="frequency" value={o.value} checked={v.frequency === o.value}
                    onChange={() => set('frequency', o.value)} />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
            <FieldError f="frequency" />
          </fieldset>

          <fieldset className="form-field" id="join-adult" tabIndex={-1} aria-describedby={describedBy('adult', true)}>
            <legend>
              18歳以上ですか <span className="form-required">必須</span>
            </legend>
            <p className="form-hint" id="join-adult-hint">
              18歳未満の方もご登録いただけます。公職選挙法により18歳未満の方は選挙運動に参加できないため、活動をご案内する際の確認のためにお聞きしています。
            </p>
            <div className="form-radios form-radios--inline">
              <label className="form-check">
                <input type="radio" name="adult" checked={v.adult === 'yes'} onChange={() => set('adult', 'yes')} />
                <span>18歳以上</span>
              </label>
              <label className="form-check">
                <input type="radio" name="adult" checked={v.adult === 'no'} onChange={() => set('adult', 'no')} />
                <span>18歳未満</span>
              </label>
            </div>
            <FieldError f="adult" />
          </fieldset>

          <div className="form-field">
            <label htmlFor="join-skills">
              得意なこと・協力できること <span className="form-optional">任意</span>
            </label>
            <p className="form-hint" id="join-skills-hint">例：写真撮影、デザイン、表計算、地域のつながり、平日の昼間なら動ける など</p>
            <textarea id="join-skills" rows={4} maxLength={SKILLS_MAX} value={v.skills} onChange={e => set('skills', e.target.value)}
              aria-invalid={!!errors.skills} aria-describedby={describedBy('skills', true)} />
            <FieldError f="skills" />
          </div>

          <div className="form-field">
            <label htmlFor="join-message">
              自由記述 <span className="form-optional">任意</span>
            </label>
            <textarea id="join-message" rows={4} maxLength={MESSAGE_MAX} value={v.message} onChange={e => set('message', e.target.value)}
              aria-invalid={!!errors.message} aria-describedby={describedBy('message')} />
            <FieldError f="message" />
          </div>

          <div className="form-field form-group join-association">
            <label className="form-check" htmlFor="join-associationInfo">
              <input id="join-associationInfo" type="checkbox" checked={v.associationInfo}
                onChange={e => set('associationInfo', e.target.checked)} aria-describedby="join-associationInfo-hint" />
              <span>
                {supportersAssociation}への入会について、案内を希望する <span className="form-optional">任意</span>
              </span>
            </label>
            <p className="form-hint" id="join-associationInfo-hint">
              チェックしなくても、ボランティアとして参加できます。チェックしても、自動的に入会にはなりません。
            </p>
          </div>

          <div className="form-hp" aria-hidden="true">
            <label htmlFor="join-website">website</label>
            <input id="join-website" type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={e => setHp(e.target.value)} />
          </div>

          <div className="form-field">
            <label className="form-check" htmlFor="join-agreed">
              <input id="join-agreed" type="checkbox" checked={v.agreed} onChange={e => set('agreed', e.target.checked)}
                aria-invalid={!!errors.agreed} aria-describedby={describedBy('agreed')} />
              <span>
                <a href={routeHref({ name: 'privacy' })} target="_blank" rel="noopener noreferrer">
                  プライバシーポリシー
                </a>
                の「ボランティア登録について」に同意します <span className="form-required">必須</span>
              </span>
            </label>
            <FieldError f="agreed" />
          </div>

          <div className="form-field">
            <p className="form-hint">送信する前に、ロボットでないことの確認をお願いします。</p>
            {siteKey ? <Turnstile siteKey={siteKey} onToken={setToken} resetKey={resetKey} /> : <p className="form-error">現在、受付を停止しています。</p>}
          </div>

          {sendError && (
            <p className="form-error form-error--block" role="alert">
              {sendError}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary btn--lg" disabled={sending}>
              {sending ? '送信しています…' : 'ボランティアに登録する'}
            </button>
          </div>
        </form>
      </PageSection>
    </PageLayout>
  )
}
