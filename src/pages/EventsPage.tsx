import PageLayout from '../components/PageLayout'
import EventCard from '../components/EventCard'
import { Notice } from '../components/ui'
import { volunteerEnabled } from '../data/features'
import { lineUrl } from '../data/social'
import { groupByMonth, splitEvents } from '../lib/events'
import { listPublishedEvents } from '../lib/publicEvents'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

/** How the upcoming events are shown. Only the list exists today; a month or week calendar can be added here. */
export type EventsView = 'list'

/**
 * イベント・活動予定: events that have not ended yet (judged by their end
 * time, Japan time), grouped by month. Ended events move to
 * 「これまでの活動」 automatically and keep their detail page.
 */
export default function EventsPage({ view = 'list' }: { view?: EventsView }) {
  const { data, error, loading } = useAsync(listPublishedEvents, [])
  const { upcoming } = splitEvents(data ?? [])
  const months = groupByMonth(upcoming)

  return (
    <PageLayout
      en="EVENTS"
      title="イベント・活動予定"
      lead="意見交換会や地域での活動など、これから開催する予定をお知らせします。"
      breadcrumb={[{ label: '活動', href: routeHref({ name: 'activity' }) }]}
    >
      {loading && <p className="page__muted" aria-live="polite">読み込んでいます…</p>}
      {error && <p className="page__muted">活動予定を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
      {!loading && !error && upcoming.length === 0 && (
        <Notice>
          <p>いまお知らせできる予定はありません。決まりしだい、このページと LINE 公式アカウントでお知らせします。</p>
          <p>
            <a href={lineUrl} target="_blank" rel="noopener noreferrer">
              LINE公式に登録する →
            </a>
          </p>
        </Notice>
      )}
      {view === 'list' &&
        months.map(m => (
          <section key={m.month} className="events-month" aria-labelledby={`month-${m.month}`}>
            <h2 id={`month-${m.month}`} className="events-month__title">
              {m.label}
            </h2>
            <div className="event-list">
              {m.events.map(e => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        ))}

      <div className="events-footer">
        {volunteerEnabled && (
          <p>
            運営のお手伝いも募集しています。<a href={routeHref({ name: 'join' })}>一緒に活動する →</a>
          </p>
        )}
        <p>
          終わったイベントは<a href={routeHref({ name: 'activity' })}>これまでの活動</a>に移ります。
        </p>
      </div>
    </PageLayout>
  )
}
