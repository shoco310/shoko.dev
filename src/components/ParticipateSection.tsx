import { motion } from 'framer-motion'
import { routeHref } from '../router'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
}

/**
 * Top-page section that explains the site's loop — gather voices →
 * improve policy → report activity → gather again — and links each step to
 * where it happens. Rendered only when the submission form is enabled.
 */
const steps = [
  {
    num: '01',
    title: '声を集める',
    desc: '暮らしの中の困りごとや、政策へのご意見をフォームから送れます。内容は公開されず、佐藤祥子が一つひとつ読みます。',
    links: [{ href: routeHref({ name: 'voice' }), label: '困りごと・ご意見を送る', primary: true }],
  },
  {
    num: '02',
    title: '政策を改善する',
    desc: 'いただいた声と、宇部市の公式な資料やデータを照らし合わせて政策を見直します。見直した内容は、各政策ページの「更新履歴」で公開します。',
    links: [
      { href: routeHref({ name: 'home', anchor: 'policy' }), label: '4つの政策を見る', primary: false },
      { href: routeHref({ name: 'data' }), label: '数字で見る宇部', primary: false },
    ],
  },
  {
    num: '03',
    title: '活動を公開する',
    desc: '調査がどこまで進んだか、どんな活動をしたかを報告します。そしてまた、新しい声を集めます。',
    links: [{ href: routeHref({ name: 'activity' }), label: '活動・調査の状況を見る', primary: false }],
  },
]

export default function ParticipateSection() {
  return (
    <section id="participate" className="section participate">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <span className="section-heading__en">YOUR VOICE</span>
            <h2 className="section-heading__ja">声を届ける</h2>
            <div className="section-heading__line" />
          </motion.div>

          <motion.p className="participate__intro" variants={fadeUp}>
            政策は、つくって終わりではありません。
            <br />
            宇部で暮らす皆さんの声から、一緒に育てていきます。
          </motion.p>

          <motion.ol className="participate__steps" variants={stagger}>
            {steps.map((step, i) => (
              <motion.li className="participate__step" key={step.num} variants={fadeUp}>
                <span className="participate__num" aria-hidden="true">
                  {step.num}
                </span>
                <h3 className="participate__title">{step.title}</h3>
                <p className="participate__desc">{step.desc}</p>
                <div className="participate__links">
                  {step.links.map(link => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`btn ${link.primary ? 'btn--primary' : 'btn--secondary'}`}
                    >
                      {link.label}
                      <span aria-hidden="true">→</span>
                    </a>
                  ))}
                </div>
                {i < steps.length - 1 && (
                  <span className="participate__arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </motion.li>
            ))}
          </motion.ol>

          <motion.p className="participate__loop" variants={fadeUp}>
            <span aria-hidden="true">↻ </span>
            活動の報告から、また新しい声が生まれる。この循環を続けていきます。
          </motion.p>

          <motion.p className="participate__note" variants={fadeUp}>
            このサイトは佐藤祥子の政治活動として運営しています。宇部市への手続きや正式な相談、命や安全に関わる緊急のご相談は、宇部市の窓口や110番・119番へご連絡ください。
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
