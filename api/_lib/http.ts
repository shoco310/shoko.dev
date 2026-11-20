import { createHmac } from 'node:crypto'

/**
 * Shared request checks for the public intake endpoints (/api/submit,
 * /api/volunteer). Order used by both: method → same-origin → size → JSON →
 * honeypot → validation → Turnstile → database function.
 *
 * Never log what people typed. Log error codes only.
 */
export const MAX_BYTES = 20_000

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export function fail(error: string, status: number, fields?: string[]): Response {
  return json({ ok: false, error, ...(fields ? { fields } : {}) }, status)
}

export function clientIp(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || null
  return request.headers.get('x-real-ip')
}

/**
 * The unit a rate limit applies to. IPv4: the address. IPv6: the /64
 * network, because one household or phone rotates through many addresses
 * inside its /64 (privacy extensions), so counting full addresses would make
 * the limit meaningless for IPv6 users.
 */
export function rateLimitKey(ip: string): string {
  const v4 = ip.replace(/^::ffff:/i, '')
  if (!v4.includes(':')) return v4
  const [head, tail = ''] = v4.toLowerCase().split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const missing = 8 - headParts.length - tailParts.length
  const full = v4.includes('::') ? [...headParts, ...Array(Math.max(missing, 0)).fill('0'), ...tailParts] : headParts
  return full.slice(0, 4).map(p => p.replace(/^0+(?=.)/, '')).join(':') + '::/64'
}

/** Salted HMAC of the rate-limit key. The raw IP is never stored. */
export function hashIp(ip: string | null, salt: string): string | null {
  if (!ip) return null
  return createHmac('sha256', salt).update(rateLimitKey(ip)).digest('hex')
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * Runs the checks every intake endpoint shares, up to (not including) field
 * validation. Returns the parsed JSON object, or the error Response to send.
 */
export async function readIntake(
  request: Request,
  log: (code: string) => void,
): Promise<{ raw: Record<string, unknown> } | { response: Response }> {
  if (request.method !== 'POST') {
    return { response: new Response(null, { status: 405, headers: { allow: 'POST' } }) }
  }
  if (!isSameOrigin(request)) return { response: fail('forbidden_origin', 403) }

  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > MAX_BYTES) return { response: fail('too_large', 413) }

  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BYTES) return { response: fail('too_large', 413) }
    raw = JSON.parse(text)
  } catch {
    return { response: fail('invalid', 400) }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { response: fail('invalid', 400) }

  // Honeypot: a field humans never see. Bots that fill it get a plain error.
  const r = raw as Record<string, unknown>
  if (typeof r.website === 'string' && r.website.trim() !== '') {
    log('honeypot')
    return { response: fail('invalid', 400) }
  }
  return { raw: r }
}

export async function checkTurnstile(
  raw: Record<string, unknown>,
  secret: string,
  verify: (token: string, secret: string) => Promise<boolean>,
): Promise<boolean> {
  const token = typeof raw.turnstileToken === 'string' ? raw.turnstileToken : ''
  return !!token && (await verify(token, secret))
}

/** Map the error codes raised by the database intake functions. */
export function dbErrorResponse(error: string | undefined, log: (code: string) => void): Response {
  if (error === 'rate_limited') return fail('rate_limited', 429)
  if (error === 'busy') return fail('busy', 503)
  if (error === 'duplicate') return fail('duplicate', 409)
  if (error === 'invalid_email') return fail('invalid', 400, ['email'])
  log(`db_error:${error ?? 'unknown'}`)
  return fail('server_error', 500)
}

export const KNOWN_DB_ERRORS = ['rate_limited', 'busy', 'duplicate', 'invalid_email']

export async function verifyTurnstileWithCloudflare(token: string, secret: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token })
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}
