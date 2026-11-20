import { useCallback, useEffect, useState } from 'react'
import { AGE_OPTIONS } from '../shared/voice'
import { supabase, statusLabels, statusOrder, type Contact, type Submission, type SubmissionStatus } from './supabase'

type Filter = SubmissionStatus | 'all'

const columns =
  'id, receipt_no, body, theme_hints, area_hint, age_range, has_contact, status, reviewer_note, created_at, updated_at'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Dashboard() {
  const [filter, setFilter] = useState<Filter>('received')
  const [items, setItems] = useState<Submission[]>([])
  const [counts, setCounts] = useState<Partial<Record<SubmissionStatus, number>>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from('submissions').select(columns).order('created_at', { ascending: false }).limit(200)
    if (filter !== 'all') query = query.eq('status', filter)
    const [{ data, error }, { data: all }] = await Promise.all([query, supabase.from('submissions').select('status')])
    setLoading(false)
    if (error) return setError('一覧を読み込めませんでした。ログインし直してください。')
    setItems((data ?? []) as Submission[])
    const c: Partial<Record<SubmissionStatus, number>> = {}
    for (const row of (all ?? []) as { status: SubmissionStatus }[]) c[row.status] = (c[row.status] ?? 0) + 1
    setCounts(c)
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const selected = items.find(i => i.id === selectedId) ?? null

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
              setSelectedId(null)
              setFlash(null)
            }}
          >
            {s === 'all' ? 'すべて' : statusLabels[s]}
            {s !== 'all' && <span className="admin-tab__count">{counts[s] ?? 0}</span>}
          </button>
        ))}
      </nav>

      <div className="admin-body">
        <section className="admin-list" aria-label="投稿の一覧">
          {flash && (
            <p className="admin-flash" role="status">
              {flash}
            </p>
          )}
          {error && <p className="admin-error">{error}</p>}
          {loading && <p className="admin-muted" aria-live="polite">読み込み中…</p>}
          {!loading && items.length === 0 && <p className="admin-muted">この状態の投稿はありません。</p>}
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <button
                  className={`admin-item${item.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  aria-current={item.id === selectedId}
                >
                  <span className="admin-item__meta">
                    <span className={`admin-status admin-status--${item.status}`}>{statusLabels[item.status]}</span>
                    <span>{formatDateTime(item.created_at)}</span>
                    {item.has_contact && <span className="admin-item__contact">連絡先あり</span>}
                  </span>
                  <span className="admin-item__body">{item.body.slice(0, 90)}{item.body.length > 90 ? '…' : ''}</span>
                  {item.theme_hints.length > 0 && <span className="admin-item__themes">{item.theme_hints.join('・')}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-detail" aria-label="投稿の詳細">
          {selected ? (
            <Detail
              key={selected.id}
              item={selected}
              onSaved={msg => {
                setFlash(msg)
                load()
              }}
            />
          ) : (
            <p className="admin-muted">左の一覧から投稿を選んでください。</p>
          )}
        </section>
      </div>
    </div>
  )
}

function Detail({ item, onSaved }: { item: Submission; onSaved: (message: string) => void }) {
  const [status, setStatus] = useState<SubmissionStatus>(item.status)
  const [note, setNote] = useState(item.reviewer_note ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [contact, setContact] = useState<Contact | null | 'none'>(null)
  const [revealing, setRevealing] = useState(false)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('submissions')
      .update({ status, reviewer_note: note.trim() || null })
      .eq('id', item.id)
    setSaving(false)
    if (error) return setMessage('保存できませんでした。')
    const moved = status !== item.status ? `「${statusLabels[status]}」に変更しました。` : 'メモを保存しました。'
    setMessage('保存しました。')
    onSaved(`${item.receipt_no} を${moved}`)
  }

  const reveal = async () => {
    setRevealing(true)
    const { data, error } = await supabase.rpc('reveal_contact', { p_submission_id: item.id })
    setRevealing(false)
    if (error) return setMessage('連絡先を表示できませんでした。')
    const row = (data as Contact[] | null)?.[0]
    setContact(row ?? 'none')
  }

  const dirty = status !== item.status || (note.trim() || null) !== (item.reviewer_note ?? null)

  return (
    <article>
      <header className="admin-detail__head">
        <p className="admin-detail__receipt">{item.receipt_no}</p>
        <p className="admin-muted">受付：{formatDateTime(item.created_at)}</p>
      </header>

      <div className="admin-detail__body">{item.body}</div>

      <dl className="admin-facts">
        <div>
          <dt>近いテーマ</dt>
          <dd>{item.theme_hints.length ? item.theme_hints.join('、') : '—'}</dd>
        </div>
        <div>
          <dt>地区</dt>
          <dd>{item.area_hint ?? '—'}</dd>
        </div>
        <div>
          <dt>年代</dt>
          <dd>{AGE_OPTIONS.find(a => a.value === item.age_range)?.label ?? '—'}</dd>
        </div>
      </dl>

      <div className="admin-panel">
        <h2>連絡先</h2>
        {!item.has_contact && <p className="admin-muted">連絡先の入力はありません。</p>}
        {item.has_contact && contact === null && (
          <>
            <p className="admin-muted">必要なときだけ表示してください。表示すると操作の記録が残ります。</p>
            <button className="btn btn--secondary" onClick={reveal} disabled={revealing}>
              {revealing ? '表示しています…' : '連絡先を表示する'}
            </button>
          </>
        )}
        {contact === 'none' && <p className="admin-muted">連絡先は保存期間を過ぎたため削除されています。</p>}
        {contact && contact !== 'none' && (
          <dl className="admin-facts">
            <div>
              <dt>お名前</dt>
              <dd>{contact.name ?? '—'}</dd>
            </div>
            <div>
              <dt>メール</dt>
              <dd>{contact.email ?? '—'}</dd>
            </div>
            <div>
              <dt>返信の希望</dt>
              <dd>{contact.reply_ok ? 'あり' : 'なし'}</dd>
            </div>
            <div>
              <dt>削除予定日</dt>
              <dd>{contact.delete_after}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="admin-panel">
        <h2>対応</h2>
        <label htmlFor="admin-status">状態</label>
        <select id="admin-status" value={status} onChange={e => setStatus(e.target.value as SubmissionStatus)}>
          {statusOrder.map(s => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <label htmlFor="admin-note">メモ（公開されません）</label>
        <textarea id="admin-note" rows={4} value={note} onChange={e => setNote(e.target.value)} maxLength={4000} />
        <p className="admin-muted">
          「政策の参考にした」「公開しない」「スパム」にすると、連絡先は6か月後に自動で削除されます。
        </p>
        <div className="admin-actions">
          <button className="btn btn--primary" onClick={save} disabled={saving || !dirty}>
            {saving ? '保存しています…' : '保存する'}
          </button>
          {message && <span role="status">{message}</span>}
        </div>
      </div>
    </article>
  )
}
