/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  /** 'true' only where the submission feature is switched on (local, preview; production after launch) */
  readonly VITE_VOICE_ENABLED?: string
  /** 'true' where the volunteer sign-up page (/join) is switched on */
  readonly VITE_VOLUNTEER_ENABLED?: string
  /** 'true' where public issues (/issues) are switched on */
  readonly VITE_ISSUES_ENABLED?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
