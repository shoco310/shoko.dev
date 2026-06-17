import { motion } from 'framer-motion'

interface Policy {
  emoji: string
  name: string
  image: string
  description: string
}

const policies: Policy[] = [
  {
    emoji: '📚',
    name: '教育・人材育成',
    image: '/images/policy-education.jpg',
    description:
      '子どもたちが自分の可能性を広げられる学びの環境づくりを進めます。デジタル教育の充実と、年代を問わずリスキリングができる機会を増やします。',
  },
  {
    emoji: '💼',
    name: '仕事・産業振興',
    image: '/images/policy-work.jpg',
    description:
      '地域産業と新しい働き方をつなぎ、宇部で挑戦できる仕事を増やします。スタートアップ支援と副業・テレワーク環境の整備に取り組みます。',
  },
  {
    emoji: '🌱',
    name: '女性・子育て支援',
    image: '/images/policy-childcare.jpg',
    description:
      '子育て、仕事、暮らしを一人で抱え込まない地域づくりを目指します。保育環境の充実と、ライフステージを問わず活躍できる仕組みをつくります。',
  },
  {
    emoji: '🏛️',
    name: '市民参加・行政改革',
    image: '/images/policy-city.jpg',
    description:
      '市民の声が届きやすく、わかりやすく開かれた市政を目指します。デジタル化による行政手続きの簡素化と、若者が参加しやすい仕組みを推進します。',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

export default function PolicySection() {
  return (
    <section id="policy" className="section">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <span className="section-heading__en">POLICY</span>
            <h2 className="section-heading__ja">4つの政策</h2>
            <div className="section-heading__line" />
          </motion.div>

          <motion.div className="policy-grid" variants={stagger}>
            {policies.map(policy => (
              <motion.div
                key={policy.name}
                className="policy-card"
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <div className="policy-card__img-wrap">
                  <img src={policy.image} alt={policy.name} loading="lazy" />
                </div>
                <div className="policy-card__body">
                  <h3 className="policy-card__name">
                    <span className="policy-card__emoji" aria-hidden="true">{policy.emoji}</span>
                    {policy.name}
                  </h3>
                  <p>{policy.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
