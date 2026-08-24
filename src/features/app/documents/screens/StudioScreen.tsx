import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Info, Scale, Search, SearchX } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useDoclib } from '../doclibContext'
import { applicability } from '../engine'
import type { ApplicabilityKind } from '../engine'
import { DocChip, JurisdictionPill, SegButton, Skel } from '../components'
/* Static reference meta only (allowed direct import) — catalogue rows
   (templates/categories) always come through useDoclib().data. */
import { jurisdictionInfo, reviewStatusInfo, riskLevelInfo, sectors, sizeTiers } from '../data'
import type {
  DocChipTone,
  DocRiskLevel,
  DocTemplate,
  Jurisdiction,
  OrgProfile,
  SizeTier,
  TemplateCategoryId,
} from '../data'

/** Applicability chip tone per the handoff: required→gold, applies→ok, below→neutral, union→warn. */
const APPLIC_TONE: Record<ApplicabilityKind, DocChipTone> = {
  required: 'gold',
  applies: 'ok',
  below: 'neutral',
  union: 'warn',
}

const RISK_LEVELS: DocRiskLevel[] = ['low', 'medium', 'high']

const SELECT_CLASS =
  'h-[40px] cursor-pointer rounded-[9px] border border-border-strong bg-surface px-[12px] text-[13px] font-medium text-text'

function tierFor(headcount: number): SizeTier | undefined {
  return sizeTiers.find((t) => headcount >= t.min && (t.max === null || headcount <= t.max))
}

/** Tiny uppercase control label used inside the org profile bar. */
function ControlLabel({
  htmlFor,
  children,
}: {
  readonly htmlFor: string
  readonly children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[9.5px] font-bold tracking-widest text-text-faint uppercase"
    >
      {children}
    </label>
  )
}

/** Neutral meta pill (sector · regulation, jurisdiction name) — .jchip in the prototype. */
function MetaPill({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[6px] border border-border bg-inset px-[7px] py-[2px] text-[11px] font-semibold whitespace-nowrap text-text-muted">
      {children}
    </span>
  )
}

/**
 * Org compliance profile bar — headcount, union status, and sector drive the
 * applicability engine live across the template grid below.
 */
function OrgProfileBar({
  org,
  setOrg,
}: {
  readonly org: OrgProfile
  readonly setOrg: (org: OrgProfile) => void
}) {
  const { t, x } = useI18n()
  const tier = tierFor(org.headcount)
  const sector = sectors.find((s) => s.key === org.sector)
  const federallyRegulated = sector?.federallyRegulated ?? false
  const juris = jurisdictionInfo.find(
    (j) => j.code === (federallyRegulated ? 'FED' : org.primaryJurisdiction),
  )

  return (
    <section
      aria-label={t('doclib_profile_title')}
      className="mb-5 flex flex-wrap items-center gap-3 rounded-[12px] border border-border bg-surface px-[14px] py-[11px] max-[640px]:px-[10px]"
    >
      <div className="flex items-center gap-[9px]">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-navy text-gold-on-navy">
          <Building2 size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <div className="text-[12.5px] font-bold text-text">{t('doclib_profile_title')}</div>
          <div className="text-[11px] text-text-muted">{t('doclib_profile_sub')}</div>
        </div>
      </div>
      <span className="h-[28px] w-px bg-border max-[1023px]:hidden" aria-hidden="true" />
      <DocChip tone="gold">
        {tier ? x(tier.label) : ''} · {org.headcount}
      </DocChip>
      <MetaPill>
        {sector ? x(sector.name) : org.sector} ·{' '}
        {federallyRegulated ? t('doclib_profile_regulated') : t('doclib_profile_provincial')}
      </MetaPill>
      {juris && <MetaPill>{x(juris.name)}</MetaPill>}

      <div className="ml-auto flex flex-wrap items-center gap-2 max-[1023px]:ml-0 max-[1023px]:w-full">
        <ControlLabel htmlFor="doclib-org-headcount">{t('doclib_profile_headcount')}</ControlLabel>
        <input
          id="doclib-org-headcount"
          type="number"
          min={1}
          value={org.headcount}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10)
            if (!Number.isNaN(next)) setOrg({ ...org, headcount: Math.max(1, next) })
          }}
          className="h-[32px] w-[72px] rounded-[8px] border border-border-strong bg-surface px-[10px] text-[12px] font-semibold text-text"
        />
        <ControlLabel htmlFor="doclib-org-sector">{t('doclib_profile_sector')}</ControlLabel>
        <select
          id="doclib-org-sector"
          value={org.sector}
          onChange={(event) => setOrg({ ...org, sector: event.target.value })}
          className="h-[32px] max-w-[190px] cursor-pointer truncate rounded-[8px] border border-border-strong bg-surface px-[10px] text-[12px] font-semibold text-text"
        >
          {sectors.map((s) => (
            <option key={s.key} value={s.key}>
              {x(s.name)}
            </option>
          ))}
        </select>
        <fieldset className="flex items-center gap-[2px] rounded-[10px] bg-inset p-[3px]">
          <legend className="sr-only">{t('doclib_profile_unionToggle')}</legend>
          <SegButton active={!org.unionized} onClick={() => setOrg({ ...org, unionized: false })}>
            {t('doclib_profile_nonunion')}
          </SegButton>
          <SegButton active={org.unionized} onClick={() => setOrg({ ...org, unionized: true })}>
            {t('doclib_profile_union')}
          </SegButton>
        </fieldset>
      </div>
    </section>
  )
}

function TemplateCard({
  template,
  org,
}: {
  readonly template: DocTemplate
  readonly org: OrgProfile
}) {
  const { t, x } = useI18n()
  const risk = riskLevelInfo[template.risk]
  const applic = applicability(template, org)

  return (
    <article
      aria-label={x(template.name)}
      className="flex flex-col rounded-[14px] border border-border bg-surface p-4 transition-shadow hover:shadow-sm max-[640px]:p-3"
    >
      <div className="mb-[10px] flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-text-faint">
          {template.tid}
        </span>
        <DocChip tone={risk.tone}>{x(risk.label)}</DocChip>
      </div>
      <div className="mb-[5px] text-[14.5px] leading-[1.35] font-semibold text-text">
        {x(template.name)}
      </div>
      <p className="mb-3 line-clamp-2 flex-1 text-[12.5px] leading-normal text-text-muted">
        {x(template.desc)}
      </p>
      <div className="mb-[10px] flex flex-wrap items-center gap-[6px]">
        {template.jurisdictions.map((code) => (
          <JurisdictionPill key={code} code={code} />
        ))}
        {template.requiresLawyerReview && (
          <span className="ml-auto">
            <DocChip tone="warn">
              <Scale size={11} strokeWidth={2} className="mr-1 self-center" aria-hidden="true" />
              {x(reviewStatusInfo[template.review].label)}
            </DocChip>
          </span>
        )}
      </div>
      <div className="mb-[10px]">
        <DocChip tone={APPLIC_TONE[applic.kind]}>{x(applic.label)}</DocChip>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-border-soft pt-[11px] text-[11.5px] text-text-faint">
        <span>{template.version}</span>
        <span aria-hidden="true">·</span>
        <span>
          {template.estMinutes} {t('doclib_studio_est')}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {template.usageCount} {t('doclib_studio_uses')}
        </span>
        <span className="ml-auto flex items-center gap-[6px]">
          <Link
            to={`/app/documents/templates/${template.tid}`}
            className="inline-flex items-center rounded-[7px] border border-border bg-surface px-[10px] py-[5px] text-[11.5px] font-bold text-text transition-colors hover:bg-inset"
          >
            {t('doclib_studio_open')}
          </Link>
          <Link
            to={`/app/documents/generate/${template.id}`}
            className="inline-flex items-center gap-[5px] rounded-[7px] bg-navy px-[11px] py-[6px] text-[11.5px] font-bold text-white transition-colors hover:opacity-90"
          >
            {t('doclib_studio_generate')}
            <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </span>
      </div>
    </article>
  )
}

/** Loading layout: header lines + profile bar + toolbar + six card shimmers. */
function StudioSkeleton() {
  return (
    <div className="pb-16">
      <Skel className="mb-3 h-4 w-[200px]" />
      <Skel className="mb-[22px] h-[30px] w-[340px] max-w-full" />
      <Skel className="mb-5 h-[56px] w-full" />
      <Skel className="mb-[26px] h-[44px] w-full" />
      <Skel className="mb-[14px] h-5 w-[160px]" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Skel key={index} className="h-[190px]" />
        ))}
      </div>
    </div>
  )
}

/**
 * Document Studio — the template library. Filterable catalogue of the
 * jurisdiction-aware templates, grouped by category, with the editable org
 * compliance profile driving each card's applicability chip live.
 */
export function StudioScreen() {
  const { t, x } = useI18n()
  const { data, org, setOrg } = useDoclib()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<TemplateCategoryId | 'all'>('all')
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | 'all'>('all')
  const [risk, setRisk] = useState<DocRiskLevel | 'all'>('all')

  if (!data) return <StudioSkeleton />

  const q = query.trim().toLowerCase()
  const filtered = data.templates.filter((tpl) => {
    if (category !== 'all' && tpl.category !== category) return false
    if (jurisdiction !== 'all' && !tpl.jurisdictions.includes(jurisdiction)) return false
    if (risk !== 'all' && tpl.risk !== risk) return false
    if (q !== '') {
      const hay =
        `${tpl.tid} ${tpl.name.en} ${tpl.name.fr} ${tpl.desc.en} ${tpl.desc.fr}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const groups = [...data.categories]
    .sort((a, b) => a.order - b.order)
    .map((cat) => ({ category: cat, templates: filtered.filter((tpl) => tpl.category === cat.id) }))
    .filter((group) => group.templates.length > 0)
  const filtersActive = q !== '' || category !== 'all' || jurisdiction !== 'all' || risk !== 'all'
  /* "Search 24 templates…" / "Rechercher parmi 24 modèles…" — composed rather
     than a fixed string, so the catalogue size is stated from the catalogue. */
  const searchPlaceholder = `${t('doclib_studio_searchPh')} ${data.templates.length} ${t('doclib_studio_results')}…`
  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setJurisdiction('all')
    setRisk('all')
  }

  return (
    <div className="pb-16">
      {/* ── Header — topbar owns the route title; lead with eyebrow + subtitle ── */}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-[7px] font-display text-[11px] font-bold tracking-[0.16em] text-gold-fg uppercase">
            {t('doclib_studio_eyebrow')}
          </div>
          <p className="max-w-[60ch] text-[14px] leading-[1.55] text-text-muted">
            {t('doclib_studio_subtitle')}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-[18px] text-[12.5px] text-text-muted">
          <span>
            <span className="font-display text-[20px] font-bold text-gold-fg">
              {data.templates.length}
            </span>{' '}
            {t('doclib_studio_results')}
          </span>
          <span>
            <span className="font-display text-[20px] font-bold text-navy">
              {jurisdictionInfo.length}
            </span>{' '}
            {t('doclib_studio_jurisdictions')}
          </span>
        </div>
      </div>

      {/* ── Library vs repository note ── */}
      <div className="mb-5 flex items-center gap-[10px] rounded-[11px] border border-gold-border bg-gold-bg px-[14px] py-[11px]">
        <Info size={16} strokeWidth={1.9} className="shrink-0 text-gold-fg" aria-hidden="true" />
        <span className="text-[12.5px] leading-normal text-text-2">
          {t('doclib_studio_libraryVsRepo')}
        </span>
      </div>

      <OrgProfileBar org={org} setOrg={setOrg} />

      {/* ── Toolbar ── */}
      <div className="mb-[22px] flex flex-wrap items-center gap-[10px]">
        <div className="relative flex min-w-[220px] flex-1 items-center">
          <Search
            size={16}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-3 text-text-faint"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-[40px] w-full rounded-[9px] border border-border-strong bg-surface pr-3 pl-9 text-[13.5px] text-text"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as TemplateCategoryId | 'all')}
          aria-label={t('doclib_studio_category')}
          className={SELECT_CLASS}
        >
          <option value="all">{t('doclib_studio_all')}</option>
          {[...data.categories]
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {x(cat.name)}
              </option>
            ))}
        </select>
        <select
          value={jurisdiction}
          onChange={(event) => setJurisdiction(event.target.value as Jurisdiction | 'all')}
          aria-label={t('doclib_studio_jurisdiction')}
          className={SELECT_CLASS}
        >
          <option value="all">{t('doclib_studio_all')}</option>
          {jurisdictionInfo.map((info) => (
            <option key={info.code} value={info.code}>
              {x(info.name)}
            </option>
          ))}
        </select>
        <select
          value={risk}
          onChange={(event) => setRisk(event.target.value as DocRiskLevel | 'all')}
          aria-label={t('doclib_studio_risk')}
          className={SELECT_CLASS}
        >
          <option value="all">{t('doclib_studio_all')}</option>
          {RISK_LEVELS.map((level) => (
            <option key={level} value={level}>
              {x(riskLevelInfo[level].label)}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-[34px] cursor-pointer px-2 text-[12px] font-semibold text-gold-fg"
          >
            {t('doclib_studio_clear')}
          </button>
        )}
        <span className="text-[12.5px] font-semibold whitespace-nowrap text-text-muted">
          {`${filtered.length} ${filtered.length === 1 ? t('doclib_studio_result') : t('doclib_studio_results')}`}
        </span>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-border-strong bg-surface px-5 py-16 text-center">
          <div className="mx-auto mb-[14px] grid h-12 w-12 place-items-center rounded-[12px] bg-inset text-text-3">
            <SearchX size={22} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="mb-[5px] text-[15px] font-semibold text-text">
            {t('doclib_studio_noResults')}
          </div>
          <div className="mb-4 text-[13px] text-text-muted">{t('doclib_studio_noResultsSub')}</div>
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer rounded-[8px] border border-border-strong bg-surface px-4 py-2 text-[13px] font-semibold text-text"
          >
            {t('doclib_studio_clear')}
          </button>
        </div>
      )}

      {/* ── Grouped template grid ── */}
      {groups.map((group) => (
        <section key={group.category.id} className="mb-[30px]">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-[10px] gap-y-1">
            <h2 className="font-display text-[15px] font-semibold text-text">
              {x(group.category.name)}
            </h2>
            <span className="text-[12px] text-text-faint">{group.templates.length}</span>
            <span className="min-w-0 truncate text-[12px] text-text-muted max-[640px]:hidden">
              {x(group.category.desc)}
            </span>
            <span
              className="h-px min-w-[40px] flex-1 self-center bg-border-soft"
              aria-hidden="true"
            />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-4">
            {group.templates.map((template) => (
              <TemplateCard key={template.id} template={template} org={org} />
            ))}
          </div>
        </section>
      ))}

      <p className="mt-2 text-[11px] text-text-faint">{t('doclib_disc_full')}</p>
    </div>
  )
}
