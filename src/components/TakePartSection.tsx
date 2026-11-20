import { routeHref } from '../router'
import { voiceEnabled, volunteerEnabled } from '../data/features'
import { supportersAssociation } from '../data/site'
import { SectionHeading } from './ui'

/**
 * Two equal ways to take part. They are different things and say so:
 * sending a voice is open to anyone and private; volunteering is helping
 * the supporters' association and does not make anyone a member.
 */
export default function TakePartSection() {
  const cards = [
    voiceEnabled && {
      key: 'voice',
      icon: <IconChat />,
      tag: 'どなたでも',
      title: '声を届ける',
      text: '宇部での暮らしの中で感じている困りごとや、もっとよくしたいことを教えてください。',
      notes: ['内容は公開されません。佐藤祥子が読みます', '名前や連絡先の入力は任意です'],
      href: routeHref({ name: 'voice' }),
      cta: '意見を送る',
    },
    volunteerEnabled && {
      key: 'join',
      icon: <IconHands />,
      tag: supportersAssociation,
      title: '活動に参加する',
      text: `${supportersAssociation}では、地域活動やイベント運営、広報などをお手伝いしてくださるボランティアを募集しています。`,
      notes: ['原則無償のボランティア。できるときに、できる範囲で', '登録しても、後援会への入会にはなりません'],
      href: routeHref({ name: 'join' }),
      cta: '一緒に活動する',
    },
  ].filter(Boolean) as {
    key: string
    icon: JSX.Element
    tag: string
    title: string
    text: string
    notes: string[]
    href: string
    cta: string
  }[]

  return (
    <section id="take-part" className="take-part-band" aria-labelledby="take-part-h">
      <div className="container">
        <SectionHeading id="take-part-h" kicker="Take part" title="宇部の未来づくりに参加しませんか？" />
        <ul className={`take-part-grid take-part-grid--${cards.length}`}>
          {cards.map(card => (
            <li className="take-part-item" key={card.key}>
              <span className="take-part-item__icon" aria-hidden="true">
                {card.icon}
              </span>
              <p className="take-part-item__tag">{card.tag}</p>
              <h3 className="take-part-item__title">{card.title}</h3>
              <p className="take-part-item__text">{card.text}</p>
              <ul className="take-part-item__notes">
                {card.notes.map(n => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <a href={card.href} className="btn btn--primary take-part-item__cta">
                {card.cta}
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function IconChat() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 11h7M8.5 14h4" />
    </svg>
  )
}

function IconHands() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7.5" r="3" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15 14.4c.6-.3 1.3-.4 2-.4 2.2 0 4 1.8 4 4v2" />
    </svg>
  )
}
