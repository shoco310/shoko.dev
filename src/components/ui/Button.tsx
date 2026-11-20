import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'text'

/** Opens off-site links in a new tab; same-site links stay in place. */
export function externalProps(href: string) {
  return /^https?:\/\//.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/**
 * A link styled as a button. Primary is the single main action of a block
 * (dark pink, white text); secondary is outlined; text is an arrow link.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size,
  children,
  className,
}: {
  href: string
  variant?: ButtonVariant
  size?: 'lg'
  children: ReactNode
  className?: string
}) {
  const classes =
    variant === 'text'
      ? ['ui-textlink', className]
      : ['btn', `btn--${variant}`, size === 'lg' && 'btn--lg', className]
  return (
    <a href={href} className={classes.filter(Boolean).join(' ')} {...externalProps(href)}>
      {children}
      {variant === 'text' && <span aria-hidden="true">→</span>}
    </a>
  )
}
