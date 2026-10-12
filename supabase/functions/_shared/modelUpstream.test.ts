import { describe, expect, it } from 'vitest'
import {
  MAX_ATTACHMENTS,
  MAX_DOCUMENT_TEXT_CHARS,
  MAX_IMAGE_DATA_URL_CHARS,
  MAX_TOTAL_DOCUMENT_CHARS,
  chatCompletionsUrl,
  createSseDeltaParser,
  missingModality,
  parseAttachments,
  persistedUserContent,
  readUpstreamCompletion,
  resolveApiKey,
  routeBodyExtras,
  routeMaxTokens,
  routeModalities,
  upstreamHeaders,
  userMessageContent,
} from './modelUpstream'
import type { AdvisorAttachment } from './modelUpstream'

/**
 * The local-provider plumbing shared by every dutiva-* completion call.
 * What these tests pin: keyless providers must reach the wire without an
 * Authorization header (Ollama/LM Studio carry no secret), a configured-but-
 * missing secret must still fail loudly, and attachment validation must
 * refuse before a malformed or oversized payload ever reaches the prompt.
 */

const pngDataUrl = `data:image/png;base64,${'A'.repeat(64)}`

describe('chatCompletionsUrl', () => {
  it('appends the path and tolerates trailing slashes', () => {
    expect(chatCompletionsUrl('http://localhost:11434/v1')).toBe(
      'http://localhost:11434/v1/chat/completions',
    )
    expect(chatCompletionsUrl('http://192.168.1.40:1234/v1/')).toBe(
      'http://192.168.1.40:1234/v1/chat/completions',
    )
  })
})

describe('resolveApiKey', () => {
  const env = (name: string) => (name === 'PRESENT_KEY' ? 'sk-test' : undefined)

  it('keyless provider → no credential, no error', () => {
    expect(resolveApiKey(null, env)).toEqual({ apiKey: null })
    expect(resolveApiKey('', env)).toEqual({ apiKey: null })
    expect(resolveApiKey('   ', env)).toEqual({ apiKey: null })
  })

  it('configured secret resolves to a bearer token', () => {
    expect(resolveApiKey('PRESENT_KEY', env)).toEqual({ apiKey: 'sk-test' })
  })

  it('configured secret with no env var → loud missing-secret error', () => {
    expect(resolveApiKey('ABSENT_KEY', env)).toEqual({ missingSecret: 'ABSENT_KEY' })
  })
})

describe('upstreamHeaders', () => {
  it('omits Authorization entirely for keyless providers', () => {
    const headers = upstreamHeaders(null)
    expect(headers['Content-Type']).toBe('application/json')
    expect('Authorization' in headers).toBe(false)
  })

  it('adds the bearer token when a key resolved', () => {
    expect(upstreamHeaders('sk-x').Authorization).toBe('Bearer sk-x')
  })
})

describe('parseAttachments', () => {
  it('accepts an image data URL and a document', () => {
    const result = parseAttachments([
      { kind: 'image', name: 'posting.png', data_url: pngDataUrl },
      { kind: 'document', name: 'policy.pdf', text: 'Section 1 …' },
    ])
    expect(result).toEqual({
      attachments: [
        { kind: 'image', name: 'posting.png', data_url: pngDataUrl },
        { kind: 'document', name: 'policy.pdf', text: 'Section 1 …' },
      ],
    })
  })

  it('passes through absent/empty attachments', () => {
    expect(parseAttachments(undefined)).toEqual({ attachments: [] })
    expect(parseAttachments([])).toEqual({ attachments: [] })
  })

  it('rejects over-limit attachment counts', () => {
    const many = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, i) => ({
      kind: 'document',
      name: `d${i}.txt`,
      text: 'x',
    }))
    expect(parseAttachments(many)).toEqual({ error: 'too_many' })
  })

  it('rejects non-allowlisted image types and malformed data URLs', () => {
    expect(
      parseAttachments([
        { kind: 'image', name: 'x.svg', data_url: 'data:image/svg+xml;base64,PHN2Zz4=' },
      ]),
    ).toEqual({ error: 'bad_image_mime' })
    expect(
      parseAttachments([{ kind: 'image', name: 'x.png', data_url: 'not-a-data-url' }]),
    ).toEqual({ error: 'bad_image_mime' })
  })

  it('rejects oversized images and documents', () => {
    const bigImage = `data:image/png;base64,${'A'.repeat(MAX_IMAGE_DATA_URL_CHARS + 8)}`
    expect(parseAttachments([{ kind: 'image', name: 'big.png', data_url: bigImage }])).toEqual({
      error: 'image_too_large',
    })
    const bigDoc = 'x'.repeat(MAX_DOCUMENT_TEXT_CHARS + 1)
    expect(parseAttachments([{ kind: 'document', name: 'big.pdf', text: bigDoc }])).toEqual({
      error: 'document_too_large',
    })
    const half = 'x'.repeat(MAX_TOTAL_DOCUMENT_CHARS / 2 + 1)
    expect(
      parseAttachments([
        { kind: 'document', name: 'a.txt', text: half },
        { kind: 'document', name: 'b.txt', text: half },
      ]),
    ).toEqual({ error: 'document_too_large' })
  })

  it('rejects empty documents and malformed entries', () => {
    expect(parseAttachments([{ kind: 'document', name: 'e.txt', text: '   ' }])).toEqual({
      error: 'empty',
    })
    expect(parseAttachments([{ kind: 'audio', name: 'a.mp3' }])).toEqual({ error: 'bad_shape' })
    expect(parseAttachments('nope')).toEqual({ error: 'bad_shape' })
    expect(parseAttachments([null])).toEqual({ error: 'bad_shape' })
  })
})

describe('routeModalities / missingModality', () => {
  const image: AdvisorAttachment = { kind: 'image', name: 'p.png', data_url: pngDataUrl }
  const doc: AdvisorAttachment = { kind: 'document', name: 'd.pdf', text: 'text' }

  it('defaults to text-only when the route declares nothing', () => {
    expect([...routeModalities(null)]).toEqual(['text'])
    expect([...routeModalities({ modalities: 'image' })]).toEqual(['text'])
  })

  it('reads declared modalities from route config', () => {
    const mods = routeModalities({ modalities: ['text', 'image'] })
    expect(mods.has('image')).toBe(true)
  })

  it('images require the image modality; documents never gate', () => {
    expect(missingModality([image], routeModalities(null))).toBe('image')
    expect(missingModality([image], routeModalities({ modalities: ['image'] }))).toBeNull()
    expect(missingModality([doc], routeModalities(null))).toBeNull()
  })
})

describe('userMessageContent / persistedUserContent', () => {
  const image: AdvisorAttachment = { kind: 'image', name: 'p.png', data_url: pngDataUrl }
  const doc: AdvisorAttachment = { kind: 'document', name: 'd.pdf', text: 'body text' }

  it('plain string when nothing is attached', () => {
    expect(userMessageContent('hello', [])).toBe('hello')
  })

  it('text part first, then document text, then image_url parts', () => {
    const parts = userMessageContent('look at this', [doc, image])
    expect(Array.isArray(parts)).toBe(true)
    const list = parts as { type: string }[]
    expect(list[0]).toEqual({ type: 'text', text: 'look at this' })
    expect(list[1]?.type).toBe('text')
    expect((list[1] as { text: string }).text).toContain('Attached document "d.pdf"')
    expect((list[1] as { text: string }).text).toContain('body text')
    expect(list[2]).toEqual({ type: 'image_url', image_url: { url: pngDataUrl } })
  })

  it('persists a manifest line, never the data URL', () => {
    const stored = persistedUserContent('check this', [image, doc])
    expect(stored).toContain('[Attached image: p.png]')
    expect(stored).toContain('[Attached document: d.pdf]')
    expect(stored).toContain('check this')
    expect(stored).not.toContain('base64')
  })
})

describe('routeBodyExtras', () => {
  it('forwards whitelisted params only', () => {
    const cfg = {
      max_tokens: 4096,
      params: {
        reasoning_effort: 'high',
        thinking: { type: 'enabled' },
        messages: [{ role: 'system', content: 'evil' }],
        model: 'other-model',
        stream: true,
      },
    }
    const extras = routeBodyExtras(cfg)
    expect(extras).toEqual({
      reasoning_effort: 'high',
      thinking: { type: 'enabled' },
    })
    expect(extras).not.toHaveProperty('messages')
    expect(extras).not.toHaveProperty('model')
    expect(extras).not.toHaveProperty('stream')
  })
  it('returns {} when config or params is missing/malformed', () => {
    expect(routeBodyExtras(null)).toEqual({})
    expect(routeBodyExtras({})).toEqual({})
    expect(routeBodyExtras({ params: 'high' })).toEqual({})
    expect(routeBodyExtras({ params: [1, 2] })).toEqual({})
  })
})

describe('routeMaxTokens', () => {
  it('returns the route-set ceiling when it is a positive number', () => {
    expect(routeMaxTokens({ max_tokens: 4096 }, 3000)).toBe(4096)
  })
  it('falls back on missing or malformed values', () => {
    expect(routeMaxTokens(null, 3000)).toBe(3000)
    expect(routeMaxTokens({}, 3000)).toBe(3000)
    expect(routeMaxTokens({ max_tokens: '4096' }, 3000)).toBe(3000)
    expect(routeMaxTokens({ max_tokens: 0 }, 3000)).toBe(3000)
    expect(routeMaxTokens({ max_tokens: -50 }, 3000)).toBe(3000)
    expect(routeMaxTokens({ max_tokens: Number.NaN }, 3000)).toBe(3000)
  })
})

/* Reasoning-capable routes stream `delta.reasoning_content` ahead of the
   reply — the thinking panel depends on the two channels staying separate:
   reasoning pieces accumulate on `reasoning`, reply pieces on `text`, and
   neither may leak into the other. */
describe('createSseDeltaParser', () => {
  const sse = (deltas: { content?: string; reasoning_content?: string }[]) =>
    deltas.map((d) => `data: ${JSON.stringify({ choices: [{ delta: d }] })}\n`).join('') +
    'data: [DONE]\n'

  it('collects reasoning and content on separate channels', () => {
    const reasons: string[] = []
    const pieces: string[] = []
    const p = createSseDeltaParser(
      (t) => pieces.push(t),
      (t) => reasons.push(t),
    )
    p.push(
      sse([
        { reasoning_content: 'Let me ', content: '' },
        { reasoning_content: 'check the rows.' },
        { content: 'Verdict' },
        { content: ': hold.' },
      ]),
    )
    expect(p.reasoning).toBe('Let me check the rows.')
    expect(p.text).toBe('Verdict: hold.')
    expect(reasons.join('')).toBe('Let me check the rows.')
    expect(pieces.join('')).toBe('Verdict: hold.')
  })

  it('buffers a data line split across chunks', () => {
    const p = createSseDeltaParser(() => {})
    const wire = sse([{ reasoning_content: 'thinking…' }, { content: 'Hi' }])
    const mid = wire.indexOf('reasoning_content')
    p.push(wire.slice(0, mid))
    expect(p.reasoning).toBe('')
    p.push(wire.slice(mid))
    expect(p.reasoning).toBe('thinking…')
    expect(p.text).toBe('Hi')
  })

  it('skips non-data lines and tolerates malformed JSON', () => {
    const p = createSseDeltaParser(() => {})
    p.push(': keepalive\n\n')
    p.push('data: {not json\n')
    p.push(sse([{ content: 'ok' }]))
    expect(p.text).toBe('ok')
    expect(p.reasoning).toBe('')
  })
})

describe('readUpstreamCompletion', () => {
  const sseResponse = (body: string) =>
    new Response(body, { headers: { 'content-type': 'text/event-stream' } })

  it('streams both channels from an SSE response', async () => {
    const reasons: string[] = []
    const body =
      'data: {"choices":[{"delta":{"reasoning_content":"thinking"}}]}\n' +
      'data: {"choices":[{"delta":{"content":"hi"}}]}\n' +
      'data: [DONE]\n'
    const out = await readUpstreamCompletion(sseResponse(body), () => {}, (t) =>
      reasons.push(t),
    )
    expect(out).toEqual({ text: 'hi', reasoning: 'thinking' })
    expect(reasons).toEqual(['thinking'])
  })

  it('reads reasoning_content off a buffered JSON response', async () => {
    const res = new Response(
      JSON.stringify({
        choices: [{ message: { content: 'answer', reasoning_content: 'worked it out' } }],
      }),
      { headers: { 'content-type': 'application/json' } },
    )
    const reasons: string[] = []
    const out = await readUpstreamCompletion(res, () => {}, (t) => reasons.push(t))
    expect(out).toEqual({ text: 'answer', reasoning: 'worked it out' })
    expect(reasons).toEqual(['worked it out'])
  })

  it('resolves empty reasoning for a plain model', async () => {
    const res = new Response(
      JSON.stringify({ choices: [{ message: { content: 'answer' } }] }),
      { headers: { 'content-type': 'application/json' } },
    )
    const out = await readUpstreamCompletion(res, () => {})
    expect(out).toEqual({ text: 'answer', reasoning: '' })
  })
})
