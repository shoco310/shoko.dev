/**
 * Anonymous, read-only Supabase client for the public site. supabase-js is
 * loaded lazily so pages that don't need it stay light, and no session is
 * ever stored: visitors are always anonymous and RLS shows only published,
 * public columns.
 */
async function createPublicClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('not_configured')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

type Client = Awaited<ReturnType<typeof createPublicClient>>
let clientPromise: Promise<Client> | null = null

export function publicClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = createPublicClient().catch(e => {
      clientPromise = null
      throw e
    })
  }
  return clientPromise
}
