/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { bi } from '@/i18n/core'
import type { AdvisorTurnSpec, ToneCardData } from '@/features/app/advisor/types'
import type { FixtureToneCard } from '@/data'
import { terminationAssessment } from './advisorFlows'
import type { MessageExtras } from './advisorFlows'
import type { LText } from '@/i18n/core'

type PushUser = (text: LText, chips?: LText[]) => string
type PushAdvisor = (spec: AdvisorTurnSpec) => string

interface QuickFormHandlersOptions {
  extras: Record<string, MessageExtras>
  updateExtras: (updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>) => void
  pushUser: PushUser
  pushAdvisor: PushAdvisor
  toToneCard: (card: FixtureToneCard) => ToneCardData
}

/** Termination quick-form field edits and submit (prototype termination flow). */
export function createAdvisorQuickFormHandlers(options: QuickFormHandlersOptions) {
  const { extras, updateExtras, pushUser, pushAdvisor, toToneCard } = options

  const changeQuickField = (messageId: string, fieldIndex: number, valueEn: string) => {
    updateExtras((prev) => {
      const entry = prev[messageId]
      const form = entry?.quickForm
      if (!entry || !form) return prev
      return {
        ...prev,
        [messageId]: {
          ...entry,
          quickForm: {
            ...form,
            fields: form.fields.map((f, i) => (i === fieldIndex ? { ...f, value: valueEn } : f)),
          },
        },
      }
    })
  }

  const submitQuickForm = (messageId: string) => {
    const form = extras[messageId]?.quickForm
    if (!form || form.submitted) return
    updateExtras((prev) => {
      const entry = prev[messageId]
      const current = entry?.quickForm
      if (!entry || !current) return prev
      return { ...prev, [messageId]: { ...entry, quickForm: { ...current, submitted: true } } }
    })
    const values = form.fields.map(
      (f) => f.options.find((o) => o.en === f.value) ?? bi(f.value, f.value),
    )
    pushUser('', values)
    const turnId = pushAdvisor({
      text: terminationAssessment.text,
      reasoning: terminationAssessment.reasoning,
      cards: terminationAssessment.cards.map(toToneCard),
    })
    updateExtras((prev) => ({
      ...prev,
      [turnId]: { docs: terminationAssessment.docs, followups: terminationAssessment.followups },
    }))
  }

  return { changeQuickField, submitQuickForm }
}
