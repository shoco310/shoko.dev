/**
 * Data checks for hand-edited content in the repository. Runs in `npm test`
 * and before every production build (package.json "build"), so a malformed
 * changelog entry stops the deploy instead of breaking the site. (Events now
 * live in the database and are validated by its constraints and the form.)
 */
import { describe, expect, it } from 'vitest'
import { policies } from '../src/data/policy'

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const validDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00+09:00`)) &&
  new Date(`${s}T00:00:00Z`).toISOString().startsWith(s)

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
