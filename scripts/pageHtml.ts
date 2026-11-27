/**
 * Build step: one HTML file per page, each with its own <title>,
 * description, canonical URL and OGP/Twitter tags, plus sitemap.xml and
 * robots.txt. Called from vite.config.ts after the bundle is written.
 *
 * Output (served by the rewrites in vercel.json):
 *   index.html               '/' (home)
 *   p/<page>.html            '/vision', '/research', …
 *   p/policy/<slug>.html     '/policy/education', …
 *   p/app.html               '/events/<slug>', '/reports/<slug>', '/issues/<id>':
 *                            site-wide tags, no canonical or og:url, so these
 *                            pages are not mistaken for copies of the top page.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  homeMeta,
  pageTitle,
  policies,
  policyMeta,
  SITE_URL,
  staticPages,
  type StaticPageName,
} from '../src/data/pageMeta'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string | null) {
  const re = new RegExp(`\\s*<meta ${attr}="${key}" content="[^"]*" />`)
  if (!re.test(html)) throw new Error(`index.html has no <meta ${attr}="${key}">`)
  return html.replace(re, value === null ? '' : `\n    <meta ${attr}="${key}" content="${esc(value)}" />`)
}

/** index.html with this page's tags. url = null: no canonical / og:url. */
export function pageHtml(base: string, page: { title: string; description: string; url: string | null }) {
  let html = base.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
  html = setMeta(html, 'name', 'description', page.description)
  html = setMeta(html, 'property', 'og:title', page.title)
  html = setMeta(html, 'property', 'og:description', page.description)
  html = setMeta(html, 'property', 'og:url', page.url)
  html = setMeta(html, 'name', 'twitter:title', page.title)
  html = setMeta(html, 'name', 'twitter:description', page.description)
  if (page.url) html = html.replace('</head>', `  <link rel="canonical" href="${esc(page.url)}" />\n  </head>`)
  return html
}

export interface Flags {
  voice: boolean
  volunteer: boolean
  issues: boolean
}

export function writePages(outDir: string, flags: Flags) {
  const base = readFileSync(join(outDir, 'index.html'), 'utf8')
  const write = (file: string, html: string) => {
    mkdirSync(dirname(join(outDir, file)), { recursive: true })
    writeFileSync(join(outDir, file), html)
  }
  const urls: string[] = [`${SITE_URL}/`]

  write('p/app.html', pageHtml(base, { ...homeMeta, url: null }))
  write('index.html', pageHtml(base, { ...homeMeta, url: `${SITE_URL}/` }))

  for (const [name, meta] of Object.entries(staticPages) as [StaticPageName, (typeof staticPages)[StaticPageName]][]) {
    const url = `${SITE_URL}/${name}`
    write(`p/${name}.html`, pageHtml(base, { title: pageTitle(meta.title), description: meta.description, url }))
    if (!meta.flag || flags[meta.flag]) urls.push(url)
  }
  for (const policy of policies) {
    const meta = policyMeta(policy)
    const url = `${SITE_URL}/policy/${policy.slug}`
    write(`p/policy/${policy.slug}.html`, pageHtml(base, { title: pageTitle(meta.title), description: meta.description, url }))
    urls.push(url)
  }

  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(u => `  <url><loc>${esc(u)}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  )
  write(
    'robots.txt',
    `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /p/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  )
  return urls
}
