import { describe, expect, it } from 'vitest'
import type { EventItem } from '../src/data/events'
import { endsAt, eventState, formatEventDate, splitEvents, startsAt } from '../src/lib/events'

const base: EventItem = { id: '2026-12-05-test', title: 'テスト', date: '2026-12-05', description: 'x' }
const at = (iso: string) => Date.parse(iso)

describe('event dates (Japan time)', () => {
  it('parses start/end as JST regardless of the device timezone', () => {
    const e = { ...base, start: '14:00', end: '15:30' }
    expect(new Date(startsAt(e)).toISOString()).toBe('2026-12-05T05:00:00.000Z')
    expect(new Date(endsAt(e)).toISOString()).toBe('2026-12-05T06:30:00.000Z')
  })

  it('without an end time, the event lasts until midnight JST', () => {
    expect(new Date(endsAt(base)).toISOString()).toBe('2026-12-05T15:00:00.000Z')
  })

  it('moves from upcoming to ongoing to ended', () => {
    const e = { ...base, start: '14:00', end: '15:30' }
    expect(eventState(e, at('2026-12-05T13:59:00+09:00'))).toBe('upcoming')
    expect(eventState(e, at('2026-12-05T14:30:00+09:00'))).toBe('ongoing')
    expect(eventState(e, at('2026-12-05T15:30:00+09:00'))).toBe('ended')
  })

  it('a day-only event is still upcoming late that evening and ended the next day', () => {
    expect(eventState(base, at('2026-12-05T23:00:00+09:00'))).toBe('upcoming')
    expect(eventState(base, at('2026-12-06T00:00:00+09:00'))).toBe('ended')
  })

  it('cancelled / postponed override the automatic state', () => {
    expect(eventState({ ...base, status: 'cancelled' }, at('2026-12-01T00:00:00+09:00'))).toBe('cancelled')
    expect(eventState({ ...base, status: 'postponed' }, at('2026-12-01T00:00:00+09:00'))).toBe('postponed')
  })

  it('splits into upcoming (soonest first) and past (newest first)', () => {
    const list: EventItem[] = [
      { ...base, id: 'a', date: '2026-12-10' },
      { ...base, id: 'b', date: '2026-12-01' },
      { ...base, id: 'c', date: '2026-11-01' },
      { ...base, id: 'd', date: '2026-10-01' },
      { ...base, id: 'e', date: '2026-12-03', status: 'cancelled' },
    ]
    const { upcoming, past } = splitEvents(list, at('2026-11-20T12:00:00+09:00'))
    expect(upcoming.map(e => e.id)).toEqual(['b', 'e', 'a'])
    expect(past.map(e => e.id)).toEqual(['c', 'd'])
  })

  it('formats the date with the weekday', () => {
    expect(formatEventDate({ ...base, start: '14:00', end: '15:30' })).toEqual({ day: '2026年12月5日（土）', time: '14:00〜15:30' })
    expect(formatEventDate({ ...base, date: '2026-11-20' }).day).toBe('2026年11月20日（金）')
  })
})
