import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { formatArticleMonthYear } from '@/seo/dates'
import { CHANGELOG_ENTRIES } from '../changelog/changelogEntries'
import { MarketingPageShell, PageCta, PageHero } from './MarketingPage'

/** /changelog — dated public product updates (changelogEntries data). */
export function ChangelogPage() {
  const { t, x, lang } = useI18n()
  const { p } = usePublicPath()
  return (
    <MarketingPageShell>
      <Seo route="changelog" />
      <PageHero eyebrow={t('changelog_eyebrow')} title={t('changelog_h1')} intro={t('changelog_intro')} />

      <section className="mx-auto max-w-[760px] px-6 py-2 pb-10">
        <p className="text-sm font-medium text-text-3">{t('changelog_byline')}</p>
        <ol className="mt-8 grid list-none gap-6 p-0">
          {CHANGELOG_ENTRIES.map((entry) => (
            <li key={entry.date + entry.title.en} className="premium-card-soft p-[22px]">
              <time
                dateTime={entry.date}
                className="text-xs font-semibold tracking-[0.14em] text-gold-strong uppercase"
              >
                {formatArticleMonthYear(entry.date, lang)} · {entry.date}
              </time>
              <h2 className="mt-2.5 text-[1.0625rem] font-semibold text-text">{x(entry.title)}</h2>
              <p className="mt-2 text-sm leading-[1.65] text-text-2">{x(entry.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <PageCta
        title={t('changelog_cta_t')}
        body={t('changelog_cta_p')}
        action={t('changelog_cta_btn')}
        to={p('pricing')}
      />
    </MarketingPageShell>
  )
}
