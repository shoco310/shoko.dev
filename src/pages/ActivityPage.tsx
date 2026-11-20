import PageLayout, { PageSection } from '../components/PageLayout'
import { ActivityCard } from '../components/ActivitySection'
import { activities } from '../data/activity'
import { policies } from '../data/policy'
import { researchAsOf, researchGroups, researchStatusLabel, type ResearchStatus } from '../data/research'
import { routeHref } from '../router'

const statusOrder: ResearchStatus[] = ['confirmed', 'next', 'open']

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

export default function ActivityPage() {
  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <PageLayout
      en="ACTIVITY"
      title="活動・調査の状況"
      lead="これまでの活動と、政策づくりのための調査がどこまで進んでいるかを公開しています。"
    >
      <PageSection title="政策の調査状況">
        <p>
          政策の根拠となる情報を、宇部市の公式資料などで確認しています。確認できたこと・まだ確認できていないことを分けて掲載しています（{formatDate(researchAsOf)}時点）。
        </p>
        <div className="research-list">
          {researchGroups.map(group => {
            const policy = policies.find(p => p.slug === group.policySlug)
            if (!policy) return null
            return (
              <div className="research-group" key={group.policySlug}>
                <h3 className="research-group__title">
                  <a href={routeHref({ name: 'policy', slug: policy.slug })}>
                    <span aria-hidden="true">{policy.emoji}</span>
                    {policy.name}
                  </a>
                </h3>
                {statusOrder.map(status => {
                  const items = group.items.filter(i => i.status === status)
                  if (items.length === 0) return null
                  return (
                    <div className="research-group__block" key={status}>
                      <p className={`research-status research-status--${status}`}>{researchStatusLabel[status]}</p>
                      <ul>
                        {items.map(item => (
                          <li key={item.title}>
                            <strong>{item.title}</strong>
                            {item.detail && <span>{item.detail}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </PageSection>

      <PageSection title="活動報告">
        <div className="activity-grid activity-grid--page">
          {sorted.map(item => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      </PageSection>
    </PageLayout>
  )
}
