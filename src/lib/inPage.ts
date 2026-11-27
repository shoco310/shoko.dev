import type { MouseEvent } from 'react'

/**
 * Handler for in-page links (tables of contents): scroll to the target and
 * move focus there, without adding a history entry for each jump.
 */
export function jumpTo(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
}

/** '2026-11-04' → '2026年11月4日' */
export function formatJaDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}
