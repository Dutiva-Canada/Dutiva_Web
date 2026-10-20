import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabaseClient'
import {
  addCheckIn,
  addHabit,
  healthVoiceTranscribeAvailable,
  localDaysAvailable,
  resetHealthReactionThrottle,
  resetHealthVoiceProbe,
  resetLocalDaysProbe,
  sendHealthReaction,
  transcribeHealthAudio,
} from './api'

/* The transport is mocked — the throttle semantics under test are which
   calls REACH it, not what it does. A truthy client so requireSupabase
   passes; invokeEdgeFn decides each call's fate. */
vi.mock('@/lib/supabaseClient', () => ({ supabase: { __test: true } }))
vi.mock('@/lib/edgeStream', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/edgeStream')>()),
  invokeEdgeFn: vi.fn(),
  invokeEdgeFnStream: vi.fn(),
}))

const { invokeEdgeFn } = await import('@/lib/edgeStream')

/* The reaction throttle is a floor between model calls — a skipped call
   resolves reply:null and the page stays quiet. A call that FAILED must
   hand its slot back: swallowing the next legitimate nudge for 90s on top
   of the lost reaction was the bug this guards. */
describe('sendHealthReaction throttle', () => {
  beforeEach(() => {
    resetHealthReactionThrottle()
    vi.mocked(invokeEdgeFn).mockReset()
  })

  it('quiets the next call inside the window after a success', async () => {
    vi.mocked(invokeEdgeFn).mockResolvedValue({ reply: 'noted', assistantId: 'a1' })
    await expect(
      sendHealthReaction({ type: 'checkin_saved', mood: 3 }, 'en'),
    ).resolves.toEqual({ reply: 'noted', assistantId: 'a1' })
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
    expect(invokeEdgeFn).toHaveBeenCalledTimes(1)
  })

  it('releases the slot when the call fails — the next one reaches the transport', async () => {
    vi.mocked(invokeEdgeFn).mockRejectedValue(new Error('down'))
    await expect(
      sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
    ).rejects.toThrow('down')
    /* Not throttled — a lost reaction must not mute the next one. */
    await expect(
      sendHealthReaction({ type: 'checkin_saved', mood: 3 }, 'en'),
    ).rejects.toThrow('down')
    expect(invokeEdgeFn).toHaveBeenCalledTimes(2)
  })

  it('reacts again once the window has passed', async () => {
    vi.mocked(invokeEdgeFn).mockResolvedValue({ reply: 'noted' })
    vi.useFakeTimers()
    try {
      await sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en')
      vi.setSystemTime(Date.now() + 120_000)
      await sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en')
      expect(invokeEdgeFn).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

/* The voice-transcribe seam: the probe caches like the journal-image one,
   and the upload is a raw multipart POST (functions.invoke is JSON-only).
   The shared client mock is a bare truthy object — per-test fields give it
   just the surface each helper touches. */
describe('health voice transcription helpers', () => {
  beforeEach(() => {
    resetHealthVoiceProbe()
    const client = supabase as unknown as Record<string, unknown>
    client.functions = { invoke: vi.fn() }
    client.auth = {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'tok' } },
      })),
    }
  })

  it('probe answers true only when the function answers ok — and caches it', async () => {
    const invoke = vi.mocked(
      (supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }).functions
        .invoke,
    )
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    await expect(healthVoiceTranscribeAvailable()).resolves.toBe(true)
    expect(invoke).toHaveBeenCalledWith('health-transcribe', { body: { ping: true } })
    await expect(healthVoiceTranscribeAvailable()).resolves.toBe(true)
    /* Second call rides the cache — one probe per session. */
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('probe caches a negative too — an undeployed function is asked once', async () => {
    const invoke = vi.mocked(
      (supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }).functions
        .invoke,
    )
    invoke.mockResolvedValue({ data: null, error: { message: 'not found' } })
    await expect(healthVoiceTranscribeAvailable()).resolves.toBe(false)
    await expect(healthVoiceTranscribeAvailable()).resolves.toBe(false)
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('posts the clip as multipart under the caller token and trims the text', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: '  hello  ' })))
    vi.stubGlobal('fetch', fetchMock)
    const blob = new Blob(['pcm'], { type: 'audio/webm' })
    await expect(transcribeHealthAudio(blob, 'fr')).resolves.toBe('hello')
    const [url, init] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(String(url)).toContain('/functions/v1/health-transcribe')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    const form = init.body as FormData
    expect(form.get('lang')).toBe('fr')
    expect(form.get('file')).toBeInstanceOf(Blob)
    vi.unstubAllGlobals()
  })

  it('rejects on a non-OK transcription response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 502 })))
    await expect(
      transcribeHealthAudio(new Blob(['pcm']), 'en'),
    ).rejects.toThrow('health-transcribe 502')
    vi.unstubAllGlobals()
  })
})

/* Migration 0229's `day` column is the one write that can't afford to
   fail blind — unlike weekly_target (a feature flag), check-ins and
   habits are core flows and an unknown-column error kills the insert.
   The probe keys the key out of the body until the column answers. */
describe('localDaysAvailable probe', () => {
  const CHECKIN_ROW = {
    id: 'c1',
    mood: 3,
    energy: null,
    note: '',
    day: null,
    created_at: '2026-10-15T12:00:00Z',
  }
  const HABIT_ROW = {
    id: 'h1',
    name: 'Walk',
    weekly_target: null,
    day: null,
    created_at: '2026-10-15T12:00:00Z',
  }

  const inserted: Record<string, unknown>[] = []
  let probeError: { message: string } | null
  let probeCalls: number

  beforeEach(() => {
    resetLocalDaysProbe()
    inserted.length = 0
    probeCalls = 0
    probeError = null
    const client = supabase as unknown as Record<string, unknown>
    client.auth = {
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })),
    }
    client.from = vi.fn((_table: string) => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => {
          probeCalls += 1
          return Promise.resolve({ error: probeError })
        }),
      })),
      insert: vi.fn((body: Record<string, unknown>) => {
        inserted.push(body)
        return {
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: 'name' in body ? { ...HABIT_ROW, name: body.name } : CHECKIN_ROW,
                error: null,
              }),
            ),
          })),
        }
      }),
    }))
  })

  it('writes the local day once the column answers — and probes once', async () => {
    await expect(localDaysAvailable()).resolves.toBe(true)
    await addCheckIn({ mood: 3 })
    await addHabit('Walk')
    expect(probeCalls).toBe(1)
    expect(inserted[0]).toMatchObject({ mood: 3, day: expect.any(String) })
    expect(inserted[1]).toMatchObject({ name: 'Walk', day: expect.any(String) })
  })

  it('omits the key entirely when the column is not there — the insert still lands', async () => {
    probeError = { message: 'column health_checkins.day does not exist' }
    await expect(localDaysAvailable()).resolves.toBe(false)
    await addCheckIn({ mood: 4 })
    await addHabit('Stretch')
    expect(probeCalls).toBe(1)
    for (const body of inserted) {
      expect(body).not.toHaveProperty('day')
    }
    expect(inserted[0]).toMatchObject({ mood: 4 })
    expect(inserted[1]).toMatchObject({ name: 'Stretch' })
  })
})
