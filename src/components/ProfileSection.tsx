import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

export default function ProfileSection() {
  return (
    <section id="profile" className="section section--mint">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <span className="section-heading__en">PROFILE</span>
            <h2 className="section-heading__ja">プロフィール</h2>
            <div className="section-heading__line" />
          </motion.div>

          <div className="profile-box">
            <motion.div className="profile-photo" variants={fadeUp}>
              <img src="/images/profile.png" alt="さとうしょうこ" loading="lazy" />
            </motion.div>

            <motion.div className="profile-content" variants={stagger}>
              <motion.h3 variants={fadeUp}>さとうしょうこ</motion.h3>

              <motion.p variants={fadeUp}>
                宇部にゆかりを持ち、IT業界でエンジニアとして活躍。
                LINE（現LINEヤフー）の技術広報をはじめ、技術コミュニティ運営に長年携わる。
                2024年に自身の会社を設立。
              </motion.p>

              <motion.p variants={fadeUp}>
                技術コミュニティやイベント運営を通じて、人と人がつながり、
                新しい挑戦が生まれる場づくりに取り組んできました。
              </motion.p>

              <motion.p variants={fadeUp}>
                これまでの経験を地域に還元し、宇部で暮らす人たちが
                自分らしく挑戦できるまちづくりを進めていきます。
              </motion.p>

              <motion.div className="profile-award" variants={fadeUp}>
                <span className="profile-award__icon">🏆</span>
                <p className="profile-award__text">
                  Forbes JAPAN「Women in Tech 30」2026 選出<br />
                  ― テクノロジー領域で世界を変える30人 ―
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
