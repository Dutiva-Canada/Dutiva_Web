import { describe, expect, it, vi, beforeEach } from 'vitest'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }))

import { getFirstLineAnswer } from './firstLineApi'
import { HELP_ARTICLES } from './help/helpCenterData'

const article = HELP_ARTICLES.find((a) => a.slug === 'generate-a-document')!

describe('getFirstLineAnswer', () => {
  beforeEach(() => invoke.mockReset())

  it('sends the question with grounded Help Centre context and returns the answer', async () => {
    invoke.mockResolvedValue({
      data: { data: { escalate: false, answer: 'Open Document Studio.' } },
      error: null,
    })
    const res = await getFirstLineAnswer(
      'how do I make a document',
      'product_question',
      [article],
      'en',
    )
    expect(res).toEqual({ escalate: false, answer: 'Open Document Studio.' })

    const [fn, opts] = invoke.mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(fn).toBe('support-firstline')
    expect(opts.body).toMatchObject({
      question: 'how do I make a document',
      category: 'product_question',
      language: 'en',
    })
    const context = opts.body.context as { title: string; text: string }[]
    expect(context[0]?.title.length).toBeGreaterThan(0)
    expect(context[0]?.text.length).toBeGreaterThan(0)
  })

  it('surfaces the server escalate flag', async () => {
    invoke.mockResolvedValue({ data: { data: { escalate: true } }, error: null })
    expect(await getFirstLineAnswer('x', 'privacy', [article], 'en')).toEqual({
      escalate: true,
      answer: '',
    })
  })

  it('maps HTTP 429 to a rate_limited error', async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 429 } } })
    await expect(
      getFirstLineAnswer('x', 'product_question', [article], 'en'),
    ).rejects.toMatchObject({
      code: 'rate_limited',
    })
  })

  it('maps HTTP 503 to an unavailable error', async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 503 } } })
    await expect(
      getFirstLineAnswer('x', 'product_question', [article], 'en'),
    ).rejects.toMatchObject({
      code: 'unavailable',
    })
  })
})
