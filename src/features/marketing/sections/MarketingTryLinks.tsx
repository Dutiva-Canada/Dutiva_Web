import { Link } from 'react-router-dom'
import { ChevronRight, FileText, Scale } from 'lucide-react'
import { usePublicPath } from '@/seo/usePublicPath'
import { useLanding } from '../useLanding'

/** Secondary CTAs to interactive or sample marketing surfaces — no sign-in required. */
export function MarketingTryLinks({ className }: { readonly className?: string }) {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  const linkClass =
    'inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3.5 py-2 text-sm font-semibold text-text transition-opacity hover:opacity-80'

  return (
    <div className={`flex flex-wrap gap-2.5 ${className ?? ''}`}>
      <Link to={p('templates')} className={linkClass}>
        <FileText size={15} className="text-gold-strong" aria-hidden="true" />
        {lt('landing_try_samples')}
        <ChevronRight size={14} className="text-text-3" aria-hidden="true" />
      </Link>
      <Link to={p('jurisdictionTool')} className={linkClass}>
        <Scale size={15} className="text-gold-strong" aria-hidden="true" />
        {lt('landing_try_jurisdiction')}
        <ChevronRight size={14} className="text-text-3" aria-hidden="true" />
      </Link>
    </div>
  )
}
