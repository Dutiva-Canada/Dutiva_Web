/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  MapPin,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { careersMessages as M } from '@/i18n/messages/careers'
import { Seo } from '@/seo/Seo'
import { jobPostingNode } from '@/seo/jsonld'
import { seoRoute } from '@/seo/routes'
import { useAuth } from '@/features/app/auth/authContext'
import { useCareersPath } from './useCareersPath'
import { formatCareersDate } from './dates'
import { seoDescription } from './seo'
import { employmentTypeCode, salaryLabel, workplaceType } from './boardFilters'
import { getPublicJobPosting } from './data/jobBoardApi'
import type { PublicJobPosting } from './data/jobBoardApi'
import { PrerenderJobPostingContext } from './prerenderJobPosting'

function fill(template: Bi, name: string, value: string): Bi {
  return { en: template.en.replace(`{${name}}`, value), fr: template.fr.replace(`{${name}}`, value) }
}

/** JSON-LD description: the same sections the page renders, as plain text. */
function jobDescriptionText(posting: PublicJobPosting): string {
  const parts = [posting.description.trim()]
  if (posting.responsibilities.length > 0)
    parts.push(posting.responsibilities.map((r) => `- ${r}`).join('\n'))
  if (posting.requirements.length > 0)
    parts.push(posting.requirements.map((r) => `- ${r}`).join('\n'))
  if (posting.benefits.length > 0) parts.push(posting.benefits.map((b) => `- ${b}`).join('\n'))
  return parts.join('\n\n')
}

/**
 * Public job detail (/careers/jobs/:postingKey — slug canonical, bare uuid
 * still resolves). Shows the full posting and an apply CTA. The CTA depends
 * on auth state: a signed-in candidate links straight to the apply form; a
 * signed-out visitor sees a "sign in to apply" card that routes to the
 * candidate portal.
 *
 * During prerendering the posting arrives through PrerenderJobPostingContext
 * (entry-server injects the row it fetched for the manifest) so the static
 * HTML carries real content; in the browser the context is empty — a
 * prerendered page instead embeds the posting as an inert JSON script tag
 * that readInlinePosting() picks up, so hydration shows the same content
 * without a refetch. Anywhere else the page fetches in an effect.
 */

/** The prerender-embedded posting payload (#dutiva-job-posting), matched to
    the URL param so a stale tag can't seed the wrong page. */
function readInlinePosting(key: string | undefined): PublicJobPosting | undefined {
  if (typeof document === 'undefined' || !key) return undefined
  const el = document.getElementById('dutiva-job-posting')
  if (!el?.textContent) return undefined
  try {
    const row = JSON.parse(el.textContent) as PublicJobPosting
    return row.slug === key || row.id === key ? row : undefined
  } catch {
    return undefined
  }
}

export function JobDetailPage() {
  const { x, L, lang } = useI18n()
  const paths = useCareersPath()
  const navigate = useNavigate()
  const location = useLocation()
  const { postingId: postingKey } = useParams<{ postingId: string }>()
  const prerenderPosting = useContext(PrerenderJobPostingContext)
  const initial =
    prerenderPosting && (prerenderPosting.slug === postingKey || prerenderPosting.id === postingKey)
      ? prerenderPosting
      : readInlinePosting(postingKey)
  const [posting, setPosting] = useState<PublicJobPosting | null | undefined>(initial)

  useEffect(() => {
    /* The prerender-injected posting satisfies the render — skip the client
       fetch only while the param still matches it. */
    if (initial !== undefined) return
    if (!postingKey) return
    let cancelled = false
    getPublicJobPosting(postingKey)
      .then((row) => {
        if (!cancelled) setPosting(row)
      })
      .catch(() => {
        if (!cancelled) setPosting(null)
      })
    return () => {
      cancelled = true
    }
  }, [postingKey, initial])

  /* Legacy bare-uuid URLs canonicalize to the slug URL (replace, not push —
     the uuid entry needn't live in history). */
  useEffect(() => {
    if (posting && postingKey === posting.id && posting.slug !== posting.id) {
      navigate(paths.jobDetail(posting.slug), { replace: true })
    }
  }, [posting, postingKey, navigate, paths])

  /* The board's filter query string arrives via link state so "All jobs"
     returns to the same filtered view. */
  const boardSearch =
    location.state && typeof location.state === 'object'
      ? (location.state as { boardSearch?: string }).boardSearch ?? ''
      : ''
  const boardPath = `${paths.board}${boardSearch}`

  const breadcrumbs = useMemo(
    () => [
      { name: L('Careers', 'Carrières'), path: paths.board },
      { name: posting?.title ?? '' },
    ],
    [L, paths, posting],
  )

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
        <BackLink to={boardPath} />
        <div className="mt-8 rounded-[12px] border border-border bg-surface px-6 py-10 text-center">
          <p className="font-semibold text-text">{x(M.careers_detail_not_found)}</p>
          <p className="mt-2 text-sm text-text-2">{x(M.careers_detail_not_found_body)}</p>
          <Link
            to={boardPath}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
          >
            {x(M.careers_detail_back)}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  const detailPath = `${seoRoute('careers').path[lang]}/jobs/${posting.slug}`
  const salary = salaryLabel(posting, lang)

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 sm:py-12">
      <Seo
        page={{
          title: {
            en: `${posting.title} — ${posting.organizationName} | Dutiva Careers`,
            fr: `${posting.title} — ${posting.organizationName} | Carrières Dutiva`,
          },
          description: {
            en: seoDescription(posting.description),
            fr: seoDescription(posting.description),
          },
          path: {
            en: `${seoRoute('careers').path.en}/jobs/${posting.slug}`,
            fr: `${seoRoute('careers').path.fr}/jobs/${posting.slug}`,
          },
          indexable: true,
        }}
        breadcrumb={breadcrumbs}
        datePublished={posting.postedDate ?? undefined}
        extraNodes={[
          jobPostingNode({
            lang,
            path: detailPath,
            title: posting.title,
            description: jobDescriptionText(posting),
            organizationName: posting.organizationName,
            location: posting.location,
            workplace: workplaceType(posting),
            employmentType: employmentTypeCode(posting.type),
            salaryMin: posting.salaryMin,
            salaryMax: posting.salaryMax,
            salaryPeriod: posting.salaryPeriod,
            datePosted: posting.postedDate,
            validThrough: posting.closingDate,
          }),
        ]}
      />

      <nav aria-label={L('Breadcrumb', "Fil d'Ariane")}>
        <BackLink to={boardPath} />
      </nav>

      <h1 className="mt-6 font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-text">
        {posting.title}
      </h1>
      <p className="mt-2 text-[15px] font-medium text-text-muted">{posting.organizationName}</p>

      {/* Metadata row */}
      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-2">
        <MetaItem icon={<Briefcase size={15} strokeWidth={1.7} aria-hidden="true" />}>
          <dt className="text-text-muted">{x(M.careers_detail_department)}:</dt>
          <dd>{posting.department}</dd>
        </MetaItem>
        <MetaItem icon={<MapPin size={15} strokeWidth={1.7} aria-hidden="true" />}>
          <dt className="text-text-muted">{x(M.careers_detail_location)}:</dt>
          <dd>{posting.location}</dd>
        </MetaItem>
        <MetaItem icon={<Briefcase size={15} strokeWidth={1.7} aria-hidden="true" />}>
          <dt className="text-text-muted">{x(M.careers_detail_type)}:</dt>
          <dd>{posting.type}</dd>
        </MetaItem>
        {salary && (
          <MetaItem icon={<Briefcase size={15} strokeWidth={1.7} aria-hidden="true" />}>
            <dt className="text-text-muted">{x(M.careers_detail_salary)}:</dt>
            <dd>{salary}</dd>
          </MetaItem>
        )}
        {posting.postedDate && (
          <MetaItem icon={<Calendar size={15} strokeWidth={1.7} aria-hidden="true" />}>
            <dt className="text-text-muted">{x(M.careers_board_posted)}:</dt>
            <dd>{formatCareersDate(posting.postedDate, lang)}</dd>
          </MetaItem>
        )}
        {posting.closingDate && (
          <MetaItem icon={<Calendar size={15} strokeWidth={1.7} aria-hidden="true" />}>
            <dt className="text-text-muted">{x(M.careers_board_closing)}:</dt>
            <dd>{formatCareersDate(posting.closingDate, lang)}</dd>
          </MetaItem>
        )}
      </dl>

      {/* Description */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">
          {x(M.careers_detail_description)}
        </h2>
        <div className="mt-3 text-[15px] leading-[1.7] text-text-2 whitespace-pre-line">
          {posting.description}
        </div>
      </section>

      {/* Responsibilities */}
      {posting.responsibilities.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-text">
            {x(M.careers_detail_responsibilities)}
          </h2>
          <BulletList items={posting.responsibilities} />
        </section>
      )}

      {/* Requirements */}
      {posting.requirements.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-text">
            {x(M.careers_detail_requirements)}
          </h2>
          <BulletList items={posting.requirements} />
        </section>
      )}

      {/* Benefits */}
      {posting.benefits.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-text">
            {x(M.careers_detail_benefits)}
          </h2>
          <BulletList items={posting.benefits} />
        </section>
      )}

      {/* Employer blurb */}
      {posting.employerBlurb && (
        <section className="mt-8 rounded-[12px] border border-border bg-bg-elevated px-6 py-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-text">
            <Building2 size={18} strokeWidth={1.7} className="text-gold-strong" aria-hidden="true" />
            {x(fill(M.careers_detail_about_employer, 'employer', posting.organizationName))}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-text-2 whitespace-pre-line">
            {posting.employerBlurb}
          </p>
        </section>
      )}

      {/* CTA */}
      <ApplyCta postingId={posting.id} />
    </div>
  )
}

function MetaItem({
  icon,
  children,
}: {
  readonly icon: React.ReactNode
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-text-muted">{icon}</span>
      {children}
    </div>
  )
}

function BulletList({ items }: { readonly items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[15px] leading-[1.6] text-text-2">
          <CheckCircle
            size={16}
            strokeWidth={1.7}
            className="mt-0.5 flex-none text-gold-strong"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function BackLink({ to }: { readonly to: string }) {
  const { x } = useI18n()
  return (
    <Link
      to={to}
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
