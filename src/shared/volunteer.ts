/**
 * Rules for volunteer sign-ups (さとうしょうこ後援会), shared by the form
 * (src/pages/JoinPage) and the server (api/volunteer.ts). Must match the
 * CHECK constraints in supabase/migrations/*_volunteers.sql.
 *
 * Imported by a Vercel Function as native Node ESM: keep '.js' on relative imports.
 */
import { privacyPolicyDate } from '../data/site.js'

export const VOLUNTEER_PRIVACY_VERSION = privacyPolicyDate

export const NAME_MAX = 100
export const EMAIL_MAX = 254
export const AREA_MAX = 50
export const SKILLS_MAX = 1000
export const MESSAGE_MAX = 2000

export const INTEREST_OPTIONS = [
  { value: 'local', label: '地域活動のお手伝い' },
  { value: 'events', label: 'イベント運営' },
  { value: 'media', label: 'SNS・広報' },
  { value: 'policy', label: '政策づくり' },
] as const

export const FREQUENCY_OPTIONS = [
  { value: 'one_off', label: '単発で（都合が合うときに）' },
  { value: 'monthly', label: '月1回程度' },
  { value: 'regular', label: '定期的に' },
  { value: 'undecided', label: 'まだ決めていない' },
] as const

export type Interest = (typeof INTEREST_OPTIONS)[number]['value']
export type Frequency = (typeof FREQUENCY_OPTIONS)[number]['value']

export interface VolunteerInput {
  name: string
  email: string
  phone: string
  area: string
  interests: Interest[]
  frequency: Frequency | ''
  /** 'yes' = 18 or over. Asked only to keep any campaign-period activity lawful. */
  adult: 'yes' | 'no' | ''
  skills: string
  message: string
  associationInfo: boolean
  agreed: boolean
}

export type VolunteerField = keyof VolunteerInput

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const PHONE_RE = /^[0-9+() -]{6,20}$/

/** Normalise full-width digits/hyphens people often type on phones. */
export function normalisePhone(raw: string): string {
  return raw
    .trim()
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー−‐－―]/g, '-')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[＋]/g, '+')
    .replace(/　/g, ' ')
}

export function validateVolunteer(v: VolunteerInput): Partial<Record<VolunteerField, string>> {
  const e: Partial<Record<VolunteerField, string>> = {}
  const name = v.name.trim()
  if (!name) e.name = 'お名前を入力してください。'
  else if (name.length > NAME_MAX) e.name = `${NAME_MAX}文字以内で入力してください。`

  const email = v.email.trim()
  if (!email) e.email = 'メールアドレスを入力してください。'
  else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) e.email = 'メールアドレスの形式を確認してください。'

  const phone = normalisePhone(v.phone)
  if (phone && !PHONE_RE.test(phone)) e.phone = '電話番号は数字とハイフンで入力してください。'

  if (v.area.trim().length > AREA_MAX) e.area = `${AREA_MAX}文字以内で入力してください。`
  if (v.interests.some(i => !INTEREST_OPTIONS.some(o => o.value === i))) e.interests = '活動の選択が正しくありません。'
  if (!FREQUENCY_OPTIONS.some(o => o.value === v.frequency)) e.frequency = '参加できる頻度を選んでください。'
  if (v.adult !== 'yes' && v.adult !== 'no') e.adult = '18歳以上かどうかを選んでください。'
  if (v.skills.trim().length > SKILLS_MAX) e.skills = `${SKILLS_MAX}文字以内で入力してください。`
  if (v.message.trim().length > MESSAGE_MAX) e.message = `${MESSAGE_MAX}文字以内で入力してください。`
  if (!v.agreed) e.agreed = '個人情報の取り扱いへの同意が必要です。'
  return e
}

export function parseVolunteerInput(raw: unknown): VolunteerInput | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const str = (x: unknown) => (typeof x === 'string' ? x : '')
  return {
    name: str(r.name),
    email: str(r.email),
    phone: str(r.phone),
    area: str(r.area),
    interests: Array.isArray(r.interests)
      ? (r.interests.filter((x): x is string => typeof x === 'string').slice(0, 4) as Interest[])
      : [],
    frequency: str(r.frequency) as Frequency | '',
    adult: str(r.adult) as VolunteerInput['adult'],
    skills: str(r.skills),
    message: str(r.message),
    associationInfo: r.associationInfo === true,
    agreed: r.agreed === true,
  }
}
