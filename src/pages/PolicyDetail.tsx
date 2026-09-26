import { motion } from 'framer-motion'
import { policies, type Policy } from '../data/policy'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  )
}

function IconLine() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}

export default function PolicyDetail({ policy }: { policy: Policy }) {
  const others = policies.filter(p => p.slug !== policy.slug)

  return (
    <article className="policy-detail">
      <header className="policy-detail__hero">
        <div className="policy-detail__hero-media">
          <img src={policy.image} alt={policy.name} />
        </div>
        <div className="container">
          <a href="#policy" className="policy-detail__back">
            ← 4つの政策一覧に戻る
          </a>
          <span className="policy-detail__num" aria-hidden="true">
            {policy.number}
          </span>
          <h1 className="policy-detail__title">
            <span className="policy-detail__emoji" aria-hidden="true">
              {policy.emoji}
            </span>
            {policy.name}
          </h1>
          <p className="policy-detail__tagline">{policy.tagline}</p>
        </div>
      </header>

      <div className="container container--narrow policy-detail__body">
        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">政策の背景と目指す姿</h2>
            {policy.background.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        </Block>

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">具体的な取り組み</h2>
            <ol className="policy-detail__initiatives">
              {policy.initiatives.map((item, i) => (
                <li key={item.title}>
                  <span className="policy-detail__initiative-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Block>

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">宇部市の現状と課題</h2>
            {policy.challenges.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        </Block>

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">既存制度と改善を検討する点</h2>
            {policy.existingSystems.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        </Block>

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">関連資料・出典</h2>
            <div className="policy-detail__note">
              <p>
                このページの内容は、対話や情報収集を重ねながら今後も更新していきます。統計データや公的資料など、出典を確認できるものについては、確認が取れ次第この欄に追記していきます。
              </p>
            </div>
          </section>
        </Block>

        <Block>
          <div className="policy-detail__cta">
            <a
              href="https://lin.ee/Rgs1sYR3"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--lg"
            >
              <IconLine />
              LINE公式に登録する
            </a>
            <a
              href="https://forms.gle/z3RQbWGoreoUCiZ4A"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary btn--lg"
            >
              後援会に入会する
            </a>
          </div>
        </Block>
      </div>

      <div className="policy-detail__others">
        <div className="container">
          <h2 className="policy-detail__others-heading">他の政策も見る</h2>
          <div className="policy-detail__others-grid">
            {others.map(p => (
              <a key={p.slug} href={`#/policy/${p.slug}`} className="policy-detail__other-card">
                <span aria-hidden="true">{p.number}</span>
                <div>
                  <strong>{p.name}</strong>
                  <p>{p.tagline}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
