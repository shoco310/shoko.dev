import { useEffect } from 'react'
import PageLayout, { PageSection } from '../components/PageLayout'
import NotFoundPage from './NotFoundPage'
import { formatDate, policyName } from '../components/IssueCard'
import { voiceEnabled } from '../data/features'
import { getPublishedIssue } from '../lib/publicIssues'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'
import { PROGRESS_OPTIONS, progressLabel } from '../shared/issues'

export default function IssueDetailPage({ id }: { id: number }) {
  const { data, error, loading } = useAsync(() => getPublishedIssue(id), [id])
  const title = data?.issue?.title
  const missing = !loading && !error && !data?.issue
  useEffect(() => {
    if (title) document.title = `${title} | さとうしょうこ`
    else if (missing) document.title = 'ページが見つかりません | さとうしょうこ'
  }, [title, missing])

  if (loading) {
    return (
      <PageLayout en="ISSUE" title="課題">
        <p className="page__muted" aria-live="polite">読み込んでいます…</p>
      </PageLayout>
    )
  }
  if (error) {
    return (
      <PageLayout en="ISSUE" title="課題">
        <p className="page__muted">課題を読み込めませんでした。時間をおいて、もう一度お試しください。</p>
      </PageLayout>
    )
  }
  if (!data?.issue) return <NotFoundPage />

  const { issue, updates } = data
  const currentIndex = PROGRESS_OPTIONS.findIndex(o => o.value === issue.progress)

  return (
    <PageLayout en={`ISSUE #${issue.id}`} title={issue.title}>
      <p className="page__more issue-back">
        <a href={routeHref({ name: 'issues' })}>← 課題の一覧へ</a>
      </p>

      <ol className="issue-steps" aria-label={`取り組みの状況：${progressLabel(issue.progress)}`}>
        {PROGRESS_OPTIONS.map((o, i) => (
          <li
            key={o.value}
            className={`issue-steps__item${i < currentIndex ? ' is-done' : ''}${i === currentIndex ? ' is-current' : ''}`}
            aria-current={i === currentIndex ? 'step' : undefined}
          >
            {o.short}
          </li>
        ))}
      </ol>

      <PageSection title="寄せられた声の要約">
        <p className="issue-summary">{issue.summary}</p>
        <dl className="info-list">
          <div>
            <dt>テーマ</dt>
            <dd>{issue.themes.length ? issue.themes.join('、') : '—'}</dd>
          </div>
          <div>
            <dt>寄せられた声</dt>
            <dd>{issue.voice_count}件</dd>
          </div>
          <div>
            <dt>公開日</dt>
            <dd>{formatDate(issue.published_at)}</dd>
          </div>
        </dl>
      </PageSection>

      <PageSection title="関連する政策">
        {issue.issue_policy_links.length === 0 ? (
          <p>まだ政策に結びついていない課題です。調査や意見交換を通じて、政策の見直しにつなげるかを検討します。</p>
        ) : (
          <ul className="issue-policies">
            {issue.issue_policy_links.map(l => (
              <li key={l.policy_slug}>
                <a href={routeHref({ name: 'policy', slug: l.policy_slug })}>{policyName(l.policy_slug)} →</a>
                {l.note && <span>{l.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <PageSection title="これまでの経過">
        {updates.length === 0 ? (
          <p>経過は、取り組みが進みしだい、ここでお知らせします。</p>
        ) : (
          <ol className="changelog">
            {updates.map(u => (
              <li key={u.id} className="changelog__item">
                <time className="changelog__date" dateTime={u.published_at}>
                  {formatDate(u.published_at)}
                </time>
                <div className="changelog__body">
                  <p className="changelog__summary issue-update">{u.body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </PageSection>

      <div className="policy-detail__note page__notice">
        <p>
          この課題は、寄せられた声をもとに、個人が特定できないよう運営者の佐藤祥子が要約したものです。原文は公開していません。
        </p>
        {voiceEnabled && (
          <p>
            <a href={routeHref({ name: 'voice' })}>同じような困りごとや、ご意見を送る →</a>
          </p>
        )}
      </div>
    </PageLayout>
  )
}
