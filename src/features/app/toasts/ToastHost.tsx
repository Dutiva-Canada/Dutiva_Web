import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { useToasts } from './toastsContext'

/**
 * Bottom-right toast stack — the port of the prototype's `toastsView` markup:
 * fixed at 20px from the corner (z 400), each toast an ink-filled pill with
 * white 13.5px text entering on `toastIn`. (The prototype's only alternate
 * ramp — `--risk-dot` for an 'error' tone — has no producer in the app;
 * every `pushToast` uses the ink style ported here.)
 *
 * Mounted by the AppShell inside the `.surface-app` token scope. Messages are
 * stored as `Bi` in the toasts context, so a live language toggle
 * re-localizes visible toasts.
 */
export function ToastHost() {
  const { toasts, dismissToast } = useToasts()
  const { lang } = useI18n()
  return (
    <div className="pointer-events-none fixed right-[20px] bottom-[20px] z-400 flex max-w-[340px] flex-col gap-[8px]">
      {/* Deliberate deviation: the prototype fills with var(--ink), which is
          #c4c9d9 in the light theme — white text at ~1.65:1. The pill is
          pinned to --toast-bg (#2a313d) in both themes: identical to the
          dark reference, legible in light. */}
      {toasts.map((toast) => (
        <output
          key={toast.id}
          className="flex animate-[toastIn_.2s_ease] flex-col gap-[8px] rounded-[10px] bg-toast-bg px-[16px] py-[12px] text-[13.5px] font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
        >
          <span>{pickL(toast.message, lang)}</span>
          {toast.action != null && (
            <Link
              to={toast.action.to}
              onClick={() => dismissToast(toast.id)}
              className="pointer-events-auto w-fit text-[12.5px] font-bold text-gold-on-navy underline-offset-2 hover:underline"
            >
              {pickL(toast.action.label, lang)}
            </Link>
          )}
        </output>
      ))}
    </div>
  )
}
