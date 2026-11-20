import { useCallback, useEffect, useMemo, useState } from 'react'
import EventCard from '../components/EventCard'
import { eventState, splitEvents, stateLabels } from '../lib/events'
import { PUBLIC_EVENT_COLUMNS, rowToEvent, type EventRow, type EventStatusOverride } from '../shared/events'
import { supabase } from './supabase'
import { clearDraft, loadDraft, saveDraft } from './draftStorage'

/**
 * 活動予定の管理（admin only — enforced by RLS). Drafts vs published;
 * published events must be unpublished before they can be deleted. Every
 * change is logged with the row before/after (audit_log). Unsaved input is
 * kept in localStorage so an error or a closed tab doesn't lose it.
 */
type Tab = 'upcoming' | 'past' | 'draft' | 'all'
const tabLabels: Record<Tab, string> = { upcoming: 'これから', past: '終了', draft: '下書き', all: 'すべて' }

interface Form {
  title: string
  event_date: string
  start_time: string
  end_time: string
  place: string
  place_url: string
  description: string
  audience: string
  how_to_join: string
  apply_url: string
  status_override: '' | EventStatusOverride
  report_id: string
  report_url: string
}

const emptyForm: Form = {
  title: '',
  event_date: '',
  start_time: '',
  end_time: '',
  place: '',
  place_url: '',
  description: '',
  audience: '',
  how_to_join: '',
  apply_url: '',
  status_override: '',
  report_id: '',
  report_url: '',
}

const rowToForm = (r: EventRow): Form => ({
  title: r.title,
  event_date: r.event_date,
  start_time: r.start_time?.slice(0, 5) ?? '',
  end_time: r.end_time?.slice(0, 5) ?? '',
  place: r.place ?? '',
  place_url: r.place_url ?? '',
  description: r.description,
  audience: r.audience ?? '',
  how_to_join: r.how_to_join ?? '',
  apply_url: r.apply_url ?? '',
  status_override: r.status_override ?? '',
  report_id: r.report_id ?? '',
  report_url: r.report_url ?? '',
})

const LIMITS: Partial<Record<keyof Form, number>> = {
  title: 100,
  place: 200,
  description: 2000,
  audience: 200,
  how_to_join: 500,
}

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {}
  if (!f.title.trim()) e.title = 'イベント名を入力してください。'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.event_date)) e.event_date = '開催日を選んでください。'
  if (!f.description.trim()) e.description = '説明文を入力してください。'
  if (f.end_time && !f.start_time) e.start_time = '終了時刻を入れる場合は、開始時刻も入れてください。'
  if (f.start_time && f.end_time && f.end_time <= f.start_time) e.end_time = '終了時刻は開始時刻より後にしてください。'
  for (const k of ['place_url', 'apply_url', 'report_url'] as const) {
    if (f[k] && !/^https:\/\/\S+$/.test(f[k].trim())) e[k] = 'https:// で始まる URL を入力してください。'
  }
  for (const [k, max] of Object.entries(LIMITS) as [keyof Form, number][]) {
    if (f[k].length > max) e[k] = `${max}文字以内で入力してください。`
  }
  return e
}

function newSlug(date: string) {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => (b % 36).toString(36)).join('')
  return `${date}-event-${rand}`
}

const nullIfEmpty = (s: string) => (s.trim() ? s.trim() : null)

function formToPayload(f: Form) {
  return {
    title: f.title.trim(),
    event_date: f.event_date,
    start_time: f.start_time || null,
    end_time: f.end_time || null,
    place: nullIfEmpty(f.place),
    place_url: nullIfEmpty(f.place_url),
    description: f.description.trim(),
    audience: nullIfEmpty(f.audience),
    how_to_join: nullIfEmpty(f.how_to_join),
    apply_url: nullIfEmpty(f.apply_url),
    status_override: f.status_override || null,
    report_id: f.report_id || null,
    report_url: nullIfEmpty(f.report_url),
  }
}

const storageKey = (id: string | 'new') => `event-form:${id}`
const loadLocal = (id: string | 'new') => loadDraft(storageKey(id), emptyForm)
const saveLocal = (id: string | 'new', f: Form) => saveDraft(storageKey(id), f)
const clearLocal = (id: string | 'new') => clearDraft(storageKey(id))

export default function EventsAdmin({ isAdmin }: { isAdmin: boolean }) {
  // Open on すべて so past events are visible too (これから is empty most of the time).
  const [tab, setTab] = useState<Tab>('all')
  const [rows, setRows] = useState<EventRow[]>([])
  const [selected, setSelected] = useState<string | 'new' | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('events').select(PUBLIC_EVENT_COLUMNS).order('event_date', { ascending: false })
    if (error) return setError('活動予定を読み込めませんでした。ログインし直してください。')
    setError(null)
    setRows((data ?? []) as unknown as EventRow[])
  }, [])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  const visible = useMemo(() => {
    const published = rows.filter(r => r.visibility === 'published')
    if (tab === 'draft') return rows.filter(r => r.visibility === 'draft')
    if (tab === 'all') return rows
    const { upcoming, past } = splitEvents(published.map(rowToEvent))
    const ids = new Set((tab === 'upcoming' ? upcoming : past).map(e => e.id))
    return published.filter(r => ids.has(r.slug)).sort((a, b) =>
      tab === 'upcoming' ? a.event_date.localeCompare(b.event_date) : b.event_date.localeCompare(a.event_date),
    )
  }, [rows, tab])

  if (!isAdmin) {
    return <p className="admin-muted admin-pad">活動予定は、佐藤祥子（管理者）だけが編集できます。</p>
  }

  const current = typeof selected === 'string' && selected !== 'new' ? rows.find(r => r.id === selected) ?? null : null

  return (
    <div>
      <nav className="admin-tabs" aria-label="表示する予定">
        {(Object.keys(tabLabels) as Tab[]).map(t => (
          <button
            key={t}
            className={`admin-tab${tab === t ? ' is-active' : ''}`}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t)
              setFlash(null)
            }}
          >
            {tabLabels[t]}
          </button>
        ))}
        <button className="btn btn--primary admin-new" onClick={() => setSelected('new')}>
          ＋ 新しい予定
        </button>
      </nav>

      <div className="admin-body">
        <section className="admin-list" aria-label="活動予定の一覧">
          {flash && (
            <p className="admin-flash" role="status">
              {flash}
            </p>
          )}
          {error && <p className="admin-error">{error}</p>}
          {!error && visible.length === 0 && <p className="admin-muted">この表示に当てはまる予定はありません。</p>}
          <ul>
            {visible.map(r => {
              const state = eventState(rowToEvent(r))
              return (
                <li key={r.id}>
                  <button
                    className={`admin-item${r.id === selected ? ' is-selected' : ''}`}
                    onClick={() => setSelected(r.id)}
                    aria-current={r.id === selected}
                  >
                    <span className="admin-item__meta">
                      <span className={`admin-status admin-status--issue-${r.visibility === 'published' ? 'published' : 'draft'}`}>
                        {r.visibility === 'published' ? '公開中' : '下書き'}
                      </span>
                      <span>{r.event_date.split('-').join('/')}</span>
                      <span>{stateLabels[state]}</span>
                    </span>
                    <span className="admin-item__body">{r.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="admin-detail" aria-label="予定の編集">
          {selected === null ? (
            <p className="admin-muted">左の一覧から予定を選ぶか、「新しい予定」を押してください。</p>
          ) : selected !== 'new' && !current ? (
            <p className="admin-muted">読み込み中…</p>
          ) : (
            <EventEditor
              key={selected === 'new' ? 'new' : `${current!.id}-${current!.updated_at}`}
              row={current}
              onDone={async (id, message) => {
                setFlash(message)
                await load()
                setSelected(id)
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function EventEditor({ row, onDone }: { row: EventRow | null; onDone: (id: string | null, message: string) => void }) {
  const [reports, setReports] = useState<{ id: string; title: string; report_date: string; visibility: string }[]>([])
  useEffect(() => {
    supabase
      .from('activity_reports')
      .select('id, title, report_date, visibility')
      .order('report_date', { ascending: false })
      .then(({ data }) => setReports((data ?? []) as typeof reports))
  }, [])
  const key = row?.id ?? 'new'
  const serverForm = row ? rowToForm(row) : emptyForm
  const restored = loadLocal(key)
  const hasRestored = !!restored && JSON.stringify(restored) !== JSON.stringify(serverForm)
  const [form, setForm] = useState<Form>(hasRestored ? restored! : serverForm)
  const [restoredNotice, setRestoredNotice] = useState(hasRestored)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const errors = validate(form)
  const shownErrors = attempted ? errors : {}
  const dirty = JSON.stringify(form) !== JSON.stringify(serverForm)
  const published = row?.visibility === 'published'

  useEffect(() => {
    if (dirty) saveLocal(key, form)
    else clearLocal(key)
  }, [form, dirty, key])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(prev => ({ ...prev, [k]: v }))

  const write = async (visibility: 'draft' | 'published', successMessage: string) => {
    setAttempted(true)
    if (Object.keys(errors).length > 0) {
      setMessage('入力内容を確認してください。入力はそのまま残っています。')
      return
    }
    setBusy(true)
    setMessage(null)
    const payload = { ...formToPayload(form), visibility }
    const result = row
      ? await supabase.from('events').update(payload).eq('id', row.id).select('id').single()
      : await supabase.from('events').insert({ ...payload, slug: newSlug(form.event_date) }).select('id').single()
    setBusy(false)
    if (result.error || !result.data) {
      setMessage('保存できませんでした。入力はそのまま残っています。時間をおいて、もう一度お試しください。')
      return
    }
    clearLocal(key)
    clearLocal(result.data.id as string)
    onDone(result.data.id as string, successMessage)
  }

  const remove = async () => {
    if (!row || published) return
    if (!window.confirm(`下書き「${row.title}」を削除します。元に戻せません。よろしいですか？`)) return
    setBusy(true)
    const { error } = await supabase.from('events').delete().eq('id', row.id)
    setBusy(false)
    if (error) return setMessage('削除できませんでした。')
    clearLocal(key)
    onDone(null, `「${row.title}」を削除しました。`)
  }

  const preview = rowToEvent({
    ...(row ?? ({} as EventRow)),
    ...formToPayload(form),
    id: row?.id ?? 'preview',
    slug: row?.slug ?? `${form.event_date || '2000-01-01'}-preview`,
    title: form.title || '（イベント名）',
    event_date: form.event_date || new Date().toISOString().slice(0, 10),
    description: form.description || '（説明文）',
    visibility: row?.visibility ?? 'draft',
    published_at: row?.published_at ?? null,
    updated_at: row?.updated_at ?? new Date().toISOString(),
  } as EventRow)

  const field = (k: keyof Form, label: string, input: JSX.Element, hint?: string) => (
    <div className="ev-field">
      <label htmlFor={`ev-${k}`}>{label}</label>
      {hint && (
        <p className="admin-muted ev-hint" id={`ev-${k}-hint`}>
          {hint}
        </p>
      )}
      {input}
      {shownErrors[k] && (
        <p className="admin-error ev-error" id={`ev-${k}-error`} role="alert">
          {shownErrors[k]}
        </p>
      )}
    </div>
  )
  const textProps = (k: keyof Form) => ({
    id: `ev-${k}`,
    value: form[k] as string,
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as Form[typeof k]),
    'aria-invalid': !!shownErrors[k],
    'aria-describedby': [shownErrors[k] ? `ev-${k}-error` : ''].filter(Boolean).join(' ') || undefined,
  })

  return (
    <article className="ev-editor">
      <header className="admin-detail__head">
        <p className="admin-detail__receipt admin-detail__name">{row ? row.title : '新しい予定'}</p>
        {row && (
          <span className={`admin-status admin-status--issue-${published ? 'published' : 'draft'}`}>{published ? '公開中' : '下書き'}</span>
        )}
      </header>

      {restoredNotice && (
        <p className="admin-warning">
          保存していなかった入力を復元しました。
          <button
            className="admin-link"
            onClick={() => {
              clearLocal(key)
              setForm(serverForm)
              setRestoredNotice(false)
            }}
          >
            復元を取り消す
          </button>
        </p>
      )}
      {published && <p className="admin-warning">公開中の予定です。保存すると、すぐにサイトに反映されます。</p>}
      <p className="admin-muted">参加者の名前や連絡先など、個人の情報は書かないでください。</p>

      <div className="admin-panel">
        {field('title', 'イベント名（必須）', <input className="admin-input" maxLength={100} {...textProps('title')} />)}
        <div className="ev-row">
          {field('event_date', '開催日（必須）', <input className="admin-input" type="date" {...textProps('event_date')} />)}
          {field('start_time', '開始時刻', <input className="admin-input" type="time" step={300} {...textProps('start_time')} />)}
          {field('end_time', '終了時刻', <input className="admin-input" type="time" step={300} {...textProps('end_time')} />)}
        </div>
        {field('place', '開催場所', <input className="admin-input" maxLength={200} {...textProps('place')} />, '例：宇部市〇〇ふれあいセンター 会議室')}
        {field('place_url', '場所の地図・案内ページ（URL）', <input className="admin-input" type="url" inputMode="url" {...textProps('place_url')} />)}
        {field('description', '説明文（必須）', <textarea rows={5} maxLength={2000} {...textProps('description')} />)}
        {field('audience', '参加対象', <input className="admin-input" maxLength={200} {...textProps('audience')} />, '例：どなたでも（お子さま連れ歓迎）')}
        {field('how_to_join', '参加方法', <textarea rows={2} maxLength={500} {...textProps('how_to_join')} />, '例：申込不要。直接会場へお越しください。')}
        {field('apply_url', '申込・詳細の URL', <input className="admin-input" type="url" inputMode="url" {...textProps('apply_url')} />)}
        {field(
          'status_override',
          '開催状況',
          <select
            id="ev-status_override"
            value={form.status_override}
            onChange={e => set('status_override', e.target.value as Form['status_override'])}
          >
            <option value="">自動（日付が過ぎたら終了）</option>
            <option value="cancelled">中止</option>
            <option value="postponed">延期</option>
            <option value="ended">終了（日付より前に終了扱いにする）</option>
          </select>,
        )}
        {field(
          'report_id',
          '関連する活動報告',
          <select id="ev-report_id" value={form.report_id} onChange={e => set('report_id', e.target.value)}>
            <option value="">なし</option>
            {reports.map(r => (
              <option key={r.id} value={r.id}>
                {r.report_date} {r.title}
                {r.visibility === 'draft' ? '（下書き）' : ''}
              </option>
            ))}
          </select>,
          '終了後、「活動報告を読む」のリンクになります。',
        )}
        {field('report_url', '活動報告の URL（一覧にない場合）', <input className="admin-input" type="url" inputMode="url" {...textProps('report_url')} />)}
      </div>

      <div className="admin-panel">
        <h2>プレビュー（サイトでの見え方）</h2>
        <div className="ev-preview">
          <EventCard event={preview} detail={false} />
        </div>
      </div>

      <div className="admin-panel ev-actions">
        {message && (
          <p className="admin-error" role="alert">
            {message}
          </p>
        )}
        {!published ? (
          <div className="admin-actions">
            <button className="btn btn--secondary" disabled={busy || (!!row && !dirty)} onClick={() => write('draft', '下書きを保存しました。')}>
              下書き保存
            </button>
            <button className="btn btn--primary" disabled={busy} onClick={() => write('published', `「${form.title}」を公開しました。`)}>
              保存して公開する
            </button>
          </div>
        ) : (
          <div className="admin-actions">
            <button className="btn btn--primary" disabled={busy || !dirty} onClick={() => write('published', '公開中の予定を更新しました。')}>
              変更を公開する
            </button>
            <button className="btn btn--secondary" disabled={busy} onClick={() => write('draft', `「${form.title}」を非公開（下書き）にしました。`)}>
              非公開にする
            </button>
          </div>
        )}
        {row && !published && (
          <button className="admin-link ev-delete" disabled={busy} onClick={remove}>
            この下書きを削除する
          </button>
        )}
        {row && published && <p className="admin-muted">公開中の予定は削除できません。削除するには、先に「非公開にする」を押してください。</p>}
      </div>
    </article>
  )
}
