import { ExternalLink } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { activeReviewDirectories } from '@/config/reviewDirectories'

const LINK_CLASS =
  'inline-flex items-center gap-1.5 text-sm text-text-2 transition-opacity hover:opacity-80'

/**
 * External review-directory links — rendered only when `reviewUrl` is set in
 * {@link reviewDirectories}. Footer and trust surfaces share this component.
 */
export function ReviewDirectoryLinks({ className }: { readonly className?: string }) {
  const { x } = useI18n()
  const links = activeReviewDirectories()
  if (links.length === 0) return null

  return (
    <div className={className ?? 'grid gap-2'}>
      {links.map((directory) => (
        <a
          key={directory.id}
          href={directory.reviewUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {x(directory.label)}
          <ExternalLink size={14} aria-hidden="true" className="flex-none" />
        </a>
      ))}
    </div>
  )
}
