import { describe, expect, it, vi } from 'vitest'
import { handleSubmit, hashIp, type SubmitDeps } from '../api/_lib/handleSubmit'

const validBody = {
  body: 'バス停が遠くて通院が大変です',
  themeHints: ['交通・移動'],
  areaHint: '東岐波',
  ageRange: '40s',
  name: '',
  email: '',
  replyOk: false,
  agreed: true,
  turnstileToken: 'token',
}

function req(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return new Request('https://shoko.dev/api/submit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://shoko.dev',
      host: 'shoko.dev',
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      ...headers,
    },
    body: text,
  })
}

function deps(over: Partial<SubmitDeps> = {}): SubmitDeps & { calls: Record<string, unknown>[] } {
  const calls: Record<string, unknown>[] = []
  return {
    turnstileSecret: 's',
    ipHashSalt: 'salt',
    verifyTurnstile: vi.fn(async () => true),
    callSubmitVoice: vi.fn(async args => {
      calls.push(args)
      return { receipt: 'UB-ABCD-EFGH' }
    }),
    calls,
    ...over,
  }
}

describe('POST /api/submit', () => {
  it('accepts a valid submission and returns the receipt number', async () => {
    const d = deps()
    const res = await handleSubmit(req(validBody), d)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, receiptNo: 'UB-ABCD-EFGH' })
    expect(d.calls[0]).toMatchObject({
      p_body: validBody.body,
      p_theme_hints: ['交通・移動'],
      p_age_range: '40s',
      p_name: null,
      p_email: null,
      p_reply_ok: false,
    })
  })

  it('stores a salted hash of the first forwarded IP, never the raw IP', async () => {
    const d = deps()
    await handleSubmit(req(validBody), d)
    expect(d.calls[0].p_ip_hash).toBe(hashIp('203.0.113.7', 'salt'))
    expect(JSON.stringify(d.calls[0])).not.toContain('203.0.113.7')
  })

  it('rejects cross-origin requests', async () => {
    const res = await handleSubmit(req(validBody, { origin: 'https://evil.example' }), deps())
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: 'forbidden_origin' })
  })

  it('rejects requests without an Origin header', async () => {
    const r = req(validBody)
    const noOrigin = new Request(r, { headers: { host: 'shoko.dev', 'content-type': 'application/json' } })
    expect((await handleSubmit(noOrigin, deps())).status).toBe(403)
  })

  it('rejects non-POST methods', async () => {
    const res = await handleSubmit(new Request('https://shoko.dev/api/submit'), deps())
    expect(res.status).toBe(405)
  })

  it('rejects oversized bodies', async () => {
    const res = await handleSubmit(req({ ...validBody, body: 'あ'.repeat(30_000) }), deps())
    expect(res.status).toBe(413)
  })

  it('rejects malformed JSON', async () => {
    expect((await handleSubmit(req('{not json'), deps())).status).toBe(400)
  })

  it('rejects when the honeypot is filled, without calling the DB', async () => {
    const d = deps()
    const res = await handleSubmit(req({ ...validBody, website: 'http://spam' }), d)
    expect(res.status).toBe(400)
    expect(d.callSubmitVoice).not.toHaveBeenCalled()
  })

  it('reports invalid fields', async () => {
    const res = await handleSubmit(req({ ...validBody, body: '  ', agreed: false, email: 'bad' }), deps())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.fields).toEqual(expect.arrayContaining(['body', 'agreed', 'email']))
  })

  it('rejects unknown themes and age ranges', async () => {
    const res = await handleSubmit(req({ ...validBody, themeHints: ['政治'], ageRange: 'old' }), deps())
    expect((await res.json()).fields).toEqual(expect.arrayContaining(['themeHints', 'ageRange']))
  })

  it('requires an email when a reply is requested', async () => {
    const res = await handleSubmit(req({ ...validBody, replyOk: true }), deps())
    expect((await res.json()).fields).toContain('replyOk')
  })

  it('rejects when Turnstile fails, without calling the DB', async () => {
    const d = deps({ verifyTurnstile: vi.fn(async () => false) })
    const res = await handleSubmit(req(validBody), d)
    expect(res.status).toBe(403)
    expect(d.callSubmitVoice).not.toHaveBeenCalled()
  })

  it('rejects when the Turnstile token is missing', async () => {
    const res = await handleSubmit(req({ ...validBody, turnstileToken: '' }), deps())
    expect(res.status).toBe(403)
  })

  it('maps the DB rate limit to 429', async () => {
    const res = await handleSubmit(req(validBody), deps({ callSubmitVoice: vi.fn(async () => ({ error: 'rate_limited' })) }))
    expect(res.status).toBe(429)
  })

  it('returns 500 on unexpected DB errors and logs only a code', async () => {
    const log = vi.fn()
    const res = await handleSubmit(
      req({ ...validBody, email: 'me@example.test' }),
      deps({ callSubmitVoice: vi.fn(async () => ({ error: 'XX000' })), log }),
    )
    expect(res.status).toBe(500)
    expect(log).toHaveBeenCalledWith('db_error:XX000')
    expect(JSON.stringify(log.mock.calls)).not.toContain('me@example.test')
  })

  it('passes contact details only when given, and reply only with an email', async () => {
    const d = deps()
    await handleSubmit(req({ ...validBody, name: ' 山田 ', email: ' Me@Example.test ', replyOk: true }), d)
    expect(d.calls[0]).toMatchObject({ p_name: '山田', p_email: 'Me@Example.test', p_reply_ok: true })
  })

  it('records the privacy policy version chosen by the server, not the client', async () => {
    const d = deps()
    await handleSubmit(req({ ...validBody, privacyVersion: 'fake' }), d)
    expect(d.calls[0].p_privacy_version).not.toBe('fake')
  })
})
