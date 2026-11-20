/**
 * Data checks for hand-edited content. Runs in `npm test` and before every
 * production build (package.json "build"), so a typo in events.ts or a
 * malformed changelog entry stops the deploy instead of breaking the site.
 */
import { describe, expect, it } from 'vitest'
import { activities } from '../src/data/activity'
import { events } from '../src/data/events'
import { policies } from '../src/data/policy'
import { endsAt, startsAt } from '../src/lib/events'

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const validDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00+09:00`)) &&
  new Date(`${s}T00:00:00Z`).toISOString().startsWith(s)

describe('events.ts', () => {
  it('has unique ids', () => {
    const ids = events.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  for (const e of events) {
    it(`event ${e.id} is well-formed`, () => {
      expect(e.id).toMatch(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/)
      expect(validDate(e.date), `date ${e.date}`).toBe(true)
      expect(e.id.startsWith(e.date), 'id starts with the date').toBe(true)
      if (e.start) expect(e.start).toMatch(TIME)
      if (e.end) expect(e.end).toMatch(TIME)
      if (e.end && !e.start) throw new Error('end without start')
      if (e.start && e.end) expect(endsAt(e)).toBeGreaterThan(startsAt(e))
      expect(e.title.trim().length).toBeGreaterThan(0)
      expect(e.description.trim().length).toBeGreaterThan(0)
      for (const url of [e.applyUrl, e.placeUrl, e.reportUrl]) if (url) expect(url).toMatch(/^https:\/\//)
      if (e.reportActivityId) expect(activities.some(a => a.id === e.reportActivityId), 'report activity exists').toBe(true)
    })
  }
})

describe('policy changelog', () => {
  for (const p of policies) {
    it(`${p.slug}: entries are well-formed, unique and newest first`, () => {
      const log = p.changelog ?? []
      expect(new Set(log.map(c => c.id)).size).toBe(log.length)
      for (const c of log) {
        expect(validDate(c.date), `date ${c.date}`).toBe(true)
        expect(c.id.startsWith(c.date)).toBe(true)
        expect(c.summary.trim().length).toBeGreaterThan(0)
        for (const e of c.evidence ?? []) if (e.url) expect(e.url).toMatch(/^https:\/\//)
        for (const id of c.relatedIssues ?? []) expect(Number.isInteger(id) && id > 0).toBe(true)
        for (const h of c.commits ?? []) expect(h).toMatch(/^[0-9a-f]{7,40}$/)
        for (const d of c.diffs ?? []) expect(d.before && d.after && d.label).toBeTruthy()
      }
      const dates = log.map(c => c.date)
      expect([...dates].sort().reverse()).toEqual(dates)
    })
  }

  it('keeps the first published entry (history is never deleted)', () => {
    for (const p of policies) expect(p.changelog?.some(c => c.id === '2026-06-17-first-publish')).toBe(true)
  })
})
