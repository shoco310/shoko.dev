import type { ReactNode } from 'react'
import { policies, type Policy, type SourceItem } from '../data/policy'
import DataCard from '../components/DataCard'
import ChangeEntry from '../components/ChangeEntry'
import { listPublishedChanges } from '../lib/publicContent'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'
import { PolicyIssues } from '../components/PolicyIssues'
import { ResearchStatusList } from '../components/ResearchStatus'
import { Breadcrumb } from '../components/ui'
import { IconLine } from '../components/icons'
import { issuesEnabled } from '../data/features'
import { researchAsOf, researchGroups } from '../data/research'
import { associationFormUrl, lineUrl } from '../data/social'
import { formatJaDate, jumpTo } from '../lib/inPage'

const sourceTypeLabel: Record<SourceItem['type'], string> = {
  primary: '一次資料',
  report: '報道',
  reference: '参考・他自治体事例',
}

/**
 * One policy, in six blocks shared by all four pages:
 * 目指す未来 / 現状と課題 / 具体的な政策・提案 / 根拠となるデータや資料 /
 * 調査・検討状況 / 更新履歴. The text itself comes unchanged from
 * src/data/policy.ts; only the order and block headings are shared.
 */
export default function PolicyDetail({ policy }: { policy: Policy }) {
  const others = policies.filter(p => p.slug !== policy.slug)
  const hasVoice = !!policy.voice && policy.voice.length > 0
  const hasData = !!policy.dataPoints && policy.dataPoints.length > 0
  const hasEvidence =
    !!policy.issuesEvidence &&
    (policy.issuesEvidence.confirmed.length > 0 ||
      policy.issuesEvidence.considerations.length > 0 ||
      policy.issuesEvidence.analysisGaps.length > 0)
  const hasResearch = researchGroups.some(g => g.policySlug === policy.slug)

  const blocks = [
    { id: 'future', title: '目指す未来' },
    { id: 'current', title: '現状と課題' },
    { id: 'proposals', title: '具体的な政策・提案' },
    { id: 'evidence', title: '根拠となるデータや資料' },
    { id: 'research', title: '調査・検討状況' },
    { id: 'history', title: '更新履歴' },
  ]

  return (
    <article className="policy-detail">
      <header className="policy-detail__hero">
        <div className="container">
          <Breadcrumb
            tone="light"
            items={[
              { label: 'ホーム', href: routeHref({ name: 'home', anchor: null }) },
              { label: 'V2MOM・政策', href: routeHref({ name: 'vision' }) },
              { label: '4つの重点政策', href: routeHref({ name: 'policies' }) },
              { label: policy.name },
            ]}
          />
          <div className="policy-detail__hero-inner">
            <div>
              <span className="policy-detail__num" aria-hidden="true">
                {policy.number}
              </span>
              <h1 className="policy-detail__title">{policy.name}</h1>
              <p className="policy-detail__tagline">{policy.tagline}</p>
            </div>
            <div className="policy-detail__hero-media">
              <img src={policy.image} alt="" />
            </div>
          </div>
        </div>
      </header>

      <div className="container container--narrow policy-detail__body">
        <nav aria-label="このページの内容" className="toc toc--policy">
          <ol>
            {blocks.map((b, i) => (
              <li key={b.id}>
                <a href={`#${b.id}`} onClick={jumpTo(b.id)}>
                  <span aria-hidden="true">{i + 1}</span>
                  {b.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Block id="future" n={1} title="目指す未来">
          {policy.background.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Block>

        <Block id="current" n={2} title="現状と課題">
          {policy.challenges.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {policy.existingSystems.map((p, i) => (
            <p key={`es-${i}`}>{p}</p>
          ))}
          {hasVoice && (
            <div className="policy-detail__sub">
              <h3 className="policy-detail__subheading">市民の声</h3>
              {policy.voice!.map((v, i) => (
                <figure className="voice-quote" key={i}>
                  <blockquote>{v.quote}</blockquote>
                  <figcaption>{v.context}</figcaption>
                  {v.response && (
                    <div className="voice-quote__response">
                      <p className="voice-quote__response-label">
                        市の考え方{v.responseLabel ? `（${v.responseLabel}）` : ''}
                      </p>
                      <p>{v.response}</p>
                    </div>
                  )}
                </figure>
              ))}
            </div>
          )}
        </Block>

        <Block id="proposals" n={3} title="具体的な政策・提案">
          <ol className="policy-detail__initiatives">
            {policy.initiatives.map((item, i) => (
              <li key={item.title}>
                <div className="policy-detail__initiative-left">
                  <span className="policy-detail__initiative-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  {item.status === 'existing' && item.statusNote && (
                    <span className="status-badge status-badge--existing">関連する既存制度あり</span>
                  )}
                </div>
                <div className="policy-detail__initiative-right">
                  <p>{item.desc}</p>
                  {item.status === 'existing' && item.statusNote && (
                    <p className="policy-detail__status-note">
                      関連制度：{item.statusNote}
                      {item.statusUrl && (
                        <>
                          {' '}
                          <a href={item.statusUrl} target="_blank" rel="noopener noreferrer">
                            公式ページ →
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Block>

        <Block id="evidence" n={4} title="根拠となるデータや資料">
          {hasData && (
            <div className="policy-detail__sub">
              <h3 className="policy-detail__subheading">数字で見る宇部の現状</h3>
              <p className="policy-detail__data-source-note">
                宇部市の公式計画・アンケート等をもとにした確認済みデータです。
              </p>
              {policy.dataNote && <p className="policy-detail__data-note">⚠️ {policy.dataNote}</p>}
              <div className="policy-detail__data-list">
                {policy.dataPoints!.map((d, i) => (
                  <DataCard key={i} d={d} />
                ))}
              </div>
            </div>
          )}
          <div className="policy-detail__sub">
            <h3 className="policy-detail__subheading">関連資料・出典</h3>
            {policy.sourceList && policy.sourceList.length > 0 ? (
              <ul className="policy-detail__sources">
                {policy.sourceList.map((s, i) => (
                  <li key={i}>
                    <span className={`source-tag source-tag--${s.type}`}>{sourceTypeLabel[s.type]}</span>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      <span>{s.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="policy-detail__note">
                <p>
                  このページの内容は、対話や情報収集を重ねながら今後も更新していきます。統計データや公的資料など、出典を確認できるものについては、確認が取れ次第この欄に追記していきます。
                </p>
              </div>
            )}
          </div>
        </Block>

        <Block id="research" n={5} title="調査・検討状況">
          {hasEvidence && (
            <div className="policy-detail__sub">
              <h3 className="policy-detail__subheading">調査結果から考えられること</h3>
              <dl className="evidence-list">
                {policy.issuesEvidence!.confirmed.length > 0 && (
                  <div className="evidence-list__row">
                    <dt>データから確認できること</dt>
                    <dd>
                      <ul>
                        {policy.issuesEvidence!.confirmed.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                {policy.issuesEvidence!.considerations.length > 0 && (
                  <div className="evidence-list__row evidence-list__row--considerations">
                    <dt>考えられる課題（推測）</dt>
                    <dd>
                      <ul>
                        {policy.issuesEvidence!.considerations.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                {policy.issuesEvidence!.analysisGaps.length > 0 && (
                  <div className="evidence-list__row">
                    <dt>さらに調査が必要なこと</dt>
                    <dd>
                      <ul>
                        {policy.issuesEvidence!.analysisGaps.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
          {hasResearch && (
            <div className="policy-detail__sub">
              <h3 className="policy-detail__subheading">調査の進み具合</h3>
              <p className="policy-detail__data-source-note">{formatJaDate(researchAsOf)}時点</p>
              <div className="research-group research-group--plain">
                <ResearchStatusList slug={policy.slug} />
              </div>
            </div>
          )}
          {issuesEnabled && <PolicyIssues slug={policy.slug} level={3} />}
        </Block>

        <PolicyChanges slug={policy.slug} />

        <div className="policy-detail__cta">
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--lg">
            <IconLine />
            LINE公式に登録する
          </a>
          <a href={associationFormUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--lg">
            後援会に入会する
          </a>
        </div>
      </div>

      <div className="policy-detail__others">
        <div className="container">
          <h2 className="policy-detail__others-heading">他の政策も見る</h2>
          <div className="policy-detail__others-grid">
            {others.map(p => (
              <a key={p.slug} href={routeHref({ name: 'policy', slug: p.slug })} className="policy-detail__other-card">
                <span aria-hidden="true">{p.number}</span>
                <div>
                  <strong>{p.name}</strong>
                  <p>{p.tagline}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function Block({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section className="policy-detail__section" id={id} aria-labelledby={`${id}-h`}>
      <h2 className="policy-detail__heading" id={`${id}-h`}>
        <span className="policy-detail__heading-num" aria-hidden="true">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** 6. 更新履歴 for one policy, from the published policy_changes records. */
function PolicyChanges({ slug }: { slug: string }) {
  const { data, error } = useAsync(listPublishedChanges, [])
  const mine = (data ?? []).filter(e => e.slugs.includes(slug))
  return (
    <Block id="history" n={6} title="更新履歴">
      <p>この政策を、いつ・なぜ・何をもとに変えたのかを記録しています。</p>
      {error && <p className="page__muted">更新履歴を読み込めませんでした。</p>}
      <ol className="changes">
        {mine.map(e => (
          <ChangeEntry key={e.change.id} change={e.change} />
        ))}
      </ol>
      <p className="page__more">
        <a href={routeHref({ name: 'changes' })} className="btn btn--secondary">
          すべての政策の変更履歴を見る →
        </a>
      </p>
    </Block>
  )
}
