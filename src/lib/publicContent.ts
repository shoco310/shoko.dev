import { PUBLIC_CHANGE_COLUMNS, rowsToChanges, type PolicyChangeRow } from '../shared/changes'
import { PUBLIC_REPORT_COLUMNS, type ReportRow } from '../shared/reports'
import { publicClient } from './publicSupabase'

/** Published activity reports, newest first. */
export async function listPublishedReports(): Promise<ReportRow[]> {
  const sb = await publicClient()
  const { data, error } = await sb.from('activity_reports').select(PUBLIC_REPORT_COLUMNS).order('report_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as ReportRow[]
}

export async function getPublishedReport(slug: string): Promise<ReportRow | null> {
  const sb = await publicClient()
  const { data, error } = await sb.from('activity_reports').select(PUBLIC_REPORT_COLUMNS).eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data as ReportRow) ?? null
}

/** Published policy changes, newest first (withdrawn ones are hidden by RLS). */
export async function listPublishedChanges() {
  const sb = await publicClient()
  const { data, error } = await sb
    .from('policy_changes')
    .select(PUBLIC_CHANGE_COLUMNS)
    .order('change_date', { ascending: false })
    .order('slug', { ascending: true })
  if (error) throw error
  return rowsToChanges((data ?? []) as PolicyChangeRow[])
}
