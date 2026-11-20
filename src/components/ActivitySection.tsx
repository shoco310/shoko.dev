import './ActivitySection.css'
import { REPORT_KIND_LABELS, reportHref, type ReportRow } from '../shared/reports'
import { formatJaDate } from '../lib/inPage'

const LINK_LABELS: Record<ReportRow['kind'], string> = {
  note: 'note で読む',
  instagram: 'Instagram で見る',
  event: '詳細を見る',
  report: '詳しく見る',
}

/**
 * One activity report as a list row: date, kind, title and an arrow; the
 * whole row is the link. `compact` (top page) leaves out the summary and
 * photo. Also used by the dashboard preview.
 */
export function ActivityCard({ item, compact = false }: { item: ReportRow; compact?: boolean }) {
  const href = reportHref(item)
  const external = href.startsWith('https://')
  return (
    <article className={`activity-row${compact ? ' activity-row--compact' : ''}`}>
      <a
        href={href}
        className="activity-row__link"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <span className="activity-row__meta">
          <time dateTime={item.report_date}>{formatJaDate(item.report_date)}</time>
          <span className="activity-row__kind">{REPORT_KIND_LABELS[item.kind]}</span>
        </span>
        <span className="activity-row__main">
          <span className="activity-row__title">{item.title}</span>
          {!compact && item.summary && <span className="activity-row__summary">{item.summary}</span>}
          {!compact && <span className="activity-row__more">{LINK_LABELS[item.kind]}</span>}
          {external && <span className="visually-hidden">（外部サイト・新しいタブで開きます）</span>}
        </span>
        {!compact && item.photo_url && (
          <img className="activity-row__photo" src={item.photo_url} alt={item.photo_alt || ''} loading="lazy" decoding="async" />
        )}
        <span className="activity-row__arrow" aria-hidden="true">
          {external ? '↗' : '→'}
        </span>
      </a>
    </article>
  )
}
