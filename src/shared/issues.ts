/**
 * Public issues (Phase C): labels and types shared by the public pages and
 * the review screen. Must match supabase/migrations/*_public_issues.sql.
 */
export { THEME_OPTIONS as ISSUE_THEMES } from './voice'

export type IssueProgress = 'heard' | 'researching' | 'proposing' | 'in_policy' | 'closed'
export type IssueStatus = 'draft' | 'published' | 'archived'

export const PROGRESS_OPTIONS: { value: IssueProgress; label: string; short: string }[] = [
  { value: 'heard', label: '声を受け止めました', short: '受け止め' },
  { value: 'researching', label: '調査しています', short: '調査中' },
  { value: 'proposing', label: '提案・質問しています', short: '提案・質問中' },
  { value: 'in_policy', label: '政策に反映しました', short: '政策に反映' },
  { value: 'closed', label: '対応を終えました', short: '対応終了' },
]

export const progressLabel = (p: IssueProgress) => PROGRESS_OPTIONS.find(o => o.value === p)?.label ?? p

export interface PolicyLink {
  policy_slug: string
  note: string | null
}

export interface PublicIssue {
  id: number
  title: string
  summary: string
  themes: string[]
  progress: IssueProgress
  voice_count: number
  published_at: string
  updated_at: string
  issue_policy_links: PolicyLink[]
}

export interface IssueUpdate {
  id: number
  body: string
  published_at: string
}

/** Columns anon may read (see column grants in the migration). */
export const PUBLIC_ISSUE_COLUMNS =
  'id, title, summary, themes, progress, voice_count, published_at, updated_at, issue_policy_links(policy_slug, note)'

export const TITLE_MAX = 80
export const SUMMARY_MAX = 2000
export const UPDATE_MAX = 1000
