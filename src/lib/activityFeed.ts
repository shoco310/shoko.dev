import type { EventItem } from '../shared/events'
import type { ReportCategory, ReportRow } from '../shared/reports'
import { eventState, reportLink, splitEvents } from './events'

/** One row of これまでの活動: a published report, or an event that has ended. */
export type ActivityItem =
  | { type: 'report'; key: string; date: string; category: ReportCategory | null; report: ReportRow }
  | { type: 'event'; key: string; date: string; category: 'event'; event: EventItem }

/**
 * Reports plus events that have ended, newest first. An ended event is left
 * out when a report already tells its story (a report whose 関連するイベント
 * is this event, or the event's own report link), and when it was cancelled
 * or postponed (it did not take place).
 */
export function activityFeed(reports: ReportRow[], events: EventItem[], now = Date.now()): ActivityItem[] {
  const reported = new Set(reports.map(r => r.event?.slug).filter(Boolean) as string[])
  const pastEvents = splitEvents(events, now).past.filter(
    e => eventState(e, now) === 'ended' && !reported.has(e.id) && !reportLink(e),
  )
  const items: ActivityItem[] = [
    ...reports.map(r => ({ type: 'report' as const, key: `r:${r.id}`, date: r.report_date, category: r.category, report: r })),
    ...pastEvents.map(e => ({ type: 'event' as const, key: `e:${e.id}`, date: e.date, category: 'event' as const, event: e })),
  ]
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
