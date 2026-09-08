/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Briefcase, Calendar, CheckCircle, MapPin } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { Seo } from '@/seo/Seo'
import { seoRoute } from '@/seo/routes'
import { useAuth } from '@/features/app/auth/authContext'
import { useCareersPath } from './useCareersPath'
import { getPublicJobPosting } from './data/jobBoardApi'
import type { PublicJobPosting } from './data/jobBoardApi'

/**
 * Public job detail (/careers/jobs/:postingId) — shows the full posting and
 * an apply CTA. The CTA depends on auth state: a signed-in candidate links
 * straight to the apply form; a signed-out visitor sees a "sign in to apply"
 * card that routes to the candidate portal.
 */
export function JobDetailPage() {
  const { x } = useI18n()
  const paths = useCareersPath()
  const { postingId } = useParams<{ postingId: string }>()
  const [posting, setPosting] = useState<PublicJobPosting | null | undefined>(undefined)

  useEffect(() => {
    if (!postingId) return
    let cancelled = false
    getPublicJobPosting(postingId)
      .then((row) => {
        if (!cancelled) setPosting(row)
      })
      .catch(() => {
        if (!cancelled) setPosting(null)
      })
    return () => {
      cancelled = true
    }
  }, [postingId])

  if (posting === undefined) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-text-muted">{x(M.careers_loading)}</p>
      </div>
    )
  }

  if (posting === null) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16 sm:px-6">
        <BackLink />
        <div className="mt-8 rounded-[12px] border border-border bg-surface px-6 py-10 text-center">
          <p className="font-semibold text-text">{x(M.careers_detail_not_found)}</p>
          <p className="mt-2 text-sm text-text-2">{x(M.careers_detail_not_found_body)}</p>
          <Link
            to={paths.board}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
          >
            {x(M.careers_detail_back)}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 sm:py-12">
      <Seo
        page={{
          title: {
            en: `${posting.title} — ${posting.department} | Dutiva Careers`,
            fr: `${posting.title} — ${posting.department} | Carrières Dutiva`,
          },
          description: {
            en: posting.description.slice(0, 155),
            fr: posting.description.slice(0, 155),
          },
          path: {
            en: `${seoRoute('careers').path.en}/jobs/${posting.id}`,
            fr: `${seoRoute('careers').path.fr}/jobs/${posting.id}`,
          },
          indexable: true,
        }}
      />
      <BackLink />

      <h1 className="mt-6 font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-text">
        {posting.title}
      </h1>

      {/* Metadata row */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-2">
        <span className="flex items-center gap-1.5">
          <Briefcase size={15} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span className="text-text-muted">{x(M.careers_detail_department)}:</span>
          <span>{posting.department}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={15} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span className="text-text-muted">{x(M.careers_detail_location)}:</span>
          <span>{posting.location}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase size={15} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          <span className="text-text-muted">{x(M.careers_detail_type)}:</span>
          <span>{posting.type}</span>
        </span>
        {posting.postedDate && (
          <span className="flex items-center gap-1.5">
            <Calendar size={15} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
            <span className="text-text-muted">{x(M.careers_board_posted)}:</span>
            <span>{formatDate(posting.postedDate)}</span>
          </span>
        )}
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">
          {x(M.careers_detail_description)}
        </h2>
        <div className="mt-3 text-[15px] leading-[1.7] text-text-2 whitespace-pre-line">
          {posting.description}
        </div>
      </section>

      {/* Requirements */}
      {posting.requirements.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-text">
            {x(M.careers_detail_requirements)}
          </h2>
          <ul className="mt-3 space-y-2">
            {posting.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-[1.6] text-text-2">
                <CheckCircle
                  size={16}
                  strokeWidth={1.7}
                  className="mt-0.5 flex-none text-gold-strong"
                  aria-hidden="true"
                />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA */}
      <ApplyCta postingId={posting.id} />
    </div>
  )
}

function BackLink() {
  const { x } = useI18n()
  const paths = useCareersPath()
  return (
    <Link
      to={paths.board}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-2 transition-opacity hover:opacity-80"
    >
      <ArrowLeft size={15} aria-hidden="true" />
      {x(M.careers_detail_back)}
    </Link>
  )
}

function ApplyCta({ postingId }: { readonly postingId: string }) {
  const { x } = useI18n()
  const { status } = useAuth()
  const paths = useCareersPath()
  const signedIn = status === 'signed-in'

  if (signedIn) {
    return (
      <section className="mt-10 rounded-[12px] border border-border bg-surface px-6 py-5">
        <Link
          to={paths.apply(postingId)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {x(M.careers_detail_apply_cta)}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    )
  }

  return (
    <section className="mt-10 rounded-[12px] border border-border bg-surface px-6 py-6">
      <h2 className="font-display text-lg font-semibold text-text">
        {x(M.careers_detail_sign_in_to_apply)}
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm leading-[1.6] text-text-2">
        {x(M.careers_detail_sign_in_to_apply_body)}
      </p>
      <Link
        to={paths.portal}
        className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {x(M.careers_detail_sign_in_to_apply)}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </section>
  )
}

/** ISO date → locale-aware short date. Falls back to the raw string. */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
