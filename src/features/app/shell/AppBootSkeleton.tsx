/**
 * App boot skeleton — shell-shaped placeholder for the two windows where the
 * workspace used to paint blank: the JS bundle download (embedded statically
 * into dist/app.html by scripts/prerender.mjs) and the signed-in resolution
 * pass (RequireAdminSession). Decorative only — the text alternative lives
 * on the caller's role="status" node.
 */
export function AppBootSkeleton() {
  const bar = 'animate-pulse rounded-[6px] bg-inset'
  const card = 'animate-pulse rounded-[12px] border border-border bg-surface'
  return (
    <div className="flex h-screen bg-bg" aria-hidden="true">
      {/* Sidebar */}
      <div className="hidden w-[248px] shrink-0 flex-col gap-[14px] border-e border-border bg-surface p-[16px] md:flex">
        <div className={`${bar} h-[26px] w-[120px]`} />
        <div className="mt-[6px] flex flex-col gap-[8px]">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={`${bar} h-[30px] w-full`} />
          ))}
        </div>
      </div>
      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface px-[20px]">
          <div className={`${bar} h-[14px] w-[160px]`} />
          <div className={`${bar} h-[28px] w-[28px] rounded-full`} />
        </div>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[14px] p-[24px]">
          <div className={`${bar} h-[20px] w-[220px]`} />
          <div className={`${card} h-[88px]`} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-[14px]">
            <div className={`${card} h-[86px]`} />
            <div className={`${card} h-[86px]`} />
            <div className={`${card} h-[86px]`} />
          </div>
          <div className={`${card} h-[120px]`} />
        </div>
      </div>
    </div>
  )
}
