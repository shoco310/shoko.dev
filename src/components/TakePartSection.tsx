import { motion } from 'framer-motion'
import { routeHref } from '../router'
import { voiceEnabled, volunteerEnabled } from '../data/features'
import { supportersAssociation } from '../data/site'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.14 } } }

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
    <section id="take-part" className="section section--tint take-part">
      <div className="container">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div className="section-heading" variants={fadeUp}>
            <span className="section-heading__en">TAKE PART</span>
            <h2 className="section-heading__ja">宇部の未来づくりに参加しませんか？</h2>
            <div className="section-heading__line" />
          </motion.div>

          <motion.ul className={`take-part__cards take-part__cards--${cards.length}`} variants={stagger}>
            {cards.map(card => (
              <motion.li className="take-part__card" key={card.key} variants={fadeUp}>
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
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}
