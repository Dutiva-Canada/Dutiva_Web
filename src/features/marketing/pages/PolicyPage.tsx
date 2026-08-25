import { Suspense, use } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { parseDisplayDate } from '@/seo/dates'
import {
  legalDocDescription,
  legalDocPath,
  legalDocTitle,
  legalRowByFrSlug,
  legalRowBySlug,
  langOfPath,
  seoRoute,
} from '@/seo/routes'
import type { LegalHubRow } from '../legal/legalHubData'
import { groupPolicyBlocks, policyDoc, policyEditionResource } from '../legal/policyContent'
import type { PolicyDoc } from '../legal/policyContent'
import { MarketingPageShell } from './MarketingPage'

/**
 * One policy document from the bilingual legal content collection, at
 * /legal/:slug (EN) or /fr/juridique/:frSlug (FR — localized slugs, see the
 * legal hub registry). Unknown slugs redirect back to the hub.
 *
 * The article suspends on its lazily imported edition (policyEditionResource
 * + React `use()`): prerendering waits for it, so the static HTML carries
 * the full document text, while a client-side visit still only downloads
 * the one document it is reading. All 26 documents currently ship both
 * editions; if a future document lands French-first, the French edition
 * renders under the EN UI with a notice and `lang="fr"` on the article.
 */
export function PolicyPage() {
  const { slug } = useParams()
  const { pathname } = useLocation()
  const { lang } = useI18n()
  const pathLang = langOfPath(pathname)
  /* The URL locale's slug space first, then the other locale's as a
     fallback so a mistyped cross-locale slug still resolves before we
     canonicalize it. */
  const row =
    pathLang === 'fr'
      ? (legalRowByFrSlug(slug ?? '') ?? legalRowBySlug(slug ?? ''))
      : (legalRowBySlug(slug ?? '') ?? legalRowByFrSlug(slug ?? ''))
  const doc = row ? policyDoc(row.slug) : undefined

  const legalIndex = seoRoute('legal').path[pathLang]

  if (!row || !doc) return <Navigate to={legalIndex} replace />

  const expectedSlug = pathLang === 'fr' ? row.frSlug : row.slug
  if ((slug ?? '') !== expectedSlug) {
    return <Navigate to={legalDocPath(row, pathLang)} replace />
  }

  return (
    <MarketingPageShell>
      {/* Metadata (<Seo>) renders inside the article once its edition
          resolves, so real document dates ride along; the shell paints
          immediately while the article suspends. */}
      <Suspense fallback={<div className="mx-auto max-w-[820px] px-6 pt-12 pb-16" />}>
        <PolicyArticle key={`${row.slug}:${lang}`} row={row} doc={doc} />
      </Suspense>
    </MarketingPageShell>
  )
}

function PolicyArticle({ row, doc }: { readonly row: LegalHubRow; readonly doc: PolicyDoc }) {
  const { t, L, lang } = useI18n()
  const resolved = use(policyEditionResource(doc, lang))

  if (!resolved) return <Navigate to={seoRoute('legal').path[lang]} replace />

  const { edition, lang: editionLang } = resolved
  const colon = L(': ', ' : ')
  const metaParts: { label: string; display: string; iso?: string }[] = []
  if (edition.lastUpdated) {
    metaParts.push({
      label: t('legalHub_lastUpdated'),
      display: edition.lastUpdated,
      iso: parseDisplayDate(edition.lastUpdated),
    })
  }
  if (edition.effectiveDate) {
    metaParts.push({
      label: t('legalHub_effective'),
      display: edition.effectiveDate,
      iso: parseDisplayDate(edition.effectiveDate),
    })
  }

  return (
    <article
      className="mx-auto max-w-[820px] px-6 pt-12 pb-16"
      lang={editionLang !== lang ? 'fr' : undefined}
    >
      <Seo
        page={{
          title: {
            en: `${legalDocTitle(row, 'en')} | Dutiva`,
            fr: `${legalDocTitle(row, 'fr')} | Dutiva`,
          },
          description: {
            en: legalDocDescription(row, 'en'),
            fr: legalDocDescription(row, 'fr'),
          },
          path: { en: legalDocPath(row, 'en'), fr: legalDocPath(row, 'fr') },
          indexable: true,
        }}
        datePublished={parseDisplayDate(edition.effectiveDate)}
        dateModified={parseDisplayDate(edition.lastUpdated)}
        breadcrumb={[
          { name: 'Dutiva', path: lang === 'fr' ? '/fr' : '/' },
          {
            name: lang === 'fr' ? 'Juridique et conformité' : 'Legal & compliance',
            path: seoRoute('legal').path[lang],
          },
          { name: legalDocTitle(row, lang) },
        ]}
      />
      <Link
        to={seoRoute('legal').path[lang]}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
      >
        <ArrowLeft size={15} />
        {t('legalHub_back')}
      </Link>

      <h1 className="mt-6 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-text">
        {edition.title}
      </h1>

      {metaParts.length > 0 && (
        <p className="mt-3 text-sm text-text-3">
          {metaParts.map((part, index) => (
            <span key={part.label}>
              {index > 0 && ' · '}
              {part.label}
              {colon}
              {part.iso ? <time dateTime={part.iso}>{part.display}</time> : part.display}
            </span>
          ))}
        </p>
      )}

      {editionLang !== lang && (
        <div className="premium-card-soft mt-6 flex items-start gap-2.5 px-[18px] py-[14px]">
          <Info size={15} className="mt-0.5 flex-none text-gold-strong" />
          <p className="text-sm leading-[1.55] text-text-2">{t('legalHub_frOnly')}</p>
        </div>
      )}

      {edition.callout && edition.callout.length > 0 && (
        <div className="premium-card mt-6 p-[clamp(20px,3vw,28px)]">
          {edition.callout.map((entry, index) => (
            <p
              key={entry}
              className={`${index > 0 ? 'mt-3 ' : ''}text-[0.9375rem] leading-[1.65] text-text-2`}
            >
              {entry}
            </p>
          ))}
        </div>
      )}

      {edition.sections.map((section) => (
        <section key={section.title}>
          <h2 className="mt-9 font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-text">
            {section.title}
          </h2>
          {groupPolicyBlocks(section.blocks).map((group) =>
            group.kind === 'p' ? (
              <p key={group.text} className="mt-3.5 text-[0.9375rem] leading-[1.7] text-text-2">
                {group.text}
              </p>
            ) : (
              <ul key={group.items.join('|')} className="mt-3.5 grid list-disc gap-2 pl-5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="text-[0.9375rem] leading-[1.65] text-text-2 marker:text-gold-strong"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}

      {/* Not the shared src/components/Disclaimer.tsx — it is styled with app-surface tokens (text-text-muted/text-text-faint) that are undefined in the .surface-marketing scope. */}
      <div className="mt-10 flex items-start gap-2.5 border-t border-border pt-5">
        <Info size={14} className="mt-0.5 flex-none text-gold-strong" />
        <span className="text-[12.5px] leading-[1.6] text-text-3">{t('disclaimer_full')}</span>
      </div>
    </article>
  )
}
