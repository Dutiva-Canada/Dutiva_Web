import { Suspense, use } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Globe, Loader2, Mail } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi, Lang } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  groupPolicyBlocks,
  policyDoc,
  policyEditionResource,
} from '@/features/marketing/legal/policyContent'
import type { PolicyEdition } from '@/features/marketing/legal/policyContent'
import { SUPPORT_CHANNELS, SUPPORT_HOURS } from '@/config/support'
import { InvestFooter } from './InvestFooter'
import { useInvestHead } from './useInvestHead'
import { investRiskDisclosure } from './investRiskDisclosure'

/**
 * Standalone legal page for the Invest surface — /invest/legal/:slug.
 *
 * Deliberately outside the gated portal layout so the sign-in wall's footer
 * links work for a signed-out visitor: same documents the marketing legal
 * hub serves (Terms, Privacy, Support policy — shared lazy editions via
 * policyContent), plus an invest-specific Risk disclosure authored for this
 * surface. Unknown slugs fall back to /invest.
 */

type DocSlug = 'terms' | 'privacy' | 'support'
type AnySlug = DocSlug | 'risk'

const SLUGS: Record<AnySlug, { doc?: string; title: Bi; desc: Bi }> = {
  terms: {
    doc: 'terms',
    title: IM.invest_seo_title_terms,
    desc: IM.invest_seo_desc_terms,
  },
  privacy: {
    doc: 'privacy',
    title: IM.invest_seo_title_privacy,
    desc: IM.invest_seo_desc_privacy,
  },
  support: {
    doc: 'support-policy',
    title: IM.invest_seo_title_support,
    desc: IM.invest_seo_desc_support,
  },
  risk: {
    title: IM.invest_seo_title_risk,
    desc: IM.invest_seo_desc_risk,
  },
}

export function InvestLegalPage() {
  const { slug } = useParams()
  const { x, L, lang, setLang } = useI18n()

  const meta = slug && slug in SLUGS ? SLUGS[slug as AnySlug] : undefined
  useInvestHead(meta?.title ?? IM.invest_title, meta?.desc ?? IM.invest_subtitle)

  if (!meta) return <Navigate to="/invest" replace />

  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const label = lang === 'en' ? 'FR' : 'EN'

  return (
    <div className="surface-app flex min-h-[100dvh] flex-col bg-bg text-text">
      <header className="border-b border-border bg-bg-elevated">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-[16px] px-[20px] py-3">
          <Link
            to="/invest"
            className="shrink-0 font-display text-lg font-bold text-text no-underline"
          >
            Duti<span className="text-gold-strong">va</span>{' '}
            <span className="hidden text-[0.625rem] font-semibold tracking-[0.28em] text-text-3 min-[360px]:inline">
              {x(IM.invest_portal_title)}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setLang(other)}
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-control-border bg-bg-elevated px-3 font-sans text-[0.8125rem] font-semibold text-text transition-[border-color] duration-[160ms] ease-in-out hover:border-gold-border"
            aria-label={L('Toggle language', 'Changer de langue')}
          >
            <Globe size={15} aria-hidden="true" />
            {label}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 px-[20px] pt-[28px] pb-[48px]">
        <Link
          to="/invest"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent no-underline hover:opacity-80"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {x(IM.invest_legal_back)}
        </Link>

        {slug === 'risk' ? (
          <PolicyArticle edition={investRiskDisclosure[lang]} />
        ) : (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-[80px]">
                <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
              </div>
            }
          >
            <DocArticle
              key={`${slug}:${lang}`}
              docSlug={slug as DocSlug}
              showContact={slug === 'support'}
            />
          </Suspense>
        )}
      </main>

      <InvestFooter />
    </div>
  )
}

function DocArticle({ docSlug, showContact }: { docSlug: DocSlug; showContact?: boolean }) {
  const { lang } = useI18n()
  const doc = policyDoc(SLUGS[docSlug].doc ?? '')
  const resolved = doc ? use(policyEditionResource(doc, lang)) : undefined
  if (!resolved) return <Navigate to="/invest" replace />
  return <PolicyArticle edition={resolved.edition} lang={resolved.lang} contact={showContact} />
}

function PolicyArticle({
  edition,
  lang,
  contact,
}: {
  edition: PolicyEdition
  lang?: Lang
  contact?: boolean
}) {
  const { x, lang: uiLang } = useI18n()
  const editionLang = lang ?? uiLang

  return (
    <article className="mt-[20px]" lang={editionLang !== uiLang ? editionLang : undefined}>
      <h1 className="m-0 font-display text-[clamp(1.5rem,3vw,2rem)] leading-[1.15] font-semibold tracking-[-0.02em] text-text">
        {edition.title}
      </h1>
      {(edition.lastUpdated || edition.effectiveDate) && (
        <p className="m-0 mt-[8px] text-[12.5px] text-text-3">
          {edition.lastUpdated && `${x(IM.invest_legal_updated)} ${edition.lastUpdated}`}
          {edition.lastUpdated && edition.effectiveDate && ' · '}
          {edition.effectiveDate && `${x(IM.invest_legal_effective)} ${edition.effectiveDate}`}
        </p>
      )}

      {contact && <SupportCard />}

      {edition.callout && edition.callout.length > 0 && (
        <div className="mt-[18px] rounded-[12px] border border-gold-border bg-gold-bg px-[16px] py-[12px]">
          {edition.callout.map((line, i) => (
            <p key={i} className="m-0 text-[13px] leading-[1.6] text-text-2 [&+p]:mt-[6px]">
              {line}
            </p>
          ))}
        </div>
      )}

      {edition.sections.map((section) => (
        <section key={section.title} className="mt-[24px]">
          <h2 className="m-0 text-[15.5px] font-semibold text-text">{section.title}</h2>
          <div className="mt-[10px] flex flex-col gap-[10px]">
            {groupPolicyBlocks(section.blocks).map((group, i) =>
              group.kind === 'p' ? (
                <p key={i} className="m-0 text-[13.5px] leading-[1.65] text-text-2">
                  {group.text}
                </p>
              ) : (
                <ul key={i} className="m-0 flex list-disc flex-col gap-[6px] pl-[20px]">
                  {group.items.map((item, j) => (
                    <li key={j} className="text-[13.5px] leading-[1.6] text-text-2">
                      {item}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </div>
        </section>
      ))}
    </article>
  )
}

/* The support page gets its practical contact card above the policy text —
   email + staffed hours come from the support config, the same source the
   Access-required card uses. */
function SupportCard() {
  const { x, L } = useI18n()
  const channel = SUPPORT_CHANNELS.find((c) => c.id === 'support')
  return (
    <div className="mt-[18px] rounded-[12px] border border-border bg-surface px-[16px] py-[14px]">
      <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_legal_contact)}</h2>
      <div className="mt-[10px] flex flex-col gap-[8px] text-[13px] text-text-2">
        {channel && (
          <a
            href={`mailto:${channel.email}?subject=Dutiva%20Invest`}
            className="inline-flex w-fit items-center gap-[6px] font-semibold text-accent no-underline hover:underline"
          >
            <Mail size={13} strokeWidth={1.8} aria-hidden="true" />
            {channel.email}
          </a>
        )}
        <p className="m-0 text-[12.5px] text-text-muted">
          {x(IM.invest_legal_hours)} {SUPPORT_HOURS.startHour}–{SUPPORT_HOURS.endHour}{' '}
          {L(SUPPORT_HOURS.timezoneLabel.en, SUPPORT_HOURS.timezoneLabel.fr)} ·{' '}
          {L(SUPPORT_HOURS.holidayJurisdiction.en, SUPPORT_HOURS.holidayJurisdiction.fr)}
        </p>
      </div>
    </div>
  )
}
