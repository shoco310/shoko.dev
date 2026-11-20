import { useCallback, useEffect, useState } from 'react'
import { FREQUENCY_OPTIONS, INTEREST_OPTIONS } from '../shared/volunteer'
import { supabase } from './supabase'

/**
 * Volunteer sign-ups for さとうしょうこ後援会. Separate from citizen
 * submissions. Email and phone are not readable by query; they are revealed
 * one sign-up at a time (and logged) via reveal_volunteer_contact().
 */
type Status = 'new' | 'contacted' | 'active' | 'paused' | 'closed'

const statusLabels: Record<Status, string> = {
  new: '新規',
  contacted: '連絡済み',
  active: '活動中',
  paused: 'お休み中',
  closed: '終了・取り消し',
}
const statusOrder: Status[] = ['new', 'contacted', 'active', 'paused', 'closed']

interface Volunteer {
  id: string
  name: string
  area: string | null
  interests: string[]
  frequency: string
  skills: string | null
  message: string | null
  adult: boolean
  association_info: boolean
  status: Status
  staff_note: string | null
  created_at: string
  updated_at: string
}

const columns =
  'id, name, area, interests, frequency, skills, message, adult, association_info, status, staff_note, created_at, updated_at'

const interestLabel = (v: string) => INTEREST_OPTIONS.find(o => o.value === v)?.label ?? v
const frequencyLabel = (v: string) => FREQUENCY_OPTIONS.find(o => o.value === v)?.label ?? v
const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })

export default function VolunteerDashboard() {
  const [filter, setFilter] = useState<Status | 'all'>('new')
  const [items, setItems] = useState<Volunteer[]>([])
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let q = supabase.from('volunteer_signups').select(columns).order('created_at', { ascending: false }).limit(300)
    if (filter !== 'all') q = q.eq('status', filter)
    const [{ data, error }, { data: all }] = await Promise.all([q, supabase.from('volunteer_signups').select('status')])
    setLoading(false)
    if (error) return setError('一覧を読み込めませんでした。ログインし直してください。')
    setItems((data ?? []) as Volunteer[])
    const c: Partial<Record<Status, number>> = {}
    for (const row of (all ?? []) as { status: Status }[]) c[row.status] = (c[row.status] ?? 0) + 1
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
        <section className="admin-list" aria-label="ボランティア登録の一覧">
          {flash && (
            <p className="admin-flash" role="status">
              {flash}
            </p>
          )}
          {error && <p className="admin-error">{error}</p>}
          {loading && <p className="admin-muted" aria-live="polite">読み込み中…</p>}
          {!loading && items.length === 0 && <p className="admin-muted">この状態の登録はありません。</p>}
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <button
                  className={`admin-item${item.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  aria-current={item.id === selectedId}
                >
                  <span className="admin-item__meta">
                    <span className={`admin-status admin-status--vol-${item.status}`}>{statusLabels[item.status]}</span>
                    <span>{formatDateTime(item.created_at)}</span>
                    {!item.adult && <span className="admin-item__contact">18歳未満</span>}
                    {item.association_info && <span className="admin-item__contact">入会案内希望</span>}
                  </span>
                  <span className="admin-item__body">
                    {item.name}
                    {item.area ? `（${item.area}）` : ''}
                  </span>
                  {item.interests.length > 0 && (
                    <span className="admin-item__themes">{item.interests.map(interestLabel).join('・')}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-detail" aria-label="登録の詳細">
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
            <p className="admin-muted">左の一覧から登録を選んでください。</p>
          )}
        </section>
      </div>
    </div>
  )
}

function Detail({ item, onSaved }: { item: Volunteer; onSaved: (message: string) => void }) {
  const [status, setStatus] = useState<Status>(item.status)
  const [note, setNote] = useState(item.staff_note ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [contact, setContact] = useState<{ email: string; phone: string | null } | null | 'none'>(null)
  const [revealing, setRevealing] = useState(false)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('volunteer_signups')
      .update({ status, staff_note: note.trim() || null })
      .eq('id', item.id)
    setSaving(false)
    if (error) return setMessage('保存できませんでした。')
    onSaved(status !== item.status ? `${item.name} さんを「${statusLabels[status]}」に変更しました。` : 'メモを保存しました。')
  }

  const reveal = async () => {
    setRevealing(true)
    const { data, error } = await supabase.rpc('reveal_volunteer_contact', { p_id: item.id })
    setRevealing(false)
    if (error) return setMessage('連絡先を表示できませんでした。')
    const row = (data as { email: string; phone: string | null }[] | null)?.[0]
    setContact(row ?? 'none')
  }

  const dirty = status !== item.status || (note.trim() || null) !== (item.staff_note ?? null)

  return (
    <article>
      <header className="admin-detail__head">
        <p className="admin-detail__receipt admin-detail__name">{item.name}</p>
        <p className="admin-muted">登録：{formatDateTime(item.created_at)}</p>
      </header>

      {!item.adult && (
        <p className="admin-warning">
          18歳未満の方です。公職選挙法により、選挙運動にあたる活動はご案内できません。
        </p>
      )}

      <dl className="admin-facts admin-facts--spaced">
        <div>
          <dt>地域</dt>
          <dd>{item.area ?? '—'}</dd>
        </div>
        <div>
          <dt>興味のある活動</dt>
          <dd>{item.interests.length ? item.interests.map(interestLabel).join('、') : '—'}</dd>
        </div>
        <div>
          <dt>頻度</dt>
          <dd>{frequencyLabel(item.frequency)}</dd>
        </div>
        <div>
          <dt>年齢</dt>
          <dd>{item.adult ? '18歳以上' : '18歳未満'}</dd>
        </div>
        <div>
          <dt>入会の案内</dt>
          <dd>{item.association_info ? '希望あり（入会はまだしていません）' : '希望なし'}</dd>
        </div>
        <div>
          <dt>得意なこと</dt>
          <dd className="admin-pre">{item.skills ?? '—'}</dd>
        </div>
        <div>
          <dt>自由記述</dt>
          <dd className="admin-pre">{item.message ?? '—'}</dd>
        </div>
      </dl>

      <div className="admin-panel">
        <h2>連絡先</h2>
        {contact === null && (
          <>
            <p className="admin-muted">必要なときだけ表示してください。表示すると操作の記録が残ります。</p>
            <button className="btn btn--secondary" onClick={reveal} disabled={revealing}>
              {revealing ? '表示しています…' : 'メール・電話番号を表示する'}
            </button>
          </>
        )}
        {contact === 'none' && <p className="admin-muted">登録は削除されています。</p>}
        {contact && contact !== 'none' && (
          <dl className="admin-facts">
            <div>
              <dt>メール</dt>
              <dd>{contact.email}</dd>
            </div>
            <div>
              <dt>電話番号</dt>
              <dd>{contact.phone ?? '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="admin-panel">
        <h2>対応</h2>
        <label htmlFor="vol-status">状態</label>
        <select id="vol-status" value={status} onChange={e => setStatus(e.target.value as Status)}>
          {statusOrder.map(s => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <label htmlFor="vol-note">メモ（本人には見えません）</label>
        <textarea id="vol-note" rows={4} value={note} onChange={e => setNote(e.target.value)} maxLength={4000} />
        <p className="admin-muted">登録は、最後に対応してから2年で自動的に削除されます。取り消しの申し出があった場合は「終了・取り消し」にし、必要に応じて削除してください。</p>
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
