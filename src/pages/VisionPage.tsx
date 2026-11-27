import PageLayout from '../components/PageLayout'
import { ButtonLink, Section, SectionHeading } from '../components/ui'
import { routeHref } from '../router'
import { issuesEnabled, voiceEnabled } from '../data/features'
import {
  fieldIndicators,
  measureCandidates,
  measureLayers,
  measures,
  measuresNote,
  measuresPeriod,
  methods,
  obstacles,
  principles,
  process,
  v2momMeta,
  values,
  vision,
  voiceDefinition,
} from '../data/v2mom'
import { policies } from '../data/policy'
import { formatJaDate, jumpTo as jump } from '../lib/inPage'

/**
 * V2MOM 2027: Vision, Values, Methods, Obstacles, Measures — in the order the
 * manuscript asks for. Methods only introduces the four policies; their
 * details live on /policies and the policy pages.
 */
export default function VisionPage() {
  return (
    <PageLayout
      en="V2MOM"
      title="V2MOM（目指す未来）"
      breadcrumb={[{ label: 'V2MOM・政策' }]}
      bare
    >
      <div className="container container--narrow v2mom-meta">
        <p>
          V2MOM 2027（{v2momMeta.version}・{formatJaDate(v2momMeta.updated)}）
        </p>
        <nav aria-label="このページの内容" className="toc">
          <ol>
            <li><a href="#vision" onClick={jump('vision')}>Vision｜目指す未来</a></li>
            <li><a href="#values" onClick={jump('values')}>Values｜3つの価値観</a></li>
            <li><a href="#methods" onClick={jump('methods')}>Methods｜4つの重点政策</a></li>
            <li><a href="#obstacles" onClick={jump('obstacles')}>Obstacles｜向き合う障壁</a></li>
            <li><a href="#measures" onClick={jump('measures')}>Measures｜成果の測り方</a></li>
          </ol>
        </nav>
      </div>

      <Section id="vision" width="narrow" labelledBy="vision-h">
        <SectionHeading id="vision-h" kicker="Vision" title="目指す未来" />
        <p className="v2mom-vision__title">
          {vision.title}
          <br />
          <span>{vision.subtitle}</span>
        </p>
        <p className="v2mom-text">{vision.body}</p>
        <p className="v2mom-emphasis">{vision.emphasis}</p>
      </Section>

      <Section id="values" tone="surface" width="narrow" labelledBy="values-h">
        <SectionHeading
          id="values-h"
          kicker="Values"
          title="社会に対して大切にする3つの価値観"
          lead={`${values.map(v => v.verb).join(' → ')} の3段階を、すべての政策に通します。`}
        />
        <ol className="v2mom-values">
          {values.map((v, i) => (
            <li key={v.verb} className="v2mom-value">
              <p className="v2mom-value__step">
                <span aria-hidden="true">{i + 1}</span>
                {v.verb}
              </p>
              <h3 className="v2mom-value__title">{v.title}</h3>
              <p>{v.body}</p>
              <p className="v2mom-value__question">
                <strong>政策判断の問い</strong>
                {v.question}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="methods" width="narrow" labelledBy="methods-h">
        <SectionHeading
          id="methods-h"
          kicker="Methods"
          title="4つの重点政策"
          action={<ButtonLink href={routeHref({ name: 'policies' })} variant="text">4つの政策を比べる</ButtonLink>}
        />
        <ul className="v2mom-methods">
          {methods.map(m => {
            const p = policies.find(x => x.slug === m.slug)
            return (
              <li key={m.slug}>
                <a href={routeHref({ name: 'policy', slug: m.slug })} className="v2mom-method">
                  <span className="v2mom-method__num" aria-hidden="true">{p?.number}</span>
                  <span className="v2mom-method__field">{m.field}</span>
                  <span className="v2mom-method__aim">{m.aim}</span>
                  <span className="v2mom-method__desc">{m.description}</span>
                </a>
              </li>
            )
          })}
        </ul>
        <div className="v2mom-principles">
          <h3>横断する行動原則</h3>
          <ol>
            {principles.map((p, i) => (
              <li key={p.title} className="v2mom-principle">
                <span className="v2mom-principle__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="v2mom-principle__text">
                  <span className="v2mom-principle__title">{p.title}</span>
                  <strong className="v2mom-principle__lead">{p.lead}</strong>
                  <span className="v2mom-principle__body">{p.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="v2mom-process">
            <strong>実行プロセス</strong>
            <span>
              {process.map((step, i) => (
                <span key={step}>
                  {i > 0 && <span aria-hidden="true"> → </span>}
                  {step}
                </span>
              ))}
            </span>
          </p>
        </div>
      </Section>

      <Section id="obstacles" tone="surface" width="narrow" labelledBy="obstacles-h">
        <SectionHeading
          id="obstacles-h"
          kicker="Obstacles"
          title="向き合う障壁"
          lead="調査の結果に応じて、内容を更新していきます。"
        />
        <dl className="v2mom-obstacles">
          {obstacles.map(o => (
            <div key={o.name}>
              <dt>{o.name}</dt>
              <dd>{o.response}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="measures" width="narrow" labelledBy="measures-h">
        <SectionHeading id="measures-h" kicker="Measures" title="成果の測り方" />
        <h3 className="v2mom-h3">3層で測定する</h3>
        <dl className="v2mom-layers">
          {measureLayers.map(l => (
            <div key={l.name}>
              <dt lang="en">{l.name}</dt>
              <dd>{l.body}</dd>
            </div>
          ))}
        </dl>

        <h3 className="v2mom-h3">
          初年度の暫定活動目標
          <span className="v2mom-h3__note">（{measuresPeriod}）</span>
        </h3>
        <div className="table-scroll">
          <table className="v2mom-measures">
            <caption className="visually-hidden">初年度の暫定活動目標と実績</caption>
            <thead>
              <tr>
                <th scope="col">指標</th>
                <th scope="col">仮目標（目標案・未確定）</th>
                <th scope="col">実績</th>
              </tr>
            </thead>
            <tbody>
              {measures.map(m => (
                <tr key={m.label}>
                  <th scope="row">{m.label}</th>
                  <td>{m.target}</td>
                  <td>
                    {m.actual !== null && m.countedAt ? (
                      <>
                        {m.actual}
                        <span className="v2mom-measures__date">（{formatJaDate(m.countedAt)}集計）</span>
                      </>
                    ) : (
                      <span className="v2mom-measures__pending">集計準備中</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="v2mom-note">{measuresNote}</p>

        <details className="v2mom-details">
          <summary>「市民・関係者の声の収集」の定義（暫定）</summary>
          <ul>
            {voiceDefinition.map(t => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
        <h3 className="v2mom-h3">市政運営の基本姿勢についての指標（検討中）</h3>
        <p className="v2mom-candidates-lead">
          透明性・市民参加・データ活用の成果を確かめるため、次の指標を検討しています。新しい目標値はまだ設定していません。指標の定義と計測方法を整理してから設定します。
        </p>
        <div className="table-scroll">
          <table className="v2mom-measures">
            <caption className="visually-hidden">検討中の指標</caption>
            <thead>
              <tr>
                <th scope="col">区分</th>
                <th scope="col">指標の例</th>
                <th scope="col">目標</th>
              </tr>
            </thead>
            <tbody>
              {measureCandidates.map(m => (
                <tr key={m.label}>
                  <td lang="en">{m.layer}</td>
                  <th scope="row">{m.label}</th>
                  <td>
                    <span className="v2mom-measures__pending">検討中</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="v2mom-note">
          ※議員個人の活動で実行できる指標と、市・議会全体で取り組む行政改革の成果指標は、区別して扱います。
        </p>

        <details className="v2mom-details">
          <summary>分野別の成果指標候補</summary>
          <ul>
            {fieldIndicators.map(f => (
              <li key={f.field}>
                <strong>{f.field}：</strong>
                {f.body}
              </li>
            ))}
          </ul>
        </details>
      </Section>

      <Section tone="surface" width="narrow">
        <div className="v2mom-next">
          {voiceEnabled && (
            <ButtonLink href={routeHref({ name: 'voice' })} size="lg">
              市民の声を届ける
            </ButtonLink>
          )}
          <ButtonLink href={routeHref({ name: 'research' })} variant="secondary" size="lg">
            政策調査を見る
          </ButtonLink>
          <ButtonLink href={routeHref({ name: 'activity' })} variant="secondary" size="lg">
            活動の進捗を見る
          </ButtonLink>
        </div>
        <p className="v2mom-related">
          関連：
          <a href={routeHref({ name: 'research' })}>政策調査</a>
          ／<a href={routeHref({ name: 'data' })}>数字で見る宇部</a>
          ／<a href={routeHref({ name: 'changes' })}>政策の変更履歴</a>
          {issuesEnabled && (
            <>
              ／<a href={routeHref({ name: 'issues' })}>市民の声</a>
            </>
          )}
        </p>
      </Section>
    </PageLayout>
  )
}
