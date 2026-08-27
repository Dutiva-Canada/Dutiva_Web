import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'

export function PublicDemoBanner() {
  const { x } = useI18n()
  const { isPublicDemo } = useWorkspaceRoot()
  if (!isPublicDemo) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg-soft px-4 py-2 text-xs text-text-2 lg:px-6">
      <Info size={14} className="shrink-0 text-gold-strong" aria-hidden="true" />
      <span>{x(M.demo_banner_text)}</span>
      <Link to="/app/welcome" className="font-semibold text-gold-strong transition-opacity hover:opacity-80">
        {x(M.demo_banner_cta)}
      </Link>
    </div>
  )
}
