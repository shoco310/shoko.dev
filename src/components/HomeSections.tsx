import { ButtonLink, Section, SectionHeading } from './ui'
import EventCard from './EventCard'
import { ActivityCard } from './ActivitySection'
import { policies } from '../data/policy'
import { values, vision } from '../data/v2mom'
import { splitEvents } from '../lib/events'
import { listPublishedEvents } from '../lib/publicEvents'
import { listPublishedReports } from '../lib/publicContent'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

/*
 * Top-page sections ②〜⑤. Each is a short entrance with one link to the
 * page that holds the full content — no long text, nothing repeated.
 * Wording is taken from the profile, V2MOM and policy data as they are.
 */

/** ② 私について */
export function AboutMeTeaser() {
  return (
    <Section id="about-me" labelledBy="home-about-h">
      <div className="home-about">
        <img
          className="home-about__photo"
          src="/images/profile-900.png"
          alt="さとうしょうこ"
          loading="lazy"
          decoding="async"
          width={684}
          height={674}
        />
        <div>
          <SectionHeading id="home-about-h" kicker="About me" title="宇部で、挑戦する人を増やしたい。" />
          <p className="home-text">
            宇部市東岐波出身。13年前に東京へ移住し、ITエンジニアとしてキャリアを築く。
            LINE（現LINEヤフー）の技術広報をはじめ、技術コミュニティ運営に長年携わる。
            2024年に自身の会社を設立。
          </p>
          <p className="home-award">
            <span aria-hidden="true">🏆 </span>
            Forbes JAPAN「Women in Tech 30」2026 選出
          </p>
          <ButtonLink href={routeHref({ name: 'profile' })} variant="text">
            プロフィールと宇部への想いを読む
          </ButtonLink>
        </div>
      </div>
    </Section>
  )
}

/** ③ 目指す未来 (V2MOM) */
export function VisionTeaser() {
  return (
    <Section id="vision-summary" tone="surface" labelledBy="home-vision-h">
      <SectionHeading
        id="home-vision-h"
        kicker="Vision"
        title="目指す未来"
        action={
          <ButtonLink href={routeHref({ name: 'vision' })} variant="text">
            V2MOMを詳しく見る
          </ButtonLink>
        }
      />
      <p className="home-vision__title">
        {vision.title}
        <span>{vision.subtitle}</span>
      </p>
      <p className="home-text">{vision.emphasis}</p>
      <ol className="home-values">
        {values.map((v, i) => (
          <li key={v.verb}>
            <span className="home-values__step" aria-hidden="true">
              {i + 1}
            </span>
            <strong>{v.verb}</strong>
            <span>{v.title}</span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/** ④ 4つの重点政策 */
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
      <ul className="home-policies">
        {policies.map(p => (
          <li key={p.slug}>
            <a href={routeHref({ name: 'policy', slug: p.slug })} className="home-policy">
              <img src={p.image} alt="" loading="lazy" decoding="async" />
              <span className="home-policy__num" aria-hidden="true">
                {p.number}
              </span>
              <span className="home-policy__name">{p.name}</span>
              <span className="home-policy__tagline">{p.tagline}</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** ⑤ 活動: the next event (if any) and the three latest reports */
export function ActivityTeaser() {
  const events = useAsync(listPublishedEvents, [])
  const reports = useAsync(listPublishedReports, [])
  const next = splitEvents(events.data ?? []).upcoming[0]
  const latest = (reports.data ?? []).slice(0, 3)
  return (
    <Section id="activity" tone="surface" labelledBy="home-activity-h">
      <SectionHeading
        id="home-activity-h"
        kicker="Activity"
        title="活動"
        action={
          <ButtonLink href={routeHref({ name: 'activity' })} variant="text">
            活動をすべて見る
          </ButtonLink>
        }
      />
      {next && (
        <div className="home-next-event">
          <p className="home-next-event__label">次の予定</p>
          <EventCard event={next} />
        </div>
      )}
      {latest.length > 0 && (
        <div className="activity-grid home-reports">
          {latest.map(item => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Section>
  )
}
