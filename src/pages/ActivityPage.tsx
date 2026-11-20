import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import { ActivityCard } from '../components/ActivitySection'
import EventCard from '../components/EventCard'
import { ResearchStatusList } from '../components/ResearchStatus'
import { Notice, SectionHeading } from '../components/ui'
import { listPublishedReports } from '../lib/publicContent'
import { listPublishedEvents } from '../lib/publicEvents'
import { splitEvents } from '../lib/events'
import { useAsync } from '../lib/useAsync'
import { formatJaDate } from '../lib/inPage'
import { policies } from '../data/policy'
import { researchAsOf, researchGroups } from '../data/research'
import { volunteerEnabled } from '../data/features'
import { lineUrl, socialLinks } from '../data/social'
import { routeHref } from '../router'

export type ActivityFilter = 'all' | 'reports' | 'events' | 'research'

const filters: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'reports', label: '活動報告' },
  { key: 'events', label: 'イベント' },
  { key: 'research', label: '政策調査' },
]

/** Read ?type= from the hash ('#/activity?type=events'). */
export function filterFromHash(hash: string): ActivityFilter | null {
  const q = hash.split('?')[1]
  const type = q ? new URLSearchParams(q).get('type') : null
  return filters.some(f => f.key === type) ? (type as ActivityFilter) : null
}

/**
 * 活動: reports, events and policy research in one place. Data comes from
 * the existing events / activity_reports tables and src/data/research.ts —
 * nothing new is stored. #/events opens this page filtered to events.
 */
export default function ActivityPage({ initialFilter = 'all' }: { initialFilter?: ActivityFilter }) {
  const [filter, setFilter] = useState<ActivityFilter>(
    () => filterFromHash(window.location.hash) ?? initialFilter,
  )
  const reports = useAsync(listPublishedReports, [])
  const events = useAsync(listPublishedEvents, [])
  const { upcoming, past } = splitEvents(events.data ?? [])

  const choose = (key: ActivityFilter) => {
    setFilter(key)
    // Keep the choice in the URL (shareable) without a route change.
    history.replaceState(null, '', key === 'all' ? '#/activity' : `#/activity?type=${key}`)
  }

  const show = (key: ActivityFilter) => filter === 'all' || filter === key

  return (
    <PageLayout
      en="ACTIVITY"
      title="活動"
      lead="活動報告、意見交換会などの予定、政策づくりのための調査の進み具合を公開しています。"
      bare
    >
      <div className="container container--narrow activity-page">
        <div className="filter-bar" role="group" aria-label="表示する活動の種類">
          {filters.map(f => (
            <button
              key={f.key}
              type="button"
              className="filter-bar__button"
              aria-pressed={filter === f.key}
              onClick={() => choose(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {show('events') && (
          <section className="activity-block" aria-labelledby="act-upcoming">
            <SectionHeading id="act-upcoming" title="これからの予定" />
            {events.loading && <p className="page__muted" aria-live="polite">読み込んでいます…</p>}
            {events.error && <p className="page__muted">活動予定を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
            {!events.loading && !events.error && upcoming.length === 0 && (
              <Notice>
                <p>いまお知らせできる予定はありません。決まりしだい、このページと LINE 公式アカウントでお知らせします。</p>
                <p>
                  <a href={lineUrl} target="_blank" rel="noopener noreferrer">
                    LINE公式に登録する →
                  </a>
                </p>
              </Notice>
            )}
            {upcoming.length > 0 && (
              <div className="event-list">
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
            {volunteerEnabled && (
              <p className="activity-block__more">
                運営のお手伝いも募集しています。<a href={routeHref({ name: 'join' })}>一緒に活動する →</a>
              </p>
            )}
          </section>
        )}

        {show('reports') && (
          <section className="activity-block" aria-labelledby="act-reports">
            <SectionHeading id="act-reports" title="活動報告" />
            {reports.error && <p className="page__muted">活動報告を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
            {reports.data && reports.data.length === 0 && <p>まだありません。</p>}
            <div className="activity-grid activity-grid--page">
              {(reports.data ?? []).map(item => (
                <ActivityCard key={item.id} item={item} />
              ))}
            </div>
            <p className="activity-block__more">
              <a
                href={socialLinks.find(s => s.key === 'instagram')!.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagramでもっとみる →
              </a>
            </p>
          </section>
        )}

        {filter === 'events' && (
          <section className="activity-block" aria-labelledby="act-past">
            <SectionHeading id="act-past" title="終了した活動" />
            {past.length === 0 ? (
              <p>まだありません。</p>
            ) : (
              <div className="event-list event-list--past">
                {past.map(e => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>
        )}

        {show('research') && (
          <section className="activity-block" aria-labelledby="act-research">
            <SectionHeading
              id="act-research"
              title="政策調査の進み具合"
              lead={`政策の根拠となる情報を、宇部市の公式資料などで確認しています。確認できたこと・まだ確認できていないことを分けて掲載しています（${formatJaDate(researchAsOf)}時点）。`}
            />
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
                    <ResearchStatusList slug={policy.slug} />
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  )
}
