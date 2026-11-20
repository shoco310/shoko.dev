/** Policy change history (public.policy_changes). Append-only once published. */
export interface EvidenceRef {
  label: string
  url?: string
}

export interface PolicyDiff {
  label: string
  before: string
  after: string
}

/** A change as shown on the site (ChangeEntry). */
export interface PolicyChange {
  /** Stable slug, e.g. '2026-09-27-research-data' */
  id: string
  date: string
  summary: string
  reason?: string
  evidence?: EvidenceRef[]
  relatedIssues?: number[]
  diffs?: PolicyDiff[]
  commits?: string[]
  /** Slug of the change this one corrects */
  corrects?: string
}

export interface PolicyChangeRow {
  id: string
  slug: string
  change_date: string
  policy_slugs: string[]
  summary: string
  reason: string | null
  evidence: EvidenceRef[]
  diffs: PolicyDiff[]
  related_issues: number[]
  commits: string[]
  corrects: string | null
  visibility: 'draft' | 'published' | 'withdrawn'
  published_at: string | null
  updated_at: string
}

export const PUBLIC_CHANGE_COLUMNS =
  'id, slug, change_date, policy_slugs, summary, reason, evidence, diffs, related_issues, commits, corrects, visibility, published_at, updated_at'

export const POLICY_SLUGS = ['education', 'work', 'childcare', 'civic'] as const

/** Map rows to the display shape; `corrects` (uuid) becomes the original's slug. */
export function rowsToChanges(rows: PolicyChangeRow[]): { change: PolicyChange; slugs: string[] }[] {
  const slugById = new Map(rows.map(r => [r.id, r.slug]))
  return rows.map(r => ({
    slugs: r.policy_slugs,
    change: {
      id: r.slug,
      date: r.change_date,
      summary: r.summary,
      reason: r.reason ?? undefined,
      evidence: r.evidence?.length ? r.evidence : undefined,
      diffs: r.diffs?.length ? r.diffs : undefined,
      relatedIssues: r.related_issues?.length ? r.related_issues : undefined,
      commits: r.commits?.length ? r.commits : undefined,
      corrects: r.corrects ? slugById.get(r.corrects) : undefined,
    },
  }))
}
