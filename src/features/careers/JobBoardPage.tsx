/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, Calendar, MapPin, Search } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { Seo } from '@/seo/Seo'
import { useCareersPath } from './useCareersPath'
import { listActiveJobPostings } from './data/jobBoardApi'
import type { PublicJobPosting } from './data/jobBoardApi'

/**
 * Public job board (/careers) — the B2C entry point. Lists every active job
 * posting with a client-side search filter. No auth required; the apply CTA
 * lives on the detail page, where the auth gate is visible.
 */
export function JobBoardPage() {
  const { x } = useI18n()
  const [postings, setPostings] = useState<PublicJobPosting[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [filter, setFilter] = useState('')

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
  }, [])

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
          </div>
        ) : postings === null ? (
          <p className="py-12 text-center text-sm text-text-muted">{x(M.careers_board_loading)}</p>
        ) : filtered !== null && filtered.length === 0 ? (
          <div className="mx-auto max-w-[480px] rounded-[12px] border border-border bg-surface px-6 py-10 text-center">
            <p className="font-semibold text-text">{x(M.careers_board_no_results)}</p>
            <p className="mt-2 text-sm text-text-2">{x(M.careers_board_no_results_body)}</p>
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
          <p className="mx-auto max-w-[80ch] text-center text-base leading-[1.7] text-text-2">
            {x(M.careers_board_how_it_works)}
          </p>
        </div>
      </section>
    </div>
  )
}

function JobCard({ posting }: { readonly posting: PublicJobPosting }) {
  const { x } = useI18n()
  const paths = useCareersPath()
  return (
    <Link
      to={paths.jobDetail(posting.id)}
      className="flex flex-col rounded-[12px] border border-border bg-surface p-5 transition-[border-color] hover:border-gold-border"
    >
      <h2 className="text-base font-semibold text-text">{posting.title}</h2>
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
          <Briefcase size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span>{posting.type}</span>
        </div>
        {posting.postedDate && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar size={13} strokeWidth={1.7} aria-hidden="true" />
            <span>
              {x(M.careers_board_posted)} {formatDate(posting.postedDate)}
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

/** ISO date → locale-aware short date. Falls back to the raw string. */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
