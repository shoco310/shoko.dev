import { useEffect, useState } from 'react'
import { issuesEnabled } from '../data/features'
import type { PolicyChange } from '../data/policy'
import { publishedIssueIds } from '../lib/publicIssues'
import { routeHref } from '../router'

const REPO = 'https://github.com/shoco310/shoko.dev'

export function formatChangeDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/** Related issues, shown only if the operator has published them. */
function RelatedIssues({ ids }: { ids: number[] }) {
  const [visible, setVisible] = useState<number[]>([])
  useEffect(() => {
    if (!issuesEnabled || ids.length === 0) return
    let cancelled = false
    publishedIssueIds()
      .then(set => !cancelled && setVisible(ids.filter(id => set.has(id))))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ids])
  if (visible.length === 0) return null
  return (
    <div className="change__block">
      <p className="change__label">きっかけになった市民の声</p>
      <ul className="change__list">
        {visible.map(id => (
          <li key={id}>
            <a href={routeHref({ name: 'issue', id })}>課題 #{id} を見る</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * One change in the policy history: what changed, why, on what evidence,
 * which public issues led to it, and before/after wording where useful.
 */
export default function ChangeEntry({
  change,
  scope,
  headingLevel = 3,
}: {
  change: PolicyChange
  /** e.g. "4つの政策すべて" or a policy name (shown on the all-changes page) */
  scope?: string
  headingLevel?: 3 | 4
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h4'
  return (
    <li className="change" id={`change-${change.id}`}>
      <time className="change__date" dateTime={change.date}>
        {formatChangeDate(change.date)}
      </time>
      <div className="change__body">
        {scope && <p className="change__scope">対象：{scope}</p>}
        <Heading className="change__summary">{change.summary}</Heading>

        {change.reason && (
          <div className="change__block">
            <p className="change__label">変えた理由</p>
            <p>{change.reason}</p>
          </div>
        )}

        {change.evidence && change.evidence.length > 0 && (
          <div className="change__block">
            <p className="change__label">根拠にした資料・データ</p>
            <ul className="change__list">
              {change.evidence.map(e => (
                <li key={e.label}>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.label}
                      <span className="visually-hidden">（新しいタブで開きます）</span>
                    </a>
                  ) : (
                    e.label
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {change.relatedIssues && <RelatedIssues ids={change.relatedIssues} />}

        {change.diffs && change.diffs.length > 0 && (
          <details className="change__diffs">
            <summary>変更前・変更後を見る</summary>
            <dl>
              {change.diffs.map(d => (
                <div key={d.label} className="change__diff">
                  <dt>{d.label}</dt>
                  <dd>
                    <span className="change__before">
                      <span className="change__tag">変更前</span>
                      {d.before}
                    </span>
                    <span className="change__after">
                      <span className="change__tag">変更後</span>
                      {d.after}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {change.commits && change.commits.length > 0 && (
          <p className="change__commits">
            記録：
            {change.commits.map((c, i) => (
              <span key={c}>
                {i > 0 && '、'}
                <a href={`${REPO}/commit/${c}`} target="_blank" rel="noopener noreferrer">
                  {c}
                </a>
              </span>
            ))}
            （GitHub）
          </p>
        )}
      </div>
    </li>
  )
}
