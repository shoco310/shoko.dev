import { PRIVACY_VERSION, parseVoiceInput, validateVoice } from '../../src/shared/voice.js'
import { checkTurnstile, clientIp, dbErrorResponse, fail, hashIp, json, readIntake } from './http.js'

export { clientIp, hashIp, rateLimitKey, verifyTurnstileWithCloudflare } from './http.js'

/**
 * POST /api/submit — the only way a citizen submission reaches the database.
 * Shared checks live in ./http.ts; the database enforces rate limits.
 */
export interface SubmitDeps {
  turnstileSecret: string
  ipHashSalt: string
  verifyTurnstile: (token: string, secret: string) => Promise<boolean>
  callSubmitVoice: (args: Record<string, unknown>) => Promise<{ receipt?: string; error?: string }>
  log?: (code: string) => void
}

export async function handleSubmit(request: Request, deps: SubmitDeps): Promise<Response> {
  const log = deps.log ?? (() => {})
  const read = await readIntake(request, log)
  if ('response' in read) return read.response

  const input = parseVoiceInput(read.raw)
  if (!input) return fail('invalid', 400)
  const errors = validateVoice(input)
  if (Object.keys(errors).length > 0) return fail('invalid', 400, Object.keys(errors))

  if (!(await checkTurnstile(read.raw, deps.turnstileSecret, deps.verifyTurnstile))) {
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
  return dbErrorResponse(result.error, log)
}
