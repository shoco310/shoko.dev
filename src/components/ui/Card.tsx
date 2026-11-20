import type { ReactNode } from 'react'
import { externalProps } from './Button'

/**
 * One card frame for policies, activities, events and issues. When `href` is
 * given the title becomes the link and the whole card is clickable (the
 * link's ::after covers the card), so there is still only one tab stop.
 */
export function Card({
  href,
  media,
  badges,
  meta,
  title,
  titleLevel = 3,
  children,
  linkLabel,
}: {
  href?: string
  media?: ReactNode
  badges?: ReactNode
  meta?: ReactNode
  title: ReactNode
  titleLevel?: 2 | 3
  children?: ReactNode
  /** Visible "詳しく見る →" style text at the bottom of a linked card. */
  linkLabel?: string
}) {
  const H = titleLevel === 2 ? 'h2' : 'h3'
  return (
    <article className={`ui-card${href ? ' ui-card--link' : ''}`}>
      {media && <div className="ui-card__media">{media}</div>}
      <div className="ui-card__body">
        {(badges || meta) && (
          <div className="ui-card__top">
            {badges}
            {meta && <span className="ui-card__meta">{meta}</span>}
          </div>
        )}
        <H className="ui-card__title">
          {href ? (
            <a href={href} className="ui-card__link" {...externalProps(href)}>
              {title}
            </a>
          ) : (
            title
          )}
        </H>
        {children && <div className="ui-card__text">{children}</div>}
        {href && linkLabel && (
          <span className="ui-card__more" aria-hidden="true">
            {linkLabel} →
          </span>
        )}
      </div>
    </article>
  )
}

/** Responsive grid for cards: 1 column on phones, up to `columns` on PC. */
export function CardGrid({ columns = 3, children }: { columns?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={`ui-card-grid ui-card-grid--${columns}`}>{children}</div>
}
