import { formatArticleMonthYear } from '@/seo/dates'
import type { Lang } from '@/i18n/core'

/**
 * Visible "Published {month year}" for blog cards and article pages.
 * `iso` is the article's `updated` field (same value as sitemap lastmod).
 */
export function ArticlePublishedLabel({
  iso,
  lang,
  template,
}: {
  readonly iso: string
  readonly lang: Lang
  readonly template: string
}) {
  const monthYear = formatArticleMonthYear(iso, lang)
  return <time dateTime={iso}>{template.replace('{date}', monthYear)}</time>
}
