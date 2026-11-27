import './ActivitySection.css'
import { REPORT_CATEGORY_LABELS, REPORT_KIND_LABELS, reportHref, type ReportRow } from '../shared/reports'
import { formatJaDate } from '../lib/inPage'
import type { EventItem } from '../shared/events'
import type { ActivityItem } from '../lib/activityFeed'
import { routeHref } from '../router'

const LINK_LABELS: Record<ReportRow['kind'], string> = {
  note: 'note で読む',
  instagram: 'Instagram で見る',
  event: '詳細を見る',
  report: '詳しく見る',
}

/**
 * One activity report as a list row: date, category, kind, title, summary,
 * thumbnail and an arrow; the whole row is the link. `compact` (top page)
 * leaves out the kind label, summary and photo. Also used by the dashboard
 * preview.
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
          {item.category ? (
            <span className="activity-row__category">{REPORT_CATEGORY_LABELS[item.category]}</span>
          ) : null}
          {!compact && <span className="activity-row__kind">{REPORT_KIND_LABELS[item.kind]}</span>}
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

/** An event that has ended, shown in the same row style as a report. */
export function EventActivityRow({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  return (
    <article className={`activity-row${compact ? ' activity-row--compact' : ''}`}>
      <a href={routeHref({ name: 'event', slug: event.id })} className="activity-row__link">
        <span className="activity-row__meta">
          <time dateTime={event.date}>{formatJaDate(event.date)}</time>
          <span className="activity-row__category">{REPORT_CATEGORY_LABELS.event}</span>
        </span>
        <span className="activity-row__main">
          <span className="activity-row__title">{event.title}</span>
          {!compact && event.description && <span className="activity-row__summary">{event.description}</span>}
          {!compact && <span className="activity-row__more">詳細を見る</span>}
        </span>
        <span className="activity-row__arrow" aria-hidden="true">
          →
        </span>
      </a>
    </article>
  )
}

/** A row of これまでの活動, whichever kind it is. */
export function ActivityFeedRow({ item, compact = false }: { item: ActivityItem; compact?: boolean }) {
  return item.type === 'report' ? (
    <ActivityCard item={item.report} compact={compact} />
  ) : (
    <EventActivityRow event={item.event} compact={compact} />
  )
}
