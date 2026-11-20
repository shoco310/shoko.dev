/**
 * Rules for citizen submissions, shared by the form (src/pages/VoicePage)
 * and the server (api/submit.ts). The server always re-validates; the form
 * uses the same rules only to give early feedback.
 *
 * Must stay in sync with the CHECK constraints in
 * supabase/migrations/*_submissions.sql.
 *
 * Imported by the Vercel Function at runtime as native Node ESM, so relative
 * imports here (and in api/) must keep their explicit '.js' extension.
 */
import { privacyPolicyDate } from '../data/site.js'

export const BODY_MAX = 4000
export const AREA_MAX = 50
export const NAME_MAX = 100
export const EMAIL_MAX = 254

/** Optional "close to" themes. Deliberately NOT the four policy areas. */
export const THEME_OPTIONS = [
  '子育て',
  '学校・教育',
  '仕事・働き方',
  '医療・介護・福祉',
  '交通・移動',
  'まちづくり・暮らし',
  '行政の手続き・情報',
  'その他・わからない',
] as const

export const AGE_OPTIONS = [
  { value: 'teens', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s', label: '60代' },
  { value: '70plus', label: '70代以上' },
  { value: 'no_answer', label: '答えない' },
] as const

export type AgeRange = (typeof AGE_OPTIONS)[number]['value']

/** Version of the privacy policy the sender agreed to (recorded with each submission). */
export const PRIVACY_VERSION = privacyPolicyDate

export interface VoiceInput {
  body: string
  themeHints: string[]
  areaHint: string
  ageRange: AgeRange | ''
  name: string
  email: string
  replyOk: boolean
  agreed: boolean
}

export type VoiceField = keyof VoiceInput

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Returns a message per invalid field (Japanese, shown to the sender). */
export function validateVoice(v: VoiceInput): Partial<Record<VoiceField, string>> {
  const errors: Partial<Record<VoiceField, string>> = {}
  const body = v.body.trim()
  if (!body) errors.body = '困りごと・ご意見を入力してください。'
  else if (body.length > BODY_MAX) errors.body = `${BODY_MAX}文字以内で入力してください（現在${body.length}文字）。`

  if (v.themeHints.some(t => !(THEME_OPTIONS as readonly string[]).includes(t))) {
    errors.themeHints = 'テーマの選択が正しくありません。'
  }
  if (v.areaHint.trim().length > AREA_MAX) errors.areaHint = `${AREA_MAX}文字以内で入力してください。`
  if (v.ageRange && !AGE_OPTIONS.some(a => a.value === v.ageRange)) errors.ageRange = '年代の選択が正しくありません。'
  if (v.name.trim().length > NAME_MAX) errors.name = `${NAME_MAX}文字以内で入力してください。`

  const email = v.email.trim()
  if (email.length > EMAIL_MAX || (email && !EMAIL_RE.test(email))) {
    errors.email = 'メールアドレスの形式を確認してください。'
  }
  if (v.replyOk && !email) errors.replyOk = '返信を希望する場合は、メールアドレスを入力してください。'
  if (!v.agreed) errors.agreed = 'プライバシーポリシーへの同意が必要です。'
  return errors
}

/** Parse an untrusted JSON body into VoiceInput, coercing types defensively. */
export function parseVoiceInput(raw: unknown): VoiceInput | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const str = (x: unknown) => (typeof x === 'string' ? x : '')
  return {
    body: str(r.body),
    themeHints: Array.isArray(r.themeHints) ? r.themeHints.filter((t): t is string => typeof t === 'string').slice(0, 10) : [],
    areaHint: str(r.areaHint),
    ageRange: str(r.ageRange) as AgeRange | '',
    name: str(r.name),
    email: str(r.email),
    replyOk: r.replyOk === true,
    agreed: r.agreed === true,
  }
}

/** Error codes returned by POST /api/submit */
export type SubmitErrorCode =
  | 'invalid'
  | 'turnstile_failed'
  | 'rate_limited'
  | 'duplicate'
  | 'busy'
  | 'forbidden_origin'
  | 'too_large'
  | 'unavailable'
  | 'server_error'

export type SubmitResponse = { ok: true; receiptNo: string } | { ok: false; error: SubmitErrorCode; fields?: string[] }
