import type { ReactNode } from 'react'

export type BadgeTone = 'pink' | 'gray' | 'outline'

/** Small label for a type or status. Text always carries the meaning, not color alone. */
export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
}
