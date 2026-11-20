// Exports published public data (events, issues) to content/*.json so the
// repository keeps a Git history of what was public, even though it is edited
// in the review screen. Uses only the publishable key: RLS returns nothing but
// published rows and public columns, so no secret is involved.
//
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... node scripts/export-content.mjs
import { mkdirSync, writeFileSync } from 'node:fs'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required')
  process.exit(1)
}

async function get(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`)
  return res.json()
}

const exports = {
  'events.json': await get(
    'events?select=slug,title,event_date,start_time,end_time,place,place_url,description,audience,how_to_join,apply_url,status_override,report_activity_id,report_url,published_at,updated_at&order=event_date.asc,slug.asc',
  ),
  'issues.json': await get(
    'public_issues?select=id,title,summary,themes,progress,voice_count,published_at,updated_at,issue_policy_links(policy_slug,note)&order=id.asc',
  ),
  'issue-updates.json': await get('issue_updates?select=id,issue_id,body,published_at&order=id.asc'),
}

mkdirSync('content', { recursive: true })
for (const [file, rows] of Object.entries(exports)) {
  writeFileSync(`content/${file}`, JSON.stringify(rows, null, 2) + '\n')
  console.log(`content/${file}: ${rows.length} rows`)
}
