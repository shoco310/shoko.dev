import { useEffect, useState } from 'react'

/**
 * 「ページの先頭へ」: a small round button in the bottom-right corner that
 * fades in once the reader has scrolled down, and returns to the top of the
 * current page. Focus moves to the site logo so keyboard users start over
 * from the top too.
 */
export default function BackToTop() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    document.querySelector<HTMLElement>('.site-header__logo')?.focus({ preventScroll: true })
  }

  return (
    <button
      type="button"
      className={`back-to-top${shown ? ' is-shown' : ''}`}
      onClick={toTop}
      aria-label="ページの先頭へ"
      title="ページの先頭へ"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}
