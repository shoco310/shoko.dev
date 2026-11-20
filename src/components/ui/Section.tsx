import type { ReactNode } from 'react'

/**
 * A page band with the standard vertical rhythm. `tone="surface"` gives the
 * quiet grey panel used behind card grids; `width="narrow"` keeps long text
 * to a readable column.
 */
export function Section({
  id,
  tone = 'default',
  width = 'wide',
  labelledBy,
  children,
}: {
  id?: string
  tone?: 'default' | 'surface'
  width?: 'wide' | 'narrow'
  labelledBy?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`ui-section${tone === 'surface' ? ' ui-section--surface' : ''}`}
      aria-labelledby={labelledBy}
    >
      <div className={`container${width === 'narrow' ? ' container--narrow' : ''}`}>
        {children}
      </div>
    </section>
  )
}

/**
 * Section title: a small English kicker (decoration, hidden from screen
 * readers), the Japanese heading, and an optional one-line lead.
 */
export function SectionHeading({
  id,
  kicker,
  title,
  lead,
  level = 2,
  action,
}: {
  id?: string
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  level?: 2 | 3
  action?: ReactNode
}) {
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <div className="ui-heading">
      <div className="ui-heading__text">
        {kicker && (
          <span className="ui-heading__kicker" aria-hidden="true">
            {kicker}
          </span>
        )}
        <H id={id} className={`ui-heading__title ui-heading__title--h${level}`}>
          {title}
        </H>
        {lead && <p className="ui-heading__lead">{lead}</p>}
      </div>
      {action && <div className="ui-heading__action">{action}</div>}
    </div>
  )
}
