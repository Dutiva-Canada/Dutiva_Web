import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, SearchX, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useLgUp } from '@/lib/useMediaQuery'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { markEmptyWorkspaceStudioVisited } from '@/features/app/workspaceMode/emptyWorkspaceOnboarding'
import { useDoclib } from '../doclibContext'
import { Skel } from '../components'
import type {
  DocRiskLevel,
  DocTemplate,
  Jurisdiction,
  OrgProfile,
  TemplateCategoryId,
} from '../data'
import {
  compareTemplatesForOrg,
  draftingDocuments,
  filterTemplates,
  groupTemplatesByCategory,
  presentApplicability,
} from '../presentation'
import { ApplicabilitySummary } from './studio/ApplicabilitySummary'
import { ContinueDrafting } from './studio/ContinueDrafting'
import { RecommendedStrip } from './studio/RecommendedStrip'
import { SelectedTemplatePanel } from './studio/SelectedTemplatePanel'
import { TemplateCard } from './studio/TemplateCard'
import { TemplateListRow } from './studio/TemplateListRow'
import {
  StudioChips,
  StudioFiltersPanel,
  StudioFiltersPopover,
  StudioFiltersSheet,
} from './studio/StudioFilters'
import type { StudioFilterValue } from './studio/StudioFilters'

function StudioSkeleton() {
  return (
    <div className="pb-16">
      <Skel className="mb-2 h-7 w-[420px] max-w-full" />
      <Skel className="mb-4 h-4 w-[320px] max-w-full" />
      <Skel className="mb-4 h-[36px] w-full max-w-[420px] rounded-full" />
      <Skel className="mb-4 h-[44px] w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)]">
        <Skel className="h-[420px] w-full" />
        <Skel className="h-[420px] w-full" />
      </div>
    </div>
  )
}

function isOrgRecommended(template: DocTemplate, org: OrgProfile) {
  const kind = presentApplicability(template, org).kind
  return kind === 'required' || kind === 'recommended'
}

/**
 * Templates sub-tab — curated catalogue: profile pill, search + quick chips,
 * a "Recommended for your organization" rail, a Continue-drafting rail, then
 * the full catalogue grouped by need. Filters live behind the search-bar
 * button — a bottom sheet below lg, an anchored popover on lg+.
 * Below lg the catalogue is a card feed (Preview → detail, Use template →
 * generate); on lg+ it stays a dense master-detail list since the detail
 * panel is already on screen. Routes remain `/documents/studio`.
 */
export function StudioScreen() {
  const { t, x } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()
  const { data, org, setOrg } = useDoclib()
  const lgUp = useLgUp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<TemplateCategoryId | 'all'>('all')
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | 'all'>('all')
  const [reviewLevel, setReviewLevel] = useState<DocRiskLevel | 'all'>('all')
  const [recommendedOnly, setRecommendedOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()
  const countId = useId()
  const detailHeadingId = 'doclib-selected-template-title'

  useEffect(() => {
    if (mode === 'production') markEmptyWorkspaceStudioVisited(organizationId)
  }, [mode, organizationId])

  useEffect(() => {
    if (lgUp) {
      setMobileShowDetail(false)
      return
    }
    setFiltersOpen(false)
  }, [lgUp])

  const filtered = useMemo(() => {
    if (!data) return [] as DocTemplate[]
    let list = filterTemplates(data.templates, {
      query,
      category,
      jurisdiction,
      reviewLevel,
    })
    if (recommendedOnly) list = list.filter((tpl) => isOrgRecommended(tpl, org))
    return [...list].sort((a, b) => compareTemplatesForOrg(a, b, org))
  }, [data, query, category, jurisdiction, reviewLevel, recommendedOnly, org])

  const recommended = useMemo(() => {
    if (!data) return [] as DocTemplate[]
    return data.templates
      .filter((tpl) => isOrgRecommended(tpl, org))
      .sort((a, b) => compareTemplatesForOrg(a, b, org))
      .slice(0, 5)
  }, [data, org])

  const drafts = useMemo(
    () => (data ? draftingDocuments(data.documents) : []),
    [data],
  )

  /* Keep selection in the filtered set; pick top recommendation when empty. */
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null)
      return
    }
    if (selectedId && filtered.some((tpl) => tpl.id === selectedId)) return
    setSelectedId(filtered[0]?.id ?? null)
  }, [filtered, selectedId])

  if (!data) return <StudioSkeleton />

  const selected = filtered.find((tpl) => tpl.id === selectedId) ?? null
  const filtersActive =
    query.trim() !== '' ||
    category !== 'all' ||
    jurisdiction !== 'all' ||
    reviewLevel !== 'all' ||
    recommendedOnly
  const browsing = category === 'all' && query.trim() === '' && !recommendedOnly
  const groups = browsing ? groupTemplatesByCategory(filtered, data.categories) : []
  const countLabel = `${filtered.length} ${
    filtered.length === 1 ? t('doclib_studio_result') : t('doclib_studio_results')
  }`
  const activePanelFilters =
    (category !== 'all' ? 1 : 0) + (jurisdiction !== 'all' ? 1 : 0) + (reviewLevel !== 'all' ? 1 : 0)
  const showCatalogue = lgUp || !mobileShowDetail
  const showDetail = lgUp || mobileShowDetail
  const filterValue: StudioFilterValue = { category, jurisdiction, reviewLevel }

  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setJurisdiction('all')
    setReviewLevel('all')
    setRecommendedOnly(false)
  }

  const clearPanelFilters = () => {
    setCategory('all')
    setJurisdiction('all')
    setReviewLevel('all')
  }

  const closeFilters = () => {
    setFiltersOpen(false)
    filterButtonRef.current?.focus()
  }

  const applyFilterValue = (next: StudioFilterValue) => {
    setCategory(next.category)
    setJurisdiction(next.jurisdiction)
    setReviewLevel(next.reviewLevel)
  }

  const selectTemplate = (id: string) => {
    setSelectedId(id)
    if (!lgUp) setMobileShowDetail(true)
    requestAnimationFrame(() => {
      document.getElementById(detailHeadingId)?.focus()
    })
  }

  const backToList = () => {
    setMobileShowDetail(false)
    requestAnimationFrame(() => {
      document.getElementById('doclib-catalogue-heading')?.focus()
    })
  }

  const filtersPanel = (
    <StudioFiltersPanel
      value={filterValue}
      categories={data.categories}
      resultCount={filtered.length}
      onChange={applyFilterValue}
      onClear={clearPanelFilters}
      onDone={closeFilters}
    />
  )

  const emptyState = (
    <div className="rounded-[12px] border border-border bg-surface px-4 py-12 text-center lg:rounded-none lg:border-0">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-[10px] bg-inset text-text-3">
        <SearchX size={20} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <div className="text-[14px] font-semibold text-text">{t('doclib_studio_noResults')}</div>
      <div className="mt-1 text-[12.5px] text-text-muted">{t('doclib_studio_noResultsSub')}</div>
      <button
        type="button"
        onClick={clearFilters}
        className="mt-3 cursor-pointer rounded-[8px] border border-border-strong bg-surface px-3 py-2 text-[12.5px] font-semibold text-text"
      >
        {t('doclib_studio_clear')}
      </button>
    </div>
  )

  return (
    <div className="pb-16">
      <header className="mb-4">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-text max-[640px]:text-[20px]">
          {t('doclib_studio_catalogue')}
        </h1>
        <p className="mt-1 max-w-[60ch] text-[14px] leading-[1.55] text-text-muted">
          {t('doclib_studio_subtitle')}
        </p>
      </header>

      <ApplicabilitySummary org={org} setOrg={setOrg} />

      {showCatalogue && (
        <>
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.9}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-faint"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('doclib_studio_searchPh')}
              aria-label={t('doclib_studio_searchPh')}
              aria-controls={listboxId}
              aria-describedby={countId}
              className="h-[44px] w-full rounded-[10px] border border-border-strong bg-surface pr-12 pl-10 text-[13.5px] text-text"
            />
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-label={t('doclib_studio_filters')}
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
              className="absolute top-1/2 right-1.5 flex min-h-[36px] min-w-[36px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset hover:text-text"
            >
              <SlidersHorizontal size={17} strokeWidth={1.9} aria-hidden="true" />
              {activePanelFilters > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-navy px-1 text-[9.5px] font-bold text-white"
                >
                  {activePanelFilters}
                </span>
              )}
            </button>
            {filtersOpen && lgUp && (
              <StudioFiltersPopover onClose={closeFilters}>{filtersPanel}</StudioFiltersPopover>
            )}
          </div>
          {filtersOpen && !lgUp && (
            <StudioFiltersSheet onClose={closeFilters}>{filtersPanel}</StudioFiltersSheet>
          )}

          <StudioChips
            value={filterValue}
            recommendedOnly={recommendedOnly}
            allActive={!filtersActive}
            categories={data.categories}
            onCategory={setCategory}
            onJurisdiction={setJurisdiction}
            onRecommended={setRecommendedOnly}
            onClearAll={clearFilters}
          />

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p
              id={countId}
              aria-live="polite"
              className="text-[12.5px] font-semibold text-text-muted"
            >
              {countLabel}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-[32px] cursor-pointer px-1 text-[12px] font-semibold text-gold-fg"
              >
                {t('doclib_studio_clear')}
              </button>
            )}
          </div>
        </>
      )}

      {!filtersActive && showCatalogue && (
        <>
          <RecommendedStrip
            templates={recommended}
            org={org}
            selectedId={selectedId}
            onPreview={(tpl) => selectTemplate(tpl.id)}
          />
          <ContinueDrafting documents={drafts} />
        </>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)]">
        {showCatalogue && (
          <section
            aria-labelledby="doclib-catalogue-heading"
            className="lg:rounded-[12px] lg:border lg:border-border lg:bg-surface"
          >
            <h2
              id="doclib-catalogue-heading"
              tabIndex={-1}
              className="mb-2.5 text-[13px] font-bold tracking-wide text-text-muted uppercase outline-none lg:px-3 lg:pt-3"
            >
              {t('doclib_studio_browseNeed')}
            </h2>

            {filtered.length === 0 ? (
              emptyState
            ) : lgUp ? (
              <ul
                id={listboxId}
                role="listbox"
                aria-label={t('doclib_studio_catalogue')}
                onKeyDown={(event) => {
                  /* listbox semantics — arrows move focus between options. */
                  if (
                    event.key !== 'ArrowDown' &&
                    event.key !== 'ArrowUp' &&
                    event.key !== 'Home' &&
                    event.key !== 'End'
                  )
                    return
                  const options = Array.from(
                    event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'),
                  )
                  if (options.length === 0) return
                  event.preventDefault()
                  const index = options.indexOf(document.activeElement as HTMLElement)
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? options.length - 1
                        : event.key === 'ArrowDown'
                          ? index < options.length - 1
                            ? index + 1
                            : 0
                          : index > 0
                            ? index - 1
                            : options.length - 1
                  options[next]?.focus()
                }}
                className="max-h-[min(640px,70vh)] space-y-0.5 overflow-y-auto p-2"
              >
                {browsing
                  ? groups.map((group) => {
                      const groupName = group.category
                        ? x(group.category.name)
                        : t('doclib_studio_catalogue')
                      return (
                        <li key={group.category?.id ?? 'other'} role="presentation">
                          <div className="sticky top-0 z-10 bg-surface px-2 py-1.5 text-[11px] font-bold tracking-wide text-text-muted uppercase">
                            {groupName}
                          </div>
                          <ul role="group" aria-label={groupName} className="space-y-0.5">
                            {group.templates.map((template) => (
                              <TemplateListRow
                                key={template.id}
                                template={template}
                                org={org}
                                selected={template.id === selectedId}
                                onSelect={() => selectTemplate(template.id)}
                              />
                            ))}
                          </ul>
                        </li>
                      )
                    })
                  : filtered.map((template) => (
                      <TemplateListRow
                        key={template.id}
                        template={template}
                        org={org}
                        selected={template.id === selectedId}
                        onSelect={() => selectTemplate(template.id)}
                      />
                    ))}
              </ul>
            ) : (
              <ul id={listboxId} className="space-y-5">
                {browsing
                  ? groups.map((group) => (
                      <li key={group.category?.id ?? 'other'}>
                        <h3 className="sticky top-[38px] z-10 -mx-1 bg-bg px-1 py-1.5 text-[11px] font-bold tracking-wide text-text-muted uppercase">
                          {group.category ? x(group.category.name) : t('doclib_studio_catalogue')}
                        </h3>
                        <ul className="mt-1 space-y-2.5">
                          {group.templates.map((template) => (
                            <li key={template.id}>
                              <TemplateCard
                                template={template}
                                org={org}
                                selected={template.id === selectedId}
                                onPreview={() => selectTemplate(template.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))
                  : filtered.map((template) => (
                      <li key={template.id}>
                        <TemplateCard
                          template={template}
                          org={org}
                          selected={template.id === selectedId}
                          onPreview={() => selectTemplate(template.id)}
                        />
                      </li>
                    ))}
              </ul>
            )}
          </section>
        )}

        {showDetail && (
          <div className="min-h-[320px] lg:sticky lg:top-14 lg:self-start">
            {!lgUp && (
              <button
                type="button"
                onClick={backToList}
                className="mb-3 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-text-muted hover:text-text"
              >
                {t('doclib_studio_backToList')}
              </button>
            )}
            <SelectedTemplatePanel template={selected} org={org} />
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-text-faint">{t('doclib_disc_full')}</p>
    </div>
  )
}
