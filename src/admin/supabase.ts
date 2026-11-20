import { createClient } from '@supabase/supabase-js'

/**
 * Browser client for the review screen. Uses only the publishable key; what
 * staff can read or change is enforced by RLS and grants in the database
 * (staff row + TOTP-verified session required).
 *
 * The session is kept in sessionStorage so closing the tab signs out.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = !!url && !!key

export const supabase = createClient(url ?? 'http://invalid.localhost', key ?? 'missing', {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export type SubmissionStatus = 'received' | 'reviewing' | 'urgent_referral' | 'used' | 'not_published' | 'spam'

export const statusLabels: Record<SubmissionStatus, string> = {
  received: '未対応',
  reviewing: '確認中',
  urgent_referral: '緊急・窓口を案内',
  used: '政策の参考にした',
  not_published: '公開しない',
  spam: 'スパム',
}

export const statusOrder: SubmissionStatus[] = ['received', 'reviewing', 'urgent_referral', 'used', 'not_published', 'spam']

export interface Submission {
  id: string
  receipt_no: string
  body: string
  theme_hints: string[]
  area_hint: string | null
  age_range: string | null
  has_contact: boolean
  status: SubmissionStatus
  reviewer_note: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  name: string | null
  email: string | null
  reply_ok: boolean
  delete_after: string
}
