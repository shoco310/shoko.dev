import { useCallback, useEffect, useState } from 'react'
import { ActivityCard } from '../components/ActivitySection'
import {
  PUBLIC_REPORT_COLUMNS,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_KIND_LABELS,
  type ReportCategory,
  type ReportKind,
  type ReportRow,
} from '../shared/reports'
import { clearDraft, loadDraft, saveDraft } from './draftStorage'
import { supabase } from './supabase'
import { uploadPhoto } from './uploadPhoto'

/**
 * 活動報告の管理（admin only — RLS）. Drafts vs published; published reports
 * must be unpublished before deletion; every change is logged with the row
 * before/after. Unsaved input survives errors and reloads.
 */
type Tab = 'published' | 'draft' | 'all'
const tabLabels: Record<Tab, string> = { published: '公開中', draft: '下書き', all: 'すべて' }

interface Form {
  kind: ReportKind
  /** '' = 未設定 */
  category: ReportCategory | ''
  title: string
  report_date: string
  summary: string
  body: string
  photo_url: string
  photo_alt: string
  external_url: string
  event_id: string
}

const emptyForm: Form = {
  kind: 'report',
  category: '',
  title: '',
  report_date: '',
  summary: '',
  body: '',
  photo_url: '',
  photo_alt: '',
  external_url: '',
  event_id: '',
}

const rowToForm = (r: ReportRow): Form => ({
  kind: r.kind,
  category: r.category ?? '',
  title: r.title,
  report_date: r.report_date,
  summary: r.summary,
  body: r.body ?? '',
  photo_url: r.photo_url ?? '',
  photo_alt: r.photo_alt ?? '',
  external_url: r.external_url ?? '',
  event_id: r.event_id ?? '',
})

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {}
  if (!f.title.trim()) e.title = 'タイトルを入力してください。'
  else if (f.title.length > 150) e.title = '150文字以内で入力してください。'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.report_date)) e.report_date = '日付を選んでください。'
  if (!f.summary.trim()) e.summary = '一覧に出す説明を入力してください。'
  else if (f.summary.length > 400) e.summary = '400文字以内で入力してください。'
  if (f.body.length > 20000) e.body = '20,000文字以内で入力してください。'
  if (f.photo_url && !/^(https:\/\/|\/images\/|http:\/\/(127\.0\.0\.1|localhost):\d+\/)\S+$/.test(f.photo_url)) e.photo_url = '写真をアップロードするか、https:// の URL を入力してください。'
  if (f.photo_url && !f.photo_alt.trim()) e.photo_alt = '写真の説明（目の不自由な方への読み上げにも使われます）を入力してください。'
  if (f.external_url && !/^https:\/\/\S+$/.test(f.external_url)) e.external_url = 'https:// で始まる URL を入力してください。'
  if (!f.body.trim() && !f.external_url.trim()) e.body = '本文を書くか、元の投稿（note・Instagram など）の URL を入れてください。'
  return e
}

const nullIfEmpty = (s: string) => (s.trim() ? s.trim() : null)
const toPayload = (f: Form) => ({
  kind: f.kind,
  category: f.category || null,
  title: f.title.trim(),
  report_date: f.report_date,
  summary: f.summary.trim(),
  body: nullIfEmpty(f.body),
  photo_url: nullIfEmpty(f.photo_url),
  photo_alt: nullIfEmpty(f.photo_alt),
  external_url: nullIfEmpty(f.external_url),
  event_id: f.event_id || null,
})

function newSlug(date: string) {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => (b % 36).toString(36)).join('')
  return `${date}-report-${rand}`
}

export default function ReportsAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>('published')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [selected, setSelected] = useState<string | 'new' | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('activity_reports').select(PUBLIC_REPORT_COLUMNS).order('report_date', { ascending: false })
    if (error) return setError('活動報告を読み込めませんでした。ログインし直してください。')
    setError(null)
    setRows((data ?? []) as unknown as ReportRow[])
  }, [])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  if (!isAdmin) return <p className="admin-muted admin-pad">活動報告は、佐藤祥子（管理者）だけが編集できます。</p>

  const visible = rows.filter(r => tab === 'all' || r.visibility === tab)
  const current = selected && selected !== 'new' ? rows.find(r => r.id === selected) ?? null : null

  return (
    <div>
      <nav className="admin-tabs" aria-label="表示する活動報告">
        {(Object.keys(tabLabels) as Tab[]).map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' is-active' : ''}`} aria-pressed={tab === t} onClick={() => { setTab(t); setFlash(null) }}>
            {tabLabels[t]}
          </button>
        ))}
        <button className="btn btn--primary admin-new" onClick={() => setSelected('new')}>
          ＋ 新しい活動報告
        </button>
      </nav>
      <div className="admin-body">
        <section className="admin-list" aria-label="活動報告の一覧">
          {flash && <p className="admin-flash" role="status">{flash}</p>}
          {error && <p className="admin-error">{error}</p>}
          {!error && visible.length === 0 && <p className="admin-muted">この表示に当てはまる活動報告はありません。</p>}
          <ul>
            {visible.map(r => (
              <li key={r.id}>
                <button className={`admin-item${r.id === selected ? ' is-selected' : ''}`} onClick={() => setSelected(r.id)} aria-current={r.id === selected}>
                  <span className="admin-item__meta">
                    <span className={`admin-status admin-status--issue-${r.visibility === 'published' ? 'published' : 'draft'}`}>
                      {r.visibility === 'published' ? '公開中' : '下書き'}
                    </span>
                    <span>{r.report_date.split('-').join('/')}</span>
                    <span>{REPORT_KIND_LABELS[r.kind]}</span>
                  </span>
                  <span className="admin-item__body">{r.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-detail" aria-label="活動報告の編集">
          {selected === null ? (
            <p className="admin-muted">左の一覧から選ぶか、「新しい活動報告」を押してください。</p>
          ) : selected !== 'new' && !current ? (
            <p className="admin-muted">読み込み中…</p>
          ) : (
            <ReportEditor
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

function ReportEditor({ row, onDone }: { row: ReportRow | null; onDone: (id: string | null, message: string) => void }) {
  const key = `report-form:${row?.id ?? 'new'}`
  const serverForm = row ? rowToForm(row) : emptyForm
  const restored = loadDraft(key, emptyForm)
  const hasRestored = !!restored && JSON.stringify(restored) !== JSON.stringify(serverForm)
  const [form, setForm] = useState<Form>(hasRestored ? restored! : serverForm)
  const [restoredNotice, setRestoredNotice] = useState(hasRestored)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [events, setEvents] = useState<{ id: string; title: string; event_date: string }[]>([])

  useEffect(() => {
    supabase
      .from('events')
      .select('id, title, event_date')
      .order('event_date', { ascending: false })
      .then(({ data }) => setEvents((data ?? []) as typeof events))
  }, [])

  const errors = validate(form)
  const shown = attempted ? errors : {}
  const dirty = JSON.stringify(form) !== JSON.stringify(serverForm)
  const published = row?.visibility === 'published'

  useEffect(() => {
    if (dirty) saveDraft(key, form)
    else clearDraft(key)
  }, [form, dirty, key])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(prev => ({ ...prev, [k]: v }))

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) return setMessage('写真が大きすぎます（20MB まで）。')
    setUploading(true)
    setMessage(null)
    try {
      const url = await uploadPhoto(file)
      set('photo_url', url)
    } catch {
      setMessage('写真をアップロードできませんでした。JPEG・PNG・WebP の画像を選んでください。入力内容はそのまま残っています。')
    } finally {
      setUploading(false)
    }
  }

  const write = async (visibility: 'draft' | 'published', done: string) => {
    setAttempted(true)
    if (Object.keys(errors).length > 0) return setMessage('入力内容を確認してください。入力はそのまま残っています。')
    setBusy(true)
    setMessage(null)
    const payload = { ...toPayload(form), visibility }
    const result = row
      ? await supabase.from('activity_reports').update(payload).eq('id', row.id).select('id').single()
      : await supabase.from('activity_reports').insert({ ...payload, slug: newSlug(form.report_date) }).select('id').single()
    setBusy(false)
    if (result.error || !result.data) return setMessage('保存できませんでした。入力はそのまま残っています。時間をおいて、もう一度お試しください。')
    clearDraft(key)
    onDone(result.data.id as string, done)
  }

  const remove = async () => {
    if (!row || published) return
    if (!window.confirm(`下書き「${row.title}」を削除します。元に戻せません。よろしいですか？`)) return
    setBusy(true)
    const { error } = await supabase.from('activity_reports').delete().eq('id', row.id)
    setBusy(false)
    if (error) return setMessage('削除できませんでした。')
    clearDraft(key)
    onDone(null, `「${row.title}」を削除しました。`)
  }

  const preview: ReportRow = {
    ...(row ?? ({} as ReportRow)),
    ...toPayload(form),
    id: row?.id ?? 'preview',
    slug: row?.slug ?? 'preview',
    title: form.title || '（タイトル）',
    report_date: form.report_date || new Date().toISOString().slice(0, 10),
    summary: form.summary || '（一覧に出す説明）',
    visibility: row?.visibility ?? 'draft',
    published_at: row?.published_at ?? null,
    updated_at: row?.updated_at ?? new Date().toISOString(),
  }

  const err = (k: keyof Form) =>
    shown[k] ? (
      <p className="admin-error ev-error" id={`rp-${k}-error`} role="alert">
        {shown[k]}
      </p>
    ) : null
  const aria = (k: keyof Form) => ({ 'aria-invalid': !!shown[k], 'aria-describedby': shown[k] ? `rp-${k}-error` : undefined })

  return (
    <article className="ev-editor">
      <header className="admin-detail__head">
        <p className="admin-detail__receipt admin-detail__name">{row ? row.title : '新しい活動報告'}</p>
        {row && <span className={`admin-status admin-status--issue-${published ? 'published' : 'draft'}`}>{published ? '公開中' : '下書き'}</span>}
      </header>
      {restoredNotice && (
        <p className="admin-warning">
          保存していなかった入力を復元しました。
          <button className="admin-link" onClick={() => { clearDraft(key); setForm(serverForm); setRestoredNotice(false) }}>
            復元を取り消す
          </button>
        </p>
      )}
      {published && <p className="admin-warning">公開中の活動報告です。保存すると、すぐにサイトに反映されます。</p>}
      <p className="admin-muted">写真に写っている方には、掲載の了解をとってください。参加者の名前や連絡先は書かないでください。</p>

      <div className="admin-panel">
        <div className="ev-row">
          <div className="ev-field">
            <label htmlFor="rp-report_date">日付（必須）</label>
            <input id="rp-report_date" className="admin-input" type="date" value={form.report_date} onChange={e => set('report_date', e.target.value)} {...aria('report_date')} />
            {err('report_date')}
          </div>
          <div className="ev-field">
            <label htmlFor="rp-kind">種類</label>
            <select id="rp-kind" value={form.kind} onChange={e => set('kind', e.target.value as ReportKind)}>
              {(Object.keys(REPORT_KIND_LABELS) as ReportKind[]).map(k => (
                <option key={k} value={k}>
                  {REPORT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="ev-field">
            <label htmlFor="rp-category">カテゴリ（公開ページの絞り込み）</label>
            <select id="rp-category" value={form.category} onChange={e => set('category', e.target.value as ReportCategory | '')}>
              <option value="">未設定（「すべて」にだけ表示）</option>
              {REPORT_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {REPORT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ev-field">
          <label htmlFor="rp-title">タイトル（必須）</label>
          <input id="rp-title" className="admin-input" maxLength={150} value={form.title} onChange={e => set('title', e.target.value)} {...aria('title')} />
          {err('title')}
        </div>
        <div className="ev-field">
          <label htmlFor="rp-summary">一覧に出す説明（必須・{form.summary.length}/400）</label>
          <textarea id="rp-summary" rows={3} maxLength={400} value={form.summary} onChange={e => set('summary', e.target.value)} {...aria('summary')} />
          {err('summary')}
        </div>
        <div className="ev-field">
          <label htmlFor="rp-body">本文（{form.body.length}/20000）</label>
          <p className="admin-muted ev-hint">本文を書くと、サイト内に報告のページができます。note や Instagram に書いた場合は、本文は空のまま、下に URL を入れてください。</p>
          <textarea id="rp-body" rows={10} maxLength={20000} value={form.body} onChange={e => set('body', e.target.value)} {...aria('body')} />
          {err('body')}
        </div>
        <div className="ev-field">
          <label htmlFor="rp-photo">写真</label>
          <p className="admin-muted ev-hint">撮影場所などの情報は自動で取り除いてからアップロードします。</p>
          <input id="rp-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onPhoto(e.target.files?.[0])} disabled={uploading} />
          {uploading && <p className="admin-muted" aria-live="polite">アップロードしています…</p>}
          {form.photo_url && (
            <div className="rp-photo">
              <img src={form.photo_url} alt="" />
              <button className="admin-link" onClick={() => set('photo_url', '')}>写真を外す</button>
            </div>
          )}
          {err('photo_url')}
        </div>
        {form.photo_url && (
          <div className="ev-field">
            <label htmlFor="rp-photo_alt">写真の説明（必須）</label>
            <input id="rp-photo_alt" className="admin-input" maxLength={200} placeholder="例：意見交換会で話し合う参加者のみなさん" value={form.photo_alt} onChange={e => set('photo_alt', e.target.value)} {...aria('photo_alt')} />
            {err('photo_alt')}
          </div>
        )}
        <div className="ev-field">
          <label htmlFor="rp-external_url">元の投稿の URL（note・Instagram など）</label>
          <input id="rp-external_url" className="admin-input" type="url" inputMode="url" value={form.external_url} onChange={e => set('external_url', e.target.value)} {...aria('external_url')} />
          {err('external_url')}
        </div>
        <div className="ev-field">
          <label htmlFor="rp-event_id">関連するイベント</label>
          <select id="rp-event_id" aria-describedby="rp-event_id-hint" value={form.event_id} onChange={e => set('event_id', e.target.value)}>
            <option value="">なし</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.event_date} {ev.title}
              </option>
            ))}
          </select>
          <p className="admin-muted" id="rp-event_id-hint">
            「活動予定」に登録したイベントから選びます。該当するものがなければ「なし」のままで大丈夫です。
          </p>
        </div>
      </div>

      <div className="admin-panel">
        <h2>プレビュー（一覧での見え方）</h2>
        <div className="ev-preview rp-preview">
          <ActivityCard item={preview} />
        </div>
      </div>

      <div className="admin-panel ev-actions">
        {message && <p className="admin-error" role="alert">{message}</p>}
        {!published ? (
          <div className="admin-actions">
            <button className="btn btn--secondary" disabled={busy || uploading || (!!row && !dirty)} onClick={() => write('draft', '下書きを保存しました。')}>
              下書き保存
            </button>
            <button className="btn btn--primary" disabled={busy || uploading} onClick={() => write('published', `「${form.title}」を公開しました。`)}>
              保存して公開する
            </button>
          </div>
        ) : (
          <div className="admin-actions">
            <button className="btn btn--primary" disabled={busy || uploading || !dirty} onClick={() => write('published', '公開中の活動報告を更新しました。')}>
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
        {row && published && <p className="admin-muted">公開中の活動報告は削除できません。削除するには、先に「非公開にする」を押してください。</p>}
      </div>
    </article>
  )
}
