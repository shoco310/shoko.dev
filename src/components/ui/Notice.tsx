import type { ReactNode } from 'react'

/**
 * Boxed note: `info` for neutral explanations (how submissions are handled,
 * provisional targets), `caution` for things the reader must not miss.
 */
export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'caution'
  title?: ReactNode
  children: ReactNode
}) {
  return (
    <aside className={`ui-notice ui-notice--${tone}`}>
      {title && <p className="ui-notice__title">{title}</p>}
      <div className="ui-notice__body">{children}</div>
    </aside>
  )
}
