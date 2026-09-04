import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'

/**
 * Production mode view for the hiring module.
 * This will connect to real database tables once the schema is implemented.
 * For now, it shows a placeholder indicating production mode is active.
 */
export function HiringProductionView() {
  const { x } = useI18n()

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-[18px]">
          <h1 className="text-[20px] font-bold text-text">{x(M.hiring_module_title)}</h1>
          <p className="mt-[2px] text-[13px] text-text-muted">{x(M.hiring_module_description)}</p>
        </div>

        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_prod_empty_title)}</div>
          <div className="mb-[14px] text-[13px] text-text-muted">{x(M.hiring_prod_empty_body)}</div>
        </div>
      </div>
    </div>
  )
}
