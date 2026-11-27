import { useEffect, useState } from 'react'

/**
 * Minimal path-based router — no router dependency.
 *
 * Route URLs look like '/policy/education'. On the top page a plain hash
 * ('/#policy') is an in-page anchor and resolves to { name: 'home', anchor }.
 *
 * Until 2026-11 the site used hash URLs ('#/policy/education'). Those links
 * are still shared on SNS, so any '#/…' hash is rewritten to its path with
 * history.replaceState (no reload, no extra history entry); see
 * upgradeLegacyHash().
 *
 * All links to routes must be built with `routeHref()`. Clicks on them are
 * handled by installLinkInterceptor(), which calls navigate() instead of
 * loading the page again. Which paths exist on the server is listed in the
 * rewrites of vercel.json; keep the two in sync.
 */
export type Route =
  | { name: 'home'; anchor: string | null }
  | { name: 'profile' }
  | { name: 'vision' }
  | { name: 'policies' }
  | { name: 'research' }
  | { name: 'policy'; slug: string }
  | { name: 'data' }
  | { name: 'activity' }
  | { name: 'about' }
  | { name: 'privacy' }
  | { name: 'voice' }
  | { name: 'join' }
  | { name: 'issues' }
  | { name: 'changes' }
  | { name: 'events' }
  | { name: 'report'; slug: string }
  | { name: 'event'; slug: string }
  | { name: 'issue'; id: number }
  | { name: 'notFound' }

/** Route for a path and hash: parseLocation('/policy/education', ''). */
export function parseLocation(pathname: string, hash = ''): Route {
  if (hash.startsWith('#/')) return parsePath(legacyHashToPath(hash))
  const route = parsePath(pathname)
  if (route.name === 'home') {
    const anchor = hash.length > 1 ? safeDecode(hash.slice(1)) : null
    return { name: 'home', anchor }
  }
  return route
}

/** The route for the current page. */
export function currentRoute(): Route {
  return parseLocation(window.location.pathname, window.location.hash)
}

/** Old hash URL → path: '#/policy/education?x=1' → '/policy/education?x=1'. */
export function legacyHashToPath(hash: string): string {
  return '/' + hash.replace(/^#\/+/, '')
}

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s)
  } catch {
    return null
  }
}

function parsePath(path: string): Route {
  const decoded = path
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .map(safeDecode)
  if (decoded.some(s => s === null)) return { name: 'notFound' }
  const segments = decoded as string[]

  if (segments.length === 0) return { name: 'home', anchor: null }
  if (segments.length === 1 && segments[0] === 'index.html') return { name: 'home', anchor: null }

  const [first, second, ...rest] = segments
  if (rest.length > 0) return { name: 'notFound' }

  switch (first) {
    case 'policy':
      // '/policy' alone means the policy list.
      return second ? { name: 'policy', slug: second } : { name: 'policies' }
    case 'events':
      if (!second) return { name: 'events' }
      return /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(second) ? { name: 'event', slug: second } : { name: 'notFound' }
    case 'reports':
      return second && /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(second) ? { name: 'report', slug: second } : { name: 'notFound' }
    case 'issues':
      if (!second) return { name: 'issues' }
      return /^[1-9][0-9]{0,8}$/.test(second) ? { name: 'issue', id: Number(second) } : { name: 'notFound' }
    case 'profile':
    case 'vision':
    case 'policies':
    case 'research':
    case 'changes':
    case 'data':
    case 'activity':
    case 'about':
    case 'privacy':
    case 'voice':
    case 'join':
      return second ? { name: 'notFound' } : { name: first }
    default:
      return { name: 'notFound' }
  }
}

type LinkableRoute = Exclude<Route, { name: 'notFound' }>

export function routeHref(route: LinkableRoute): string {
  switch (route.name) {
    case 'home':
      return route.anchor ? `/#${route.anchor}` : '/'
    case 'policy':
      return `/policy/${encodeURIComponent(route.slug)}`
    case 'issue':
      return `/issues/${route.id}`
    case 'report':
      return `/reports/${route.slug}`
    case 'event':
      return `/events/${route.slug}`
    default:
      return `/${route.name}`
  }
}

/**
 * Top-page anchors from before the 2026-11 renewal that may still be shared
 * on SNS, and where that content lives now. Anchors not listed here
 * (#policy, #activity, #take-part, #contact) still exist.
 */
export function legacyAnchorTarget(
  anchor: string,
  flags: { volunteerEnabled: boolean },
): { route: LinkableRoute } | { anchor: string } | null {
  switch (anchor) {
    case 'message':
    case 'profile':
      return { route: { name: 'profile' } }
    case 'support':
      return flags.volunteerEnabled ? { route: { name: 'join' } } : { anchor: 'contact' }
    case 'participate':
      return { anchor: 'take-part' }
    case 'events':
      return { anchor: 'activity' }
    default:
      return null
  }
}

/** Stable identity for a route, used to detect page changes. */
export function routeKey(route: Route): string {
  if (route.name === 'policy') return `policy:${route.slug}`
  if (route.name === 'issue') return `issue:${route.id}`
  if (route.name === 'report') return `report:${route.slug}`
  if (route.name === 'event') return `event:${route.slug}`
  return route.name
}

/** Fired on window after navigate() changes the URL. */
export const ROUTE_CHANGE = 'routechange'
/**
 * Fired on window just before navigate() changes the URL, with the new URL
 * in `detail`. Analytics uses it to switch itself off before GA records a
 * page view for a form page.
 */
export const ROUTE_WILL_CHANGE = 'routewillchange'

/** Go to a path on this site without reloading the page. */
export function navigate(href: string, { replace = false } = {}) {
  const url = new URL(href, window.location.href)
  window.dispatchEvent(new CustomEvent(ROUTE_WILL_CHANGE, { detail: url }))
  const target = url.pathname + url.search + url.hash
  if (replace) history.replaceState(null, '', target)
  else history.pushState(null, '', target)
  window.dispatchEvent(new Event(ROUTE_CHANGE))
}

/** If the URL is an old '#/…' one, replace it with its path. */
export function upgradeLegacyHash() {
  const { hash } = window.location
  if (hash.startsWith('#/')) navigate(legacyHashToPath(hash), { replace: true })
}

/** Paths served as files, not pages: the browser loads these as usual. */
const NOT_PAGES = /^\/(admin|api|assets|images)(\/|\.|$)|\.[a-z0-9]+$/i

/**
 * Handle clicks on links to pages of this site with navigate(). Links that
 * open a new tab, downloads, modified clicks, other sites and files are
 * left to the browser, as are in-page anchors ('#vision') on the same page.
 */
export function installLinkInterceptor() {
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element | null)?.closest?.('a')
    if (!a || !a.href || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
    const url = new URL(a.href)
    if (url.origin !== window.location.origin || NOT_PAGES.test(url.pathname)) return
    const samePage = url.pathname === window.location.pathname && url.search === window.location.search
    if (samePage && url.hash && !url.hash.startsWith('#/')) return
    e.preventDefault()
    if (samePage && !url.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    navigate(url.hash.startsWith('#/') ? legacyHashToPath(url.hash) : url.href)
  })
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute)

  useEffect(() => {
    const update = () => {
      // A '#/…' link inside report text, followed by the browser.
      if (window.location.hash.startsWith('#/')) return upgradeLegacyHash()
      setRoute(currentRoute())
    }
    window.addEventListener(ROUTE_CHANGE, update)
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    // Child components' effects run first and may already have navigated.
    update()
    return () => {
      window.removeEventListener(ROUTE_CHANGE, update)
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])

  return route
}
