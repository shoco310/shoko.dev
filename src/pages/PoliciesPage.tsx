import PageLayout from '../components/PageLayout'
import { Badge, ButtonLink, Card, CardGrid, Section } from '../components/ui'
import { policies } from '../data/policy'
import { routeHref } from '../router'

/**
 * 4つの重点政策: compare the four policies side by side. Every word comes from
 * src/data/policy.ts (name, tagline, summary, initiative titles); the long
 * text stays on each policy page.
 */
export default function PoliciesPage() {
  return (
    <PageLayout
      en="POLICY"
      title="4つの重点政策"
      lead="すべての政策に「知る → 選ぶ → 実現する」を通します。"
      breadcrumb={[{ label: 'V2MOM・政策', href: routeHref({ name: 'vision' }) }]}
      bare
    >
      <Section tone="surface">
        <CardGrid columns={2}>
          {policies.map(p => (
            <Card
              key={p.slug}
              href={routeHref({ name: 'policy', slug: p.slug })}
              media={<img src={p.image} alt="" loading="lazy" decoding="async" />}
              badges={<Badge tone="pink">{p.number}</Badge>}
              title={
                <>
                  <span aria-hidden="true">{p.emoji} </span>
                  {p.name}
                </>
              }
              linkLabel="詳しく見る"
            >
              <p className="policy-card__tagline">{p.tagline}</p>
              <p>{p.summary}</p>
              <p className="policy-card__label">主な取り組み</p>
              <ul className="policy-card__list">
                {p.initiatives.map(i => (
                  <li key={i.title}>{i.title}</li>
                ))}
              </ul>
            </Card>
          ))}
        </CardGrid>
        <p className="policies-related">
          <ButtonLink href={routeHref({ name: 'vision' })} variant="text">
            V2MOM（目指す未来）
          </ButtonLink>
          <ButtonLink href={routeHref({ name: 'data' })} variant="text">
            数字で見る宇部
          </ButtonLink>
          <ButtonLink href={routeHref({ name: 'changes' })} variant="text">
            政策の変更履歴
          </ButtonLink>
        </p>
      </Section>
    </PageLayout>
  )
}
