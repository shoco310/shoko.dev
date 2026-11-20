import { useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import NotFoundPage from './NotFoundPage'
import { eventState, formatEventDate, stateLabels } from '../lib/events'
import { getPublishedEvent } from '../lib/publicEvents'
import { useAsync } from '../lib/useAsync'
import { formatJaDate } from '../lib/inPage'
import { routeHref } from '../router'

/**
 * One event (#/events/<slug>): kept after it ends. Links to the reports
 * written about it (their 「関連するイベント」, or the event's own report link).
 */
export default function EventDetailPage({ slug }: { slug: string }) {
  const { data, error, loading } = useAsync(() => getPublishedEvent(slug), [slug])
  const missing = !loading && !error && !data
  useEffect(() => {
    if (data) document.title = `${data.event.title} | さとうしょうこ`
    else if (missing) document.title = 'ページが見つかりません | さとうしょうこ'
  }, [data, missing])

  const crumbs = [
    { label: '活動', href: routeHref({ name: 'activity' }) },
    { label: 'イベント・活動予定', href: routeHref({ name: 'events' }) },
  ]
  if (loading) return <PageLayout en="EVENT" title="イベント" breadcrumb={crumbs}><p className="page__muted">読み込んでいます…</p></PageLayout>
  if (error) return <PageLayout en="EVENT" title="イベント" breadcrumb={crumbs}><p className="page__muted">イベントを読み込めませんでした。</p></PageLayout>
  if (!data) return <NotFoundPage />

  const { event, reports } = data
  const state = eventState(event)
  const { day, time } = formatEventDate(event)
  const open = state === 'upcoming' || state === 'ongoing'
  const ownReport = event.reportUrl
  const links = [
    ...reports.map(r => ({ key: r.slug, href: r.external_url ?? routeHref({ name: 'report', slug: r.slug }), title: r.title, date: r.report_date })),
    ...(ownReport && !reports.some(r => (r.external_url ?? routeHref({ name: 'report', slug: r.slug })) === ownReport)
      ? [{ key: ownReport, href: ownReport, title: '活動報告', date: null as string | null }]
      : []),
  ]

  return (
    <PageLayout en="EVENT" title={event.title} breadcrumb={crumbs}>
      <p className="report-meta">
        <span className={`event-state event-state--${state}`}>{stateLabels[state]}</span>
      </p>
      <dl className="info-list event-detail">
        <div>
          <dt>日時</dt>
          <dd>
            <time dateTime={event.date}>{day}</time>
            {time && ` ${time}`}
          </dd>
        </div>
        {event.place && (
          <div>
            <dt>場所</dt>
            <dd>
              {event.placeUrl ? (
                <a href={event.placeUrl} target="_blank" rel="noopener noreferrer">
                  {event.place}
                </a>
              ) : (
                event.place
              )}
            </dd>
          </div>
        )}
        {event.audience && (
          <div>
            <dt>対象</dt>
            <dd>{event.audience}</dd>
          </div>
        )}
        {event.howToJoin && open && (
          <div>
            <dt>参加方法</dt>
            <dd>{event.howToJoin}</dd>
          </div>
        )}
      </dl>
      <p className="event-detail__desc">{event.description}</p>
      {open && event.applyUrl && (
        <p className="page__more">
          <a href={event.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--lg">
            申し込む・詳しく見る<span className="visually-hidden">（新しいタブで開きます）</span>
          </a>
        </p>
      )}

      {links.length > 0 && (
        <section className="event-detail__reports" aria-labelledby="event-reports-h">
          <h2 id="event-reports-h" className="policy-detail__subheading">このイベントの活動報告</h2>
          <ul>
            {links.map(l => (
              <li key={l.key}>
                <a
                  href={l.href}
                  {...(l.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {l.title} →
                </a>
                {l.date && <span>{formatJaDate(l.date)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="page__more">
        <a href={routeHref({ name: 'events' })}>← イベント・活動予定へ</a>
      </p>
    </PageLayout>
  )
}
