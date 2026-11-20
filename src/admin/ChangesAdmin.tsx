import { useCallback, useEffect, useState } from 'react'
import ChangeEntry from '../components/ChangeEntry'
import { policies } from '../data/policy'
import { PUBLIC_CHANGE_COLUMNS, rowsToChanges, type EvidenceRef, type PolicyChangeRow, type PolicyDiff } from '../shared/changes'
import { clearDraft, loadDraft, saveDraft } from './draftStorage'
import { supabase } from './supabase'

/**
 * 政策変更履歴の管理（admin only — RLS). Drafts are freely editable.
 * Publishing is final: the database refuses any edit or deletion of a
 * published record. Mistakes are fixed with a correction (a new record that
 * points at the original); withdrawal is for emergencies only and keeps the
 * record in the database and the audit log.
 */
type Tab = 'published' | 'draft' | 'withdrawn'
const tabLabels: Record<Tab, string> = { published: '公開中', draft: '下書き', withdrawn: '取り下げ' }

interface Form {
  change_date: string
  policy_slugs: string[]
  summary: string
  reason: string
  evidence: EvidenceRef[]
  diffs: PolicyDiff[]
  related_issues: number[]
  commits: string
  corrects: string
}

const emptyForm: Form = {
  change_date: '',
  policy_slugs: [],
  summary: '',
  reason: '',
  evidence: [],
  diffs: [],
  related_issues: [],
  commits: '',
  corrects: '',
}

const rowToForm = (r: PolicyChangeRow): Form => ({
  change_date: r.change_date,
  policy_slugs: r.policy_slugs,
  summary: r.summary,
  reason: r.reason ?? '',
  evidence: r.evidence ?? [],
  diffs: r.diffs ?? [],
  related_issues: r.related_issues ?? [],
  commits: (r.commits ?? []).join(' '),
  corrects: r.corrects ?? '',
})

function validate(f: Form): string[] {
  const e: string[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.change_date)) e.push('更新日を選んでください。')
  if (f.policy_slugs.length === 0) e.push('対象の政策を1つ以上選んでください。')
  if (!f.summary.trim()) e.push('変更内容を入力してください。')
  if (f.summary.length > 500) e.push('変更内容は500文字以内にしてください。')
  if (f.reason.length > 2000) e.push('変更理由は2000文字以内にしてください。')
  if (f.evidence.some(x => !x.label.trim())) e.push('根拠資料の名前が空の行があります。')
  if (f.evidence.some(x => x.url && !/^https:\/\/\S+$/.test(x.url))) e.push('根拠資料の URL は https:// で始めてください。')
  if (f.diffs.some(d => !d.label.trim() || !d.before.trim() || !d.after.trim())) e.push('変更前・変更後に空の欄があります。')
  if (f.commits.trim() && !f.commits.trim().split(/\s+/).every(c => /^[0-9a-f]{7,40}$/.test(c)))
    e.push('記録（コミット）は英数字のハッシュを空白区切りで入力してください。')
  return e
}

const toPayload = (f: Form) => ({
  change_date: f.change_date,
  policy_slugs: f.policy_slugs,
  summary: f.summary.trim(),
  reason: f.reason.trim() || null,
  evidence: f.evidence.map(x => ({ label: x.label.trim(), ...(x.url?.trim() ? { url: x.url.trim() } : {}) })),
  diffs: f.diffs.map(d => ({ label: d.label.trim(), before: d.before.trim(), after: d.after.trim() })),
  related_issues: f.related_issues,
  commits: f.commits.trim() ? f.commits.trim().split(/\s+/) : [],
  corrects: f.corrects || null,
})

function newSlug(date: string) {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => (b % 36).toString(36)).join('')
  return `${date}-change-${rand}`
}

export default function ChangesAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>('published')
  const [rows, setRows] = useState<PolicyChangeRow[]>([])
  const [selected, setSelected] = useState<string | 'new' | null>(null)
  const [correcting, setCorrecting] = useState<PolicyChangeRow | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('policy_changes')
      .select(PUBLIC_CHANGE_COLUMNS)
      .order('change_date', { ascending: false })
    if (error) return setError('変更履歴を読み込めませんでした。ログインし直してください。')
    setError(null)
    setRows((data ?? []) as PolicyChangeRow[])
  }, [])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  if (!isAdmin) return <p className="admin-muted admin-pad">政策変更履歴は、佐藤祥子（管理者）だけが編集できます。</p>

  const visible = rows.filter(r => r.visibility === tab)
  const current = selected && selected !== 'new' ? rows.find(r => r.id === selected) ?? null : null
  const policyNames = (slugs: string[]) =>
    slugs.length === 4 ? '4つの政策すべて' : slugs.map(s => policies.find(p => p.slug === s)?.name ?? s).join('、')

  return (
    <div>
      <nav className="admin-tabs" aria-label="表示する変更履歴">
        {(Object.keys(tabLabels) as Tab[]).map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' is-active' : ''}`} aria-pressed={tab === t} onClick={() => { setTab(t); setFlash(null) }}>
            {tabLabels[t]}
          </button>
        ))}
        <button className="btn btn--primary admin-new" onClick={() => { setCorrecting(null); setSelected('new') }}>
          ＋ 変更を記録する
        </button>
      </nav>
      <div className="admin-body">
        <section className="admin-list" aria-label="変更履歴の一覧">
          {flash && <p className="admin-flash" role="status">{flash}</p>}
          {error && <p className="admin-error">{error}</p>}
          {!error && visible.length === 0 && <p className="admin-muted">この表示に当てはまる記録はありません。</p>}
          <ul>
            {visible.map(r => (
              <li key={r.id}>
                <button className={`admin-item${r.id === selected ? ' is-selected' : ''}`} onClick={() => setSelected(r.id)} aria-current={r.id === selected}>
                  <span className="admin-item__meta">
                    <span>{r.change_date.split('-').join('/')}</span>
                    <span>{policyNames(r.policy_slugs)}</span>
                    {r.corrects && <span>訂正</span>}
                  </span>
                  <span className="admin-item__body">{r.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-detail" aria-label="変更履歴の編集">
          {selected === null ? (
            <p className="admin-muted">左の一覧から選ぶか、「変更を記録する」を押してください。</p>
          ) : selected !== 'new' && !current ? (
            <p className="admin-muted">読み込み中…</p>
          ) : current && current.visibility !== 'draft' ? (
            <PublishedChange
              row={current}
              all={rows}
              onCorrect={() => { setCorrecting(current); setSelected('new') }}
              onWithdrawn={async msg => { setFlash(msg); await load(); setTab('withdrawn') }}
            />
          ) : (
            <ChangeEditor
              key={selected === 'new' ? `new-${correcting?.id ?? ''}` : `${current!.id}-${current!.updated_at}`}
              row={current}
              correcting={selected === 'new' ? correcting : null}
              published={rows.filter(r => r.visibility === 'published')}
              onDone={async (id, message, nextTab) => {
                setFlash(message)
                setCorrecting(null)
                await load()
                if (nextTab) setTab(nextTab)
                setSelected(id)
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function PublishedChange({
  row,
  all,
  onCorrect,
  onWithdrawn,
}: {
  row: PolicyChangeRow
  all: PolicyChangeRow[]
  onCorrect: () => void
  onWithdrawn: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const display = rowsToChanges(all).find(c => c.change.id === row.slug)!
  const withdraw = async () => {
    if (
      !window.confirm(
        'この記録を取り下げます。サイトからは見えなくなりますが、記録そのものは消えずに残ります。\n個人情報が載ってしまった場合など、緊急のときだけ使ってください。誤りの修正は「訂正する」を使ってください。\n\n取り下げますか？',
      )
    )
      return
    setBusy(true)
    const { error } = await supabase.from('policy_changes').update({ visibility: 'withdrawn' }).eq('id', row.id)
    setBusy(false)
    if (error) return setMessage('取り下げできませんでした。')
    onWithdrawn('記録を取り下げました（サイトには表示されません。記録は残っています）。')
  }
  return (
    <article>
      <p className={`admin-warning`}>
        {row.visibility === 'published'
          ? '公開済みの記録は、変更・削除できません。誤りがあれば「この記録を訂正する」で、訂正の記録を追加してください。'
          : 'この記録は取り下げ済みです（サイトには表示されません）。記録は残っています。'}
      </p>
      <ol className="changes">
        <ChangeEntry change={display.change} scope={display.slugs.length === 4 ? '4つの政策すべて' : display.slugs.join('、')} />
      </ol>
      {message && <p className="admin-error" role="alert">{message}</p>}
      {row.visibility === 'published' && (
        <div className="admin-actions ev-actions">
          <button className="btn btn--primary" onClick={onCorrect} disabled={busy}>
            この記録を訂正する
          </button>
          <button className="admin-link ev-delete" onClick={withdraw} disabled={busy}>
            取り下げる（緊急時のみ）
          </button>
        </div>
      )}
    </article>
  )
}

function ChangeEditor({
  row,
  correcting,
  published,
  onDone,
}: {
  row: PolicyChangeRow | null
  correcting: PolicyChangeRow | null
  published: PolicyChangeRow[]
  onDone: (id: string | null, message: string, nextTab?: Tab) => void
}) {
  const key = `change-form:${row?.id ?? `new-${correcting?.id ?? ''}`}`
  const base: Form = row
    ? rowToForm(row)
    : correcting
      ? { ...rowToForm(correcting), change_date: new Date().toISOString().slice(0, 10), corrects: correcting.id, commits: '' }
      : emptyForm
  const restored = loadDraft(key, emptyForm)
  const hasRestored = !!restored && JSON.stringify(restored) !== JSON.stringify(base)
  const [form, setForm] = useState<Form>(hasRestored ? restored! : base)
  const [restoredNotice, setRestoredNotice] = useState(hasRestored)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [issues, setIssues] = useState<{ id: number; title: string }[]>([])

  useEffect(() => {
    // Only published issues may be cited.
    supabase
      .from('public_issues')
      .select('id, title')
      .eq('status', 'published')
      .order('id', { ascending: false })
      .then(({ data }) => setIssues((data ?? []) as typeof issues))
  }, [])

  const errors = validate(form)
  const dirty = JSON.stringify(form) !== JSON.stringify(base)
  useEffect(() => {
    if (dirty) saveDraft(key, form)
    else clearDraft(key)
  }, [form, dirty, key])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(prev => ({ ...prev, [k]: v }))

  const write = async (visibility: 'draft' | 'published') => {
    setAttempted(true)
    if (errors.length > 0) return setMessage('入力内容を確認してください。入力はそのまま残っています。')
    if (
      visibility === 'published' &&
      !window.confirm('公開した記録は、あとから変更も削除もできません。誤りがあった場合は「訂正」の記録を追加することになります。\n\nこの内容で公開しますか？')
    )
      return
    setBusy(true)
    setMessage(null)
    const payload = { ...toPayload(form), visibility }
    const result = row
      ? await supabase.from('policy_changes').update(payload).eq('id', row.id).select('id').single()
      : await supabase.from('policy_changes').insert({ ...payload, slug: newSlug(form.change_date) }).select('id').single()
    setBusy(false)
    if (result.error || !result.data) return setMessage('保存できませんでした。入力はそのまま残っています。時間をおいて、もう一度お試しください。')
    clearDraft(key)
    onDone(
      result.data.id as string,
      visibility === 'published' ? '変更履歴を公開しました。' : '下書きを保存しました。',
      visibility === 'published' ? 'published' : 'draft',
    )
  }

  const remove = async () => {
    if (!row) return
    if (!window.confirm('この下書きを削除します。元に戻せません。よろしいですか？')) return
    setBusy(true)
    const { error } = await supabase.from('policy_changes').delete().eq('id', row.id)
    setBusy(false)
    if (error) return setMessage('削除できませんでした。')
    clearDraft(key)
    onDone(null, '下書きを削除しました。')
  }

  const previewList = rowsToChanges([
    ...published,
    {
      ...(row ?? ({} as PolicyChangeRow)),
      ...toPayload(form),
      id: row?.id ?? 'preview',
      slug: row?.slug ?? 'preview',
      change_date: form.change_date || new Date().toISOString().slice(0, 10),
      summary: form.summary || '（変更内容）',
      visibility: 'draft',
      published_at: null,
      updated_at: new Date().toISOString(),
    } as PolicyChangeRow,
  ])
  const preview = previewList[previewList.length - 1]

  return (
    <article className="ev-editor">
      <header className="admin-detail__head">
        <p className="admin-detail__receipt admin-detail__name">{correcting ? '訂正の記録' : row ? '下書き' : '新しい変更の記録'}</p>
      </header>
      {restoredNotice && (
        <p className="admin-warning">
          保存していなかった入力を復元しました。
          <button className="admin-link" onClick={() => { clearDraft(key); setForm(base); setRestoredNotice(false) }}>
            復元を取り消す
          </button>
        </p>
      )}
      {correcting && <p className="admin-warning">「{correcting.summary}」の訂正です。直したい部分を書き換えて公開してください。元の記録はそのまま残ります。</p>}
      <p className="admin-muted">実際に行った変更だけを記録してください。市民の投稿の原文や個人情報は書かないでください。</p>

      <div className="admin-panel">
        <div className="ev-field">
          <label htmlFor="ch-date">更新日（必須）</label>
          <input id="ch-date" className="admin-input" type="date" value={form.change_date} onChange={e => set('change_date', e.target.value)} />
        </div>
        <fieldset className="admin-fieldset">
          <legend>対象の政策（必須）</legend>
          <div className="admin-checks">
            {policies.map(p => (
              <label key={p.slug}>
                <input
                  type="checkbox"
                  checked={form.policy_slugs.includes(p.slug)}
                  onChange={() =>
                    set('policy_slugs', form.policy_slugs.includes(p.slug) ? form.policy_slugs.filter(s => s !== p.slug) : [...form.policy_slugs, p.slug])
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="ev-field">
          <label htmlFor="ch-summary">変更内容（必須・{form.summary.length}/500）</label>
          <textarea id="ch-summary" rows={3} maxLength={500} value={form.summary} onChange={e => set('summary', e.target.value)} />
        </div>
        <div className="ev-field">
          <label htmlFor="ch-reason">変更理由（{form.reason.length}/2000）</label>
          <textarea id="ch-reason" rows={4} maxLength={2000} value={form.reason} onChange={e => set('reason', e.target.value)} />
        </div>

        <fieldset className="admin-fieldset">
          <legend>根拠資料・データ</legend>
          {form.evidence.map((ev, i) => (
            <div key={i} className="ch-row">
              <input className="admin-input" aria-label={`根拠資料${i + 1}の名前`} placeholder="資料名（例：宇部市こども計画）" value={ev.label}
                onChange={e => set('evidence', form.evidence.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="admin-input" aria-label={`根拠資料${i + 1}の URL`} placeholder="https://（任意）" type="url" value={ev.url ?? ''}
                onChange={e => set('evidence', form.evidence.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button className="admin-link" onClick={() => set('evidence', form.evidence.filter((_, j) => j !== i))}>この行を消す</button>
            </div>
          ))}
          <button className="btn btn--secondary ch-add" onClick={() => set('evidence', [...form.evidence, { label: '', url: '' }])}>＋ 資料を追加</button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>変更前・変更後（必要な場合）</legend>
          {form.diffs.map((d, i) => (
            <div key={i} className="ch-row ch-row--diff">
              <input className="admin-input" aria-label={`変更点${i + 1}の項目`} placeholder="どこを変えたか（例：見出し）" value={d.label}
                onChange={e => set('diffs', form.diffs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <textarea rows={2} aria-label={`変更点${i + 1}の変更前`} placeholder="変更前" value={d.before}
                onChange={e => set('diffs', form.diffs.map((x, j) => (j === i ? { ...x, before: e.target.value } : x)))} />
              <textarea rows={2} aria-label={`変更点${i + 1}の変更後`} placeholder="変更後" value={d.after}
                onChange={e => set('diffs', form.diffs.map((x, j) => (j === i ? { ...x, after: e.target.value } : x)))} />
              <button className="admin-link" onClick={() => set('diffs', form.diffs.filter((_, j) => j !== i))}>この行を消す</button>
            </div>
          ))}
          <button className="btn btn--secondary ch-add" onClick={() => set('diffs', [...form.diffs, { label: '', before: '', after: '' }])}>＋ 変更点を追加</button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>関連する市民の声（公開中の課題から選択）</legend>
          {issues.length === 0 ? (
            <p className="admin-muted">公開中の課題はまだありません。</p>
          ) : (
            <div className="admin-checks admin-checks--column">
              {issues.map(i => (
                <label key={i.id}>
                  <input
                    type="checkbox"
                    checked={form.related_issues.includes(i.id)}
                    onChange={() =>
                      set('related_issues', form.related_issues.includes(i.id) ? form.related_issues.filter(x => x !== i.id) : [...form.related_issues, i.id])
                    }
                  />
                  課題 #{i.id} {i.title}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="ev-field">
          <label htmlFor="ch-commits">記録（GitHub のコミット。任意）</label>
          <input id="ch-commits" className="admin-input" placeholder="例：708e835 72ada07" value={form.commits} onChange={e => set('commits', e.target.value)} />
        </div>
      </div>

      <div className="admin-panel">
        <h2>プレビュー（サイトでの見え方）</h2>
        <ol className="changes ev-preview">
          <ChangeEntry change={preview.change} scope={preview.slugs.length === 4 ? '4つの政策すべて' : preview.slugs.map(s => policies.find(p => p.slug === s)?.name ?? s).join('、')} />
        </ol>
      </div>

      <div className="admin-panel ev-actions">
        {attempted && errors.length > 0 && (
          <ul className="admin-error" role="alert">
            {errors.map(e => <li key={e}>{e}</li>)}
          </ul>
        )}
        {message && <p className="admin-error" role="alert">{message}</p>}
        <div className="admin-actions">
          <button className="btn btn--secondary" disabled={busy || (!!row && !dirty)} onClick={() => write('draft')}>
            下書き保存
          </button>
          <button className="btn btn--primary" disabled={busy} onClick={() => write('published')}>
            公開する（変更できなくなります）
          </button>
        </div>
        {row && (
          <button className="admin-link ev-delete" disabled={busy} onClick={remove}>
            この下書きを削除する
          </button>
        )}
      </div>
    </article>
  )
}
