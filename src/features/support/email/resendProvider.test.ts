import { describe, expect, it, vi } from 'vitest'
import { RESEND_ENDPOINT, createResendProvider } from './resendProvider'
import { deliverSupportEmail } from './emailService'

function okResponse(): Response {
  return new Response('{"id":"abc"}', { status: 200 })
}

describe('createResendProvider', () => {
  const message = {
    to: 'user@example.ca',
    subject: 'Dutiva Support — Request DUT-2026-000001 received',
    text: 'Body.',
  }

  it('POSTs the Resend request with auth and the message fields', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse())
    const provider = createResendProvider({
      apiKey: 'key_test',
      from: 'Dutiva Support <support@dutiva.ca>',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await provider.send(message)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(RESEND_ENDPOINT)
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer key_test')
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({
      from: 'Dutiva Support <support@dutiva.ca>',
      to: message.to,
      subject: message.subject,
      text: message.text,
    })
  })

  it('throws with status and detail when Resend rejects the request', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('domain not verified', { status: 422 }))
    const provider = createResendProvider({
      apiKey: 'key_test',
      from: 'x@dutiva.ca',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await expect(provider.send(message)).rejects.toThrow(/422.*domain not verified/)
  })

  it('propagates a network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    const provider = createResendProvider({
      apiKey: 'k',
      from: 'x@dutiva.ca',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await expect(provider.send(message)).rejects.toThrow('ECONNRESET')
  })

  it('plugs into deliverSupportEmail as the provider', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse())
    const provider = createResendProvider({
      apiKey: 'k',
      from: 'x@dutiva.ca',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    const result = await deliverSupportEmail(provider, message)
    expect(result.delivered).toBe(true)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })
})
