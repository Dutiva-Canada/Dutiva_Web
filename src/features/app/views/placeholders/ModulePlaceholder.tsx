import { Link } from 'react-router-dom'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { placeholderMessages as M } from '@/i18n/messages/placeholder'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { Construction } from 'lucide-react'

export function ModulePlaceholder({ title }: { readonly title: Bi }) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[12px] border border-gold-border bg-gold-bg">
        <Construction size={26} className="text-gold-fg" aria-hidden="true" />
      </div>
      <h1 className="m-0 mb-2 font-display text-[22px] font-semibold text-text">{x(title)}</h1>
      <h2 className="m-0 mb-6 max-w-[420px] text-[15px] font-semibold text-text">
        {x(M.placeholder_title)}
      </h2>
      <p className="mb-8 max-w-[420px] text-[13.5px] leading-relaxed text-text-muted">
        {x(M.placeholder_message)}
      </p>
      <Link
        to={`${root}/home`}
        className="rounded-[8px] bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
      >
        {x(M.placeholder_back_home)}
      </Link>
    </div>
  )
}
