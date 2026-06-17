import { motion } from 'framer-motion'
import { activities, type Activity, type ActivityType } from '../data/activity'

const TYPE_LABELS: Record<ActivityType, string> = {
  note: 'note',
  instagram: 'Instagram',
  event: 'イベント',
  report: '活動報告',
}

const TYPE_ICONS: Record<ActivityType, string> = {
  note: '📝',
  instagram: '📷',
  event: '📅',
  report: '📋',
}

const TYPE_LINKS: Record<ActivityType, string> = {
  note: '記事を読む',
  instagram: '投稿を見る',
  event: '詳細を見る',
  report: '詳しく見る',
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function ActivityCard({ item }: { item: Activity }) {
  const isExternal = item.url !== '#'
  return (
    <motion.article
      className="activity-card"
      variants={fadeUp}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="activity-card__thumb">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} loading="lazy" />
        ) : (
          <span className="activity-card__thumb-icon" aria-hidden="true">
            {TYPE_ICONS[item.type]}
          </span>
        )}
      </div>

      <div className="activity-card__body">
        <div className="activity-card__meta">
          <span className={`badge badge--${item.type}`}>{TYPE_LABELS[item.type]}</span>
          <time className="activity-card__date" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
        </div>

        <h3 className="activity-card__title">{item.title}</h3>
        <p className="activity-card__desc">{item.description}</p>

        <a
          href={item.url}
          className="activity-card__link"
          {...(isExternal
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {TYPE_LINKS[item.type]}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </motion.article>
  )
}

export default function ActivitySection() {
  return (
    <section id="activity" className="section section--beige">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <span className="section-heading__en">ACTIVITY</span>
            <h2 className="section-heading__ja">最新の活動</h2>
            <div className="section-heading__line" />
          </motion.div>

          <motion.div className="activity-grid" variants={stagger}>
            {activities.map(item => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </motion.div>

          <motion.div className="activity-more" variants={fadeUp}>
            <a
              href="https://www.instagram.com/shoko_sato_ube/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary"
            >
              Instagramでもっとみる →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
