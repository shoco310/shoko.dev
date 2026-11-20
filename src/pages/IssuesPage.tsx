import { useMemo, useState } from 'react'
import PageLayout from '../components/PageLayout'
import IssueCard from '../components/IssueCard'
import { policies } from '../data/policy'
import { voiceEnabled } from '../data/features'
import { listPublishedIssues } from '../lib/publicIssues'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'
import { ISSUE_THEMES, PROGRESS_OPTIONS } from '../shared/issues'

export default function IssuesPage() {
  const { data, error, loading } = useAsync(listPublishedIssues, [])
  const [theme, setTheme] = useState('')
  const [progress, setProgress] = useState('')
  const [policy, setPolicy] = useState('')

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        i =>
          (!theme || i.themes.includes(theme)) &&
          (!progress || i.progress === progress) &&
          (!policy ||
            (policy === 'none'
              ? i.issue_policy_links.length === 0
              : i.issue_policy_links.some(l => l.policy_slug === policy))),
      ),
    [data, theme, progress, policy],
  )

  return (
    <PageLayout
      en="ISSUES"
      title="みんなの声から見えた課題"
      lead="寄せられた困りごとやご意見をもとに、個人が特定できないよう要約した課題と、その後の取り組みの状況を公開しています。"
    >
      <div className="issues-filters" role="group" aria-label="課題の絞り込み">
        <label>
          <span>テーマ</span>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            <option value="">すべて</option>
            {ISSUE_THEMES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>状況</span>
          <select value={progress} onChange={e => setProgress(e.target.value)}>
            <option value="">すべて</option>
            {PROGRESS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>関連する政策</span>
          <select value={policy} onChange={e => setPolicy(e.target.value)}>
            <option value="">すべて</option>
            {policies.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
            <option value="none">まだ政策に結びついていない</option>
          </select>
        </label>
      </div>

      <div aria-live="polite">
        {loading && <p className="page__muted">読み込んでいます…</p>}
        {error && <p className="page__muted">課題を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
        {!loading && !error && data && data.length === 0 && (
          <p className="page__muted">公開している課題は、まだありません。寄せられた声を確認したうえで、順次公開していきます。</p>
        )}
        {!loading && !error && data && data.length > 0 && (
          <p className="page__muted">
            {filtered.length}件{filtered.length !== data.length && `（全${data.length}件）`}
          </p>
        )}
      </div>

      <div className="issue-list">
        {filtered.map(issue => (
          <IssueCard key={issue.id} issue={issue} headingLevel={2} />
        ))}
      </div>

      <div className="policy-detail__note page__notice issues-note">
        <p>
          ここに載せている課題は、寄せられた声を運営者の佐藤祥子が読み、個人が特定できる内容を除いて要約したものです。原文は公開していません。政策の4つの分類に当てはまらない課題も、そのまま載せています。
        </p>
        {voiceEnabled && (
          <p>
            <a href={routeHref({ name: 'voice' })}>困りごと・ご意見を送る →</a>
          </p>
        )}
      </div>
    </PageLayout>
  )
}
