import { motion, type Variants } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}
const fromLeft = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}
const fromRight = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
}
const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: 'easeOut' } },
}
const visionItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
}
const climax = {
  hidden: { opacity: 0, scale: 0.88, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
}

function Block({
  children,
  variants = fadeUp,
  amount = 0.3,
}: {
  children: React.ReactNode
  variants?: Variants
  amount?: number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

export default function Greeting() {
  return (
    <section id="message" className="section section--mint">
      <div className="container">

        <Block variants={fadeUp}>
          <div className="section-heading">
            <span className="section-heading__en">GREETING</span>
            <h2 className="section-heading__ja">ごあいさつ</h2>
            <div className="section-heading__line" />
          </div>
        </Block>

        <div className="greeting__body">

          <Block variants={fadeUp}>
            <p className="greeting__lead">宇部で、挑戦する人を増やしたい。</p>
          </Block>

          <Block variants={fromLeft}>
            <p>
              28歳の時に地元を離れ東京へ。エンジニアとしてIT業界で働き、技術広報やコミュニティ運営に携わり、多くの人が新しい一歩を踏み出す瞬間を見てきました。
              技術を学ぶ機会、新しい仕事との出会い、挑戦を応援してくれる仲間とのつながり。そうした環境が、人の可能性を大きく広げることを実感してきました。
              そして13年の時を経て、今度は自分が育った地元・宇部に、その経験を還元したいと思うようになりました。
            </p>
          </Block>

          <div className="greeting__divider" />

          <Block variants={fromRight}>
            <p>
              振り返ると、私自身も決して順風満帆な人生ではありませんでした。仕事と子育てを両立しながら、悩み、迷い、それでも一歩ずつ挑戦を続けてきました。エンジニアとして技術を学び、コミュニティ活動を通じて全国の仲間と出会い、そして起業にも挑戦しました。
              だからこそ強く感じています。<br />
              <strong>人の可能性は、生まれた環境や年齢で決まるものではありません。</strong>
            </p>
          </Block>

          <motion.div
            className="greeting__principles"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger}
          >
            {[
              '学ぶ機会があること。',
              '挑戦を応援してくれる人がいること。',
              '困ったときに相談できる場所があること。',
            ].map(text => (
              <motion.div key={text} className="greeting__principle" variants={listItem}>
                <span className="greeting__principle-check" aria-hidden="true">✓</span>
                <span>{text}</span>
              </motion.div>
            ))}
            <motion.p className="greeting__principle-note" variants={fadeUp}>
              そうした環境があれば、人は何歳からでも、新しい一歩を踏み出すことができます。
            </motion.p>
          </motion.div>

          <div className="greeting__divider" />

          <Block variants={fromLeft}>
            <p>
              しかし今、宇部では人口減少や若者の流出が進み、「やりたいことがあれば都市部へ」という考え方が当たり前になりつつあります。<br />
              私は、宇部に暮らしながらでも学び、働き、子育てをし、自分らしく挑戦できる環境を増やしたい。
            </p>
          </Block>

          <motion.div
            className="greeting__vision"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {[
              { emoji: '🌱', text: '子どもたちが未来に希望を持てるまち。' },
              { emoji: '💼', text: '働く世代が新しいことに挑戦できるまち。' },
              { emoji: '🤝', text: '子育てや介護をしながらでも、自分らしく活躍できるまち。' },
              { emoji: '✨', text: '年齢や性別、立場に関係なく、一人ひとりの挑戦が応援されるまち。' },
            ].map(item => (
              <motion.div key={item.text} className="greeting__vision-item" variants={visionItem}>
                <span className="greeting__vision-emoji" aria-hidden="true">{item.emoji}</span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <Block variants={fadeUp}>
            <p>
              そんな宇部を、皆さんと一緒につくっていきたいと思っています。
            </p>
            <p>
              地域の声を聞き、現場に足を運び、一つひとつの課題に向き合いながら、未来につながる選択肢を増やしていく。<br />
              そして、宇部から新しい挑戦が生まれ続ける地域を目指していく。
            </p>
          </Block>

          <Block variants={climax} amount={0.5}>
            <div className="greeting__climax">
              <p className="greeting__climax-text">誰もが挑戦できる宇部へ。</p>
            </div>
          </Block>

          <Block variants={fadeUp}>
            <p>その実現に向けて、皆さんとともに歩んでまいります。</p>
          </Block>

          <Block variants={fadeUp}>
            <motion.a
              href="https://note.com/satoshoco/n/n073cb334dd8b"
              target="_blank"
              rel="noopener noreferrer"
              className="note-card"
              whileHover={{ y: -3 }}
            >
              <div className="note-card__icon">📝</div>
              <div className="note-card__content">
                <span className="note-card__label">note</span>
                <span className="note-card__title">決意表明の全文を読む</span>
              </div>
              <span className="note-card__arrow">→</span>
            </motion.a>
          </Block>

        </div>
      </div>
    </section>
  )
}
