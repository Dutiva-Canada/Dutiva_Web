import type { ReactNode } from 'react'

/**
 * The portal's page opening — title (+ hint/subtitle) on the left,
 * primary actions on the right, wrapping onto narrow columns. Every tab
 * renders this one element so page headers can't drift into per-page
 * idioms: a tab's top is always the same shape, in the same place.
 */
export function PageHead({
  title,
  sub,
  actions,
  children,
}: {
  /** The h1 — string, or a fragment when it carries an InfoHint. */
  title: ReactNode
  /** Subtitle line under the title — rendered in sb-sub. */
  sub?: ReactNode
  /** Right-side verbs — rendered inside sb-row-actions. */
  actions?: ReactNode
  /** Extra left-column content under the sub (a data-as-of line, etc.). */
  children?: ReactNode
}) {
  return (
    <div className="sb-head-row">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sb-sub">{sub}</p>}
        {children}
      </div>
      {actions && <div className="sb-row-actions">{actions}</div>}
    </div>
  )
}
