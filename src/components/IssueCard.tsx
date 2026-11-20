import { policies } from '../data/policy'
import { routeHref } from '../router'
import { progressLabel, type PublicIssue } from '../shared/issues'

export function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export const policyName = (slug: string) => policies.find(p => p.slug === slug)?.name ?? slug

/** Card for one published issue (list pages, policy pages, top page). */
export default function IssueCard({ issue, headingLevel = 3 }: { issue: PublicIssue; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className="issue-card">
      <a href={routeHref({ name: 'issue', id: issue.id })} className="issue-card__link">
        <div className="issue-card__meta">
          <span className={`issue-progress issue-progress--${issue.progress}`}>{progressLabel(issue.progress)}</span>
          <span className="issue-card__num">課題 #{issue.id}</span>
        </div>
        <Heading className="issue-card__title">{issue.title}</Heading>
        <p className="issue-card__summary">{issue.summary}</p>
        <div className="issue-card__foot">
          {issue.themes.length > 0 && <span className="issue-card__themes">{issue.themes.join('・')}</span>}
          <span>
            {issue.issue_policy_links.length > 0
              ? `関連する政策：${issue.issue_policy_links.map(l => policyName(l.policy_slug)).join('、')}`
              : 'まだ政策に結びついていない課題'}
          </span>
          <span>
            寄せられた声 {issue.voice_count}件 ・ 更新 {formatDate(issue.updated_at)}
          </span>
        </div>
      </a>
    </article>
  )
}
