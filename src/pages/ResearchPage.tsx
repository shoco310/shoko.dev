import { useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import { ButtonLink, Section, SectionHeading } from '../components/ui'
import { SourceList } from '../components/SourceList'
import { policies } from '../data/policy'
import { researchAsOf, researchGroups, researchStatusLabel, type ResearchItem, type ResearchStatus } from '../data/research'
import { issuesEnabled } from '../data/features'
import { formatJaDate } from '../lib/inPage'
import { routeHref } from '../router'

/** Link to one policy's research ('/research?policy=education'). */
export function researchHref(slug?: string) {
  return slug ? `${routeHref({ name: 'research' })}?policy=${encodeURIComponent(slug)}` : routeHref({ name: 'research' })
}

/** Read ?policy= from the query string. */
export function policyFromSearch(search: string): string | null {
  const slug = new URLSearchParams(search).get('policy')
  return slug && policies.some(p => p.slug === slug) ? slug : null
}

const order: ResearchStatus[] = ['confirmed', 'next', 'open']

/** Section labels on this page; the status badges keep the original labels. */
const groupHeading: Record<ResearchStatus, string> = {
  confirmed: '調査で確認できたこと',
  next: '次に確認すること',
  open: '今後の調査予定',
}

/**
 * 政策調査: what has been checked for each policy, what is next and what is
 * still open, with the sources. Everything comes from src/data/research.ts
 * (status) and src/data/policy.ts (sources) — the same data the policy pages
 * show, so nothing is kept twice. No progress is shown that the data does not
 * record.
 */
export default function ResearchPage() {
  const target = policyFromSearch(window.location.search)

  useEffect(() => {
    if (!target) return
    requestAnimationFrame(() => document.getElementById(`research-${target}`)?.scrollIntoView())
  }, [target])

  const counts = order.map(s => ({
    status: s,
    n: researchGroups.reduce((sum, g) => sum + g.items.filter(i => i.status === s).length, 0),
  }))

  return (
    <PageLayout
      en="RESEARCH"
      title="政策調査"
      lead={`政策の根拠となる情報を、宇部市の公式資料などで確認しています。確認できたこと・まだ確認できていないことを分けて掲載しています（${formatJaDate(researchAsOf)}時点）。`}
      breadcrumb={[{ label: 'V2MOM・政策', href: routeHref({ name: 'vision' }) }]}
      bare
    >
      <Section width="narrow">
        <ul className="research-summary" aria-label="調査の状況（項目数）">
          {counts.map(c => (
            <li key={c.status}>
              <span className={`research-status research-status--${c.status}`}>{researchStatusLabel[c.status]}</span>
              <span className="research-summary__n">
                {c.n}
                <small>項目</small>
              </span>
            </li>
          ))}
        </ul>

        <nav aria-label="政策ごとの調査" className="research-jump">
          {researchGroups.map(g => {
            const p = policies.find(x => x.slug === g.policySlug)
            return p ? (
              <a key={p.slug} href={researchHref(p.slug)} onClick={jump(p.slug)}>
                <span>{p.number}</span>
                {p.name}
              </a>
            ) : null
          })}
        </nav>

        {researchGroups.map(group => {
          const policy = policies.find(p => p.slug === group.policySlug)
          if (!policy) return null
          return (
            <section
              key={policy.slug}
              id={`research-${policy.slug}`}
              className="research-policy"
              aria-labelledby={`research-${policy.slug}-h`}
            >
              <SectionHeading
                id={`research-${policy.slug}-h`}
                kicker={`Policy ${policy.number}`}
                title={policy.name}
                action={
                  <ButtonLink href={routeHref({ name: 'policy', slug: policy.slug })} variant="text">
                    政策ページへ
                  </ButtonLink>
                }
              />
              {order.map(status => {
                const items = group.items.filter(i => i.status === status)
                if (items.length === 0) return null
                return (
                  <div className="research-block" key={status}>
                    <h3 className={`research-block__title research-block__title--${status}`}>{groupHeading[status]}</h3>
                    <ul className="research-items">
                      {items.map(item => (
                        <ResearchRow key={item.title} item={item} />
                      ))}
                    </ul>
                  </div>
                )
              })}
              {policy.sourceList && policy.sourceList.length > 0 && (
                <details className="research-sources">
                  <summary>参考資料・出典（{policy.sourceList.length}件）</summary>
                  <SourceList sources={policy.sourceList} />
                </details>
              )}
            </section>
          )
        })}

        <div className="research-related">
          <h2 className="research-related__title">関連するページ</h2>
          <ul>
            <li>
              <a href={routeHref({ name: 'vision' })}>V2MOM（目指す未来）</a>
              <span>調査はMeasures（成果の測り方）とObstaclesに沿って進めます</span>
            </li>
            <li>
              <a href={routeHref({ name: 'policies' })}>4つの重点政策</a>
              <span>調査の結果は各政策ページの「調査・検討状況」にも表示されます</span>
            </li>
            <li>
              <a href={routeHref({ name: 'data' })}>数字で見る宇部</a>
              <span>確認できた統計データ</span>
            </li>
            {issuesEnabled && (
              <li>
                <a href={routeHref({ name: 'issues' })}>市民の声</a>
                <span>寄せられた声から見えた課題</span>
              </li>
            )}
          </ul>
        </div>
      </Section>
    </PageLayout>
  )
}

function ResearchRow({ item }: { item: ResearchItem }) {
  return (
    <li className="research-items__row">
      <span className="research-items__body">
        <strong>{item.title}</strong>
        {item.detail && <span>{item.detail}</span>}
      </span>
    </li>
  )
}

/** Jump within the page and keep ?policy= in the URL without a route change. */
function jump(slug: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    history.replaceState(null, '', researchHref(slug))
    document.getElementById(`research-${slug}`)?.scrollIntoView({ behavior: 'smooth' })
  }
}
