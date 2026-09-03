import { useEffect, useId, useMemo, useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useLgUp } from '@/lib/useMediaQuery'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { markEmptyWorkspaceStudioVisited } from '@/features/app/workspaceMode/emptyWorkspaceOnboarding'
import { useDoclib } from '../doclibContext'
import { Skel } from '../components'
import { jurisdictionInfo } from '../data'
import type { DocRiskLevel, DocTemplate, Jurisdiction, TemplateCategoryId } from '../data'
import {
  REVIEW_LEVEL_ORDER,
  compareTemplatesForOrg,
  filterTemplates,
  reviewLevelInfo,
} from '../presentation'
import { ApplicabilitySummary } from './studio/ApplicabilitySummary'
import { SelectedTemplatePanel } from './studio/SelectedTemplatePanel'
import { TemplateListRow } from './studio/TemplateListRow'

const SELECT_CLASS =
  'h-[40px] w-full cursor-pointer rounded-[9px] border border-border-strong bg-surface px-[12px] text-[13px] font-medium text-text'

function StudioSkeleton() {
  return (
    <div className="pb-16">
      <Skel className="mb-2 h-7 w-[420px] max-w-full" />
      <Skel className="mb-4 h-4 w-[320px] max-w-full" />
      <Skel className="mb-4 h-[56px] w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)]">
        <Skel className="h-[420px] w-full" />
        <Skel className="h-[420px] w-full" />
      </div>
    </div>
  )
}

/**
 * Templates sub-tab — recommendation-first master-detail catalogue.
 * Routes remain `/documents/studio` for bookmark compatibility.
 * Below lg: list → detail → back (one panel at a time).
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const listboxId = useId()
  const countId = useId()
  const detailHeadingId = 'doclib-selected-template-title'

  useEffect(() => {
    if (mode === 'production') markEmptyWorkspaceStudioVisited(organizationId)
  }, [mode, organizationId])

  useEffect(() => {
    if (lgUp) setMobileShowDetail(false)
  }, [lgUp])

  const filtered = useMemo(() => {
    if (!data) return [] as DocTemplate[]
    const list = filterTemplates(data.templates, {
      query,
      category,
      jurisdiction,
      reviewLevel,
    })
    return [...list].sort((a, b) => compareTemplatesForOrg(a, b, org))
  }, [data, query, category, jurisdiction, reviewLevel, org])

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
    query.trim() !== '' || category !== 'all' || jurisdiction !== 'all' || reviewLevel !== 'all'
  const countLabel = `${filtered.length} ${
    filtered.length === 1 ? t('doclib_studio_result') : t('doclib_studio_results')
  }`
  const showCatalogue = lgUp || !mobileShowDetail
  const showDetail = lgUp || mobileShowDetail

  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setJurisdiction('all')
    setReviewLevel('all')
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

  return (
    <div className="pb-16">
      <header className="mb-4">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-text max-[640px]:text-[20px]">
          {t('doclib_studio_title')}
        </h1>
        <p className="mt-1 max-w-[60ch] text-[14px] leading-[1.55] text-text-muted">
          {t('doclib_studio_subtitle')}
        </p>
      </header>

      <ApplicabilitySummary org={org} setOrg={setOrg} />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)]">
        {showCatalogue && (
          <section
            aria-labelledby="doclib-catalogue-heading"
            className="rounded-[12px] border border-border bg-surface"
          >
            <div className="border-b border-border-soft px-3 py-3">
              <h2
                id="doclib-catalogue-heading"
                tabIndex={-1}
                className="text-[13px] font-bold tracking-wide text-text uppercase outline-none"
              >
                {t('doclib_studio_catalogue')}
              </h2>

              <div className="mt-3 space-y-2.5">
                <div className="relative">
                  <Search
                    size={16}
                    strokeWidth={1.9}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint"
                    aria-hidden="true"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('doclib_studio_searchPh')}
                    aria-label={t('doclib_studio_searchPh')}
                    aria-controls={listboxId}
                    aria-describedby={countId}
                    className="h-[40px] w-full rounded-[9px] border border-border-strong bg-surface pr-3 pl-9 text-[13.5px] text-text"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="doclib-filter-category"
                      className="mb-1 block text-[11px] font-bold text-text-muted"
                    >
                      {t('doclib_studio_category')}
                    </label>
                    <select
                      id="doclib-filter-category"
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value as TemplateCategoryId | 'all')
                      }
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
                  </div>
                  <div>
                    <label
                      htmlFor="doclib-filter-jurisdiction"
                      className="mb-1 block text-[11px] font-bold text-text-muted"
                    >
                      {t('doclib_studio_jurisdiction')}
                    </label>
                    <select
                      id="doclib-filter-jurisdiction"
                      value={jurisdiction}
                      onChange={(event) =>
                        setJurisdiction(event.target.value as Jurisdiction | 'all')
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="all">{t('doclib_studio_all')}</option>
                      {jurisdictionInfo.map((info) => (
                        <option key={info.code} value={info.code}>
                          {x(info.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="doclib-filter-review"
                      className="mb-1 block text-[11px] font-bold text-text-muted"
                    >
                      {t('doclib_studio_review')}
                    </label>
                    <select
                      id="doclib-filter-review"
                      value={reviewLevel}
                      onChange={(event) =>
                        setReviewLevel(event.target.value as DocRiskLevel | 'all')
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="all">{t('doclib_studio_all')}</option>
                      {REVIEW_LEVEL_ORDER.map((level) => (
                        <option key={level} value={level}>
                          {x(reviewLevelInfo(level).label)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
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
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-[10px] bg-inset text-text-3">
                  <SearchX size={20} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <div className="text-[14px] font-semibold text-text">
                  {t('doclib_studio_noResults')}
                </div>
                <div className="mt-1 text-[12.5px] text-text-muted">
                  {t('doclib_studio_noResultsSub')}
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 cursor-pointer rounded-[8px] border border-border-strong bg-surface px-3 py-2 text-[12.5px] font-semibold text-text"
                >
                  {t('doclib_studio_clear')}
                </button>
              </div>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-label={t('doclib_studio_catalogue')}
                className="max-h-[min(640px,70vh)] space-y-0.5 overflow-y-auto p-2"
              >
                {filtered.map((template) => (
                  <TemplateListRow
                    key={template.id}
                    template={template}
                    org={org}
                    selected={template.id === selectedId}
                    onSelect={() => selectTemplate(template.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {showDetail && (
          <div className="min-h-[320px] lg:sticky lg:top-4 lg:self-start">
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
