import { PUBLIC_EVENT_COLUMNS, rowToEvent, type EventItem, type EventRow } from '../shared/events'
import { publicClient } from './publicSupabase'

/** Published events (RLS hides drafts), oldest first. */
export async function listPublishedEvents(): Promise<EventItem[]> {
  const sb = await publicClient()
  const { data, error } = await sb.from('events').select(PUBLIC_EVENT_COLUMNS).order('event_date', { ascending: true })
  if (error) throw error
  return ((data ?? []) as EventRow[]).map(rowToEvent)
}
