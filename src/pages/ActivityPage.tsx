import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { ActivityCard } from '../components/ActivitySection'
import { listPublishedReports } from '../lib/publicContent'
import { listPublishedEvents } from '../lib/publicEvents'
import { formatEventDate, splitEvents } from '../lib/events'
import { useAsync } from '../lib/useAsync'
import { REPORT_CATEGORIES, REPORT_CATEGORY_LABELS, type ReportCategory } from '../shared/reports'
import { socialLinks } from '../data/social'
import { navigate, routeHref } from '../router'

export type ActivityFilter = 'all' | ReportCategory

const filters: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...REPORT_CATEGORIES.map(c => ({ key: c as ActivityFilter, label: REPORT_CATEGORY_LABELS[c] })),
]

/**
 * What the URL asks for: '/activity?category=media' → 'media'. Old links
 * from before the split: ?type=events → the events page, ?type=research →
 * the research page, ?type=reports → everything.
 */
export function filterFromSearch(search: string): ActivityFilter | { redirect: string } | null {
  const q = new URLSearchParams(search)
  const type = q.get('type')
  if (type === 'events') return { redirect: routeHref({ name: 'events' }) }
  if (type === 'research') return { redirect: routeHref({ name: 'research' }) }
  // 'volunteer' was renamed 'political' (政治活動) on 2026-11-21.
  const category = q.get('category') === 'volunteer' ? 'political' : q.get('category')
  return filters.some(f => f.key === category) ? (category as ActivityFilter) : null
}

/** Reports in the chosen category; uncategorised ones appear under すべて only. */
export function filterReports<T extends { category: ReportCategory | null }>(list: T[], filter: ActivityFilter): T[] {
  return filter === 'all' ? list : list.filter(r => r.category === filter)
}

/**
 * これまでの活動: published activity reports, newest first, filterable by
 * category. An event shows up here once a report about it is published —
 * the event itself stays on its own page.
 */
export default function ActivityPage() {
  const fromUrl = filterFromSearch(window.location.search)
  const [filter, setFilter] = useState<ActivityFilter>(() => (typeof fromUrl === 'string' ? fromUrl : 'all'))
  useEffect(() => {
    if (fromUrl && typeof fromUrl === 'object') navigate(fromUrl.redirect, { replace: true })
  }, [fromUrl])

  const reports = useAsync(listPublishedReports, [])
  const events = useAsync(listPublishedEvents, [])
  const upcoming = splitEvents(events.data ?? []).upcoming
  const shown = filterReports(reports.data ?? [], filter)

  const choose = (key: ActivityFilter) => {
    setFilter(key)
    history.replaceState(null, '', key === 'all' ? '/activity' : `/activity?category=${key}`)
  }

  return (
    <PageLayout en="ACTIVITY" title="これまでの活動" lead="これまでに行った活動を、新しい順に掲載しています。" bare>
      <div className="container container--narrow activity-page">
        {upcoming.length > 0 && (
          <a href={routeHref({ name: 'events' })} className="home-next-event activity-upcoming">
            <span className="home-next-event__label">これからの予定 {upcoming.length}件</span>
            <span className="home-next-event__date">{formatEventDate(upcoming[0]).day}</span>
            <span className="home-next-event__title">{upcoming[0].title}</span>
            <span aria-hidden="true">→</span>
          </a>
        )}

        <div className="filter-bar filter-bar--scroll" role="group" aria-label="活動のカテゴリ">
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

        <div aria-live="polite">
          {reports.loading && <p className="page__muted">読み込んでいます…</p>}
          {reports.error && <p className="page__muted">活動報告を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
          {reports.data && (
            <p className="page__muted activity-count">
              {shown.length}件{filter !== 'all' && `（全${reports.data.length}件）`}
            </p>
          )}
        </div>

        {reports.data && shown.length === 0 && (
          <p className="activity-empty">このカテゴリの活動報告は、まだありません。</p>
        )}
        <div className="activity-list">
          {shown.map(item => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>

        <div className="activity-links">
          <p>
            <a href={routeHref({ name: 'events' })}>イベント・活動予定を見る →</a>
          </p>
          <p>
            <a href={socialLinks.find(s => s.key === 'instagram')!.href} target="_blank" rel="noopener noreferrer">
              Instagramでもっとみる →
            </a>
          </p>
          <p className="activity-research-link">
            政策づくりのための調査の進み具合は、<a href={routeHref({ name: 'research' })}>政策調査</a>のページにまとめています。
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
