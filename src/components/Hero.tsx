import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.35 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function Hero() {
  return (
    <section className="hero" id="top" aria-label="ファーストビュー">
      <div className="hero__inner">
        <motion.div
          className="hero__content"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div className="hero__tag" variants={item}>
            宇部から、新しい挑戦を。
          </motion.div>

          <motion.h1 className="hero__title" variants={item}>
            さとうしょうこ
          </motion.h1>

          <motion.p className="hero__copy" variants={item}>
            誰もが挑戦できる宇部へ。
          </motion.p>

          <motion.p className="hero__desc" variants={item}>
            宇部で暮らす一人ひとりが、自分らしく学び、働き、
            子育てし、挑戦できるまちを目指して活動しています。
          </motion.p>

          <motion.div className="hero__btns" variants={item}>
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
          </motion.div>

          <motion.div className="hero__sns" variants={item}>
            <a
              href="https://www.facebook.com/profile.php?id=61590433598518"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__sns-link"
            >
              <IconFacebook />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/shoko_sato_ube/"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__sns-link"
            >
              <IconInstagram />
              Instagram
            </a>
            <a
              href="https://note.com/satoshoco"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__sns-link"
            >
              <IconNote />
              note
            </a>
          </motion.div>

          <motion.nav className="hero__nav" variants={item} aria-label="ページ内ナビゲーション">
            <a href="#message">ごあいさつ</a>
            <a href="#policy">4つの政策</a>
            <a href="#activity">活動報告</a>
            <a href="#profile">プロフィール</a>
            <a href="#support">後援会</a>
          </motion.nav>
        </motion.div>
      </div>

      <motion.a
        href="#message"
        className="hero__scroll"
        aria-label="下にスクロール"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <span className="hero__scroll-text">SCROLL</span>
        <span className="hero__scroll-arrow">↓</span>
      </motion.a>
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

function IconFacebook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function IconNote() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.4 1H5.41C4.08 1 3 2.08 3 3.41v17.18C3 21.92 4.08 23 5.41 23H18.6c1.32 0 2.4-1.08 2.4-2.41V8.02L14.4 1zM13.8 9V2.5L20.1 9H13.8z" />
    </svg>
  )
}
