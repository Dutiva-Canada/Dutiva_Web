import type { LucideIcon } from 'lucide-react'

/**
 * Shared empty-state block for production HR modules — icon, title, body.
 */
export function ModuleEmptyBlock({
  icon: Icon,
  title,
  body,
}: {
  readonly icon: LucideIcon
  readonly title: string
  readonly body: string
}) {
  return (
    <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[32px] text-center">
      <div className="mx-auto mb-[12px] flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-inset">
        <Icon size={18} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
      </div>
      <div className="mb-[6px] text-[15px] font-semibold text-text">{title}</div>
      <p className="m-0 text-[13px] leading-[1.55] text-text-muted">{body}</p>
    </div>
  )
}
