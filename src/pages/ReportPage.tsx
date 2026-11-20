import { useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import NotFoundPage from './NotFoundPage'
import { getPublishedReport } from '../lib/publicContent'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'
import { REPORT_CATEGORY_LABELS, REPORT_KIND_LABELS } from '../shared/reports'
import '../components/ActivitySection.css'

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/** One activity report written on this site (#/reports/<slug>). */
export default function ReportPage({ slug }: { slug: string }) {
  const { data, error, loading } = useAsync(() => getPublishedReport(slug), [slug])
  const missing = !loading && !error && !data
  useEffect(() => {
    if (data) document.title = `${data.title} | さとうしょうこ`
    else if (missing) document.title = 'ページが見つかりません | さとうしょうこ'
  }, [data, missing])

  if (loading) return <PageLayout en="REPORT" title="活動報告"><p className="page__muted">読み込んでいます…</p></PageLayout>
  if (error) return <PageLayout en="REPORT" title="活動報告"><p className="page__muted">活動報告を読み込めませんでした。</p></PageLayout>
  if (!data) return <NotFoundPage />

  return (
    <PageLayout en="REPORT" title={data.title}>
      <p className="page__more issue-back">
        <a href={routeHref({ name: 'activity' })}>← これまでの活動へ</a>
      </p>
      <p className="report-meta">
        {data.category && <span className="activity-row__category">{REPORT_CATEGORY_LABELS[data.category]}</span>}
        <span className={`badge badge--${data.kind}`}>{REPORT_KIND_LABELS[data.kind]}</span>
        <time dateTime={data.report_date}>{formatDate(data.report_date)}</time>
      </p>
      {data.photo_url && (
        <figure className="report-photo">
          <img src={data.photo_url} alt={data.photo_alt || ''} />
          {data.photo_alt && <figcaption>{data.photo_alt}</figcaption>}
        </figure>
      )}
      <p className="report-summary">{data.summary}</p>
      {data.body && <div className="report-body">{data.body}</div>}
      {data.external_url && (
        <p className="page__more">
          <a href={data.external_url} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
            元の投稿を見る →<span className="visually-hidden">（新しいタブで開きます）</span>
          </a>
        </p>
      )}
      {data.event && (
        <p className="report-event">
          このイベントの記録です：
          <a href={routeHref({ name: 'event', slug: data.event.slug })}>{data.event.title} →</a>
        </p>
      )}
      <p className="page__more">
        <a href={routeHref({ name: 'events' })}>イベント・活動予定を見る →</a>
      </p>
    </PageLayout>
  )
}
