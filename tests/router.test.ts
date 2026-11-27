import { describe, expect, it } from 'vitest'
import { legacyAnchorTarget, legacyHashToPath, parseLocation, routeHref } from '../src/router'

/** Old hash URLs still resolve: '#/vision' → the vision route. */
const parseHash = (hash: string) => parseLocation('/', hash)
const parsePath = (path: string) => parseLocation(path.split('#')[0], path.includes('#') ? '#' + path.split('#')[1] : '')

describe('router', () => {
  it('keeps legacy and in-page URLs working', () => {
    expect(parseHash('')).toEqual({ name: 'home', anchor: null })
    expect(parseHash('#policy')).toEqual({ name: 'home', anchor: 'policy' })
    expect(parseHash('#/policy/education')).toEqual({ name: 'policy', slug: 'education' })
  })

  it('parses issue routes', () => {
    expect(parseHash('#/issues')).toEqual({ name: 'issues' })
    expect(parseHash('#/issues/12')).toEqual({ name: 'issue', id: 12 })
    expect(routeHref({ name: 'issue', id: 12 })).toBe('/issues/12')
  })

  it('rejects malformed issue numbers', () => {
    expect(parseHash('#/issues/0')).toEqual({ name: 'notFound' })
    expect(parseHash('#/issues/abc')).toEqual({ name: 'notFound' })
    expect(parseHash('#/issues/1/2')).toEqual({ name: 'notFound' })
  })

  it('parses every static page to itself (regression: case fall-through)', () => {
    for (const name of ['profile', 'vision', 'policies', 'research', 'data', 'activity', 'about', 'privacy', 'voice', 'join', 'changes'] as const) {
      expect(parseHash(`#/${name}`)).toEqual({ name })
      expect(parseHash(`#/${name}/x`)).toEqual({ name: 'notFound' })
    }
  })

  it('sends the bare #/policy to the policy list', () => {
    expect(parseHash('#/policy')).toEqual({ name: 'policies' })
    expect(routeHref({ name: 'policies' })).toBe('/policies')
    expect(routeHref({ name: 'vision' })).toBe('/vision')
    expect(routeHref({ name: 'profile' })).toBe('/profile')
  })

  it('parses the form pages', () => {
    expect(parseHash('#/voice')).toEqual({ name: 'voice' })
    expect(parseHash('#/join')).toEqual({ name: 'join' })
  })
})

describe('activity and events URLs', async () => {
  const { filterFromSearch, filterReports } = await import('../src/pages/ActivityPage')
  it('parses the events list and an event page', () => {
    expect(parseHash('#/events')).toEqual({ name: 'events' })
    expect(parseHash('#/events/2026-12-05-voice-meeting')).toEqual({ name: 'event', slug: '2026-12-05-voice-meeting' })
    expect(parseHash('#/events/x')).toEqual({ name: 'notFound' })
    expect(routeHref({ name: 'event', slug: '2026-12-05-voice-meeting' })).toBe('/events/2026-12-05-voice-meeting')
  })
  it('reads ?category= and sends old ?type= links to the new pages', () => {
    expect(parseHash('#/activity?category=media')).toEqual({ name: 'activity' })
    expect(filterFromSearch('?category=media')).toBe('media')
    expect(filterFromSearch('?category=x')).toBeNull()
    expect(filterFromSearch('?category=volunteer')).toBe('political')
    expect(filterFromSearch('')).toBeNull()
    expect(filterFromSearch('?type=events')).toEqual({ redirect: '/events' })
    expect(filterFromSearch('?type=research')).toEqual({ redirect: '/research' })
    expect(filterFromSearch('?type=reports')).toBeNull()
  })
  it('shows uncategorised reports under すべて only', () => {
    const list = [{ category: null }, { category: 'media' as const }, { category: 'event' as const }]
    expect(filterReports(list, 'all')).toHaveLength(3)
    expect(filterReports(list, 'media')).toEqual([{ category: 'media' }])
    expect(filterReports(list, 'political')).toEqual([])
  })
})

describe('research page links', async () => {
  const { researchHref, policyFromSearch } = await import('../src/pages/ResearchPage')
  it('links to one policy and reads it back', () => {
    expect(researchHref()).toBe('/research')
    expect(researchHref('civic')).toBe('/research?policy=civic')
    expect(parseHash('#/research?policy=civic')).toEqual({ name: 'research' })
    expect(policyFromSearch('?policy=civic')).toBe('civic')
    expect(policyFromSearch('?policy=nope')).toBeNull()
  })
})

describe('path URLs', () => {
  it('parses paths', () => {
    expect(parsePath('/')).toEqual({ name: 'home', anchor: null })
    expect(parsePath('/index.html')).toEqual({ name: 'home', anchor: null })
    expect(parsePath('/#policy')).toEqual({ name: 'home', anchor: 'policy' })
    expect(parsePath('/policy/education')).toEqual({ name: 'policy', slug: 'education' })
    expect(parsePath('/vision#methods')).toEqual({ name: 'vision' })
    expect(parsePath('/events/2026-12-05-voice-meeting')).toEqual({ name: 'event', slug: '2026-12-05-voice-meeting' })
    expect(parsePath('/issues/12')).toEqual({ name: 'issue', id: 12 })
    expect(parsePath('/nope')).toEqual({ name: 'notFound' })
    expect(parsePath('/%E0%A4%A')).toEqual({ name: 'notFound' })
  })
  it('builds paths', () => {
    expect(routeHref({ name: 'home', anchor: null })).toBe('/')
    expect(routeHref({ name: 'home', anchor: 'policy' })).toBe('/#policy')
    expect(routeHref({ name: 'policy', slug: 'education' })).toBe('/policy/education')
    expect(routeHref({ name: 'report', slug: '2026-11-01-x' })).toBe('/reports/2026-11-01-x')
  })
  it('turns old hash URLs into paths', () => {
    expect(legacyHashToPath('#/policy/education')).toBe('/policy/education')
    expect(legacyHashToPath('#/activity?category=media')).toBe('/activity?category=media')
    expect(legacyHashToPath('#/')).toBe('/')
    // A '#/…' hash wins over the path it is attached to.
    expect(parseLocation('/activity', '#/vision')).toEqual({ name: 'vision' })
  })
})
