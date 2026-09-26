import { motion } from 'framer-motion'
import { policies } from '../data/policy'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const fromLeft = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}
const fromRight = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}

export default function PolicySection() {
  return (
    <section id="policy" className="section policy-section">
      <div className="container">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <span className="section-heading__en">POLICY</span>
          <h2 className="section-heading__ja">4つの政策</h2>
          <div className="section-heading__line" />
        </motion.div>

        <motion.p
          className="policy-intro"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
        >
          年齢や立場に関わらず、誰もが挑戦できる宇部を目指して。
          <br />
          4つのテーマで取り組みを進めます。
        </motion.p>
      </div>

      <div className="policy-rows">
        {policies.map((policy, i) => {
          const reversed = i % 2 === 1
          return (
            <div
              key={policy.slug}
              className={`policy-row${reversed ? ' policy-row--reverse' : ''}`}
            >
              <motion.div
                className="policy-row__media"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                variants={reversed ? fromRight : fromLeft}
              >
                <img src={policy.image} alt={policy.name} loading="lazy" />
              </motion.div>

              <motion.div
                className="policy-row__body"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={reversed ? fromLeft : fromRight}
              >
                <div className="policy-row__inner">
                  <span className="policy-row__num" aria-hidden="true">
                    {policy.number}
                  </span>
                  <h3 className="policy-row__name">
                    <span className="policy-row__emoji" aria-hidden="true">
                      {policy.emoji}
                    </span>
                    {policy.name}
                  </h3>
                  <p className="policy-row__tagline">{policy.tagline}</p>
                  <p className="policy-row__desc">{policy.summary}</p>
                  <a href={`#/policy/${policy.slug}`} className="btn btn--secondary">
                    政策の詳細を見る
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
