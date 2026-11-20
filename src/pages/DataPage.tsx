import PageLayout from '../components/PageLayout'
import DataCard from '../components/DataCard'
import { policies } from '../data/policy'
import { routeHref } from '../router'

export default function DataPage() {
  const groups = policies.filter(p => p.dataPoints && p.dataPoints.length > 0)

  return (
    <PageLayout
      en="DATA"
      title="数字で見る宇部"
      lead="宇部市の計画書やアンケート調査など、公式な資料で確認できた数字だけを、政策のテーマごとにまとめています。"
    >
      <div className="policy-detail__note page__notice">
        <p>
          掲載している数字は、出典・調査の時期・対象をそれぞれのカードに記載しています。調査ごとに対象や母数が異なるため、別のカードの数字どうしを単純に比べることはできません。新しい数字は、元の資料を確認してから追加します。
        </p>
      </div>

      {groups.map(policy => (
        <section className="policy-detail__section" key={policy.slug} aria-labelledby={`data-${policy.slug}`}>
          <h2 className="policy-detail__heading" id={`data-${policy.slug}`}>
            <span aria-hidden="true">{policy.emoji}</span>
            {policy.name}
          </h2>
          {policy.dataNote && <p className="policy-detail__data-note">⚠️ {policy.dataNote}</p>}
          <div className="policy-detail__data-list">
            {policy.dataPoints!.map((d, i) => (
              <DataCard key={i} d={d} />
            ))}
          </div>
          <p className="page__more">
            <a href={routeHref({ name: 'policy', slug: policy.slug })} className="btn btn--secondary">
              {policy.name}の政策を見る →
            </a>
          </p>
        </section>
      ))}
    </PageLayout>
  )
}
