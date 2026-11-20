export type Crumb = { label: string; href?: string }

/**
 * Where this page sits, e.g. ホーム › V2MOM・政策 › 教育・人材育成.
 * The last item is the current page and is not a link.
 */
export function Breadcrumb({ items, tone = 'light' }: { items: Crumb[]; tone?: 'light' | 'dark' }) {
  return (
    <nav aria-label="パンくずリスト" className={`ui-breadcrumb ui-breadcrumb--${tone}`}>
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${i}-${item.label}`}>
              {item.href && !last ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
