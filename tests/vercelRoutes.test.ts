import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseLocation, routeHref } from '../src/router'
import { policies } from '../src/data/policy'

/** vercel.json rewrite sources as regular expressions ('/policy/:slug(a|b)' → /^\/policy\/(a|b)$/). */
const rewrites: RegExp[] = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).rewrites.map(
  (r: { source: string }) => new RegExp('^' + r.source.replace(/:[a-z]+\(/g, '(') + '$'),
)
const served = (path: string) => path === '/' || rewrites.some(re => re.test(path))

describe('vercel.json serves every page the router knows', () => {
  it('serves the static pages', () => {
    for (const name of ['profile', 'vision', 'policies', 'research', 'data', 'activity', 'about', 'privacy', 'voice', 'join', 'issues', 'changes', 'events'] as const) {
      expect(served(routeHref({ name })), name).toBe(true)
    }
    expect(served('/policy')).toBe(true)
  })
  it('serves every policy page and the dynamic pages', () => {
    for (const p of policies) expect(served(routeHref({ name: 'policy', slug: p.slug })), p.slug).toBe(true)
    expect(served(routeHref({ name: 'event', slug: '2026-12-05-voice-meeting' }))).toBe(true)
    expect(served(routeHref({ name: 'report', slug: '2026-11-01-ube-matsuri' }))).toBe(true)
    expect(served(routeHref({ name: 'issue', id: 12 }))).toBe(true)
  })
  it('does not serve paths the router would not show (real 404s)', () => {
    for (const path of ['/nope', '/policy/nope', '/events/x', '/issues/0', '/vision/x']) {
      expect(served(path), path).toBe(false)
      expect(parseLocation(path).name === 'notFound' || path === '/policy/nope').toBe(true)
    }
  })
})
