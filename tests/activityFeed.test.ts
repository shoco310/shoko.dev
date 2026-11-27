import { describe, expect, it } from 'vitest'
import { activityFeed } from '../src/lib/activityFeed'
import type { EventItem } from '../src/shared/events'
import type { ReportRow } from '../src/shared/reports'

const ev = (id: string, date: string, extra: Partial<EventItem> = {}): EventItem => ({ id, title: id, date, description: 'x', ...extra })
const rep = (id: string, date: string, eventSlug?: string): ReportRow => ({
  id, slug: `${date}-${id}`, kind: 'report', title: id, report_date: date, summary: 's', body: null, photo_url: null,
  photo_alt: null, external_url: null, event_id: eventSlug ? 'uuid' : null, category: null,
  event: eventSlug ? { slug: eventSlug, title: eventSlug, event_date: date } : null,
  visibility: 'published', published_at: null, updated_at: '',
})
const now = Date.parse('2026-11-27T12:00:00+09:00')

describe('これまでの活動 feed', () => {
  it('adds ended events, newest first, as the イベント category', () => {
    const feed = activityFeed([rep('a', '2026-11-01')], [ev('2026-11-10-talk', '2026-11-10'), ev('2026-12-05-later', '2026-12-05')], now)
    expect(feed.map(i => i.key)).toEqual(['e:2026-11-10-talk', 'r:a'])
    expect(feed[0].category).toBe('event')
  })
  it('leaves out an event once a report covers it', () => {
    const feed = activityFeed([rep('a', '2026-11-11', '2026-11-10-talk')], [ev('2026-11-10-talk', '2026-11-10')], now)
    expect(feed.map(i => i.key)).toEqual(['r:a'])
    const viaLink = activityFeed([], [ev('2026-11-10-talk', '2026-11-10', { reportUrl: 'https://note.com/x' })], now)
    expect(viaLink).toEqual([])
  })
  it('leaves out cancelled and postponed events', () => {
    const feed = activityFeed([], [ev('c', '2026-11-10', { status: 'cancelled' }), ev('p', '2026-11-10', { status: 'postponed' })], now)
    expect(feed).toEqual([])
  })
})
