import { PUBLIC_EVENT_COLUMNS, rowToEvent, type EventItem, type EventRow } from '../shared/events'
import { publicClient } from './publicSupabase'

/** Published events (RLS hides drafts), oldest first. */
export async function listPublishedEvents(): Promise<EventItem[]> {
  const sb = await publicClient()
  const { data, error } = await sb.from('events').select(PUBLIC_EVENT_COLUMNS).order('event_date', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as EventRow[]).map(rowToEvent)
}

export interface EventReportLink {
  slug: string
  title: string
  external_url: string | null
  report_date: string
}

/**
 * One published event with the published reports written about it (linked
 * by the report's 「関連するイベント」). null when missing or not published.
 */
export async function getPublishedEvent(slug: string): Promise<{ event: EventItem; reports: EventReportLink[] } | null> {
  const sb = await publicClient()
  const { data, error } = await sb
    .from('events')
    .select(`${PUBLIC_EVENT_COLUMNS}, reports:activity_reports!activity_reports_event_id_fkey(slug, title, external_url, report_date)`)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as unknown as EventRow & { reports: EventReportLink[] | null }
  return { event: rowToEvent(row), reports: row.reports ?? [] }
}
