import IssueCard from './IssueCard'
import { listIssuesForPolicy, listPublishedIssues } from '../lib/publicIssues'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

/** "この政策につながった市民の課題" on a policy page. Hidden until there is one. */
export function PolicyIssues({ slug }: { slug: string }) {
  const { data } = useAsync(() => listIssuesForPolicy(slug), [slug])
  if (!data || data.length === 0) return null
  return (
    <section className="policy-detail__section">
      <h2 className="policy-detail__heading">この政策につながった市民の課題</h2>
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

/** Latest published issues for the top page. Hidden until there is one. */
export function LatestIssues({ count = 3 }: { count?: number }) {
  const { data } = useAsync(listPublishedIssues, [])
  if (!data || data.length === 0) return null
  return (
    <div className="latest-issues">
      <h3 className="latest-issues__title">みんなの声から見えた課題</h3>
      <div className="issue-list issue-list--grid">
        {data.slice(0, count).map(issue => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
      <p className="latest-issues__more">
        <a href={routeHref({ name: 'issues' })} className="btn btn--secondary">
          課題の一覧を見る（{data.length}件） →
        </a>
      </p>
    </div>
  )
}
