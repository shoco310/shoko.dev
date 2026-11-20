/**
 * Google Analytics (GA4), loaded from code instead of index.html so it never
 * runs on the citizen submission page. Rules:
 *  - If the visitor lands on the submission page, gtag.js is not loaded at all.
 *  - If gtag.js is already loaded and the visitor moves to the submission
 *    page, sending is switched off with GA's documented
 *    `window['ga-disable-<ID>'] = true` flag until they leave it.
 * The privacy policy (src/pages/PrivacyPage.tsx) states this behaviour.
 */
import { parseHash } from './router'

const GA_ID = 'G-5PK8VTS383'
const disableKey = `ga-disable-${GA_ID}`

type GtagWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  [key: string]: unknown
}

let loaded = false

function load() {
  const w = window as unknown as GtagWindow
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', GA_ID)
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
  loaded = true
}

/** Call on every page change with whether analytics may run on that page. */
export function setAnalyticsAllowed(allowed: boolean) {
  const w = window as unknown as GtagWindow
  w[disableKey] = !allowed
  if (allowed && !loaded) load()
}

/**
 * Start analytics for the current page and keep the on/off state in sync on
 * navigation. These listeners are registered before gtag.js loads, so they
 * run before GA's own history listener and the flag is already set when GA
 * would record a page view for the submission page.
 */
export function initAnalytics() {
  const sync = () => setAnalyticsAllowed(parseHash(window.location.hash).name !== 'voice')
  window.addEventListener('popstate', sync)
  window.addEventListener('hashchange', sync)
  sync()
}
