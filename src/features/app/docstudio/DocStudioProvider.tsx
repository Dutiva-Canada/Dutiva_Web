import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { bi, pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { docMetaDefaults, documentTemplatesByKey } from '@/data'
import type { DocMeta } from '@/data'
import { templateByTid, templateCategories } from '@/features/app/documents/data'
import type { DocTemplate, PreviewBlock } from '@/features/app/documents/data'
import { customTemplateByTid } from '@/features/app/documents/customTemplates'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { AuthContext } from '@/features/app/auth/authContext'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  authorizeExport,
  buildTextPdf,
  encodeInvisibleTag,
  exportDenialMessage,
  exportFilename,
  triggerDownload,
  watermarkFooterLines,
} from '@/lib/exportProtection'
import { docstudioMessages as M } from '@/i18n/messages/docstudio'
import { exportProtectionMessages as XP } from '@/i18n/messages/exportProtection'
import { DocStudioContext } from './docStudioContext'
import type {
  DocExportKind,
  DocRevisionKind,
  DocStudioContextValue,
  DocStudioState,
} from './docStudioContext'

/** Prototype `handleGenerateDoc` — the fake generation delay before "draft ready". */
const GENERATION_MS = 750

const CLOSED: DocStudioState = {
  open: false,
  templateKey: '',
  title: bi('', ''),
  category: bi('', ''),
  highRisk: false,
  meta: docMetaDefaults,
  sections: [],
  generating: false,
  editingAll: false,
  aiNote: null,
  gate: null,
  gateConfirmed: false,
  exportStatus: null,
  lastModified: false,
  metaOpen: false,
  signatureSent: false,
}

const AI_NOTES: Record<DocRevisionKind, Bi> = {
  formal: M.docstudio_ainote_formal,
  shorten: M.docstudio_ainote_shorten,
  compassionate: M.docstudio_ainote_compassionate,
}

interface ResolvedTemplate {
  title: Bi
  category: Bi
  highRisk: boolean
  meta: DocMeta
  sections: Bi[]
}

function categoryLabel(categoryId: string): Bi {
  return templateCategories.find((c) => c.id === categoryId)?.name ?? bi(categoryId, categoryId)
}

/** Flattens preview blocks into flat prose sections — the overlay isn't
 * jurisdiction/org-aware, so gates (`when`) aren't evaluated here; every
 * block with body text is shown. Clause blocks keep their heading as a
 * lead-in line. */
function sectionsFromPreview(blocks: PreviewBlock[]): Bi[] {
  return blocks
    .filter((b): b is PreviewBlock & { text: Bi } => b.text !== undefined)
    .map((b) =>
      b.type === 'clause' && b.heading
        ? bi(`${b.heading.en}\n\n${b.text.en}`, `${b.heading.fr}\n\n${b.text.fr}`)
        : b.text,
    )
}

/** Best-effort mapping from a doclib DocTemplate into the overlay's flat
 * display shape — lossy (drops questions/clause-gates/versioning) by
 * design, since the overlay has no jurisdiction/org-profile context. */
function docTemplateToOverlayShape(template: DocTemplate): ResolvedTemplate {
  return {
    title: template.name,
    category: categoryLabel(template.category),
    highRisk: template.risk === 'high',
    meta: {
      ...docMetaDefaults,
      jur: template.jurisdictions.length
        ? bi(template.jurisdictions.join(' / '), template.jurisdictions.join(' / '))
        : docMetaDefaults.jur,
      governing: template.statutory[0] ?? docMetaDefaults.governing,
      legalReview: template.requiresLawyerReview
        ? bi('Required before sending', 'Requise avant l’envoi')
        : docMetaDefaults.legalReview,
    },
    sections: sectionsFromPreview(template.preview),
  }
}

/** Prototype `docBodies[title]` + `docMetaFor(title)` + `isHighRiskDoc(title)`.
 * Tries the doclib template set first (by tid) — the richer, actively
 * maintained model — then falls back to the legacy flat fixture (by
 * title-string key), then the generic placeholder. Tids ('T01') and
 * legacy keys ('Termination Letter') never collide, so no caller needs
 * to say which kind of key it's passing. */
function resolveTemplate(templateKey: string, fromLibrary: boolean): ResolvedTemplate {
  const doclibTemplate = templateByTid.get(templateKey) ?? customTemplateByTid.get(templateKey)
  if (doclibTemplate) return docTemplateToOverlayShape(doclibTemplate)

  const template = documentTemplatesByKey[templateKey]
  if (template) {
    return {
      title: template.title,
      category: template.category,
      highRisk: template.highRisk,
      meta: { ...docMetaDefaults, ...template.meta },
      sections: template.sections.slice(),
    }
  }
  return {
    title: bi(templateKey, templateKey),
    category: M.docstudio_fallback_category,
    highRisk: false,
    meta: docMetaDefaults,
    sections: fromLibrary
      ? [M.docstudio_fallback_library_1, M.docstudio_fallback_library_2]
      : [M.docstudio_fallback_generate],
  }
}

export function DocStudioProvider({ children }: { readonly children: ReactNode }) {
  const [studio, setStudio] = useState<DocStudioState>(CLOSED)
  const { showToast } = useToasts()
  const { lang } = useI18n()
  /* Read, not required: the overlay also mounts in narrow contexts (tests,
     previews) without the auth/workspace providers, where exports degrade to
     the demo identity + device-local audit. */
  const auth = useContext(AuthContext)
  const workspaceMode = useContext(WorkspaceModeContext)
  const genTimer = useRef<number | null>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  useEffect(
    () => () => {
      if (genTimer.current !== null) window.clearTimeout(genTimer.current)
    },
    [],
  )

  const clearGenTimer = () => {
    if (genTimer.current !== null) {
      window.clearTimeout(genTimer.current)
      genTimer.current = null
    }
  }

  const rememberFocus = () => {
    lastFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
  }

  const openWith = (
    templateKey: string,
    resolved: ResolvedTemplate,
    generating: boolean,
    initialContent?: string,
  ) => {
    setStudio({
      ...CLOSED,
      open: true,
      templateKey,
      title: resolved.title,
      category: resolved.category,
      highRisk: resolved.highRisk,
      meta: resolved.meta,
      /* Seed with the caller's content (an exported Advisor reply) as a single
         editable section when provided; otherwise the template's sections. */
      sections: initialContent !== undefined ? [initialContent] : resolved.sections,
      generating,
      lastModified: initialContent !== undefined,
    })
  }

  /** Prototype `handleGenerateDoc(e, title)` — shimmer, then "draft ready" toast. */
  const openDocStudio = useCallback(
    (templateKey: string, options?: { initialContent?: string }) => {
      rememberFocus()
      const resolved = resolveTemplate(templateKey, false)
      openWith(templateKey, resolved, true, options?.initialContent)
      clearGenTimer()
      genTimer.current = window.setTimeout(() => {
        genTimer.current = null
        setStudio((prev) => ({ ...prev, generating: false }))
        showToast(
          bi(
            resolved.title.en + M.docstudio_toast_ready_suffix.en,
            resolved.title.fr + M.docstudio_toast_ready_suffix.fr,
          ),
          'ok',
        )
      }, GENERATION_MS)
    },
    [showToast],
  )

  /** Prototype `openDocFromLibrary(title)` — no generation shimmer, no toast. */
  const openDocFromLibrary = useCallback((templateKey: string) => {
    rememberFocus()
    clearGenTimer()
    openWith(templateKey, resolveTemplate(templateKey, true), false)
  }, [])

  const closeDocStudio = useCallback(() => {
    setStudio((prev) => ({ ...prev, open: false }))
    const el = lastFocused.current
    lastFocused.current = null
    if (el) {
      /* Prototype `restoreFocus()` — defer so the overlay unmounts first. */
      window.setTimeout(() => {
        if (el.isConnected) el.focus()
      }, 0)
    }
  }, [])

  const toggleEditAll = useCallback(() => {
    setStudio((prev) => ({ ...prev, editingAll: !prev.editingAll }))
  }, [])

  const updateSection = useCallback((index: number, value: string) => {
    setStudio((prev) => {
      const sections = prev.sections.slice()
      sections[index] = value
      return { ...prev, sections, lastModified: true }
    })
  }, [])

  const applyRevision = useCallback(
    (kind: DocRevisionKind) => {
      setStudio((prev) => ({ ...prev, aiNote: AI_NOTES[kind], lastModified: true }))
      showToast(M.docstudio_toast_revised, 'ok')
    },
    [showToast],
  )

  /**
   * The real export pipeline (src/lib/exportProtection, docs/EXPORT_PROTECTION.md):
   * authorize (velocity guard + audit trail, server-side when signed in) →
   * build the watermarked artifact → deliver → then the prototype's
   * exportStatus/toast contract, unchanged. A refused export changes nothing
   * and says when to retry.
   */
  const doExport = useCallback(
    async (kind: DocExportKind) => {
      const identity = workspaceMode?.identity
      const actorLabel = identity
        ? `${identity.user.name} (${identity.user.email})`
        : pick(XP.exportprot_demo_actor, lang)
      const workspaceLabel = identity?.companyName ?? pick(XP.exportprot_demo_workspace, lang)
      const title = pick(studio.title, lang)
      const paragraphs = studio.sections.map((section) => pickL(section, lang))

      const decision = await authorizeExport({
        surface: 'docstudio',
        kind: kind === 'PDF' ? 'pdf' : kind === 'Word' ? 'word' : 'link',
        title,
        content: [title, ...paragraphs].join('\n\n'),
        lang,
        actorLabel,
        workspaceLabel,
        session: auth?.session ?? null,
      })
      if (!decision.allowed) {
        showToast(exportDenialMessage(decision), 'info')
        return
      }

      const { stamp } = decision
      const footerLines = watermarkFooterLines(stamp, lang)
      if (kind === 'PDF') {
        const bytes = buildTextPdf({
          title,
          paragraphs,
          footerLines,
          exportId: stamp.exportId,
          author: stamp.actorLabel,
          workspaceLabel: stamp.workspaceLabel,
          createdAt: stamp.exportedAt,
        })
        triggerDownload(
          exportFilename(title, 'pdf', stamp.exportedAt),
          new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        )
      } else if (kind === 'Word') {
        const { buildWordDoc } = await import('@/lib/exportProtection/artifacts/wordDoc')
        const bytes = await buildWordDoc({
          title,
          paragraphs,
          footerLines,
          invisibleTag: encodeInvisibleTag(stamp.exportId),
          exportId: stamp.exportId,
          author: stamp.actorLabel,
          workspaceLabel: stamp.workspaceLabel,
          lang,
        })
        triggerDownload(
          exportFilename(title, 'docx', stamp.exportedAt),
          new Blob([bytes.buffer as ArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }),
        )
      } else {
        /* "Copy link" — a reference URL carrying the export id, so even the
           lightest share is traceable. Clipboard is absent in some contexts
           (tests, insecure origins); the export is still recorded. */
        const url = `${window.location.origin}/app/documents?export-ref=${stamp.exportId}`
        navigator.clipboard?.writeText(url).catch(() => {})
      }

      setStudio((prev) => ({ ...prev, exportStatus: kind }))
      showToast(bi(M.docstudio_exported_as.en + kind, M.docstudio_exported_as.fr + kind), 'ok')
    },
    [showToast, lang, auth, workspaceMode, studio.title, studio.sections],
  )

  const doSendForSignature = useCallback(() => {
    setStudio((prev) => ({ ...prev, signatureSent: true }))
    showToast(M.docstudio_toast_esign, 'ok')
  }, [showToast])

  const exportDoc = useCallback(
    (kind: DocExportKind) => {
      if (studio.highRisk && !studio.gateConfirmed) {
        setStudio((prev) => ({ ...prev, gate: { action: kind } }))
        return
      }
      void doExport(kind)
    },
    [studio.highRisk, studio.gateConfirmed, doExport],
  )

  const sendForSignature = useCallback(() => {
    if (studio.highRisk && !studio.gateConfirmed) {
      setStudio((prev) => ({ ...prev, gate: { action: 'signature' } }))
      return
    }
    doSendForSignature()
  }, [studio.highRisk, studio.gateConfirmed, doSendForSignature])

  const confirmGate = useCallback(() => {
    const action = studio.gate?.action
    if (!action) return
    if (action === 'signature') {
      setStudio((prev) => ({ ...prev, gate: null, gateConfirmed: true, signatureSent: true }))
      showToast(M.docstudio_toast_esign, 'ok')
    } else {
      /* The confirmed export runs the same protected pipeline as a direct
         one — the gate only ever deferred it. */
      setStudio((prev) => ({ ...prev, gate: null, gateConfirmed: true }))
      void doExport(action)
    }
  }, [studio.gate, showToast, doExport])

  const cancelGate = useCallback(() => {
    setStudio((prev) => ({ ...prev, gate: null }))
  }, [])

  const requestLegalReview = useCallback(() => {
    setStudio((prev) => ({ ...prev, gate: null }))
    showToast(M.docstudio_toast_legal, 'ok')
  }, [showToast])

  const toggleMeta = useCallback(() => {
    setStudio((prev) => ({ ...prev, metaOpen: !prev.metaOpen }))
  }, [])

  const value = useMemo<DocStudioContextValue>(
    () => ({
      studio,
      openDocStudio,
      openDocFromLibrary,
      closeDocStudio,
      toggleEditAll,
      updateSection,
      applyRevision,
      exportDoc,
      sendForSignature,
      confirmGate,
      cancelGate,
      requestLegalReview,
      toggleMeta,
    }),
    [
      studio,
      openDocStudio,
      openDocFromLibrary,
      closeDocStudio,
      toggleEditAll,
      updateSection,
      applyRevision,
      exportDoc,
      sendForSignature,
      confirmGate,
      cancelGate,
      requestLegalReview,
      toggleMeta,
    ],
  )

  return <DocStudioContext value={value}>{children}</DocStudioContext>
}
