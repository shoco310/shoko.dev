/** Activity reports (public.activity_reports). */
export type ReportKind = 'report' | 'note' | 'instagram' | 'event'

/** Filter category on 「これまでの活動」 (null = uncategorised: shown under すべて only). */
export type ReportCategory = 'event' | 'community' | 'political' | 'media' | 'other'

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  event: 'イベント',
  community: '地域活動',
  political: '政治活動',
  media: 'メディア出演',
  other: 'その他',
}
export const REPORT_CATEGORIES = Object.keys(REPORT_CATEGORY_LABELS) as ReportCategory[]

export interface ReportRow {
  id: string
  slug: string
  kind: ReportKind
  title: string
  report_date: string
  summary: string
  body: string | null
  photo_url: string | null
  photo_alt: string | null
  external_url: string | null
  event_id: string | null
  category: ReportCategory | null
  /** The event this report records (embedded; null when none or not published) */
  event?: { slug: string; title: string; event_date: string } | null
  visibility: 'draft' | 'published'
  published_at: string | null
  updated_at: string
}

export const PUBLIC_REPORT_COLUMNS =
  'id, slug, kind, title, report_date, summary, body, photo_url, photo_alt, external_url, event_id, category, visibility, published_at, updated_at, event:events!activity_reports_event_id_fkey(slug, title, event_date)'

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  report: '活動報告',
  note: 'note',
  instagram: 'Instagram',
  event: 'イベント',
}

/** Where a report card links: the external post if any, else the report page on this site. */
export function reportHref(r: Pick<ReportRow, 'slug' | 'external_url' | 'body'>): string {
  if (r.external_url) return r.external_url
  return `/reports/${r.slug}`
}
