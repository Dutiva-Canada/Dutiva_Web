import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import { getPostingStatusLabel, getPostingStatusTone } from './postingStatus'

export interface JobPostingCardProps {
  title: ReactNode
  department: ReactNode
  location: ReactNode
  type: ReactNode
  postedDate: string | null | undefined
  closingDate?: string | null | undefined
  status: string
  onClick: () => void
  ariaLabel: string
}

export function JobPostingCard({
  title,
  department,
  location,
  type,
  postedDate,
  closingDate,
  status,
  onClick,
  ariaLabel,
}: JobPostingCardProps) {
  const { x } = useI18n()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-full cursor-pointer rounded-[12px] border border-border bg-surface p-[16px] text-left font-sans hover:border-(--accent-soft-border)"
    >
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex-1">
          <div className="text-[14.5px] font-semibold text-text">{title}</div>
          <div className="mt-[8px] space-y-[4px] text-[13px] text-text-2">
            <div>
              {department} · {location}
            </div>
            <div>{type}</div>
            <div className="text-[12px] text-text-muted">
              {x(M.hiring_posting_posted)} {postedDate || '-'}
              {closingDate && ` · ${x(M.hiring_posting_closing)} ${closingDate}`}
            </div>
          </div>
        </div>
        <span className={statusChipClass(getPostingStatusTone(status))}>
          {x(getPostingStatusLabel(status))}
        </span>
      </div>
    </button>
  )
}
