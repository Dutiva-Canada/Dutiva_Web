/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { careersMessages as M } from '@/i18n/messages/careers'
import { Seo } from '@/seo/Seo'
import { viewIntentProps } from '@/app/viewPrefetch'
import { useCareersPath } from './useCareersPath'
import { formatCareersDate } from './dates'
import { listActiveJobPostings } from './data/jobBoardApi'
import type { PublicJobPosting } from './data/jobBoardApi'
import {
  annualSalaryCeiling,
  boardFacets,
  filterFromParams,
  filterPostings,
  filterToParams,
  SALARY_BANDS,
  salaryBandLabel,
  salaryLabel,
} from './boardFilters'
import type { BoardFilter, Workplace } from './boardFilters'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

const WORKPLACE_LABEL: Record<Workplace, Bi> = {
  remote: M.careers_board_workplace_remote,
  hybrid: M.careers_board_workplace_hybrid,
  onsite: M.careers_board_workplace_onsite,
}

/** Interpolate a `{name}` placeholder the same way other careers pages do. */
function fill(template: Bi, name: string, value: string): Bi {
  return { en: template.en.replace(`{${name}}`, value), fr: template.fr.replace(`{${name}}`, value) }
}

/**
 * Public job board (/careers) — the B2C entry point. Lists every active job
 * posting; keyword search, facet filters and sort all live in the URL query
 * string (?q=&location=&type=&employer=&department=&salary=&sort=) so views
 * are shareable and the
 * back button works. No auth required; the apply CTA lives on the detail
 * page, where the auth gate is visible.
 */
export function JobBoardPage() {
  const { x, lang } = useI18n()
  const paths = useCareersPath()
  const [searchParams, setSearchParams] = useSearchParams()
  const [postings, setPostings] = useState<PublicJobPosting[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const filter = useMemo(() => filterFromParams(searchParams), [searchParams])
  /* Load-more depth lives in the URL too (?page=), so a shared link lands on
     the same window. Not part of BoardFilter — any commitFilter rebuild drops
     it, which is exactly the reset-on-filter-change behavior we want. */
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1)
  const visibleCount = page * PAGE_SIZE

  /* The input is debounced: queryInput is what's typed, filter.q is what's
     committed to the URL ~300ms after the user stops. */
  const [queryInput, setQueryInput] = useState(filter.q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    /* External URL changes (back/forward nav, cleared chip) re-seed the
       input. The debounce commit writes the same value the user just typed,
       so this never clobbers in-progress input. */
    setQueryInput((current) => (current === filter.q ? current : filter.q))
  }, [filter.q])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  const commitFilter = (next: BoardFilter) => {
    const params = filterToParams(next)
    setSearchParams(params, { preventScrollReset: true })
  }

  const onQueryInput = (value: string) => {
    setQueryInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      commitFilter({ ...filter, q: value })
    }, SEARCH_DEBOUNCE_MS)
  }

  const clearAll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQueryInput('')
    setSearchParams(new URLSearchParams(), { preventScrollReset: true })
  }

  useEffect(() => {
    let cancelled = false
    setLoadFailed(false)
    listActiveJobPostings()
      .then((rows) => {
        if (!cancelled) setPostings(rows)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [retryKey])

  const filtered = useMemo(
    () => (postings ? filterPostings(postings, filter) : null),
    [postings, filter],
  )
  const facets = useMemo(
    () => (postings ? boardFacets(postings, lang) : null),
    [postings, lang],
  )
  /* Salary bands that at least one posting can actually meet — a band with
     zero qualifying rows would just dead-end the user. */
  const salaryBands = useMemo(
    () =>
      postings
        ? SALARY_BANDS.filter((band) =>
            postings.some((p) => (annualSalaryCeiling(p) ?? 0) >= band),
          ).map(String)
        : [],
    [postings],
  )

  /* Facet option sets derive from the *unfiltered* list so a selection never
     hides the option that produced it. */
  const activeChips = useMemo(() => {
    const chips: { key: keyof BoardFilter; label: string }[] = []
    if (filter.q.trim()) chips.push({ key: 'q', label: filter.q.trim() })
    if (filter.location) chips.push({ key: 'location', label: filter.location })
    if (filter.workplace) chips.push({ key: 'workplace', label: x(WORKPLACE_LABEL[filter.workplace]) })
    if (filter.employer) chips.push({ key: 'employer', label: filter.employer })
    if (filter.department) chips.push({ key: 'department', label: filter.department })
    if (filter.salaryMin > 0)
      chips.push({ key: 'salaryMin', label: salaryBandLabel(filter.salaryMin, lang) })
    return chips
  }, [filter, x, lang])

  const employerPath = lang === 'fr' ? '/fr/employeur' : '/employer'

  return (
    <div className="bg-bg text-text">
      <Seo route="careers" />
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-4 pt-12 pb-6 text-center sm:px-6 sm:pt-16">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.02em] text-text">
          {x(M.careers_board_title)}
        </h1>
        <p className="mx-auto mt-3 max-w-[62ch] text-lg leading-[1.6] text-text-2">
          {x(M.careers_board_subtitle)}
        </p>
        <Link
          to={employerPath}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          {x(M.careers_board_employer_cta)}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      {/* Search + filters */}
      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <div className="relative mx-auto max-w-[520px]">
          <Search
            size={16}
            strokeWidth={1.7}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            value={queryInput}
            onChange={(e: FormEvent<HTMLInputElement>) => onQueryInput(e.currentTarget.value)}
            placeholder={x(M.careers_board_search_placeholder)}
            aria-label={x(M.careers_board_search_placeholder)}
            className="w-full rounded-[10px] border border-border bg-surface py-2.5 pr-4 pl-10 font-sans text-sm text-text transition-[border-color] focus:border-gold-border focus:outline-none"
          />
        </div>

        {facets && postings !== null && postings.length > 0 && (
          <fieldset className="mx-auto mt-4 flex max-w-[900px] flex-wrap items-end justify-center gap-3 border-0 p-0">
            <legend className="sr-only">{x(M.careers_board_filters_label)}</legend>
            {facets.locations.length > 1 && (
              <FacetSelect
                id="filter-location"
                label={x(M.careers_board_filter_location)}
                allLabel={x(M.careers_board_filter_location_all)}
                value={filter.location}
                options={facets.locations}
                onChange={(v) => commitFilter({ ...filter, location: v })}
              />
            )}
            {facets.workplaces.length > 1 && (
              <FacetSelect
                id="filter-workplace"
                label={x(M.careers_board_filter_workplace)}
                allLabel={x(M.careers_board_filter_workplace_all)}
                value={filter.workplace}
                options={facets.workplaces}
                optionLabel={(w) => x(WORKPLACE_LABEL[w as Workplace])}
                onChange={(v) => commitFilter({ ...filter, workplace: v as BoardFilter['workplace'] })}
              />
            )}
            {facets.employers.length > 1 && (
              <FacetSelect
                id="filter-employer"
                label={x(M.careers_board_filter_employer)}
                allLabel={x(M.careers_board_filter_employer_all)}
                value={filter.employer}
                options={facets.employers}
                onChange={(v) => commitFilter({ ...filter, employer: v })}
              />
            )}
            {facets.departments.length > 1 && (
              <FacetSelect
                id="filter-department"
                label={x(M.careers_board_filter_department)}
                allLabel={x(M.careers_board_filter_department_all)}
                value={filter.department}
                options={facets.departments}
                onChange={(v) => commitFilter({ ...filter, department: v })}
              />
            )}
            {salaryBands.length > 0 && (
              <FacetSelect
                id="filter-salary"
                label={x(M.careers_board_filter_salary)}
                allLabel={x(M.careers_board_filter_salary_all)}
                value={filter.salaryMin > 0 ? String(filter.salaryMin) : ''}
                options={salaryBands}
                optionLabel={(band) => salaryBandLabel(Number(band), lang)}
                onChange={(v) =>
                  commitFilter({ ...filter, salaryMin: Number.parseInt(v, 10) || 0 })
                }
              />
            )}
            <div className="flex flex-col">
              <label htmlFor="board-sort" className="mb-1 text-xs font-semibold text-text-muted">
                {x(M.careers_board_sort_label)}
              </label>
              <select
                id="board-sort"
                value={filter.sort}
                onChange={(e) =>
                  commitFilter({ ...filter, sort: e.currentTarget.value as BoardFilter['sort'] })
                }
                className="rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-text transition-[border-color] focus:border-gold-border focus:outline-none"
              >
                <option value="newest">{x(M.careers_board_sort_newest)}</option>
                {filter.q.trim() && (
                  <option value="relevance">{x(M.careers_board_sort_relevance)}</option>
                )}
              </select>
            </div>
          </fieldset>
        )}

        {/* Active-filter chips */}
        {activeChips.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-[900px] flex-wrap items-center justify-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  const next = { ...filter, [chip.key]: '' } as BoardFilter
                  if (chip.key === 'q') {
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    setQueryInput('')
                    if (next.sort === 'relevance') next.sort = 'newest'
                  }
                  commitFilter(next)
                }}
                aria-label={x(fill(M.careers_board_chip_remove, 'label', chip.label))}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold-border bg-gold-bg px-3 py-1 text-xs font-semibold text-gold-fg transition-opacity hover:opacity-80"
              >
                {chip.label}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer rounded-full px-2 py-1 text-xs font-semibold text-text-2 underline-offset-2 transition-opacity hover:underline"
            >
              {x(M.careers_board_clear_all)}
            </button>
          </div>
        )}
      </section>

      {/* Results */}
      <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6">
        <p aria-live="polite" role="status" className="sr-only">
          {filtered === null
            ? x(M.careers_board_loading)
            : filtered.length === 0
              ? x(M.careers_board_results_announce_none)
              : x(
                  fill(
                    filtered.length === 1
                      ? M.careers_board_results_announce_one
                      : M.careers_board_results_announce_many,
                    'count',
                    String(filtered.length),
                  ),
                )}
        </p>
        {loadFailed ? (
          <div className="rounded-[12px] border border-risk-border bg-risk-bg px-5 py-4 text-center">
            <p className="text-sm text-risk-fg">{x(M.careers_board_load_error)}</p>
            <button
              type="button"
              onClick={() => {
                setPostings(null)
                setLoadFailed(false)
                setRetryKey((key) => key + 1)
              }}
              className="mt-3 inline-flex cursor-pointer items-center rounded-[9px] border border-risk-border bg-surface px-4 py-2 text-sm font-semibold text-risk-fg transition-[background-color] hover:bg-risk-bg"
            >
              {x(M.careers_board_retry)}
            </button>
          </div>
        ) : postings === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : postings.length === 0 ? (
          <div className="mx-auto max-w-[480px] rounded-[12px] border border-border bg-surface px-6 py-10 text-center">
            <p className="font-semibold text-text">{x(M.careers_board_empty)}</p>
            <p className="mt-2 text-sm text-text-2">{x(M.careers_board_empty_body)}</p>
            <Link
              to={paths.portal}
              className="mt-5 inline-flex items-center gap-1.5 rounded-[10px] bg-navy px-5 py-2.5 text-sm font-semibold text-white no-underline transition-opacity hover:opacity-90"
            >
              {x(M.careers_board_empty_cta)}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : filtered !== null && filtered.length === 0 ? (
          <div className="mx-auto max-w-[480px] rounded-[12px] border border-border bg-surface px-6 py-10 text-center">
            <p className="font-semibold text-text">{x(M.careers_board_no_results)}</p>
            <p className="mt-2 text-sm text-text-2">{x(M.careers_board_no_results_body)}</p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition-[border-color] hover:border-gold-border"
            >
              {x(M.careers_board_clear_search)}
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-center text-sm text-text-muted">
              {x(
                fill(
                  fill(
                    M.careers_board_showing,
                    'shown',
                    String(Math.min(visibleCount, filtered?.length ?? 0)),
                  ),
                  'total',
                  String(filtered?.length ?? 0),
                ),
              )}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered?.slice(0, visibleCount).map((posting) => (
                <JobCard key={posting.id} posting={posting} />
              ))}
            </div>
            {filtered !== null && filtered.length > visibleCount && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.set('page', String(page + 1))
                    setSearchParams(params, { preventScrollReset: true })
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-[border-color] hover:border-gold-border"
                >
                  {x(M.careers_board_load_more)}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Explainer */}
      <section className="border-t border-border bg-bg-elevated">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-center font-display text-xl font-semibold tracking-[-0.01em] text-text">
            {x(M.careers_board_how_title)}
          </h2>
          <p className="mx-auto mt-3 max-w-[64ch] text-center text-[15px] leading-[1.65] text-text-2">
            {x(M.careers_board_how_lead)}
          </p>
          <ul className="mx-auto mt-6 flex max-w-[560px] list-none flex-col gap-4 p-0">
            <li className="flex items-start gap-3 text-[15px] leading-[1.6] text-text-2">
              <Search
                size={18}
                strokeWidth={1.7}
                className="mt-[2px] shrink-0 text-gold-strong"
                aria-hidden="true"
              />
              <span>{x(M.careers_board_how_1)}</span>
            </li>
            <li className="flex items-start gap-3 text-[15px] leading-[1.6] text-text-2">
              <UserRound
                size={18}
                strokeWidth={1.7}
                className="mt-[2px] shrink-0 text-gold-strong"
                aria-hidden="true"
              />
              <span>{x(M.careers_board_how_2)}</span>
            </li>
            <li className="flex items-start gap-3 text-[15px] leading-[1.6] text-text-2">
              <Sparkles
                size={18}
                strokeWidth={1.7}
                className="mt-[2px] shrink-0 text-gold-strong"
                aria-hidden="true"
              />
              <span>{x(M.careers_board_how_3)}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

function FacetSelect({
  id,
  label,
  allLabel,
  value,
  options,
  optionLabel,
  onChange,
}: {
  readonly id: string
  readonly label: string
  readonly allLabel: string
  readonly value: string
  readonly options: readonly string[]
  readonly optionLabel?: (option: string) => string
  readonly onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-xs font-semibold text-text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="max-w-[220px] rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-text transition-[border-color] focus:border-gold-border focus:outline-none"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel ? optionLabel(option) : option}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Card-shaped placeholder while the posting list loads. */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[12px] border border-border bg-surface p-5">
      <div className="h-4 w-3/5 rounded bg-inset" />
      <div className="mt-2 h-3 w-2/5 rounded bg-inset" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-1/2 rounded bg-inset" />
        <div className="h-3 w-2/3 rounded bg-inset" />
        <div className="h-3 w-1/3 rounded bg-inset" />
      </div>
      <div className="mt-4 h-3 w-1/4 rounded bg-inset" />
    </div>
  )
}

function JobCard({ posting }: { readonly posting: PublicJobPosting }) {
  const { x, lang } = useI18n()
  const paths = useCareersPath()
  const location = useLocation()
  const salary = salaryLabel(posting, lang)
  return (
    <Link
      to={paths.jobDetail(posting.slug)}
      /* Carry the board's query string so the detail page's breadcrumb
         returns to the same filtered view. */
      state={{ boardSearch: location.search }}
      {...viewIntentProps('careers.job')}
      className="flex flex-col rounded-[12px] border border-border bg-surface p-5 transition-[border-color] hover:border-gold-border focus-visible:border-gold-border focus-visible:outline-none"
    >
      <h2 className="text-base font-semibold text-text">{posting.title}</h2>
      <p className="mt-1 text-[13px] font-medium text-text-muted">{posting.organizationName}</p>
      <div className="mt-3 space-y-1.5 text-sm text-text-2">
        <div className="flex items-center gap-1.5">
          <Briefcase size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span>{posting.department}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span>{posting.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span>{posting.type}</span>
        </div>
        {salary && <div className="flex items-center gap-1.5 font-medium text-text">{salary}</div>}
        {posting.postedDate && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar size={13} strokeWidth={1.7} aria-hidden="true" />
            <span>
              {x(M.careers_board_posted)} {formatCareersDate(posting.postedDate, lang)}
            </span>
          </div>
        )}
        {posting.closingDate && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar size={13} strokeWidth={1.7} aria-hidden="true" />
            <span>
              {x(M.careers_board_closing)} {formatCareersDate(posting.closingDate, lang)}
            </span>
          </div>
        )}
      </div>
      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong">
        {x(M.careers_board_view_detail)}
        <ArrowRight size={14} aria-hidden="true" />
      </div>
    </Link>
  )
}
