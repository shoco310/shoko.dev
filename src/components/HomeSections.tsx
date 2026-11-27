import { ButtonLink, Section, SectionHeading } from './ui'
import { ActivityCard } from './ActivitySection'
import { policies } from '../data/policy'
import { values, vision } from '../data/v2mom'
import { eventState, formatEventDate, splitEvents } from '../lib/events'
import { listPublishedEvents } from '../lib/publicEvents'
import { listPublishedReports } from '../lib/publicContent'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

/*
 * Top-page sections. Each is a short entrance with one link to the page
 * that holds the full content: no long text, no cards, thin rules only.
 * Wording comes from the V2MOM and policy data as it is.
 */

/** VISION: Vision line and 知る・選ぶ・実現する in three columns */
export function VisionTeaser() {
  return (
    <Section id="vision-summary" labelledBy="home-vision-h">
      <SectionHeading
        id="home-vision-h"
        kicker="Vision / V2MOM"
        title="目指す未来"
        action={
          <ButtonLink href={routeHref({ name: 'vision' })} variant="text">
            V2MOMを詳しく見る
          </ButtonLink>
        }
      />
      <div className="home-vision">
        <p className="home-vision__title">
          {vision.title}
          <span>{vision.subtitle}</span>
        </p>
        <p className="home-vision__text">{vision.emphasis}</p>
      </div>
      <ol className="columns-3">
        {values.map((v, i) => (
          <li key={v.verb}>
            <span className="columns-3__num">{String(i + 1).padStart(2, '0')}</span>
            <strong className="columns-3__title">{v.verb}</strong>
            <span className="columns-3__sub">{v.title}</span>
            <span className="columns-3__text">{v.body}</span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/** POLICY: one row per policy — number, name, tagline, arrow */
export function PolicyTeaser() {
  return (
    <Section id="policy" labelledBy="home-policy-h">
      <SectionHeading
        id="home-policy-h"
        kicker="Policy"
        title="4つの重点政策"
        action={
          <ButtonLink href={routeHref({ name: 'policies' })} variant="text">
            4つの政策を比べる
          </ButtonLink>
        }
      />
      <ul className="row-list">
        {policies.map(p => (
          <li key={p.slug}>
            <a href={routeHref({ name: 'policy', slug: p.slug })} className="row-link">
              <span className="row-link__num">{p.number}</span>
              <span className="row-link__title">{p.name}</span>
              <span className="row-link__text">{p.tagline}</span>
              <span className="row-link__arrow" aria-hidden="true">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** ACTIVITY: the next event (if any) and the five latest reports, as a list */
export function ActivityTeaser() {
  const events = useAsync(listPublishedEvents, [])
  const reports = useAsync(listPublishedReports, [])
  const next = splitEvents(events.data ?? []).upcoming[0]
  const latest = (reports.data ?? []).slice(0, 5)
  return (
    <Section id="activity" labelledBy="home-activity-h">
      <SectionHeading
        id="home-activity-h"
        kicker="Activity"
        title="最近の活動"
        action={
          <ButtonLink href={routeHref({ name: 'activity' })} variant="text">
            活動をすべて見る
          </ButtonLink>
        }
      />
      {next && (
        <a href={routeHref({ name: 'event', slug: next.id })} className="home-next-event">
          <span className="home-next-event__label">次の予定</span>
          <span className="home-next-event__date">
            {formatEventDate(next).day}
            {formatEventDate(next).time && ` ${formatEventDate(next).time}`}
            {eventState(next) === 'ongoing' && '（開催中）'}
          </span>
          <span className="home-next-event__title">{next.title}</span>
          <span aria-hidden="true">→</span>
        </a>
      )}
      <div className="activity-list">
        {latest.map(item => (
          <ActivityCard key={item.id} item={item} compact />
        ))}
      </div>
    </Section>
  )
}
