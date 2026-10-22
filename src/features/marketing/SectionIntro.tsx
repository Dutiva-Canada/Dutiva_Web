/** Shared section header — the portal page-head: caps eyebrow, serif
    heading, one muted line of subcopy. */
export function SectionIntro({
  badge,
  title,
  sub,
}: {
  readonly badge: string
  readonly title: string
  readonly sub: string
}) {
  return (
    <div className="mb-7 max-w-[640px]">
      <span className="lp-eyebrow">{badge}</span>
      <h2 className="lp-h2 mt-2">{title}</h2>
      <p className="lp-sub mt-2 leading-[1.6]">{sub}</p>
    </div>
  )
}
