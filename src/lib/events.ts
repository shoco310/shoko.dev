import type { EventItem } from '../shared/events'

/**
 * Event status and ordering. All dates and times in the data are Japan time
 * (UTC+9, no daylight saving), so they are parsed with an explicit +09:00
 * offset and compared as instants — correct whatever timezone the visitor's
 * device uses.
 */
export type EventState = 'upcoming' | 'ongoing' | 'ended' | 'cancelled' | 'postponed'

const JST = '+09:00'

export function startsAt(e: EventItem): number {
  return Date.parse(`${e.date}T${e.start ?? '00:00'}:00${JST}`)
}

/** End instant: the end time, else the end of the event day (24:00 JST). */
export function endsAt(e: EventItem): number {
  if (e.end) return Date.parse(`${e.date}T${e.end}:00${JST}`)
  return Date.parse(`${e.date}T00:00:00${JST}`) + 24 * 60 * 60 * 1000
}

export function eventState(e: EventItem, now = Date.now()): EventState {
  if (e.status) return e.status
  if (now >= endsAt(e)) return 'ended'
  if (e.start && now >= startsAt(e)) return 'ongoing'
  return 'upcoming'
}

export const stateLabels: Record<EventState, string> = {
  upcoming: '予定',
  ongoing: '開催中',
  ended: '終了',
  cancelled: '中止',
  postponed: '延期',
}

/**
 * Upcoming: not yet ended (soonest first). Cancelled / postponed events stay
 * here, labelled, until their date passes. Past: ended by time or marked
 * ended by hand (newest first).
 */
export function splitEvents(list: EventItem[], now = Date.now()) {
  const isPast = (e: EventItem) => e.status === 'ended' || now >= endsAt(e)
  const upcoming = list.filter(e => !isPast(e)).sort((a, b) => startsAt(a) - startsAt(b))
  const past = list.filter(isPast).sort((a, b) => startsAt(b) - startsAt(a))
  return { upcoming, past }
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** { day: '2026年12月5日（土）', time: '14:00〜15:30' | null } — calendar date as written (Japan time). */
export function formatEventDate(e: EventItem): { day: string; time: string | null } {
  const [y, m, d] = e.date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  const time = e.start ? `${e.start}〜${e.end ?? ''}` : null
  return { day: `${y}年${m}月${d}日（${weekday}）`, time }
}

/** Link to the report written after the event, if any. */
export function reportLink(e: EventItem): string | null {
  return e.reportUrl ?? null
}
