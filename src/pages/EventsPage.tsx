import PageLayout from '../components/PageLayout'
import EventCard from '../components/EventCard'
import { Notice } from '../components/ui'
import { volunteerEnabled } from '../data/features'
import { associationFormUrl, lineUrl } from '../data/social'
import ActivityPhotos from '../components/ActivityPhotos'
import { listPublishedReports } from '../lib/publicContent'
import { groupByMonth, splitEvents } from '../lib/events'
import { listPublishedEvents } from '../lib/publicEvents'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

/** How the upcoming events are shown. Only the list exists today; a month or week calendar can be added here. */
export type EventsView = 'list'

/**
 * イベント・活動予定: events that have not ended yet (judged by their end
 * time, Japan time), grouped by month. Ended events drop off automatically;
 * they keep their detail page, and what happened is told in a report on
 * 「これまでの活動」.
 */
export default function EventsPage({ view = 'list' }: { view?: EventsView }) {
  const { data, error, loading } = useAsync(listPublishedEvents, [])
  const { upcoming } = splitEvents(data ?? [])
  const months = groupByMonth(upcoming)
  const reports = useAsync(listPublishedReports, [])

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

      <section className="events-join" aria-labelledby="events-join-h">
        <h2 id="events-join-h" className="events-section__title">運営のお手伝いも募集しています</h2>
        <div className="events-join__btns">
          {volunteerEnabled && (
            <a href={routeHref({ name: 'join' })} className="btn btn--primary">
              一緒に活動する
            </a>
          )}
          <a href={associationFormUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
            後援会に入会する
            <span className="visually-hidden">（入会フォーム・新しいタブで開きます）</span>
          </a>
        </div>
      </section>

      {reports.data && reports.data.some(r => r.photo_url) && (
        <section className="events-past" aria-labelledby="events-past-h">
          <h2 id="events-past-h" className="events-section__title">これまでの活動</h2>
          <p className="events-past__lead">終わったイベントや地域での活動の様子を、新しい順に紹介しています。</p>
          <ActivityPhotos reports={reports.data} />
          <p className="events-past__more">
            <a href={routeHref({ name: 'activity' })} className="btn btn--secondary">
              これまでの活動をすべて見る →
            </a>
          </p>
        </section>
      )}
    </PageLayout>
  )
}
