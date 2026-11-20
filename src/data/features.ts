// Browser-only flags (uses import.meta.env; do not import from api/).
/**
 * The citizen submission form is switched on per environment with
 * VITE_VOICE_ENABLED=true (local and preview first; production only after the
 * privacy policy is revised and the production database is ready).
 */
export const voiceEnabled = import.meta.env.VITE_VOICE_ENABLED === 'true'
