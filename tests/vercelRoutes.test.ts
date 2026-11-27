import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseLocation, routeHref } from '../src/router'
import { policies } from '../src/data/policy'
import { staticPages } from '../src/data/pageMeta'
import { pageHtml } from '../scripts/pageHtml'

type Rewrite = { source: string; destination: string }
const rewrites: Rewrite[] = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).rewrites
/** '/policy/:slug(a|b)' → /^\/policy\/(a|b)$/ */
const toRe = (source: string) => new RegExp('^' + source.replace(/:[a-z]+\(/g, '(') + '$')
const fileFor = (path: string) => (path === '/' ? '/index.html' : rewrites.find(r => toRe(r.source).test(path))?.destination)

describe('vercel.json serves every page the router knows', () => {
  it('serves each static page from its own HTML file', () => {
    for (const name of Object.keys(staticPages) as (keyof typeof staticPages)[]) {
      expect(fileFor(routeHref({ name })), name).toBe(`/p/${name}.html`)
    }
    expect(fileFor('/policy')).toBe('/p/policies.html')
  })
  it('serves every policy page from its own HTML file', () => {
    for (const p of policies) expect(fileFor(routeHref({ name: 'policy', slug: p.slug })), p.slug).toBe(`/p/policy/${p.slug}.html`)
  })
  it('serves the database pages from the shared app file', () => {
    expect(fileFor(routeHref({ name: 'event', slug: '2026-12-05-voice-meeting' }))).toBe('/p/app.html')
    expect(fileFor(routeHref({ name: 'report', slug: '2026-11-01-ube-matsuri' }))).toBe('/p/app.html')
    expect(fileFor(routeHref({ name: 'issue', id: 12 }))).toBe('/p/app.html')
  })
  it('does not serve paths the router would not show (real 404s)', () => {
    for (const path of ['/nope', '/policy/nope', '/events/x', '/issues/0', '/vision/x']) {
      expect(fileFor(path), path).toBeUndefined()
      expect(path === '/policy/nope' || parseLocation(path).name === 'notFound').toBe(true)
    }
  })
})

describe('per-page HTML', () => {
  const base = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  it('sets title, description, canonical and OGP', () => {
    const html = pageHtml(base, { title: 'A & B | さとうしょうこ', description: '説明"', url: 'https://shoko.dev/vision' })
    expect(html).toContain('<title>A &amp; B | さとうしょうこ</title>')
    expect(html).toContain('<meta name="description" content="説明&quot;" />')
    expect(html).toContain('<meta property="og:url" content="https://shoko.dev/vision" />')
    expect(html).toContain('<meta name="twitter:title" content="A &amp; B | さとうしょうこ" />')
    expect(html).toContain('<link rel="canonical" href="https://shoko.dev/vision" />')
  })
  it('leaves out canonical and og:url for the shared app file', () => {
    const html = pageHtml(base, { title: 't', description: 'd', url: null })
    expect(html).not.toContain('og:url')
    expect(html).not.toContain('canonical')
  })
  it('keeps descriptions short enough for search results', () => {
    for (const m of Object.values(staticPages)) expect(m.description.length).toBeLessThanOrEqual(130)
  })
})

describe('build output', () => {
  it.runIf(existsSync(new URL('../dist/p/app.html', import.meta.url)))('has every rewrite destination', () => {
    for (const r of rewrites) expect(existsSync(new URL('../dist' + r.destination, import.meta.url)), r.destination).toBe(true)
  })
})
