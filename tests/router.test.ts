import { describe, expect, it } from 'vitest'
import { parseHash, routeHref } from '../src/router'

describe('router', () => {
  it('keeps legacy and in-page URLs working', () => {
    expect(parseHash('')).toEqual({ name: 'home', anchor: null })
    expect(parseHash('#policy')).toEqual({ name: 'home', anchor: 'policy' })
    expect(parseHash('#/policy/education')).toEqual({ name: 'policy', slug: 'education' })
  })

  it('parses issue routes', () => {
    expect(parseHash('#/issues')).toEqual({ name: 'issues' })
    expect(parseHash('#/issues/12')).toEqual({ name: 'issue', id: 12 })
    expect(routeHref({ name: 'issue', id: 12 })).toBe('#/issues/12')
  })

  it('rejects malformed issue numbers', () => {
    expect(parseHash('#/issues/0')).toEqual({ name: 'notFound' })
    expect(parseHash('#/issues/abc')).toEqual({ name: 'notFound' })
    expect(parseHash('#/issues/1/2')).toEqual({ name: 'notFound' })
  })

  it('parses every static page to itself (regression: case fall-through)', () => {
    for (const name of ['profile', 'vision', 'policies', 'data', 'activity', 'about', 'privacy', 'voice', 'join', 'changes', 'events'] as const) {
      expect(parseHash(`#/${name}`)).toEqual({ name })
      expect(parseHash(`#/${name}/x`)).toEqual({ name: 'notFound' })
    }
  })

  it('sends the bare #/policy to the policy list', () => {
    expect(parseHash('#/policy')).toEqual({ name: 'policies' })
    expect(routeHref({ name: 'policies' })).toBe('#/policies')
    expect(routeHref({ name: 'vision' })).toBe('#/vision')
    expect(routeHref({ name: 'profile' })).toBe('#/profile')
  })

  it('parses the form pages', () => {
    expect(parseHash('#/voice')).toEqual({ name: 'voice' })
    expect(parseHash('#/join')).toEqual({ name: 'join' })
  })
})

describe('activity filter in the URL', async () => {
  const { filterFromHash } = await import('../src/pages/ActivityPage')
  it('reads ?type= and ignores unknown values', () => {
    expect(parseHash('#/activity?type=events')).toEqual({ name: 'activity' })
    expect(filterFromHash('#/activity?type=research')).toBe('research')
    expect(filterFromHash('#/activity?type=x')).toBeNull()
    expect(filterFromHash('#/activity')).toBeNull()
  })
})
