// Fails the build if a secret was put in a VITE_* variable. Anything named
// VITE_* is embedded in the public JavaScript bundle, so it must never hold
// the Supabase secret/service_role key, a Turnstile secret or a Resend key.
import { loadEnv } from 'vite'

// Check both the process environment (Vercel) and local .env* files.
const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const suspicious = [/^sb_secret_/, /service_role/, /^re_[A-Za-z0-9]/, /^0x4AAAA[A-Za-z0-9_-]{20,}$/]
const leaks = Object.entries(env)
  .filter(([k]) => k.startsWith('VITE_'))
  .filter(([k, v]) => {
    if (!v) return false
    if (/SECRET|SERVICE_ROLE|PRIVATE|SALT/.test(k)) return true
    if (/^ey[A-Za-z0-9_-]+\.ey/.test(v)) {
      // A JWT: allow only an anon-role key
      try {
        const payload = JSON.parse(Buffer.from(v.split('.')[1], 'base64url').toString())
        return payload.role !== 'anon'
      } catch {
        return true
      }
    }
    return suspicious.some(re => re.test(v)) && !k.endsWith('SITE_KEY')
  })
  .map(([k]) => k)

if (leaks.length) {
  console.error(`Refusing to build: these VITE_* variables look like secrets: ${leaks.join(', ')}`)
  process.exit(1)
}
