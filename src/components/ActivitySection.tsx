import { motion } from 'framer-motion'
import { REPORT_KIND_LABELS, reportHref, type ReportKind, type ReportRow } from '../shared/reports'

const TYPE_LABELS = REPORT_KIND_LABELS

const TYPE_ICONS: Record<ReportKind, string> = {
  note: '📝',
  instagram: '📷',
  event: '📅',
  report: '📋',
}

const TYPE_LINKS: Record<ReportKind, string> = {
  note: '記事を読む',
  instagram: '投稿を見る',
  event: '詳細を見る',
  report: '詳しく見る',
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}


function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function ActivityCard({ item }: { item: ReportRow }) {
  const href = reportHref(item)
  const isExternal = href.startsWith('https://')
  const type = item.kind
  return (
    <motion.article
      className="activity-card"
      variants={fadeUp}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="activity-card__thumb">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.photo_alt || item.title} loading="lazy" />
        ) : (
          <span className="activity-card__thumb-icon" aria-hidden="true">
            {TYPE_ICONS[type]}
          </span>
        )}
      </div>

      <div className="activity-card__body">
        <div className="activity-card__meta">
          <span className={`badge badge--${type}`}>{TYPE_LABELS[type]}</span>
          <time className="activity-card__date" dateTime={item.report_date}>
            {formatDate(item.report_date)}
          </time>
        </div>

        <h3 className="activity-card__title">{item.title}</h3>
        <p className="activity-card__desc">{item.summary}</p>

        <a
          href={href}
          className="activity-card__link"
          {...(isExternal
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {TYPE_LINKS[type]}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </motion.article>
  )
}
