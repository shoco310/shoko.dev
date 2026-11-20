import { createClient } from '@supabase/supabase-js'
import { handleSubmit, verifyTurnstileWithCloudflare } from './_lib/handleSubmit.js'

/**
 * Vercel Function: POST /api/submit (Node.js runtime, region hnd1 via vercel.json).
 * Server-only environment variables — never prefixed with VITE_:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY, TURNSTILE_SECRET_KEY, IP_HASH_SALT
 */
export async function POST(request: Request): Promise<Response> {
  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  const ipHashSalt = process.env.IP_HASH_SALT
  if (process.env.VITE_VOICE_ENABLED !== 'true' || !url || !secretKey || !turnstileSecret || !ipHashSalt) {
    return new Response(JSON.stringify({ ok: false, error: 'unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    })
  }

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return handleSubmit(request, {
    turnstileSecret,
    ipHashSalt,
    verifyTurnstile: verifyTurnstileWithCloudflare,
    callSubmitVoice: async args => {
      const { data, error } = await supabase.rpc('submit_voice', args)
      if (error) {
        const known = ['rate_limited', 'busy', 'duplicate', 'invalid_email'].find(code => error.message === code)
        return { error: known ?? error.code ?? 'unknown' }
      }
      return { receipt: data as string }
    },
    log: code => console.error(`[api/submit] ${code}`),
  })
}
