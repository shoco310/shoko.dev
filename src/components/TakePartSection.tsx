import { routeHref } from '../router'
import { voiceEnabled, volunteerEnabled } from '../data/features'
import { supportersAssociation } from '../data/site'

import { Section, SectionHeading } from './ui'

/**
 * Two equal ways to take part. They are different things and say so:
 * sending a voice is open to anyone and private; volunteering is helping
 * the supporters' association and does not make anyone a member.
 */
export default function TakePartSection() {
  const cards = [
    voiceEnabled && {
      key: 'voice',
      tag: 'どなたでも',
      title: '声を届ける',
      text: '宇部での暮らしの中で感じている困りごとや、もっとよくしたいことを教えてください。',
      notes: ['内容は公開されません。佐藤祥子が読みます', '名前や連絡先の入力は任意です'],
      href: routeHref({ name: 'voice' }),
      cta: '意見を送る',
    },
    volunteerEnabled && {
      key: 'join',
      tag: supportersAssociation,
      title: '活動に参加する',
      text: `${supportersAssociation}では、地域活動やイベント運営、広報などをお手伝いしてくださるボランティアを募集しています。`,
      notes: ['原則無償のボランティア。できるときに、できる範囲で', '登録しても、後援会への入会にはなりません'],
      href: routeHref({ name: 'join' }),
      cta: '一緒に活動する',
    },
  ].filter(Boolean) as {
    key: string
    tag: string
    title: string
    text: string
    notes: string[]
    href: string
    cta: string
  }[]

  return (
    <Section id="take-part" labelledBy="take-part-h">
      <SectionHeading id="take-part-h" kicker="Take part" title="宇部の未来づくりに参加しませんか？" />
      <ul className={`take-part__cards take-part__cards--${cards.length}`}>
        {cards.map(card => (
          <li className="take-part__card" key={card.key}>
            <span className="take-part__tag">{card.tag}</span>
            <h3 className="take-part__title">{card.title}</h3>
            <p className="take-part__text">{card.text}</p>
            <ul className="take-part__notes">
              {card.notes.map(n => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <a href={card.href} className="btn btn--primary btn--lg take-part__cta">
              {card.cta}
              <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
