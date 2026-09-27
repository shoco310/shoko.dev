import { motion } from 'framer-motion'
import { policies, type Policy, type SourceItem } from '../data/policy'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  )
}

function IconLine() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}

const sourceTypeLabel: Record<SourceItem['type'], string> = {
  primary: '一次資料',
  report: '報道',
  reference: '参考・他自治体事例',
}

export default function PolicyDetail({ policy }: { policy: Policy }) {
  const others = policies.filter(p => p.slug !== policy.slug)
  const hasVoice = !!policy.voice && policy.voice.length > 0
  const hasData = !!policy.dataPoints && policy.dataPoints.length > 0
  const hasEvidence =
    !!policy.issuesEvidence &&
    (policy.issuesEvidence.confirmed.length > 0 ||
      policy.issuesEvidence.considerations.length > 0 ||
      policy.issuesEvidence.analysisGaps.length > 0)

  return (
    <article className="policy-detail">
      <header className="policy-detail__hero">
        <div className="policy-detail__hero-media">
          <img src={policy.image} alt={policy.name} />
        </div>
        <div className="container">
          <a href="#policy" className="policy-detail__back">
            ← 4つの政策一覧に戻る
          </a>
          <span className="policy-detail__num" aria-hidden="true">
            {policy.number}
          </span>
          <h1 className="policy-detail__title">
            <span className="policy-detail__emoji" aria-hidden="true">
              {policy.emoji}
            </span>
            {policy.name}
          </h1>
          <p className="policy-detail__tagline">{policy.tagline}</p>
        </div>
      </header>

      <div className="container container--narrow policy-detail__body">
        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">政策の背景と目指す姿</h2>
            {policy.background.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        </Block>

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">具体的な取り組み</h2>
            <ol className="policy-detail__initiatives">
              {policy.initiatives.map((item, i) => (
                <li key={item.title}>
                  <div className="policy-detail__initiative-left">
                    <span className="policy-detail__initiative-num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
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
          </section>
        </Block>

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">なぜ、この政策が必要なのか</h2>
            {policy.challenges.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {policy.existingSystems.map((p, i) => (
              <p key={`es-${i}`}>{p}</p>
            ))}
          </section>
        </Block>

        {hasData && (
          <Block>
            <section className="policy-detail__section">
              <h2 className="policy-detail__heading">数字で見る宇部の現状</h2>
              <p className="policy-detail__data-source-note">
                宇部市の公式計画・アンケート等をもとにした確認済みデータです。
              </p>
              {policy.dataNote && <p className="policy-detail__data-note">⚠️ {policy.dataNote}</p>}
              <div className="policy-detail__data-list">
                {policy.dataPoints!.map((d, i) => {
                  const isMultiStat = !!d.stats && d.stats.length > 1
                  const isSingleStat = !d.highlight && !isMultiStat && (!!d.value || (!!d.stats && d.stats.length === 1))
                  const singleStat = d.stats && d.stats.length === 1 ? d.stats[0] : undefined
                  return (
                    <div className={`data-card ${isSingleStat ? '' : 'data-card--stacked'}`} key={i}>
                      {isSingleStat && (
                        <div className="data-card__figure">
                          {singleStat ? (
                            <>
                              <p className="data-card__value">{singleStat.value}</p>
                              {typeof singleStat.barPct === 'number' && (
                                <div className="data-card__bar">
                                  <div className="data-card__bar-fill" style={{ width: `${singleStat.barPct}%` }} />
                                </div>
                              )}
                            </>
                          ) : (
                            d.value && <p className="data-card__value">{d.value}</p>
                          )}
                        </div>
                      )}

                      <div className="data-card__body">
                        <div className="data-card__head">
                          <p className="data-card__label">{d.label}</p>
                          <p className="data-card__meta">{d.survey}</p>
                        </div>

                        {d.highlight && <p className="data-card__highlight">{d.value}</p>}

                        {isMultiStat && (
                          <div
                            className="data-card__stats"
                            style={{ '--stat-cols': Math.min(d.stats!.length, 3) } as React.CSSProperties}
                          >
                            {d.stats!.map((s, j) => (
                              <div className="data-card__stat" key={j}>
                                <p className="data-card__stat-label">{s.label}</p>
                                <p className="data-card__stat-value">{s.value}</p>
                                {typeof s.barPct === 'number' && (
                                  <div className="data-card__bar">
                                    <div className="data-card__bar-fill" style={{ width: `${s.barPct}%` }} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {d.description && <p className="data-card__description">{d.description}</p>}

                        {d.breakdown && (
                          <ul className={`data-card__breakdown ${d.chartable ? 'data-card__breakdown--chart' : ''}`}>
                            {d.breakdown.map((b, j) => (
                              <li key={j}>
                                <div className="data-card__breakdown-row">
                                  <span>{b.label}</span>
                                  <strong>{b.value}</strong>
                                </div>
                                {d.chartable && typeof b.barPct === 'number' && (
                                  <div className="data-card__bar">
                                    <div className="data-card__bar-fill" style={{ width: `${b.barPct}%` }} />
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {d.note && <p className="data-card__note">{d.note}</p>}
                      </div>

                      <div className="data-card__source">
                        <span>{d.source}</span>
                        {d.sourceUrl && (
                          <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
                            原本を見る →
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </Block>
        )}

        {hasEvidence && (
          <Block>
            <section className="policy-detail__section">
              <h2 className="policy-detail__heading">調査結果から考えられること</h2>
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
            </section>
          </Block>
        )}

        {hasVoice && (
          <Block>
            <section className="policy-detail__section">
              <h2 className="policy-detail__heading">市民の声</h2>
              {policy.voice!.map((v, i) => (
                <figure className="voice-quote" key={i}>
                  <blockquote>{v.quote}</blockquote>
                  <figcaption>{v.context}</figcaption>
                  {v.response && (
                    <div className="voice-quote__response">
                      <p className="voice-quote__response-label">市の考え方{v.responseLabel ? `（${v.responseLabel}）` : ''}</p>
                      <p>{v.response}</p>
                    </div>
                  )}
                </figure>
              ))}
            </section>
          </Block>
        )}

        <Block>
          <section className="policy-detail__section">
            <h2 className="policy-detail__heading">関連資料・出典</h2>
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
          </section>
        </Block>

        <Block>
          <div className="policy-detail__cta">
            <a
              href="https://lin.ee/Rgs1sYR3"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--lg"
            >
              <IconLine />
              LINE公式に登録する
            </a>
            <a
              href="https://forms.gle/z3RQbWGoreoUCiZ4A"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary btn--lg"
            >
              後援会に入会する
            </a>
          </div>
        </Block>
      </div>

      <div className="policy-detail__others">
        <div className="container">
          <h2 className="policy-detail__others-heading">他の政策も見る</h2>
          <div className="policy-detail__others-grid">
            {others.map(p => (
              <a key={p.slug} href={`#/policy/${p.slug}`} className="policy-detail__other-card">
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
