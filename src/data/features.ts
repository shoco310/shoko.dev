// Browser-only flags (uses import.meta.env; do not import from api/).
/**
 * The citizen submission form is switched on per environment with
 * VITE_VOICE_ENABLED=true (local and preview first; production only after the
 * privacy policy is revised and the production database is ready).
 */
export const voiceEnabled = import.meta.env.VITE_VOICE_ENABLED === 'true'

/**
 * Volunteer sign-up page (/join) for さとうしょうこ後援会. Switched on per
 * environment with VITE_VOLUNTEER_ENABLED=true, independently of the
 * citizen submission form.
 */
export const volunteerEnabled = import.meta.env.VITE_VOLUNTEER_ENABLED === 'true'

/**
 * Public issues (/issues) written from citizen submissions. Switched on per
 * environment with VITE_ISSUES_ENABLED=true; needs VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY.
 */
export const issuesEnabled = import.meta.env.VITE_ISSUES_ENABLED === 'true'
