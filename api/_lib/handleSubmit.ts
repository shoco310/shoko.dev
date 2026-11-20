import { createHmac } from 'node:crypto'
import {
  PRIVACY_VERSION,
  parseVoiceInput,
  validateVoice,
  type SubmitErrorCode,
  type SubmitResponse,
} from '../../src/shared/voice'

/**
 * POST /api/submit — the only way a citizen submission reaches the database.
 *
 * Order of checks: same-origin → size → JSON shape → honeypot → field
 * validation → Turnstile → DB (rate limit + insert inside submit_voice()).
 *
 * Never log the submission body or contact details. Errors are logged with
 * a code only.
 */
export interface SubmitDeps {
  turnstileSecret: string
  ipHashSalt: string
  verifyTurnstile: (token: string, secret: string) => Promise<boolean>
  callSubmitVoice: (args: Record<string, unknown>) => Promise<{ receipt?: string; error?: string }>
  log?: (code: string) => void
}

const MAX_BYTES = 20_000

function json(body: SubmitResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function fail(error: SubmitErrorCode, status: number, fields?: string[]) {
  return json({ ok: false, error, ...(fields ? { fields } : {}) }, status)
}

export function clientIp(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || null
  return request.headers.get('x-real-ip')
}

export function hashIp(ip: string | null, salt: string): string | null {
  if (!ip) return null
  return createHmac('sha256', salt).update(ip).digest('hex')
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function handleSubmit(request: Request, deps: SubmitDeps): Promise<Response> {
  const log = deps.log ?? (() => {})

  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'POST' } })
  }
  if (!isSameOrigin(request)) return fail('forbidden_origin', 403)

  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > MAX_BYTES) return fail('too_large', 413)

  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BYTES) return fail('too_large', 413)
    raw = JSON.parse(text)
  } catch {
    return fail('invalid', 400)
  }

  const input = parseVoiceInput(raw)
  if (!input) return fail('invalid', 400)

  // Honeypot: a field humans never see. Bots that fill it get a plain error.
  const r = raw as Record<string, unknown>
  if (typeof r.website === 'string' && r.website.trim() !== '') {
    log('honeypot')
    return fail('invalid', 400)
  }

  const errors = validateVoice(input)
  if (Object.keys(errors).length > 0) return fail('invalid', 400, Object.keys(errors))

  const token = typeof r.turnstileToken === 'string' ? r.turnstileToken : ''
  if (!token || !(await deps.verifyTurnstile(token, deps.turnstileSecret))) {
    log('turnstile_failed')
    return fail('turnstile_failed', 403)
  }

  const email = input.email.trim()
  const result = await deps.callSubmitVoice({
    p_body: input.body.trim(),
    p_privacy_version: PRIVACY_VERSION,
    p_ip_hash: hashIp(clientIp(request), deps.ipHashSalt),
    p_theme_hints: input.themeHints,
    p_area_hint: input.areaHint.trim() || null,
    p_age_range: input.ageRange || null,
    p_name: input.name.trim() || null,
    p_email: email || null,
    p_reply_ok: input.replyOk && !!email,
  })

  if (result.receipt) return json({ ok: true, receiptNo: result.receipt }, 200)
  if (result.error === 'rate_limited') return fail('rate_limited', 429)
  if (result.error === 'invalid_email') return fail('invalid', 400, ['email'])
  log(`db_error:${result.error ?? 'unknown'}`)
  return fail('server_error', 500)
}

export async function verifyTurnstileWithCloudflare(token: string, secret: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token })
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}
