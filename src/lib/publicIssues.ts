import { PUBLIC_ISSUE_COLUMNS, type IssueUpdate, type PublicIssue } from '../shared/issues'

/**
 * Read-only access to published issues for the public site. supabase-js is
 * loaded lazily so the rest of the site stays light, and the client never
 * stores a session (visitors are always anonymous; RLS shows only what the
 * operator has approved).
 */
type Client = Awaited<ReturnType<typeof createPublicClient>>
let clientPromise: Promise<Client> | null = null

async function createPublicClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('not_configured')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

function client() {
  if (!clientPromise) {
    clientPromise = createPublicClient().catch(e => {
      clientPromise = null
      throw e
    })
  }
  return clientPromise
}

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
