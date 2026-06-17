import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

export default function SupportSection() {
  return (
    <section id="support" className="section section--green">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <span className="section-heading__en">JOIN US</span>
            <h2 className="section-heading__ja">後援会のご案内</h2>
            <div className="section-heading__line" />
          </motion.div>

          <motion.p className="support-desc" variants={fadeUp}>
            さとうしょうこ後援会では、活動を応援してくださる方を募集しています。
            LINE公式アカウントでは、活動報告やイベント情報をいち早くお届けします。
            一緒に、挑戦できる宇部をつくりましょう。
          </motion.p>

          <motion.div className="support-btns" variants={fadeUp}>
            <a
              href="https://lin.ee/Rgs1sYR3"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--white btn--lg"
            >
              <IconLine />
              LINE公式に登録する
            </a>
            <a
              href="https://forms.gle/z3RQbWGoreoUCiZ4A"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--lg"
            >
              入会フォームへ
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function IconLine() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}
