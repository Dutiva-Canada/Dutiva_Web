/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'src/features/app/documents/data/templates/t01-offer-letter.ts'
const content = readFileSync(path, 'utf8')
const headerEnd = content.indexOf('  questions: [')
const previewStart = content.indexOf('  preview: [')
const previewEnd = content.lastIndexOf('  ],\n  subject:')
if (headerEnd < 0 || previewStart < 0 || previewEnd < 0) {
  throw new Error('markers not found — already split?')
}

const metaBlock = content.slice(content.indexOf('export const tplT01'), headerEnd)
const questionsBody = content.slice(headerEnd + '  questions: '.length, previewStart).trimEnd()
const questionsTrimmed = questionsBody.endsWith(',') ? questionsBody.slice(0, -1) : questionsBody
const previewBody = content.slice(previewStart + '  preview: '.length, previewEnd + 1).trimEnd()
const previewTrimmed = previewBody.endsWith(',') ? previewBody.slice(0, -1) : previewBody
const footer = content.slice(previewEnd)

writeFileSync(
  'src/features/app/documents/data/templates/t01-offer-letter.questions.ts',
  `/* T01 wizard questions — split from t01-offer-letter.ts for maintainability. */
import type { TemplateQuestion } from '../types'

export const t01OfferLetterQuestions: TemplateQuestion[] = ${questionsTrimmed}
`,
)

writeFileSync(
  'src/features/app/documents/data/templates/t01-offer-letter.preview.ts',
  `/* T01 preview blocks — split from t01-offer-letter.ts for maintainability. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { PreviewBlock } from '../types'

export const t01OfferLetterPreview: PreviewBlock[] = ${previewTrimmed}
`,
)

writeFileSync(
  path,
  `/* T01 — Offer of employment letter (Ontario).
   Replaced from T01_Offer_Letter_ON_Bilingual_EN_FR_polished.md (bilingual
   Ontario offer letter handoff). Ontario-only: QC and FED get their own
   jurisdiction-specific offer-letter templates (see T09 for QC) rather than
   this one carrying conditional Ontario-only clauses. Hand-maintained; keep
   the FR in step with the EN on every edit.

   Questions and preview blocks live in t01-offer-letter.questions.ts and
   t01-offer-letter.preview.ts — edit those when changing wizard or body copy. */
import type { DocTemplate } from '../types'
import { t01OfferLetterQuestions } from './t01-offer-letter.questions'
import { t01OfferLetterPreview } from './t01-offer-letter.preview'

${metaBlock}  questions: t01OfferLetterQuestions,
  preview: t01OfferLetterPreview,${footer.replace(/^  \],/, '')}`,
)

console.log('split-t01-offer-letter: OK')
