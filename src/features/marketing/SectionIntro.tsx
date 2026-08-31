/** Shared section header: badge, display heading, one-line subcopy. */
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
    <div className="mb-10 max-w-[640px]">
      <span className="badge">{badge}</span>
      <h2 className="mt-4 font-display text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.02em] text-text">
        {title}
      </h2>
      <p className="mt-3 text-base leading-[1.6] text-text-2">{sub}</p>
    </div>
  )
}
