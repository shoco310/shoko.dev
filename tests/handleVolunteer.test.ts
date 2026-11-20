import { describe, expect, it, vi } from 'vitest'
import { handleVolunteer, type VolunteerDeps } from '../api/_lib/handleVolunteer'
import { hashIp } from '../api/_lib/http'
import { normalisePhone } from '../src/shared/volunteer'

const valid = {
  name: '山田 花子',
  email: 'hanako@example.test',
  phone: '０９０ー１２３４ー５６７８',
  area: '東岐波',
  interests: ['events', 'media'],
  frequency: 'monthly',
  adult: 'yes',
  skills: '写真撮影',
  message: '',
  associationInfo: false,
  agreed: true,
  turnstileToken: 'token',
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://shoko.dev/api/volunteer', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://shoko.dev', host: 'shoko.dev', 'x-forwarded-for': '203.0.113.9', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function deps(over: Partial<VolunteerDeps> = {}) {
  const calls: Record<string, unknown>[] = []
  const d: VolunteerDeps & { calls: typeof calls } = {
    turnstileSecret: 's',
    ipHashSalt: 'salt',
    verifyTurnstile: vi.fn(async () => true),
    callRegister: vi.fn(async args => {
      calls.push(args)
      return { ok: true }
    }),
    calls,
    ...over,
  }
  return d
}

describe('POST /api/volunteer', () => {
  it('accepts a valid sign-up and maps fields for register_volunteer', async () => {
    const d = deps()
    const res = await handleVolunteer(req(valid), d)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(d.calls[0]).toMatchObject({
      p_name: '山田 花子',
      p_email: 'hanako@example.test',
      p_phone: '090-1234-5678',
      p_area: '東岐波',
      p_interests: ['events', 'media'],
      p_frequency: 'monthly',
      p_adult: true,
      p_skills: '写真撮影',
      p_message: null,
      p_association_info: false,
      p_ip_hash: hashIp('203.0.113.9', 'salt'),
    })
  })

  it('never treats a sign-up as an association membership unless asked', async () => {
    const d = deps()
    await handleVolunteer(req({ ...valid, associationInfo: 'yes' }), d)
    expect(d.calls[0].p_association_info).toBe(false)
  })

  it('requires name, email, frequency, the age question and consent', async () => {
    const res = await handleVolunteer(req({ ...valid, name: ' ', email: 'x', frequency: '', adult: '', agreed: false }), deps())
    expect(res.status).toBe(400)
    expect((await res.json()).fields).toEqual(expect.arrayContaining(['name', 'email', 'frequency', 'adult', 'agreed']))
  })

  it('rejects unknown interests and malformed phone numbers', async () => {
    const res = await handleVolunteer(req({ ...valid, interests: ['campaign'], phone: 'call me' }), deps())
    expect((await res.json()).fields).toEqual(expect.arrayContaining(['interests', 'phone']))
  })

  it('rejects cross-origin posts, honeypot fills and failed Turnstile without touching the DB', async () => {
    const d = deps({ verifyTurnstile: vi.fn(async () => false) })
    expect((await handleVolunteer(req(valid, { origin: 'https://evil.example' }), d)).status).toBe(403)
    expect((await handleVolunteer(req({ ...valid, website: 'x' }), d)).status).toBe(400)
    expect((await handleVolunteer(req(valid), d)).status).toBe(403)
    expect(d.callRegister).not.toHaveBeenCalled()
  })

  it('maps duplicate, rate limit and unexpected DB errors', async () => {
    const dup = await handleVolunteer(req(valid), deps({ callRegister: vi.fn(async () => ({ error: 'duplicate' })) }))
    expect(dup.status).toBe(409)
    const rl = await handleVolunteer(req(valid), deps({ callRegister: vi.fn(async () => ({ error: 'rate_limited' })) }))
    expect(rl.status).toBe(429)
    const log = vi.fn()
    const err = await handleVolunteer(req(valid), deps({ callRegister: vi.fn(async () => ({ error: 'XX000' })), log }))
    expect(err.status).toBe(500)
    expect(JSON.stringify(log.mock.calls)).not.toContain('hanako')
  })
})

describe('normalisePhone', () => {
  it('converts full-width digits and dashes', () => {
    expect(normalisePhone('（０８３）１２ー３４５６')).toBe('(083)12-3456')
  })
})
