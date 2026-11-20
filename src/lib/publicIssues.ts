import { PUBLIC_ISSUE_COLUMNS, type IssueUpdate, type PublicIssue } from '../shared/issues'

import { publicClient as client } from './publicSupabase'

/** Read-only access to published issues (RLS shows only what the operator approved). */
export async function listPublishedIssues(): Promise<PublicIssue[]> {
  const sb = await client()
  const { data, error } = await sb
    .from('public_issues')
    .select(PUBLIC_ISSUE_COLUMNS)
    .order('published_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as PublicIssue[]
}

export async function getPublishedIssue(id: number): Promise<{ issue: PublicIssue | null; updates: IssueUpdate[] }> {
  const sb = await client()
  const [{ data, error }, { data: updates, error: uError }] = await Promise.all([
    sb.from('public_issues').select(PUBLIC_ISSUE_COLUMNS).eq('id', id).maybeSingle(),
    sb.from('issue_updates').select('id, body, published_at').eq('issue_id', id).order('published_at', { ascending: true }),
  ])
  if (error) throw error
  if (uError) throw uError
  return { issue: (data as unknown as PublicIssue) ?? null, updates: (updates ?? []) as IssueUpdate[] }
}

export async function listIssuesForPolicy(slug: string): Promise<PublicIssue[]> {
  const sb = await client()
  const { data, error } = await sb
    .from('public_issues')
    .select(PUBLIC_ISSUE_COLUMNS.replace('issue_policy_links(', 'issue_policy_links!inner('))
    .eq('issue_policy_links.policy_slug', slug)
    .order('published_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PublicIssue[]
}

let publishedIdsPromise: Promise<Set<number>> | null = null

/** Ids of currently published issues (cached per page load). */
export function publishedIssueIds(): Promise<Set<number>> {
  if (!publishedIdsPromise) {
    publishedIdsPromise = client()
      .then(sb => sb.from('public_issues').select('id'))
      .then(({ data, error }) => {
        if (error) throw error
        return new Set((data ?? []).map(r => (r as { id: number }).id))
      })
      .catch(e => {
        publishedIdsPromise = null
        throw e
      })
  }
  return publishedIdsPromise
}
