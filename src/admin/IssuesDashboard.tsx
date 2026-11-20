import { useCallback, useEffect, useState } from 'react'
import IssueCard from '../components/IssueCard'
import { policies } from '../data/policy'
import {
  ISSUE_THEMES,
  PROGRESS_OPTIONS,
  SUMMARY_MAX,
  TITLE_MAX,
  UPDATE_MAX,
  type IssueProgress,
  type IssueStatus,
  type PublicIssue,
} from '../shared/issues'
import { supabase } from './supabase'

/**
 * Drafting and approving public issues. Staff draft; only an admin (the
 * operator) can publish — enforced in the database, mirrored here in the UI.
 * The original submissions are shown for reference only and are never public.
 */
interface IssueRow {
  id: number
  title: string
  summary: string
  themes: string[]
  progress: IssueProgress
  status: IssueStatus
  voice_count: number
  published_at: string | null
  updated_at: string
}
interface Source {
  submission_id: string
  submissions: { receipt_no: string; body: string; created_at: string } | null
}
interface Update {
  id: number
  body: string
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
}
export interface PendingSource {
  submissionId: string
  receiptNo: string
  body: string
}

const statusLabels: Record<IssueStatus, string> = { draft: '下書き', published: '公開中', archived: '非公開（保管）' }
const statusOrder: IssueStatus[] = ['draft', 'published', 'archived']
const checklist = [
  '個人や家族、特定の場所・お店などが特定できる内容を含んでいない',
  '投稿の原文をそのまま写していない（要約・書き直しになっている）',
  '投稿した方や関係する方を傷つける表現がない',
]
const formatDate = (iso: string) => new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })

export default function IssuesDashboard({
  isAdmin,
  pendingSource,
  onPendingUsed,
}: {
  isAdmin: boolean
  pendingSource: PendingSource | null
  onPendingUsed: () => void
}) {
  const [filter, setFilter] = useState<IssueStatus | 'all'>('draft')
  const [items, setItems] = useState<IssueRow[]>([])
  const [selected, setSelected] = useState<number | 'new' | null>(pendingSource ? 'new' : null)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The selected issue is loaded by id, independently of the list filter, so
  // it stays open after it moves to another status (e.g. once published).
  const [current, setCurrent] = useState<IssueRow | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    let q = supabase
      .from('public_issues')
      .select('id, title, summary, themes, progress, status, voice_count, published_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(300)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) return setError('一覧を読み込めませんでした。ログインし直してください。')
    setError(null)
    setItems((data ?? []) as IssueRow[])
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (pendingSource) setSelected('new')
  }, [pendingSource])

  useEffect(() => {
    if (typeof selected !== 'number') {
      setCurrent(null)
      return
    }
    let cancelled = false
    supabase
      .from('public_issues')
      .select('id, title, summary, themes, progress, status, voice_count, published_at, updated_at')
      .eq('id', selected)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCurrent((data as IssueRow) ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [selected, reloadKey])

  return (
    <div>
      <nav className="admin-tabs" aria-label="状態で絞り込み">
        {[...statusOrder, 'all' as const].map(s => (
          <button
            key={s}
            className={`admin-tab${filter === s ? ' is-active' : ''}`}
            aria-pressed={filter === s}
            onClick={() => {
              setFilter(s)
              setSelected(null)
              setFlash(null)
            }}
          >
            {s === 'all' ? 'すべて' : statusLabels[s]}
          </button>
        ))}
        <button className="btn btn--primary admin-new" onClick={() => setSelected('new')}>
          ＋ 新しい課題
        </button>
      </nav>

      <div className="admin-body">
        <section className="admin-list" aria-label="課題の一覧">
          {flash && (
            <p className="admin-flash" role="status">
              {flash}
            </p>
          )}
          {error && <p className="admin-error">{error}</p>}
          {items.length === 0 && !error && <p className="admin-muted">この状態の課題はありません。</p>}
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <button
                  className={`admin-item${item.id === selected ? ' is-selected' : ''}`}
                  onClick={() => setSelected(item.id)}
                  aria-current={item.id === selected}
                >
                  <span className="admin-item__meta">
                    <span className={`admin-status admin-status--issue-${item.status}`}>{statusLabels[item.status]}</span>
                    <span>#{item.id}</span>
                    <span>声 {item.voice_count}件</span>
                  </span>
                  <span className="admin-item__body">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-detail" aria-label="課題の編集">
          {typeof selected === 'number' && current?.id !== selected ? (
            <p className="admin-muted" aria-live="polite">読み込み中…</p>
          ) : selected === null ? (
            <p className="admin-muted">左の一覧から課題を選ぶか、「新しい課題」を押してください。投稿の画面から「この投稿から課題を作る」でも始められます。</p>
          ) : (
            <IssueEditor
              key={selected === 'new' ? `new-${pendingSource?.submissionId ?? ''}` : `${selected}-${current?.updated_at}-${current?.status}`}
              issue={current}
              isAdmin={isAdmin}
              pendingSource={selected === 'new' ? pendingSource : null}
              onSaved={(id, msg) => {
                if (selected === 'new') onPendingUsed()
                setFlash(msg)
                setSelected(id)
                setReloadKey(k => k + 1)
                load()
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function IssueEditor({
  issue,
  isAdmin,
  pendingSource,
  onSaved,
}: {
  issue: IssueRow | null
  isAdmin: boolean
  pendingSource: PendingSource | null
  onSaved: (id: number, message: string) => void
}) {
  const [title, setTitle] = useState(issue?.title ?? '')
  const [summary, setSummary] = useState(issue?.summary ?? '')
  const [themes, setThemes] = useState<string[]>(issue?.themes ?? [])
  const [progress, setProgress] = useState<IssueProgress>(issue?.progress ?? 'heard')
  const [links, setLinks] = useState<Record<string, string>>({})
  const [savedLinks, setSavedLinks] = useState<Record<string, string>>({})
  const [sources, setSources] = useState<Source[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [receipt, setReceipt] = useState('')
  const [newUpdate, setNewUpdate] = useState('')
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadChildren = useCallback(async () => {
    if (!issue) return
    const [s, l, u] = await Promise.all([
      supabase.from('issue_sources').select('submission_id, submissions(receipt_no, body, created_at)').eq('issue_id', issue.id),
      supabase.from('issue_policy_links').select('policy_slug, note').eq('issue_id', issue.id),
      supabase
        .from('issue_updates')
        .select('id, body, status, published_at, created_at')
        .eq('issue_id', issue.id)
        .order('created_at', { ascending: true }),
    ])
    setSources((s.data ?? []) as unknown as Source[])
    const map: Record<string, string> = {}
    for (const row of (l.data ?? []) as { policy_slug: string; note: string | null }[]) map[row.policy_slug] = row.note ?? ''
    setLinks(map)
    setSavedLinks(map)
    setUpdates((u.data ?? []) as Update[])
  }, [issue])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  const published = issue?.status === 'published'
  const locked = published && !isAdmin
  const fieldsDirty =
    !issue ||
    title !== issue.title ||
    summary !== issue.summary ||
    progress !== issue.progress ||
    JSON.stringify([...themes].sort()) !== JSON.stringify([...issue.themes].sort())
  const linksDirty = JSON.stringify(links) !== JSON.stringify(savedLinks)
  const dirty = fieldsDirty || linksDirty
  const canSave = title.trim().length > 0 && title.length <= TITLE_MAX && summary.length <= SUMMARY_MAX && !locked

  const save = async () => {
    setBusy(true)
    setMessage(null)
    let id = issue?.id
    if (!issue) {
      const { data, error } = await supabase
        .from('public_issues')
        .insert({ title: title.trim(), summary: summary.trim(), themes, progress })
        .select('id')
        .single()
      if (error || !data) {
        setBusy(false)
        return setMessage('保存できませんでした。')
      }
      id = data.id as number
      if (pendingSource) await supabase.from('issue_sources').insert({ issue_id: id, submission_id: pendingSource.submissionId })
    } else if (fieldsDirty) {
      const { error } = await supabase
        .from('public_issues')
        .update({ title: title.trim(), summary: summary.trim(), themes, progress })
        .eq('id', issue.id)
      if (error) {
        setBusy(false)
        return setMessage(error.message.includes('admin_approval_required') ? '公開中の課題は、佐藤祥子だけが変更できます。' : '保存できませんでした。')
      }
    }
    // Policy links
    for (const slug of Object.keys(savedLinks)) {
      if (!(slug in links)) await supabase.from('issue_policy_links').delete().eq('issue_id', id!).eq('policy_slug', slug)
    }
    for (const [slug, note] of Object.entries(links)) {
      if (!(slug in savedLinks)) {
        await supabase.from('issue_policy_links').insert({ issue_id: id!, policy_slug: slug, note: note.trim() || null })
      } else if (savedLinks[slug] !== note) {
        await supabase.from('issue_policy_links').update({ note: note.trim() || null }).eq('issue_id', id!).eq('policy_slug', slug)
      }
    }
    setBusy(false)
    onSaved(id!, issue ? `課題 #${id} を保存しました。` : `課題 #${id} を下書きとして作成しました。`)
  }

  const attach = async () => {
    if (!issue || !receipt.trim()) return
    const { error } = await supabase.rpc('attach_submission_by_receipt', { p_issue_id: issue.id, p_receipt: receipt })
    if (error) return setMessage('その受付番号の投稿が見つかりませんでした。')
    setReceipt('')
    setMessage('投稿を追加しました。')
    loadChildren()
  }

  const detach = async (submissionId: string) => {
    if (!issue) return
    await supabase.from('issue_sources').delete().eq('issue_id', issue.id).eq('submission_id', submissionId)
    loadChildren()
  }

  const addUpdate = async () => {
    if (!issue || !newUpdate.trim()) return
    const { error } = await supabase.from('issue_updates').insert({ issue_id: issue.id, body: newUpdate.trim() })
    if (error) return setMessage('経過を追加できませんでした。')
    setNewUpdate('')
    loadChildren()
  }

  const callRpc = async (fn: string, args: Record<string, unknown>, done: string) => {
    setBusy(true)
    const { error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) return setMessage(error.message.includes('admin_approval_required') ? '佐藤祥子の承認が必要です。' : '操作できませんでした。')
    if (issue) onSaved(issue.id, done)
    loadChildren()
  }

  const preview: PublicIssue = {
    id: issue?.id ?? 0,
    title: title || '（タイトル）',
    summary: summary || '（要約）',
    themes,
    progress,
    voice_count: issue ? sources.length : pendingSource ? 1 : 0,
    published_at: issue?.published_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    issue_policy_links: Object.entries(links).map(([policy_slug, note]) => ({ policy_slug, note })),
  }

  const sourceList: { key: string; receipt: string; body: string; removable: boolean }[] = issue
    ? sources.map(s => ({
        key: s.submission_id,
        receipt: s.submissions?.receipt_no ?? '（削除済み）',
        body: s.submissions?.body ?? '',
        removable: true,
      }))
    : pendingSource
      ? [{ key: pendingSource.submissionId, receipt: pendingSource.receiptNo, body: pendingSource.body, removable: false }]
      : []

  return (
    <article className="issue-editor">
      <header className="admin-detail__head">
        <p className="admin-detail__receipt">{issue ? `課題 #${issue.id}` : '新しい課題'}</p>
        {issue && <span className={`admin-status admin-status--issue-${issue.status}`}>{statusLabels[issue.status]}</span>}
      </header>

      {published && isAdmin && (
        <p className="admin-warning">この課題は公開中です。保存すると、変更はすぐにサイトに反映されます。</p>
      )}
      {locked && <p className="admin-warning">公開中の課題は、佐藤祥子だけが変更できます。</p>}

      <div className="admin-panel">
        <h2>元になった投稿（非公開・参考用）</h2>
        {sourceList.length === 0 && <p className="admin-muted">まだ投稿が結びついていません。</p>}
        {sourceList.map(s => (
          <div className="issue-source" key={s.key}>
            <p className="issue-source__head">
              <span>{s.receipt}</span>
              {s.removable && issue && !locked && (
                <button className="admin-link" onClick={() => detach(s.key)}>
                  外す
                </button>
              )}
            </p>
            <p className="admin-pre">{s.body}</p>
          </div>
        ))}
        {issue && !locked && (
          <div className="issue-attach">
            <input aria-label="追加する投稿の受付番号" placeholder="受付番号（UB-XXXX-XXXX）" value={receipt} onChange={e => setReceipt(e.target.value)} />
            <button className="btn btn--secondary" onClick={attach} disabled={!receipt.trim()}>
              投稿を追加
            </button>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <h2>公開する内容</h2>
        <p className="admin-muted">原文をそのまま写さず、個人が特定できないように書き直してください。</p>
        <label htmlFor="issue-title">タイトル（{title.length}/{TITLE_MAX}）</label>
        <input id="issue-title" className="admin-input" value={title} maxLength={TITLE_MAX} onChange={e => setTitle(e.target.value)} disabled={locked} />
        <label htmlFor="issue-summary">要約（{summary.length}/{SUMMARY_MAX}）</label>
        <textarea id="issue-summary" rows={6} value={summary} maxLength={SUMMARY_MAX} onChange={e => setSummary(e.target.value)} disabled={locked} />
        <fieldset className="admin-fieldset" disabled={locked}>
          <legend>テーマ</legend>
          <div className="admin-checks">
            {ISSUE_THEMES.map(t => (
              <label key={t}>
                <input
                  type="checkbox"
                  checked={themes.includes(t)}
                  onChange={() => setThemes(themes.includes(t) ? themes.filter(x => x !== t) : [...themes, t])}
                />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor="issue-progress">取り組みの状況</label>
        <select id="issue-progress" value={progress} onChange={e => setProgress(e.target.value as IssueProgress)} disabled={locked}>
          {PROGRESS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <fieldset className="admin-fieldset" disabled={locked}>
          <legend>関連する政策（なしでも構いません）</legend>
          {policies.map(p => (
            <div key={p.slug} className="issue-link-row">
              <label>
                <input
                  type="checkbox"
                  checked={p.slug in links}
                  onChange={() => {
                    const next = { ...links }
                    if (p.slug in next) delete next[p.slug]
                    else next[p.slug] = ''
                    setLinks(next)
                  }}
                />
                {p.name}
              </label>
              {p.slug in links && (
                <input
                  className="admin-input"
                  aria-label={`${p.name}との関係（任意）`}
                  placeholder="関係のひとこと（任意。例：地域の安全）"
                  maxLength={200}
                  value={links[p.slug]}
                  onChange={e => setLinks({ ...links, [p.slug]: e.target.value })}
                />
              )}
            </div>
          ))}
        </fieldset>
        <div className="admin-actions">
          <button className="btn btn--primary" onClick={save} disabled={busy || !dirty || !canSave}>
            {busy ? '保存しています…' : issue ? '保存する' : '下書きとして作成する'}
          </button>
          {message && <span role="status">{message}</span>}
        </div>
      </div>

      <div className="admin-panel">
        <h2>公開したときの見え方</h2>
        <IssueCard issue={preview} />
      </div>

      {issue && (
        <div className="admin-panel">
          <h2>経過（公開には承認が必要）</h2>
          {updates.length === 0 && <p className="admin-muted">まだ経過はありません。</p>}
          <ul className="issue-updates-admin">
            {updates.map(u => (
              <li key={u.id}>
                <p className="admin-pre">{u.body}</p>
                <p className="admin-muted">
                  {u.status === 'published' ? `公開中（${formatDate(u.published_at!)}）` : '下書き'}
                  {isAdmin && u.status === 'draft' && (
                    <button className="admin-link" onClick={() => callRpc('publish_issue_update', { p_update_id: u.id }, '経過を公開しました。')}>
                      公開する
                    </button>
                  )}
                  {isAdmin && u.status === 'published' && (
                    <button className="admin-link" onClick={() => callRpc('unpublish_issue_update', { p_update_id: u.id }, '経過の公開を取り下げました。')}>
                      取り下げる
                    </button>
                  )}
                </p>
              </li>
            ))}
          </ul>
          <label htmlFor="issue-update">経過を追加（{newUpdate.length}/{UPDATE_MAX}）</label>
          <textarea id="issue-update" rows={3} maxLength={UPDATE_MAX} value={newUpdate} onChange={e => setNewUpdate(e.target.value)} />
          <button className="btn btn--secondary" onClick={addUpdate} disabled={!newUpdate.trim()}>
            下書きとして追加
          </button>
        </div>
      )}

      {issue && (
        <div className="admin-panel issue-approval">
          <h2>公開の承認</h2>
          {!isAdmin ? (
            <p className="admin-muted">公開には、佐藤祥子の承認が必要です。</p>
          ) : issue.status === 'published' ? (
            <div className="admin-actions">
              <button className="btn btn--secondary" disabled={busy} onClick={() => callRpc('unpublish_issue', { p_issue_id: issue.id, p_archive: false }, `課題 #${issue.id} の公開を取り下げ、下書きに戻しました。`)}>
                公開を取り下げる
              </button>
              <button className="admin-link" disabled={busy} onClick={() => callRpc('unpublish_issue', { p_issue_id: issue.id, p_archive: true }, `課題 #${issue.id} を非公開にして保管しました。`)}>
                非公開にして保管
              </button>
            </div>
          ) : (
            <>
              <p className="admin-muted">公開前に確認してください。</p>
              {checklist.map((c, i) => (
                <label key={c} className="admin-check">
                  <input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((v, j) => (j === i ? !v : v)))} />
                  {c}
                </label>
              ))}
              {dirty && <p className="admin-warning">保存していない変更があります。先に保存してください。</p>}
              <button
                className="btn btn--primary"
                disabled={busy || dirty || !checks.every(Boolean) || !summary.trim()}
                onClick={() => callRpc('publish_issue', { p_issue_id: issue.id, p_checked: true }, `課題 #${issue.id} を公開しました。`)}
              >
                承認して公開する
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}
