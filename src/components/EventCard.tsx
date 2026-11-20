import type { EventItem } from '../shared/events'
import { eventState, formatEventDate, reportLink, stateLabels } from '../lib/events'

/** One event, as a readable list item (works on phones without a calendar grid). */
export default function EventCard({ event, headingLevel = 3 }: { event: EventItem; headingLevel?: 2 | 3 }) {
  const state = eventState(event)
  const { day, time } = formatEventDate(event)
  const report = reportLink(event)
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const inactive = state === 'cancelled' || state === 'postponed'
  return (
    <article className={`event-card event-card--${state}`}>
      <div className="event-card__when">
        <time dateTime={event.date} className="event-card__day">
          {day}
        </time>
        {time && <span className="event-card__time">{time}</span>}
        <span className={`event-state event-state--${state}`}>{stateLabels[state]}</span>
      </div>
      <div className="event-card__body">
        <Heading className={`event-card__title${inactive ? ' is-inactive' : ''}`}>{event.title}</Heading>
        <p className="event-card__desc">{event.description}</p>
        <dl className="event-card__facts">
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
          {event.howToJoin && state !== 'ended' && (
            <div>
              <dt>参加方法</dt>
              <dd>{event.howToJoin}</dd>
            </div>
          )}
        </dl>
        {(state === 'upcoming' || state === 'ongoing') && event.applyUrl && (
          <a href={event.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary event-card__cta">
            申し込む・詳しく見る
            <span className="visually-hidden">（{event.title}、新しいタブで開きます）</span>
          </a>
        )}
        {state === 'ended' && report && (
          <a href={report} target="_blank" rel="noopener noreferrer" className="event-card__report">
            活動報告を読む →<span className="visually-hidden">（{event.title}、新しいタブで開きます）</span>
          </a>
        )}
      </div>
    </article>
  )
}
