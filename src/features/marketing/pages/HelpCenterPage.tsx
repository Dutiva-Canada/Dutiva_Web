import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CreditCard,
  FileText,
  LifeBuoy,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { helpDocPath } from '@/seo/routes'
import { maxIsoDate } from '@/seo/dates'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  helpArticlesByCategory,
} from '@/features/support/help/helpCenterData'
import type { HelpArticle, HelpIcon } from '@/features/support/help/helpCenterData'
import { HelpContactCta } from '@/features/support/help/HelpContactCta'
import { searchHelpArticles } from '@/features/support/help/helpSearch'
import { trackEvent } from '@/features/support/analytics/supportAnalytics'
import { MarketingPageShell, PageHero } from './MarketingPage'

const CATEGORY_ICONS: Record<HelpIcon, LucideIcon> = {
  rocket: Rocket,
  'file-text': FileText,
  sparkles: Sparkles,
  'credit-card': CreditCard,
  'shield-check': ShieldCheck,
  'life-buoy': LifeBuoy,
}

/** /help (EN) · /fr/aide (FR) — searchable, category-organized self-service hub. */
export function HelpCenterPage() {
  const { t, x, lang } = useI18n()
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const results = trimmed ? searchHelpArticles(query, lang) : []

  // Debounced search analytics — fire one event after the user stops typing
  // for 1 second, not one per keystroke. Empty queries are not tracked.
  useEffect(() => {
    if (!trimmed) return
    const timer = setTimeout(() => {
      trackEvent({
        event_type: 'help_search',
        search_query: trimmed,
        search_result_count: results.length,
        locale: lang,
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [trimmed, results.length, lang])

  return (
    <MarketingPageShell>
      <Seo
        route="help"
        pageType="CollectionPage"
        dateModified={maxIsoDate(HELP_ARTICLES.map((article) => article.updated))}
      />
      <PageHero eyebrow={t('help_eyebrow')} title={t('help_h1')} intro={t('help_intro')} />

      <div role="search" className="mx-auto max-w-[640px] px-6">
        <label htmlFor="help-search" className="sr-only">
          {t('help_search_label')}
        </label>
        <div className="relative">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-3"
          />
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('help_search_placeholder')}
            autoComplete="off"
            className="w-full rounded-full border border-control-border bg-bg py-3.5 pr-12 pl-11 text-[0.9375rem] text-text shadow-sm outline-none transition-colors focus-visible:border-gold-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-strong"
          />
          {trimmed && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('help_search_clear')}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-text-3 transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-strong"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {/* Screen-reader status: announce result counts as the query changes. */}
        <p className="sr-only" role="status" aria-live="polite">
          {trimmed
            ? `${results.length} ${x({ en: results.length === 1 ? 'result' : 'results', fr: results.length === 1 ? 'résultat' : 'résultats' })}`
            : ''}
        </p>
      </div>

      {trimmed ? (
        results.length > 0 ? (
          <section className="mx-auto max-w-[840px] px-6 py-10">
            <h2 className="mb-5 text-sm font-semibold text-text-3">
              {t('help_results_for')} “{trimmed}”
            </h2>
            <ul className="grid gap-3">
              {results.map(({ article }) => (
                <li key={article.slug}>
                  <HelpArticleCard article={article} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            <section className="mx-auto max-w-[840px] px-6 py-10">
              <div className="premium-card-soft px-[22px] py-[26px] text-center">
                <h2 className="text-[1.0625rem] font-semibold text-text">
                  {t('help_no_results_title')}
                </h2>
                <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-[1.6] text-text-2">
                  {t('help_no_results_body')}
                </p>
              </div>
            </section>
            <BrowseByTopic />
          </>
        )
      ) : (
        <BrowseByTopic />
      )}

      <HelpContactCta />
    </MarketingPageShell>
  )
}

function BrowseByTopic() {
  const { t } = useI18n()
  return (
    <section className="mx-auto max-w-[1000px] px-6 py-10">
      <h2 className="mb-6 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-semibold tracking-[-0.02em] text-text">
        {t('help_browse_title')}
      </h2>
      <div className="grid gap-6">
        {HELP_CATEGORIES.map((category) => {
          const articles = helpArticlesByCategory(category.id)
          if (articles.length === 0) return null
          const Icon = CATEGORY_ICONS[category.icon]
          return (
            <CategoryGroup key={category.id} icon={Icon} category={category} articles={articles} />
          )
        })}
      </div>
    </section>
  )
}

function CategoryGroup({
  icon: Icon,
  category,
  articles,
}: {
  readonly icon: LucideIcon
  readonly category: (typeof HELP_CATEGORIES)[number]
  readonly articles: HelpArticle[]
}) {
  const { x } = useI18n()
  return (
    <div className="premium-card-soft p-[clamp(20px,3vw,28px)]">
      <div className="flex items-start gap-3">
        <span className="flex-none rounded-xl bg-gold-subtle p-2.5 text-gold-strong">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-[1.0625rem] font-semibold text-text">{x(category.title)}</h3>
          <p className="mt-1 text-sm leading-[1.5] text-text-2">{x(category.description)}</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {articles.map((article) => (
          <li key={article.slug}>
            <HelpArticleCard article={article} compact />
          </li>
        ))}
      </ul>
    </div>
  )
}

function HelpArticleCard({
  article,
  compact = false,
}: {
  readonly article: HelpArticle
  readonly compact?: boolean
}) {
  const { x, lang } = useI18n()
  return (
    <Link
      to={helpDocPath(article, lang)}
      className={`group flex items-start justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-3 transition-colors hover:border-gold-strong ${compact ? '' : 'px-[18px] py-4'}`}
    >
      <div>
        <div className="text-[0.9375rem] font-semibold text-text">{x(article.title)}</div>
        {!compact && <p className="mt-1 text-sm leading-[1.5] text-text-2">{x(article.summary)}</p>}
      </div>
      <ArrowRight
        size={15}
        aria-hidden="true"
        className="mt-1 flex-none text-text-3 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
