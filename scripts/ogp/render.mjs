// Renders scripts/ogp/template.html to a 1200x630 JPEG with local Chrome.
//   node scripts/ogp/render.mjs                       -> public/images/ogp.jpg (top page)
//   node scripts/ogp/render.mjs out.jpg kicker=… title=… sub=…   (page-specific, for later)
// Requires playwright-core and Google Chrome on this machine (not run in CI).
import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const [out = 'public/images/ogp.jpg', ...pairs] = process.argv.slice(2)
const params = new URLSearchParams(pairs.map(p => p.split(/=(.*)/s).slice(0, 2)))
const url = pathToFileURL(resolve('scripts/ogp/template.html')).href + (pairs.length ? `?${params}` : '')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: out, type: 'jpeg', quality: 90 })
await browser.close()
console.log(`wrote ${out}`)
