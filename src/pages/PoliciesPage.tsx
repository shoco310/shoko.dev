import PageLayout from '../components/PageLayout'
import { ButtonLink, Section } from '../components/ui'
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
      <Section>
        <ol className="policy-rows">
          {policies.map(p => (
            <li key={p.slug}>
              <a href={routeHref({ name: 'policy', slug: p.slug })} className="policy-rows__link">
                <span className="policy-rows__num">{p.number}</span>
                <span className="policy-rows__head">
                  <span className="policy-rows__name">{p.name}</span>
                  <span className="policy-rows__tagline">{p.tagline}</span>
                </span>
                <span className="policy-rows__body">
                  <span className="policy-rows__summary">{p.summary}</span>
                  <span className="policy-rows__label">主な取り組み</span>
                  <span className="policy-rows__list">
                    {p.initiatives.map(i => (
                      <span key={i.title}>{i.title}</span>
                    ))}
                  </span>
                  <span className="policy-rows__more">詳しく見る →</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <p className="policies-related">
          <ButtonLink href={routeHref({ name: 'vision' })} variant="text">
            V2MOM（目指す未来）
          </ButtonLink>
          <ButtonLink href={routeHref({ name: 'research' })} variant="text">
            政策調査
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
