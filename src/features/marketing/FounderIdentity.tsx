import { Linkedin } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { FOUNDER } from '@/seo/site'

const PHOTO_PX = { compact: 168, about: 240 } as const

/**
 * Named founder card (photo, title, LinkedIn) shared by the homepage Why
 * Dutiva band and the About “Why we built Dutiva” section. Identity facts
 * come from `FOUNDER` so the UI cannot drift from JSON-LD.
 */
export function FounderIdentity({ size }: { readonly size: 'compact' | 'about' }) {
  const { t, lang } = useI18n()
  const px = PHOTO_PX[size]
  const compact = size === 'compact'
  return (
    <div
      className={
        compact ? 'mt-6 flex items-center gap-4' : 'flex w-[240px] flex-col items-start gap-4'
      }
    >
      <img
        src={FOUNDER.photoPath}
        alt={t('about_founder_alt')}
        width={px}
        height={px}
        className={`rounded-2xl border border-border object-cover ${compact ? 'size-[168px]' : 'size-[240px]'}`}
      />
      <div className="min-w-0">
        <div className="font-semibold text-text">{FOUNDER.name}</div>
        <p className="mt-0.5 text-sm text-text-3">{FOUNDER.jobTitle[lang]}</p>
        <a
          href={FOUNDER.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          <Linkedin size={16} aria-hidden="true" className="flex-none" />
          {t('about_founder_linkedin')}
        </a>
      </div>
    </div>
  )
}
