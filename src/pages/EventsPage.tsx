import PageLayout, { PageSection } from '../components/PageLayout'
import EventCard from '../components/EventCard'
import { volunteerEnabled } from '../data/features'
import { splitEvents } from '../lib/events'
import { listPublishedEvents } from '../lib/publicEvents'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

export default function EventsPage() {
  const { data, error, loading } = useAsync(listPublishedEvents, [])
  const { upcoming, past } = splitEvents(data ?? [])

  return (
    <PageLayout
      en="EVENTS"
      title="活動予定"
      lead="意見交換会や地域での活動など、これからの予定と、これまでの活動をお知らせします。"
    >
      {loading && <p className="page__muted" aria-live="polite">読み込んでいます…</p>}
      {error && <p className="page__muted">活動予定を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
      {!loading && !error && (
        <>
          <PageSection title="これからの予定">
            {upcoming.length === 0 ? (
              <div className="policy-detail__note">
                <p>いまお知らせできる予定はありません。決まりしだい、このページと LINE 公式アカウントでお知らせします。</p>
                <p>
                  <a href="https://lin.ee/Rgs1sYR3" target="_blank" rel="noopener noreferrer">
                    LINE公式に登録する →
                  </a>
                </p>
              </div>
            ) : (
              <div className="event-list">
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
            {volunteerEnabled && (
              <p className="page__more">
                運営のお手伝いも募集しています。
                <a href={routeHref({ name: 'join' })}>一緒に活動する →</a>
              </p>
            )}
          </PageSection>

          <PageSection title="終了した活動">
            {past.length === 0 ? (
              <p>まだありません。</p>
            ) : (
              <div className="event-list event-list--past">
                {past.map(e => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
            <p className="page__more">
              <a href={routeHref({ name: 'activity' })} className="btn btn--secondary">
                活動報告・調査の状況を見る →
              </a>
            </p>
          </PageSection>
        </>
      )}
    </PageLayout>
  )
}
