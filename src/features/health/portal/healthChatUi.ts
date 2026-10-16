import { healthMessages as HM } from '@/i18n/messages/health'
import type { HealthChatAction, HealthChatContext } from '@/features/health/data/api'

/* Pure helpers for HealthChatPage — kept in their own module so the page
   file stays under the size budget and the copy/format rules stay
   unit-testable. */

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in health-ai/handlers.ts. */
export function actionLabel(
  action: HealthChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const slots = { name: action.detail }
  switch (action.type) {
    case 'mark_habit_done':
      return x(HM.health_chat_did_mark).replace('{name}', slots.name)
    case 'unmark_habit_done':
      return x(HM.health_chat_did_unmark).replace('{name}', slots.name)
    case 'add_habit':
      return x(HM.health_chat_did_habit).replace('{name}', slots.name)
    case 'add_checkin':
      return x(HM.health_chat_did_checkin).replace('{name}', slots.name)
    case 'add_journal_entry':
      return x(HM.health_chat_did_journal)
    case 'propose_memory':
      return x(HM.health_chat_did_memory).replace('{name}', slots.name)
    default:
      return ''
  }
}

/** The portal page the action's write lands on — the chip's "View" link. */
export function actionRoute(action: HealthChatAction): string | null {
  switch (action.type) {
    case 'mark_habit_done':
    case 'unmark_habit_done':
    case 'add_habit':
      return '/wellness/habits'
    case 'add_checkin':
      return '/wellness/check-in'
    case 'add_journal_entry':
      return '/wellness/journal'
    case 'propose_memory':
      return '/wellness/review'
    default:
      return null
  }
}

/* Words that pin the 988 line beside the bubble, not only under the
   composer. Deliberately narrow — it fires on ideation, not venting. */
/* `don['’]?t` — phone keyboards autocorrect 'don't' to the curly form;
   matching only the straight quote let "I don't want to live" sail past
   the flag that's supposed to pin the crisis line. The prefix-shaped
   alternatives are written in full (`kill \w*sel(?:f|ves)`, plurals) —
   the trailing \b used to reject every word that continued past the
   partial form, so "kill myself" and "hurt myself" never flagged. */
export const DISTRESS_RE =
  /\b(suicid(?:e|al)s?|suicidaires?|kill \w*sel(?:f|ves)|end (?:my life|it all)|self[- ]?harm(?:ing|ed|s)?|hurt \w*sel(?:f|ves)|wants? to die|don['’]?t want to (?:live|be here|go on)|doesn['’]?t want to (?:live|be here|go on)|no reason to (?:live|go on)|better off without me|me suicider|me faire du mal|en finir|envie de mourir|plus envie de vivre|envie de dispara[îi]tre)\b/i

/** True when a failed send was the reader's own stop — an aborted stream
    keeps its partial text instead of flagging the turn failed. */
export function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

/** "Drew on: 4 check-ins · 1 saved memory" — the per-reply transparency
    line, counts only. Null when nothing was in scope (a bare-hello reply
    says nothing rather than dressing an empty set up). */
export function contextLine(
  u: HealthChatContext,
  x: (m: { en: string; fr: string }) => string,
  lang: 'en' | 'fr',
): string | null {
  const parts: string[] = []
  const push = (count: number, one: { en: string; fr: string }, many: { en: string; fr: string }) => {
    if (count > 0) parts.push(x(count === 1 ? one : many).replace('{count}', String(count)))
  }
  push(u.checkins, HM.health_chat_ctx_checkin_one, HM.health_chat_ctx_checkin_many)
  push(u.habits, HM.health_chat_ctx_habit_one, HM.health_chat_ctx_habit_many)
  push(u.memories, HM.health_chat_ctx_memory_one, HM.health_chat_ctx_memory_many)
  push(u.journals, HM.health_chat_ctx_journal_one, HM.health_chat_ctx_journal_many)
  /* French takes a non-breaking space before the colon. */
  return parts.length
    ? `${x(HM.health_chat_ctx_label)}${lang === 'fr' ? ' : ' : ': '}${parts.join(' · ')}`
    : null
}
