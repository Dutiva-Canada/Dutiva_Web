import { createContext, useContext } from 'react'
import type { Bi, LText } from '@/i18n/core'
import type { DocMeta } from '@/data'

/**
 * Document Studio — the guided document-generation overlay (right-hand
 * drawer with a live preview). Mirrors the prototype's `state.docStudio`
 * plus its methods (`handleGenerateDoc`, `exportDoc`, `confirmGate`, …).
 */

export type DocExportKind = 'PDF' | 'Word' | 'link'
export type DocRevisionKind = 'formal' | 'shorten' | 'compassionate'
/** What the high-risk gate is guarding — an export kind or the e-signature send. */
type DocGateAction = DocExportKind | 'signature'

export interface DocStudioState {
  open: boolean
  /** Template key (the prototype's EN title) this draft was generated from. */
  templateKey: string
  title: Bi
  category: Bi
  /** Prototype `isHighRiskDoc()` — export/signature actions go through the gate. */
  highRisk: boolean
  meta: DocMeta
  /**
   * Live section texts. Fixture sections are `Bi` so a language toggle
   * re-localizes them; once the user edits a section it becomes a plain
   * string (their words, language-neutral).
   */
  sections: LText[]
  /** True during the simulated generation shimmer (~750ms). */
  generating: boolean
  editingAll: boolean
  /** Note shown after an "Ask Advisor to revise" action. */
  aiNote: Bi | null
  /** Open confirmation gate (high-risk docs only), with the deferred action. */
  gate: { action: DocGateAction } | null
  /** Once confirmed, further exports/sends skip the gate. */
  gateConfirmed: boolean
  exportStatus: DocExportKind | null
  /** True after any manual edit or Advisor revision ("Last modified · Just now"). */
  lastModified: boolean
  metaOpen: boolean
  signatureSent: boolean
}

export interface DocStudioContextValue {
  studio: DocStudioState
  /**
   * Generate a draft from a template key (prototype `handleGenerateDoc`):
   * opens the overlay with a short "Advisor is drafting…" state, then a
   * "draft ready" toast. `options.initialContent` seeds the draft with a
   * single editable section (used to export an Advisor reply into a document)
   * instead of the template's default sections.
   */
  openDocStudio: (templateKey: string, options?: { initialContent?: string }) => void
  /** Open an existing document without the generation shimmer (prototype `openDocFromLibrary`). */
  openDocFromLibrary: (templateKey: string) => void
  closeDocStudio: () => void
  toggleEditAll: () => void
  updateSection: (index: number, value: string) => void
  applyRevision: (kind: DocRevisionKind) => void
  /** Export the draft — high-risk docs open the review gate first. */
  exportDoc: (kind: DocExportKind) => void
  /** Send for e-signature — high-risk docs open the review gate first. */
  sendForSignature: () => void
  confirmGate: () => void
  cancelGate: () => void
  /** "Request legal review instead" — closes the gate and routes to counsel. */
  requestLegalReview: () => void
  toggleMeta: () => void
}

export const DocStudioContext = createContext<DocStudioContextValue | null>(null)

export function useDocStudio(): DocStudioContextValue {
  const ctx = useContext(DocStudioContext)
  if (!ctx) throw new Error('useDocStudio must be used within a DocStudioProvider')
  return ctx
}
