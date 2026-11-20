import { useEffect, useState } from 'react'

/**
 * Minimal hash-based router — no router dependency.
 *
 * Route URLs look like '#/policy/education'. Any hash that does NOT start
 * with '#/' (e.g. '#message', '#policy') is a plain in-page anchor on the
 * top page and resolves to { name: 'home', anchor }.
 *
 * All links to routes must be built with `routeHref()` so that the planned
 * move to path URLs (M-2 in docs/platform/hosting.md) only has to change
 * this file: parse from location.pathname, rewrite legacy '#/…' hashes with
 * history.replaceState, and make routeHref() return '/policy/…'.
 */
export type Route =
  | { name: 'home'; anchor: string | null }
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
  | { name: 'issue'; id: number }
  | { name: 'notFound' }

export function parseHash(hash: string): Route {
  if (!hash.startsWith('#/')) {
    const anchor = hash.length > 1 ? decodeURIComponent(hash.slice(1)) : null
    return { name: 'home', anchor }
  }

  const segments = hash
    .slice(2)
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .map(s => decodeURIComponent(s))

  if (segments.length === 0) return { name: 'home', anchor: null }

  const [first, second, ...rest] = segments
  if (rest.length > 0) return { name: 'notFound' }

  switch (first) {
    case 'policy':
      return second ? { name: 'policy', slug: second } : { name: 'notFound' }
    case 'issues':
      if (!second) return { name: 'issues' }
      return /^[1-9][0-9]{0,8}$/.test(second) ? { name: 'issue', id: Number(second) } : { name: 'notFound' }
    case 'changes':
    case 'events':
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
      return route.anchor ? `#${route.anchor}` : '#top'
    case 'policy':
      return `#/policy/${encodeURIComponent(route.slug)}`
    case 'issue':
      return `#/issues/${route.id}`
    default:
      return `#/${route.name}`
  }
}

/** Stable identity for a route, used to detect page changes. */
export function routeKey(route: Route): string {
  if (route.name === 'policy') return `policy:${route.slug}`
  if (route.name === 'issue') return `issue:${route.id}`
  return route.name
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
