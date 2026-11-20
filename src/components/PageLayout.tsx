import type { ReactNode } from 'react'
import { routeHref } from '../router'

/**
 * Shared frame for simple subpages (data, activity, about, privacy):
 * dark band under the fixed header, English kicker + Japanese title, then a
 * narrow reading column. Section headings inside reuse the policy-detail
 * styles so every subpage reads like the policy pages.
 */
export default function PageLayout({
  en,
  title,
  lead,
  children,
}: {
  en: string
  title: string
  lead?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="page">
      <header className="page__hero">
        <div className="container container--narrow">
          <a href={routeHref({ name: 'home', anchor: null })} className="page__back">
            ← トップページへ
          </a>
          <span className="page__en" aria-hidden="true">
            {en}
          </span>
          <h1 className="page__title">{title}</h1>
          {lead && <p className="page__lead">{lead}</p>}
        </div>
      </header>
      <div className="container container--narrow page__body">{children}</div>
    </article>
  )
}

export function PageSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="policy-detail__section">
      <h2 className="policy-detail__heading">{title}</h2>
      {children}
    </section>
  )
}
