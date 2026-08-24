import { Link, Navigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowRight, ChevronLeft, CircleCheck, Scale, TriangleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { Disclaimer } from '@/components/Disclaimer'
import { dotToneClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { useDoclib } from '../doclibContext'
import { applicability, computedTokens, resolveBlocks } from '../engine'
import type { ApplicabilityKind } from '../engine'
import { DocChip, DocPaper, JurisdictionPill, Skel } from '../components'
import { jurisdictionInfo, reviewStatusInfo, riskLevelInfo, sectors, sizeTiers } from '../data'
import type { DocChipTone } from '../data'

/**
 * Template detail (/app/documents/templates/:tid) — the prototype's
 * "TEMPLATE DETAIL" view: header chips + name, review-posture callout,
 * applicability verdict for the org profile, per-jurisdiction legal notes,
 * what's-included / statutory lists, and a sticky right rail with the sample
 * rendered preview and the Generate CTA.
 */

/* Horizontal pad lives on DocumentsLayout / AppPage; keep vertical spacing only. */
const PAGE_PAD = 'pt-1 pb-[64px]'

/** Applicability verdict → chip tone (prototype `applicability()` tones). */
const APPLIC_TONE: Record<ApplicabilityKind, DocChipTone> = {
  required: 'warn',
  applies: 'ok',
  below: 'neutral',
  union: 'info',
}

/** Doclib chip tone → status-dot tone (the prototype chips' `.cdot`). */
const DOT_TONE: Record<DocChipTone, ChipTone> = {
  ok: 'success',
  warn: 'warning',
  risk: 'risk',
  info: 'info',
  neutral: 'neutral',
  gold: 'warning',
}

function ChipDot({ tone }: { readonly tone: DocChipTone }) {
  return (
    <span
      className={`mr-[6px] h-[6px] w-[6px] self-center rounded-full ${dotToneClass(DOT_TONE[tone])}`}
      aria-hidden="true"
    />
  )
}

/** Uppercase section eyebrow (prototype 11px/700, .14em tracking). */
function Eyebrow({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mb-[11px] font-display text-[11px] font-bold tracking-[0.14em] text-text-muted uppercase">
      {children}
    </div>
  )
}

/** jchip-style org-profile chip (generic content, unlike JurisdictionPill). */
function OrgChip({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[6px] border border-border bg-inset px-[6px] py-px text-[10.5px] font-bold tracking-[0.04em] text-text-muted">
      {children}
    </span>
  )
}

/** '2026-06-18' → 'Jun 18, 2026' / '18 juin 2026' (local-safe, no UTC shift). */
function fmtDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y + m + d)) return iso
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function MetaLine({
  version,
  updated,
  est,
  className,
}: {
  readonly version: string
  readonly updated: string
  readonly est: number
  readonly className?: string
}) {
  const { t } = useI18n()
  const sep = (
    <span className="text-text-faint" aria-hidden="true">
      ·
    </span>
  )
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-[11.5px] text-text-muted ${className ?? ''}`}
    >
      <span>
        {t('doclib_detail_version')} <b className="font-semibold text-text">{version}</b>
      </span>
      {sep}
      <span>
        {t('doclib_detail_updated')} <b className="font-semibold text-text">{updated}</b>
      </span>
      {sep}
      <span>
        {t('doclib_detail_est')}{' '}
        <b className="font-semibold text-text">
          {est} {t('doclib_studio_est')}
        </b>
      </span>
    </div>
  )
}

/** Loading layout — mirrors the two-column shape while the catalogue loads. */
function DetailSkeleton() {
  return (
    <div className={PAGE_PAD}>
      <Skel className="mb-5 h-[18px] w-[130px]" />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <div className="flex gap-2">
            <Skel className="h-[22px] w-[46px]" />
            <Skel className="h-[22px] w-[88px]" />
          </div>
          <Skel className="mt-3 h-[32px] w-3/5" />
          <Skel className="mt-3 h-[15px] w-4/5" />
          <Skel className="mt-2 h-[15px] w-2/3" />
          <Skel className="mt-6 h-[74px]" />
          <Skel className="mt-3 h-[74px]" />
          <Skel className="mt-3 h-[74px]" />
        </div>
        <Skel className="h-[430px]" />
      </div>
    </div>
  )
}

export function TemplateDetailScreen() {
  const { t, x, lang } = useI18n()
  const { data, org } = useDoclib()
  const { tid } = useParams<{ tid: string }>()

  if (!data) return <DetailSkeleton />

  const template = data.templates.find((candidate) => candidate.tid === tid)
  if (!template) return <Navigate to="/app/documents/studio" replace />

  const risk = riskLevelInfo[template.risk]
  const review = reviewStatusInfo[template.review]
  const reviewFlagged =
    template.requiresLawyerReview || template.review === 'lawyer_review_recommended'
  const applic = applicability(template, org)
  const applicTone = APPLIC_TONE[applic.kind]

  const blocks = resolveBlocks(template, {
    jurisdiction: org.primaryJurisdiction,
    headcount: org.headcount,
    unionized: org.unionized,
  })
  const values = computedTokens(
    org.primaryJurisdiction,
    lang,
    new Date().toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA'),
  )

  const jNotes = template.jurisdictions.flatMap((code) => {
    const note = template.jurisdictionNotes[code]
    if (!note) return []
    const info = jurisdictionInfo.find((j) => j.code === code)
    return [{ code, name: info ? x(info.name) : code, note }]
  })

  const tier = sizeTiers.find(
    (candidate) =>
      org.headcount >= candidate.min && (candidate.max === null || org.headcount <= candidate.max),
  )
  const sector = sectors.find((candidate) => candidate.key === org.sector)
  const updated = fmtDate(template.updatedAt, lang)

  return (
    <div className={PAGE_PAD}>
      <Link
        to="/app/documents/studio"
        className="mb-4 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        {t('doclib_detail_back')}
      </Link>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="mb-[10px] flex flex-wrap items-center gap-[10px]">
            <span className="rounded-[6px] border border-gold-border bg-gold-bg px-2 py-[2px] font-display text-[12px] font-bold tracking-[0.06em] text-gold-fg">
              {template.tid}
            </span>
            <DocChip tone={risk.tone}>
              <ChipDot tone={risk.tone} />
              {x(risk.label)}
            </DocChip>
            {reviewFlagged && <DocChip tone={review.tone}>{x(review.label)}</DocChip>}
          </div>

          <h1 className="mb-2 font-display text-[27px] leading-[1.15] font-semibold tracking-[-0.02em] text-text">
            {x(template.name)}
          </h1>
          <MetaLine version={template.version} updated={updated} est={template.estMinutes} />

          {reviewFlagged && (
            <div
              className={`mt-[18px] flex items-start gap-[11px] rounded-[12px] px-[15px] py-[13px] text-[13px] leading-normal font-medium ${
                review.tone === 'risk' ? 'bg-risk-bg text-risk-fg' : 'bg-warn-bg text-warn-fg'
              }`}
            >
              <TriangleAlert
                size={17}
                strokeWidth={2}
                className="mt-px shrink-0"
                aria-hidden="true"
              />
              <div>
                {t(template.requiresLawyerReview ? 'doclib_gen_lawyerWarn' : 'doclib_gen_hrWarn')}
              </div>
            </div>
          )}

          <section className="mt-6">
            <Eyebrow>{t('doclib_detail_about')}</Eyebrow>
            <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-text-muted">
              {x(template.desc)}
            </p>
          </section>

          <section className="mt-6">
            <Eyebrow>{t('doclib_applic_title')}</Eyebrow>
            <div className="rounded-[12px] border border-border bg-surface px-4 py-[14px]">
              <div className="mb-[11px] flex flex-wrap gap-[7px]">
                {tier && (
                  <OrgChip>
                    {x(tier.label)} · {org.headcount} {t('doclib_profile_employees')}
                  </OrgChip>
                )}
                <OrgChip>
                  {t(org.unionized ? 'doclib_profile_union' : 'doclib_profile_nonunion')}
                </OrgChip>
                {sector && <OrgChip>{x(sector.name)}</OrgChip>}
              </div>
              <div className="flex flex-wrap items-start gap-[10px]">
                <DocChip tone={applicTone}>
                  <ChipDot tone={applicTone} />
                  {x(applic.label)}
                </DocChip>
                <span className="min-w-0 flex-1 basis-[220px] text-[12.5px] leading-normal text-text-muted">
                  {x(applic.reason)}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <Eyebrow>{t('doclib_detail_supports')}</Eyebrow>
            <div className="flex flex-col gap-2">
              {jNotes.map((row) => (
                <div
                  key={row.code}
                  className="flex items-start gap-3 rounded-[11px] border border-border bg-surface px-[14px] py-3"
                >
                  <JurisdictionPill code={row.code} />
                  <div className="min-w-0">
                    <div className="mb-[2px] text-[13px] font-semibold text-text">{row.name}</div>
                    <div className="text-[12.5px] leading-normal text-text-muted">
                      {x(row.note)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid gap-[22px] min-[641px]:grid-cols-2">
            <section>
              <Eyebrow>{t('doclib_detail_includes')}</Eyebrow>
              <ul className="flex flex-col gap-[7px]">
                {template.includes.map((item) => (
                  <li key={item.en} className="flex items-start gap-2 text-[13px] text-text">
                    <CircleCheck
                      size={14}
                      strokeWidth={2.2}
                      className="mt-[3px] shrink-0 text-ok-fg"
                      aria-hidden="true"
                    />
                    {x(item)}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <Eyebrow>{t('doclib_detail_statutory')}</Eyebrow>
              <ul className="flex flex-col gap-[7px]">
                {template.statutory.map((item) => (
                  <li key={item.en} className="flex items-start gap-2 text-[12.5px] text-text">
                    <Scale
                      size={14}
                      strokeWidth={1.8}
                      className="mt-[2px] shrink-0 text-gold-fg"
                      aria-hidden="true"
                    />
                    {x(item)}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* ── Right rail — sample preview + CTA ───────────────────────── */}
        <aside className="min-w-0 lg:sticky lg:top-4">
          <div className="mb-[6px] font-display text-[11px] font-bold tracking-[0.14em] text-text-muted uppercase">
            {t('doclib_detail_preview')}
          </div>
          <MetaLine
            version={template.version}
            updated={updated}
            est={template.estMinutes}
            className="mb-[10px]"
          />
          <DocPaper blocks={blocks} values={values} className="max-h-[56vh] overflow-y-auto" />
          <p className="mt-2 text-[11px] leading-normal text-text-faint">
            {t('doclib_detail_mergeNote')}
          </p>
          <Link
            to={`/app/documents/generate/${template.id}`}
            className="gold-button mt-[14px] min-h-[46px] w-full text-[14px]"
          >
            {t('doclib_detail_generate')}
            <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </aside>
      </div>

      <Disclaimer variant="block" className="mt-8 max-w-[62ch]" />
    </div>
  )
}
