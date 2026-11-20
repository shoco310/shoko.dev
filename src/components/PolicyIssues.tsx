import IssueCard from './IssueCard'
import { listIssuesForPolicy } from '../lib/publicIssues'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

/** "この政策につながった市民の課題" on a policy page. Hidden until there is one. */
export function PolicyIssues({ slug, level = 2 }: { slug: string; level?: 2 | 3 }) {
  const { data } = useAsync(() => listIssuesForPolicy(slug), [slug])
  if (!data || data.length === 0) return null
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <section className={level === 2 ? 'policy-detail__section' : 'policy-detail__sub'}>
      <H className={level === 2 ? 'policy-detail__heading' : 'policy-detail__subheading'}>この政策につながった市民の課題</H>
      <p>寄せられた声から見えた課題のうち、この政策に関係するものです。</p>
      <div className="issue-list">
        {data.map(issue => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
      <p className="page__more">
        <a href={routeHref({ name: 'issues' })} className="btn btn--secondary">
          課題の一覧を見る →
        </a>
      </p>
    </section>
  )
}
