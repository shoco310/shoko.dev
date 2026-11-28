import './EventCard.css'
import { eventCategoryLabel, type EventItem } from '../shared/events'
import { eventState, formatEventDate, reportLink, stateLabels } from '../lib/events'
import { routeHref } from '../router'

/**
 * One event as a list row: date column, then title, time and place, the
 * short description, and the 申し込み / 詳しく見る links. Same frame as the
 * activity report rows. Also used by the dashboard preview
 * (`detail={false}` there, since a draft has no public page).
 */
export default function EventCard({
  event,
  headingLevel = 3,
  detail = true,
}: {
  event: EventItem
  headingLevel?: 2 | 3
  detail?: boolean
}) {
  const state = eventState(event)
  const { day, time } = formatEventDate(event)
  const report = reportLink(event)
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const inactive = state === 'cancelled' || state === 'postponed'
  const external = (u: string) => u.startsWith('https://')
  return (
    <article className={`event-row event-row--${state}`}>
      <div className="event-row__when">
        <time dateTime={event.date} className="event-row__day">
          {day}
        </time>
        {time && <span className="event-row__time">{time}</span>}
        <span className="event-row__tags">
          <span className={`event-state event-state--${state}`}>{stateLabels[state]}</span>
          <span className="category-tag">{eventCategoryLabel(event)}</span>
        </span>
      </div>
      <div className="event-row__body">
        <Heading className={`event-row__title${inactive ? ' is-inactive' : ''}`}>
          {detail ? <a href={routeHref({ name: 'event', slug: event.id })}>{event.title}</a> : event.title}
        </Heading>
        {event.place && (
          <p className="event-row__place">
            <span className="visually-hidden">場所：</span>
            {event.placeUrl ? (
              <a href={event.placeUrl} target="_blank" rel="noopener noreferrer">
                {event.place}
              </a>
            ) : (
              event.place
            )}
          </p>
        )}
        <p className="event-row__desc">{event.description}</p>
        <div className="event-row__actions">
          {(state === 'upcoming' || state === 'ongoing') && event.applyUrl && (
            <a href={event.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              申し込む・詳しく見る
              <span className="visually-hidden">（{event.title}、新しいタブで開きます）</span>
            </a>
          )}
          {detail && (
            <a href={routeHref({ name: 'event', slug: event.id })} className="event-row__more">
              詳細 →<span className="visually-hidden">（{event.title}）</span>
            </a>
          )}
          {state === 'ended' && report && (
            <a
              href={report}
              className="event-row__more"
              {...(external(report) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              活動報告を読む →
              {external(report) && <span className="visually-hidden">（{event.title}、新しいタブで開きます）</span>}
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
