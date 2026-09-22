/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { Seo } from '@/seo/Seo'
import { useCareersPath } from './useCareersPath'
import { formatCareersDate } from './dates'
import { listActiveJobPostings } from './data/jobBoardApi'
import type { PublicJobPosting } from './data/jobBoardApi'

/**
 * Public job board (/careers) — the B2C entry point. Lists every active job
 * posting with a client-side search filter. No auth required; the apply CTA
 * lives on the detail page, where the auth gate is visible.
 */
export function JobBoardPage() {
  const { x } = useI18n()
  const paths = useCareersPath()
  const [postings, setPostings] = useState<PublicJobPosting[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [filter, setFilter] = useState('')
  const [retryKey, setRetryKey] = useState(0)

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

  const q = filter.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!postings) return null
    if (!q) return postings
    return postings.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    )
  }, [postings, q])

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
      </section>

      {/* Search */}
      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <div className="relative mx-auto max-w-[520px]">
          <Search
            size={16}
            strokeWidth={1.7}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            value={filter}
            onChange={(e: FormEvent<HTMLInputElement>) => setFilter(e.currentTarget.value)}
            placeholder={x(M.careers_board_search_placeholder)}
            aria-label={x(M.careers_board_search_placeholder)}
            className="w-full rounded-[10px] border border-border bg-surface py-2.5 pr-4 pl-10 font-sans text-sm text-text"
          />
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6">
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
          <p className="py-12 text-center text-sm text-text-muted">{x(M.careers_board_loading)}</p>
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
              onClick={() => setFilter('')}
              className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition-[border-color] hover:border-gold-border"
            >
              {x(M.careers_board_clear_search)}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered?.map((posting) => (
              <JobCard key={posting.id} posting={posting} />
            ))}
          </div>
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

function JobCard({ posting }: { readonly posting: PublicJobPosting }) {
  const { x, lang } = useI18n()
  const paths = useCareersPath()
  return (
    <Link
      to={paths.jobDetail(posting.id)}
      className="flex flex-col rounded-[12px] border border-border bg-surface p-5 transition-[border-color] hover:border-gold-border"
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
