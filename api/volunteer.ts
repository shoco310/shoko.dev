import { createClient } from '@supabase/supabase-js'
import { handleVolunteer } from './_lib/handleVolunteer.js'
import { KNOWN_DB_ERRORS, fail, verifyTurnstileWithCloudflare } from './_lib/http.js'

/**
 * Vercel Function: POST /api/volunteer (Node.js, hnd1).
 * Off unless VITE_VOLUNTEER_ENABLED=true. Server-only env: SUPABASE_URL,
 * SUPABASE_SECRET_KEY, TURNSTILE_SECRET_KEY, IP_HASH_SALT.
 */
export async function POST(request: Request): Promise<Response> {
  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  const ipHashSalt = process.env.IP_HASH_SALT
  if (process.env.VITE_VOLUNTEER_ENABLED !== 'true' || !url || !secretKey || !turnstileSecret || !ipHashSalt) {
    return fail('unavailable', 503)
  }

  const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })

  return handleVolunteer(request, {
    turnstileSecret,
    ipHashSalt,
    verifyTurnstile: verifyTurnstileWithCloudflare,
    callRegister: async args => {
      const { error } = await supabase.rpc('register_volunteer', args)
      if (error) return { error: KNOWN_DB_ERRORS.find(code => error.message === code) ?? error.code ?? 'unknown' }
      return { ok: true }
    },
    log: code => console.error(`[api/volunteer] ${code}`),
  })
}
