import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import type { SupportCategory } from '@/config/support'
import { articlePlainText } from './help/helpContent'
import type { HelpArticle } from './help/helpCenterData'

/**
 * Client for the `support-firstline` edge function — the AUTHENTICATED generative
 * first-line answer. The client does the retrieval (passing the Help Centre
 * articles it already found as grounding context) and the server does the
 * guarded generation. Human-only categories are refused server-side (and the
 * caller shouldn't offer the button for them anyway).
 */

type FirstLineAnswerCode = 'rate_limited' | 'unavailable' | 'error'

export class FirstLineAnswerError extends Error {
  constructor(public readonly code: FirstLineAnswerCode) {
    super(code)
    this.name = 'FirstLineAnswerError'
  }
}

interface FirstLineAnswer {
  /** True when the server refused to auto-answer (sensitive category). */
  escalate: boolean
  /** The grounded answer text, or '' when there was nothing to answer from. */
  answer: string
}

const schema = z.object({
  data: z.object({
    escalate: z.boolean().optional(),
    answer: z.string().optional(),
  }),
})

function codeFromStatus(status: number | undefined): FirstLineAnswerCode {
  if (status === 429) return 'rate_limited'
  if (status === 503 || status === 502) return 'unavailable'
  return 'error'
}

export async function getFirstLineAnswer(
  question: string,
  category: SupportCategory | '',
  articles: HelpArticle[],
  lang: Lang,
): Promise<FirstLineAnswer> {
  if (!supabase) throw new FirstLineAnswerError('unavailable')
  const context = articles.slice(0, 3).map((a) => ({
    title: pick(a.title, lang),
    text: articlePlainText(a, lang),
  }))
  const { data, error } = await supabase.functions.invoke('support-firstline', {
    body: { question, category, language: lang, context },
  })
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status
    throw new FirstLineAnswerError(codeFromStatus(status))
  }
  const parsed = schema.parse(data).data
  return { escalate: parsed.escalate ?? false, answer: parsed.answer ?? '' }
}
