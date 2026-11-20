/**
 * Event shape used by the public pages and the review screen. Stored in the
 * Supabase `events` table (supabase/migrations/*_events.sql); dates and times
 * are Japan time.
 */
export type EventStatusOverride = 'cancelled' | 'postponed' | 'ended'

export interface EventItem {
  /** Stable slug: 'YYYY-MM-DD-short-name' */
  id: string
  title: string
  /** YYYY-MM-DD (Japan time) */
  date: string
  /** HH:MM (Japan time) */
  start?: string
  /** HH:MM (Japan time) */
  end?: string
  place?: string
  placeUrl?: string
  description: string
  audience?: string
  howToJoin?: string
  applyUrl?: string
  /** Manual override; upcoming → ended is automatic */
  status?: EventStatusOverride
  /** id in src/data/activity.ts for the report written afterwards */
  reportActivityId?: string
  reportUrl?: string
}

/** Row as stored in public.events (public columns). */
export interface EventRow {
  id: string
  slug: string
  title: string
  event_date: string
  start_time: string | null
  end_time: string | null
  place: string | null
  place_url: string | null
  description: string
  audience: string | null
  how_to_join: string | null
  apply_url: string | null
  status_override: EventStatusOverride | null
  report_activity_id: string | null
  report_url: string | null
  visibility: 'draft' | 'published'
  published_at: string | null
  updated_at: string
}

export const PUBLIC_EVENT_COLUMNS =
  'id, slug, title, event_date, start_time, end_time, place, place_url, description, audience, how_to_join, apply_url, status_override, report_activity_id, report_url, visibility, published_at, updated_at'

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : undefined)
const opt = (s: string | null) => (s && s.trim() ? s : undefined)

export function rowToEvent(r: EventRow): EventItem {
  return {
    id: r.slug,
    title: r.title,
    date: r.event_date,
    start: hhmm(r.start_time),
    end: hhmm(r.end_time),
    place: opt(r.place),
    placeUrl: opt(r.place_url),
    description: r.description,
    audience: opt(r.audience),
    howToJoin: opt(r.how_to_join),
    applyUrl: opt(r.apply_url),
    status: r.status_override ?? undefined,
    reportActivityId: opt(r.report_activity_id),
    reportUrl: opt(r.report_url),
  }
}
