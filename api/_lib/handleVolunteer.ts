import {
  VOLUNTEER_PRIVACY_VERSION,
  normalisePhone,
  parseVolunteerInput,
  validateVolunteer,
} from '../../src/shared/volunteer.js'
import { checkTurnstile, clientIp, dbErrorResponse, fail, hashIp, json, readIntake } from './http.js'

/**
 * POST /api/volunteer — volunteer sign-up for さとうしょうこ後援会.
 * Same checks as /api/submit; stored in a separate table by
 * register_volunteer(). Nothing about the sign-up is logged except codes.
 */
export interface VolunteerDeps {
  turnstileSecret: string
  ipHashSalt: string
  verifyTurnstile: (token: string, secret: string) => Promise<boolean>
  callRegister: (args: Record<string, unknown>) => Promise<{ ok?: boolean; error?: string }>
  log?: (code: string) => void
}

export async function handleVolunteer(request: Request, deps: VolunteerDeps): Promise<Response> {
  const log = deps.log ?? (() => {})
  const read = await readIntake(request, log)
  if ('response' in read) return read.response

  const input = parseVolunteerInput(read.raw)
  if (!input) return fail('invalid', 400)
  const errors = validateVolunteer(input)
  if (Object.keys(errors).length > 0) return fail('invalid', 400, Object.keys(errors))

  if (!(await checkTurnstile(read.raw, deps.turnstileSecret, deps.verifyTurnstile))) {
    log('turnstile_failed')
    return fail('turnstile_failed', 403)
  }

  const result = await deps.callRegister({
    p_name: input.name.trim(),
    p_email: input.email.trim(),
    p_frequency: input.frequency,
    p_adult: input.adult === 'yes',
    p_privacy_version: VOLUNTEER_PRIVACY_VERSION,
    p_ip_hash: hashIp(clientIp(request), deps.ipHashSalt),
    p_phone: normalisePhone(input.phone) || null,
    p_area: input.area.trim() || null,
    p_interests: input.interests,
    p_skills: input.skills.trim() || null,
    p_message: input.message.trim() || null,
    p_association_info: input.associationInfo,
  })

  if (result.ok) return json({ ok: true }, 200)
  return dbErrorResponse(result.error, log)
}
