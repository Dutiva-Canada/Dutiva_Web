import { useState } from 'react'
import { Loader2, UserRound } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { authMessages as M } from '@/i18n/messages/auth'
import { useAuth } from './authContext'
import { AuthSignInForm } from './AuthSignInForm'

/**
 * Topbar account/sign-in entry point — the only globally reachable way to
 * get an authenticated session (previously only available inside the
 * Knowledge view's guidance panel). Signed in unlocks real AI Advisor
 * replies and live legal sources; this button doesn't gate anything
 * itself. No prototype counterpart.
 */
export function AuthMenuButton({ compact = false }: { readonly compact?: boolean }) {
  const { x } = useI18n()
  const { status, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        aria-label={x(M.auth_menu_title)}
        aria-expanded={open}
        className={
          compact
            ? 'flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border-none bg-transparent p-[6px] text-text'
            : 'relative cursor-pointer border-none bg-transparent p-[6px] text-text-3'
        }
      >
        {/* The signed-in dot anchors to the glyph, not the button, so the
            compact variant can grow to a 44pt touch target without dragging
            the dot off into the corner of the larger box. */}
        <span className="relative flex">
          <UserRound size={compact ? 19 : 18} strokeWidth={1.7} />
          {status === 'signed-in' && (
            <div className="absolute top-[-1px] right-0 h-[7px] w-[7px] rounded-full border-[1.5px] border-bg bg-gold-dot" />
          )}
        </span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-190" aria-hidden="true" />
          <dialog
            open
            aria-label={x(M.auth_menu_title)}
            className="absolute top-[38px] right-0 left-auto z-200 m-0 w-[min(300px,calc(100vw-24px))] animate-[fadeInUp_.15s_ease] overflow-hidden rounded-[12px] border border-border bg-surface p-[16px] shadow-popover"
          >
            <div className="mb-[10px] text-[13.5px] font-bold text-text">
              {x(M.auth_menu_title)}
            </div>

            {status === 'loading' && (
              <div className="flex items-center gap-[8px] text-[13px] text-text-muted">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                {x(M.auth_sending)}
              </div>
            )}

            {/* One branch for both states, and deliberately so: the form itself
                shows the "check your email" confirmation and then takes the
                6-digit code. Splitting them would remount the form at the
                moment the status flips to 'sent-link', discarding the address
                it needs to verify that code against. */}
            {(status === 'signed-out' || status === 'sent-link') && (
              <div className="flex flex-col gap-[10px]">
                <p className="text-[12.5px] text-text-2">{x(M.auth_menu_description)}</p>
                <AuthSignInForm idPrefix="topbar" />
              </div>
            )}

            {status === 'signed-in' && (
              <div className="flex items-center justify-between gap-[10px]">
                <span className="text-[13px] text-text-2">{x(M.auth_signed_in)}</span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="shrink-0 cursor-pointer rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[12.5px] font-semibold text-text-2"
                >
                  {x(M.auth_sign_out)}
                </button>
              </div>
            )}
          </dialog>
        </>
      )}
    </div>
  )
}
