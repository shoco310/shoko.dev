import { motion } from 'framer-motion'
import EventCard from './EventCard'
import { splitEvents } from '../lib/events'
import { listPublishedEvents } from '../lib/publicEvents'
import { useAsync } from '../lib/useAsync'
import { routeHref } from '../router'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

/** Top page: up to three upcoming events. Not rendered when nothing is planned. */
export default function UpcomingEventsSection() {
  const { data } = useAsync(listPublishedEvents, [])
  const { upcoming } = splitEvents(data ?? [])
  if (upcoming.length === 0) return null
  return (
    <section id="events" className="section upcoming-events">
      <div className="container container--narrow">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={fadeUp}>
          <div className="section-heading">
            <span className="section-heading__en">EVENTS</span>
            <h2 className="section-heading__ja">これからの活動</h2>
            <div className="section-heading__line" />
          </div>
          <div className="event-list">
            {upcoming.slice(0, 3).map(e => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
          <p className="upcoming-events__more">
            <a href={routeHref({ name: 'events' })} className="btn btn--secondary">
              活動予定をすべて見る →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
