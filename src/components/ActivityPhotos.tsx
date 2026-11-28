import { useCallback, useEffect, useRef, useState } from 'react'
import './ActivityPhotos.css'
import { reportHref, type ReportRow } from '../shared/reports'
import { formatJaDate } from '../lib/inPage'

/**
 * Activity photos in a horizontal strip, newest first. Swipe or scroll on
 * phones; the ‹ › buttons move one screen at a time. No autoplay, so
 * nothing moves unless the reader asks for it. Each photo links to its
 * report (note / Instagram / report page) like the activity list does.
 */
export default function ActivityPhotos({ reports, max = 10 }: { reports: ReportRow[]; max?: number }) {
  const items = reports.filter(r => r.photo_url).slice(0, max)
  const strip = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = strip.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])
  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update, items.length])

  const move = (dir: 1 | -1) => {
    const el = strip.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' })
  }

  if (items.length === 0) return null
  return (
    <div className="photo-strip">
      <div className="photo-strip__controls">
        <button type="button" className="photo-strip__btn" onClick={() => move(-1)} disabled={edge.start} aria-label="前の写真">
          ‹
        </button>
        <button type="button" className="photo-strip__btn" onClick={() => move(1)} disabled={edge.end} aria-label="次の写真">
          ›
        </button>
      </div>
      <ul ref={strip} className="photo-strip__list" onScroll={update}>
        {items.map(r => {
          const href = reportHref(r)
          const external = href.startsWith('https://')
          return (
            <li key={r.id} className="photo-strip__item">
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                <img src={r.photo_url!} alt={r.photo_alt || ''} loading="lazy" decoding="async" />
                <time dateTime={r.report_date}>{formatJaDate(r.report_date)}</time>
                <span className="photo-strip__title">{r.title}</span>
                {external && <span className="visually-hidden">（外部サイト・新しいタブで開きます）</span>}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
