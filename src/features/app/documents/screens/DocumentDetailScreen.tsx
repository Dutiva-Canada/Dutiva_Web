import { useState } from 'react'
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Lock, TriangleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
import type { WorkspaceMessageKey } from '@/i18n/messages'
import { doclibMessages } from '@/i18n/messages/doclib'
import { dotToneClass } from '@/components/chips'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { ToastTone } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useDoclib } from '../doclibContext'
import { DocumentDetailProductionView } from './DocumentDetailProductionView'
import { ActBtn, DocChip, DocPaper, JurisdictionPill, Skel } from '../components'
import { SignatureModal } from '../components/SignatureModal'
import {
  bilingualMergeValues,
  docActionsFor,
  isBilingualDelivery,
  mergeFieldValues,
  resolveBlocks,
  templateTokens,
} from '../engine'
import type { DocAction } from '../engine'
import {
  documentStatusInfo,
  jurisdictionInfo,
  reviewStatusInfo,
  riskLevelInfo,
  signatureStatusInfo,
} from '../data'
import type {
  AuditEventType,
  DocTemplate,
  GeneratedDoc,
  OrgProfile,
  PreviewBlock,
  RecipientType,
  ReviewStatus,
  SignatureStatus,
  StatusInfo,
  WorkspaceRole,
} from '../data'

/**
 * Document detail — port of the prototype's DOCUMENT DETAIL view
 * (`HR Documents Library.dc.html`, markup ~670–775 + `docVals()`): header with
 * the four status chips, role-gated action bar (demo-simulated via toasts),
 * five tabs (Preview / Fields / Versions / Recipients & signatures / Audit
 * trail), and the sticky "Details · documents" metadata rail whose mono
 * sub-labels are the handoff's authoritative Supabase column names.
 */

const TABS = [
  ['preview', 'doclib_docd_tabPreview'],
  ['fields', 'doclib_docd_tabFields'],
  ['versions', 'doclib_docd_tabVersions'],
  ['recipients', 'doclib_docd_tabRecipients'],
  ['audit', 'doclib_docd_tabAudit'],
] as const satisfies ReadonlyArray<readonly [string, WorkspaceMessageKey]>

type TabKey = (typeof TABS)[number][0]

/** Prototype `editDoc()` toast — the demo stand-in for the guided-flow hop. */
const EDIT_TOAST: Bi = bi('Editing in the guided flow', 'Modification dans le flux guidé')

interface ActionConfig {
  label: WorkspaceMessageKey
  toast: Bi
  tone: ToastTone
  variant: 'primary' | 'ghost' | 'danger'
}

/* Button kinds + toasts per the prototype's docActionsFor()/docAction(). */
const ACTION_CFG: Record<DocAction, ActionConfig> = {
  edit: { label: 'doclib_docd_edit', toast: EDIT_TOAST, tone: 'info', variant: 'ghost' },
  request_review: {
    label: 'doclib_docd_requestReview',
    toast: doclibMessages.doclib_toast_reviewRequested,
    tone: 'info',
    variant: 'primary',
  },
  approve: {
    label: 'doclib_docd_approve',
    toast: doclibMessages.doclib_toast_approved,
    tone: 'ok',
    variant: 'primary',
  },
  send_for_signature: {
    label: 'doclib_docd_sendSign',
    toast: doclibMessages.doclib_toast_sent,
    tone: 'info',
    variant: 'primary',
  },
  export: {
    label: 'doclib_docd_export',
    toast: doclibMessages.doclib_toast_exported,
    tone: 'ok',
    variant: 'ghost',
  },
  archive: {
    label: 'doclib_docd_archive',
    toast: doclibMessages.doclib_toast_archived,
    tone: 'info',
    variant: 'ghost',
  },
  restore: {
    label: 'doclib_docd_restore',
    toast: doclibMessages.doclib_toast_restored,
    tone: 'ok',
    variant: 'primary',
  },
  void: {
    label: 'doclib_docd_void',
    toast: doclibMessages.doclib_toast_voided,
    tone: 'info',
    variant: 'danger',
  },
}

/* Prototype `recipientType()` — FR strings from the handoff. */
const RECIPIENT_TYPE: Record<RecipientType, Bi> = {
  employer: bi('Employer', 'Employeur'),
  employee: bi('Employee', 'Employé(e)'),
  manager: bi('Manager', 'Gestionnaire'),
  hr: bi('HR', 'RH'),
  external: bi('External', 'Externe'),
}

/* Prototype `auditLabel()` — FR strings from the handoff. `template_opened`
   has no entry there either; unknown events fall back to a humanized key. */
const AUDIT_LABEL: Partial<Record<AuditEventType, Bi>> = {
  generation_started: bi('Generation started', 'Génération démarrée'),
  document_created: bi('Document created', 'Document créé'),
  draft_saved: bi('Draft saved', 'Brouillon enregistré'),
  document_updated: bi('Document updated', 'Document mis à jour'),
  version_created: bi('Version created', 'Version créée'),
  review_requested: bi('Review requested', 'Révision demandée'),
  review_approved: bi('Review approved', 'Révision approuvée'),
  review_rejected: bi('Sent back for revision', 'Retourné pour révision'),
  sent_for_signature: bi('Sent for signature', 'Envoyé pour signature'),
  signature_viewed: bi('Signature viewed', 'Signature consultée'),
  signature_completed: bi('Signature completed', 'Signature complétée'),
  document_exported: bi('Document exported', 'Document exporté'),
  document_archived: bi('Archived', 'Archivé'),
  document_restored: bi('Restored', 'Restauré'),
  document_voided: bi('Voided', 'Annulé'),
  permission_changed: bi('Permission changed', 'Permission modifiée'),
  comment_added: bi('Comment added', 'Commentaire ajouté'),
}

/* Rail labels the doclib i18n dictionary doesn't carry — FR from the
   prototype's `docVals()` meta ternaries. */
const REFERENCE_LABEL: Bi = bi('Reference', 'Référence')
const TEMPLATE_VERSION_LABEL: Bi = bi('Template version', 'Version du modèle')
const CASE_FILE_LABEL: Bi = bi('Case file', 'Dossier')
const CURRENT_VERSION_LABEL: Bi = bi('Current version', 'Version actuelle')

/** Prototype `fmtDate()` — date-only strings, local midnight, short month. */
function fmtDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Recipient rows carry free-form status strings; map the known ones. */
function signatureInfo(status: string): StatusInfo | undefined {
  return status in signatureStatusInfo ? signatureStatusInfo[status as SignatureStatus] : undefined
}

/** Prototype `auditTone()` → status-dot fill. */
function auditDotClass(event: AuditEventType): string {
  if (event === 'review_rejected' || event === 'document_voided') return dotToneClass('risk')
  if (
    event === 'review_approved' ||
    event === 'signature_completed' ||
    event === 'document_exported'
  )
    return dotToneClass('success')
  if (
    event === 'sent_for_signature' ||
    event === 'signature_viewed' ||
    event === 'document_created'
  )
    return dotToneClass('info')
  return dotToneClass('neutral')
}

/** The prototype's `.cdot` — tone dot inside the status/risk chips. */
function ChipDot() {
  return (
    <span className="mr-1.25 h-1.5 w-1.5 self-center rounded-full bg-current" aria-hidden="true" />
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-300 px-7 pt-1 pb-16 max-[640px]:px-4">
      <Skel className="mb-3.5 h-3.75 w-37.5" />
      <Skel className="mb-2.5 h-7 w-110 max-w-full" />
      <Skel className="mb-4 h-5.5 w-75 max-w-full" />
      <div className="flex items-start gap-6.5 max-[1023px]:flex-col">
        <div className="min-w-0 flex-1 max-[1023px]:w-full">
          <Skel className="mb-4.5 h-9.5" />
          <Skel className="h-90" />
        </div>
        <Skel className="h-105 w-80 shrink-0 max-[1023px]:w-full" />
      </div>
    </div>
  )
}

function onTabKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  tab: TabKey,
  setTab: Dispatch<SetStateAction<TabKey>>,
) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  const index = TABS.findIndex(([key]) => key === tab)
  const step = event.key === 'ArrowRight' ? 1 : TABS.length - 1
  const next = TABS[(index + step) % TABS.length]
  if (!next) return
  setTab(next[0])
  document.getElementById(`docd-tab-${next[0]}`)?.focus()
}

type Translator = ReturnType<typeof useI18n>['t']

function DocumentActions({
  actions,
  t,
  showToast,
  onSendForSignature,
}: {
  readonly actions: DocAction[]
  readonly t: Translator
  readonly showToast: ReturnType<typeof useToasts>['showToast']
  readonly onSendForSignature: () => void
}) {
  if (actions.length === 0) return null
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {actions.map((action) => {
        const cfg = ACTION_CFG[action]
        const handle =
          action === 'send_for_signature'
            ? onSendForSignature
            : () => showToast(cfg.toast, cfg.tone)
        return (
          <ActBtn key={action} variant={cfg.variant} onClick={handle}>
            {t(cfg.label)}
          </ActBtn>
        )
      })}
    </div>
  )
}

function AccessBanner({ role, t }: { readonly role: WorkspaceRole; readonly t: Translator }) {
  if (role === 'viewer') {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-[11px] border border-border bg-inset px-3.5 py-2.75 text-text-muted">
        <Lock size={16} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
        <div className="text-[12.5px]">
          <b className="text-text">{t('doclib_docd_readOnly')}</b> · {t('doclib_docd_readOnlySub')}
        </div>
      </div>
    )
  }
  if (role === 'external') {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-[11px] bg-accent-soft px-3.5 py-2.75 text-accent">
        <Lock size={16} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
        <div className="text-[12.5px] font-medium">
          {t('doclib_docd_permDenied')} · {t('doclib_docd_readOnlySub')}
        </div>
      </div>
    )
  }
  return null
}

function ReviewBanner({
  reviewStatus,
  tone,
  t,
}: {
  readonly reviewStatus: ReviewStatus
  readonly tone: StatusInfo['tone']
  readonly t: Translator
}) {
  if (reviewStatus !== 'lawyer_review_recommended' && reviewStatus !== 'hr_review_required')
    return null
  const message =
    reviewStatus === 'lawyer_review_recommended' ? 'doclib_gen_lawyerWarn' : 'doclib_gen_hrWarn'
  const toneClass = tone === 'risk' ? 'bg-risk-bg text-risk-fg' : 'bg-warn-bg text-warn-fg'
  return (
    <div
      className={`mb-4 flex items-start gap-2.75 rounded-[11px] px-3.5 py-3 font-medium ${toneClass}`}
    >
      <TriangleAlert size={17} strokeWidth={2} className="mt-px shrink-0" aria-hidden="true" />
      <div className="text-[13px] leading-normal">{t(message)}</div>
    </div>
  )
}

/* No `lang` parameter: everything in the preview follows `doc.language`, the
   language the document was written in, rather than the workspace's locale. */
function previewData(
  doc: GeneratedDoc,
  template: DocTemplate | undefined,
  org: OrgProfile,
): {
  blocks: PreviewBlock[]
  values: Record<string, string>
  valuesByLang?: { en: Record<string, string>; fr: Record<string, string> }
  bilingual: boolean
  tokens: string[]
} {
  const blocks = template
    ? resolveBlocks(template, {
        jurisdiction: doc.jurisdiction,
        headcount: org.headcount,
        unionized: org.unionized,
        answers: doc.answers,
      })
    : []
  const bilingual = template ? isBilingualDelivery(template) : false
  const valuesByLang =
    bilingual && template
      ? bilingualMergeValues(template, doc.answers, doc.jurisdiction)
      : undefined
  return {
    blocks,
    values:
      valuesByLang?.en ??
      (template
        ? mergeFieldValues(template, doc.answers, doc.jurisdiction, doc.language)
        : doc.answers),
    valuesByLang,
    bilingual,
    tokens: template ? templateTokens(template) : Object.keys(doc.answers),
  }
}

function DocumentPreview({
  active,
  template,
  blocks,
  values,
  valuesByLang,
  bilingual,
  docLang,
}: {
  readonly active: boolean
  readonly template: DocTemplate | undefined
  readonly blocks: PreviewBlock[]
  readonly values: Record<string, string>
  readonly valuesByLang?: { en: Record<string, string>; fr: Record<string, string> }
  readonly bilingual: boolean
  readonly docLang: 'en' | 'fr'
}) {
  if (!active || !template) return null
  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-[14px]">
      <DocPaper
        blocks={blocks}
        values={values}
        valuesByLang={valuesByLang}
        bilingual={bilingual}
        docLang={docLang}
      />
    </div>
  )
}

export function DocumentDetailScreen() {
  const { mode } = useWorkspaceMode()
  if (mode === 'production') return <DocumentDetailProductionView />
  return <DocumentDetailDemoScreen />
}

function DocumentDetailDemoScreen() {
  const { t, x, lang } = useI18n()
  const { data, role, org, sendForSignature } = useDoclib()
  const { showToast } = useToasts()
  const navigate = useNavigate()
  const { docId } = useParams()
  const [tab, setTab] = useState<TabKey>('preview')
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)

  if (!data) return <DetailSkeleton />

  const doc = data.documents.find((d) => d.id === docId)
  if (!doc) return <Navigate to="/app/documents" replace />

  const template = data.templates.find((tpl) => tpl.tid === doc.templateTid)
  const statusInfo = documentStatusInfo[doc.status]
  const reviewInfo = reviewStatusInfo[doc.reviewStatus]
  const sigInfo = signatureStatusInfo[doc.signatureStatus]
  const riskInfo = riskLevelInfo[doc.risk]
  const juris = jurisdictionInfo.find((j) => j.code === doc.jurisdiction)

  const actions = docActionsFor(doc, role)

  /* Preview: conditional clauses resolved against the live org profile; merge
     values = computed tokens under the wizard answers. */
  const { blocks, values, valuesByLang, bilingual, tokens } = previewData(doc, template, org)
  const versions = [...doc.versions].sort((a, b) => b.n - a.n)
  const recipients = [...doc.recipients].sort((a, b) => a.order - b.order)
  const audit = [...doc.audit].reverse()
  const signature = doc.signature

  const employee = doc.employeeId ? data.employees.find((e) => e.id === doc.employeeId) : undefined
  const docCase = doc.caseId ? data.cases.find((c) => c.id === doc.caseId) : undefined

  /* The mono `col` strings are the handoff's authoritative Supabase column
     names — render them verbatim. */
  const metaRows: { label: string; value: string; col: string }[] = [
    { label: x(REFERENCE_LABEL), value: doc.ref, col: 'documents.id / ref' },
    {
      label: t('doclib_docd_template'),
      value: `${doc.templateTid} · ${template ? x(template.name) : doc.templateKey}`,
      col: 'documents.template_id',
    },
    {
      label: x(TEMPLATE_VERSION_LABEL),
      value: template ? `${template.version} (${fmtDate(template.effectiveDate, lang)})` : '—',
      col: 'documents.template_version_id (frozen)',
    },
    {
      label: t('doclib_docd_jurisdiction'),
      value: juris ? x(juris.name) : doc.jurisdiction,
      col: 'documents.jurisdiction',
    },
    {
      label: t('doclib_filter_language'),
      value: doc.language.toUpperCase(),
      col: 'documents.language',
    },
    {
      label: t('doclib_col_employee'),
      value: employee ? employee.name : t('doclib_repo_orgWide'),
      col: 'documents.employee_id',
    },
    {
      label: x(CASE_FILE_LABEL),
      value: docCase ? x(docCase.title) : '—',
      col: 'documents.case_id',
    },
    {
      label: x(CURRENT_VERSION_LABEL),
      value: `v${doc.currentVersion} / ${doc.versions.length}`,
      col: 'documents.current_version_id',
    },
    {
      label: t('doclib_docd_created'),
      value: `${fmtDate(doc.createdAt, lang)} · ${doc.createdBy}`,
      col: 'documents.created_by / created_at',
    },
    {
      label: t('doclib_docd_updated'),
      value: `${fmtDate(doc.updatedAt, lang)} · ${doc.updatedBy}`,
      col: 'documents.updated_by / updated_at',
    },
  ]

  return (
    <div className="mx-auto max-w-300 px-7 pt-1 pb-16 max-[640px]:px-4 max-[640px]:pb-11">
      <Link
        to="/app/documents"
        className="mb-3.5 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        {t('doclib_docd_back')}
      </Link>

      {/* ── Header ── */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-1.5 font-display text-[23px] leading-[1.2] font-semibold tracking-[-0.015em] text-text max-[640px]:text-xl">
            {x(doc.title)}
          </h1>
          <div className="mb-2.5 text-[12.5px] text-text-faint">
            {doc.templateTid} · {doc.ref} · {template ? x(template.name) : doc.templateKey}
          </div>
          <div className="flex flex-wrap items-center gap-1.75">
            <DocChip tone={statusInfo.tone}>
              <ChipDot />
              {x(statusInfo.label)}
            </DocChip>
            <DocChip tone={reviewInfo.tone}>{x(reviewInfo.label)}</DocChip>
            <DocChip tone={sigInfo.tone}>{x(sigInfo.label)}</DocChip>
            <DocChip tone={riskInfo.tone}>
              <ChipDot />
              {x(riskInfo.label)}
            </DocChip>
            <JurisdictionPill code={doc.jurisdiction} />
          </div>
        </div>
        <DocumentActions
          actions={actions}
          t={t}
          showToast={showToast}
          onSendForSignature={() => setIsSignModalOpen(true)}
        />
      </div>

      {/* ── Role banners (viewer / external get no actions) ── */}
      <AccessBanner role={role} t={t} />

      {/* ── Review-posture flag ── */}
      <ReviewBanner reviewStatus={doc.reviewStatus} tone={reviewInfo.tone} t={t} />

      <div className="flex items-start gap-6.5 max-[1023px]:flex-col">
        {/* ── Left: tabs ── */}
        <div className="min-w-0 flex-1 max-[1023px]:w-full">
          <div role="tablist" className="mb-4.5 flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map(([key, msgKey]) => (
              <button
                key={key}
                id={`docd-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={tab === key}
                aria-controls="docd-panel"
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={(event) => onTabKeyDown(event, tab, setTab)}
                className={`-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  tab === key
                    ? 'border-gold-dot text-text'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                {t(msgKey)}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="docd-panel" aria-labelledby={`docd-tab-${tab}`}>
            <DocumentPreview
              active={tab === 'preview'}
              template={template}
              blocks={blocks}
              values={values}
              valuesByLang={valuesByLang}
              bilingual={bilingual}
              docLang={doc.language}
            />

            <div
              hidden={tab !== 'fields'}
              className="overflow-hidden rounded-[14px] border border-border bg-surface"
            >
              {tokens.map((token) => {
                const question = template?.questions.find((q) => q.id === token)
                const answer = doc.answers[token]
                const filled = answer !== undefined && answer.trim() !== ''
                return (
                  <div
                    key={token}
                    className="grid grid-cols-[200px_1fr] gap-3.5 border-b border-inset px-4 py-2.75 last:border-b-0 max-[640px]:grid-cols-1 max-[640px]:gap-1"
                  >
                    <div className="text-[12.5px] font-semibold text-text-muted">
                      {question ? x(question.label) : token.replaceAll('_', ' ')}
                    </div>
                    {filled ? (
                      <div className="text-[13px] text-text">{answer}</div>
                    ) : (
                      <div>
                        <DocChip tone="warn">{t('doclib_docd_notFilled')}</DocChip>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div hidden={tab !== 'versions'} className="flex flex-col gap-2.5">
              {versions.map((version) => (
                <div
                  key={version.n}
                  className="flex items-start gap-3.25 rounded-xl border border-border bg-surface px-4 py-3.25"
                >
                  <span
                    className="min-w-7.5 shrink-0 font-display text-[13px] font-bold text-navy"
                    aria-label={`${t('doclib_docd_version')} ${version.n}`}
                  >
                    v{version.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.75 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-text">
                        {x(version.changeSummary)}
                      </span>
                      {version.n === doc.currentVersion && (
                        <DocChip tone="ok">{t('doclib_docd_current')}</DocChip>
                      )}
                    </div>
                    <div className="text-[11.5px] text-text-faint">
                      {fmtDate(version.createdAt, lang)} · {t('doclib_docd_by')} {version.createdBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div hidden={tab !== 'recipients'}>
              {signature && (
                <div className="mb-3.5 rounded-[13px] border border-border bg-surface px-4.25 py-3.75">
                  <div className="mb-1.5 font-display text-[11px] font-bold tracking-[0.06em] text-text-muted uppercase">
                    {t('doclib_docd_provider')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-text">
                    <span className="font-semibold">{signature.provider}</span>
                    <span className="inline-flex items-center rounded-md border border-border bg-inset px-1.75 py-px text-[11px] font-semibold text-text-muted">
                      {t('doclib_docd_envelope')} {signature.envelopeId}
                    </span>
                    <DocChip tone={signatureStatusInfo[signature.status].tone}>
                      {x(signatureStatusInfo[signature.status].label)}
                    </DocChip>
                  </div>
                  {(signature.sentAt || signature.viewedAt || signature.signedAt) && (
                    <div className="mt-1.75 text-[11.5px] text-text-muted">
                      {[
                        signature.sentAt &&
                          `${x(signatureStatusInfo.sent.label)} ${fmtDate(signature.sentAt, lang)}`,
                        signature.viewedAt &&
                          `${x(signatureStatusInfo.viewed.label)} ${fmtDate(signature.viewedAt, lang)}`,
                        signature.signedAt &&
                          `${x(signatureStatusInfo.signed.label)} ${fmtDate(signature.signedAt, lang)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                  <div className="mt-2.25 text-[11.5px] text-text-faint">
                    {t('doclib_docd_providerAgnostic')}
                  </div>
                </div>
              )}

              {recipients.length === 0 ? (
                <div className="rounded-[13px] border border-dashed border-border px-4 py-8.5 text-center text-[13px] text-text-muted">
                  {t('doclib_docd_noRecipients')}
                </div>
              ) : (
                recipients.map((recipient) => {
                  const info = signatureInfo(recipient.status)
                  return (
                    <div
                      key={`${recipient.order}-${recipient.email}`}
                      className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                    >
                      <span
                        aria-label={`${t('doclib_docd_order')} ${recipient.order}`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-inset text-[11px] font-bold text-text-muted"
                      >
                        {recipient.order}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-text">{recipient.name}</div>
                        <div className="text-[11.5px] text-text-faint">
                          {x(RECIPIENT_TYPE[recipient.type])} · {recipient.email}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {info ? (
                          <DocChip tone={info.tone}>{x(info.label)}</DocChip>
                        ) : (
                          <DocChip tone="neutral">{recipient.status}</DocChip>
                        )}
                        <div className="mt-0.75 text-[11px] text-text-faint">
                          {recipient.signedAt ? fmtDate(recipient.signedAt, lang) : '—'}
                        </div>
                        {signature && recipient.status !== 'signed' && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/app/documents/sign/${signature.envelopeId}?recipient=${encodeURIComponent(recipient.email)}`,
                              )
                            }
                            className="mt-2 rounded-lg bg-navy px-2.5 py-1 text-[11.5px] font-semibold text-white"
                          >
                            {t('doclib_docd_sign')}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div
              hidden={tab !== 'audit'}
              className="rounded-[14px] border border-border bg-surface px-4.5 py-1.5"
            >
              {audit.map((event, index) => {
                const label = AUDIT_LABEL[event.event]
                return (
                  <div
                    key={`${event.at}-${index}`}
                    className="flex items-start gap-3.25 border-b border-inset py-3 last:border-b-0"
                  >
                    <span
                      className={`mt-1.25 h-2.25 w-2.25 shrink-0 rounded-full ${auditDotClass(event.event)}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-text">
                        {label ? x(label) : event.event.replaceAll('_', ' ')}
                      </div>
                      {event.meta && (
                        <div className="mt-px text-xs text-text-muted">{event.meta}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-text-muted">{event.actor}</div>
                      <div className="text-[11px] text-text-faint">{event.at}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Right: metadata rail ── */}
        <aside className="w-80 shrink-0 max-[1023px]:w-full min-[1024px]:sticky min-[1024px]:top-[14px]">
          <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
            {/* Handoff schema-speak header — literal on purpose. */}
            <div className="border-b border-border bg-inset px-4 py-3 font-display text-[11px] font-bold tracking-[0.12em] text-text-muted uppercase">
              Details · documents
            </div>
            <div className="px-4 pt-1 pb-2">
              {metaRows.map((row) => (
                <div key={row.col} className="border-b border-inset py-2.25 last:border-b-0">
                  <div className="mb-0.5 text-[11px] text-text-muted">{row.label}</div>
                  <div className="text-[13px] leading-[1.35] font-medium text-text">
                    {row.value}
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-text-faint">{row.col}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {isSignModalOpen && (
        <SignatureModal
          docRef={doc.ref}
          initialRecipients={doc.recipients}
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSend={(recipients) => {
            sendForSignature(doc.id, recipients)
            setIsSignModalOpen(false)
            showToast(doclibMessages.doclib_toast_sent, 'info')
            setTab('recipients')
          }}
        />
      )}

      <Disclaimer variant="block" className="mt-5" />
    </div>
  )
}
