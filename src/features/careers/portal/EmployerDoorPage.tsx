import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  bootstrapOrganization,
  claimOrgInvitations,
  fetchOrganizationMembership,
  saveStoredMode,
} from '@/features/app/workspaceMode/api'
import { CandidateAuthPanel } from './CandidateAuthPanel'

type MembershipState = 'loading' | 'member' | 'none'

const cardClass =
  'rounded-[18px] border border-border bg-surface p-[28px] shadow-[0_20px_50px_-24px_rgba(13,27,42,0.35)] min-[640px]:p-[32px]'
const fieldClass =
  'h-[46px] w-full rounded-[11px] border border-border bg-bg px-[14px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[6px] block text-[12.5px] font-semibold text-text-2'
const primaryBtnClass =
  'flex h-[46px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60'

/**
 * /employer — the employer door into the Dutiva workspace. Signed-out visitors
 * get the passwordless sign-in card (magic links return here via `next`).
 * Signed-in users either open their workspace (membership exists — including
 * freshly claimed invites) or name their organization, which the
 * create_organization RPC provisions with them as owner (capacity-gated
 * server-side). The workspace itself is the existing /app production mode —
 * this page is only the front door, so it stays visually consistent.
 */
export function EmployerDoorPage() {
  const { x } = useI18n()
  const { status, session, refreshAuthorization } = useAuth()
  const { showToast } = useToasts()
  const navigate = useNavigate()

  const [membership, setMembership] = useState<MembershipState>('loading')
  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<'capacity' | 'waitlist' | 'error' | null>(null)

  const resolve = useCallback(async () => {
    if (status !== 'signed-in' || !session) return
    setMembership('loading')
    /* Claim first — an invited teammate's pending invite becomes a membership
       here, so they see "open your workspace" rather than the create form. */
    await claimOrgInvitations()
    const m = await fetchOrganizationMembership(session.user.id)
    setMembership(m ? 'member' : 'none')
  }, [status, session])

  useEffect(() => {
    void resolve()
  }, [resolve])

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = orgName.trim()
    if (!name || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const result = await bootstrapOrganization(name, name)
      if (result.status === 'success') {
        if (session) await saveStoredMode(session.user.id, 'production')
        /* The workspace gate (RequireAdminSession → authorized) evaluated at
           sign-in, before this org existed — re-check now that the membership
           is real so the navigation doesn't bounce to /app/welcome. */
        await refreshAuthorization()
        showToast(M.careers_employer_created, 'ok')
        navigate('/app/home')
        return
      }
      setCreateError(result.status === 'capacity' ? 'capacity' : result.status)
    } catch {
      setCreateError('error')
    } finally {
      setCreating(false)
    }
  }

  const openWorkspace = async () => {
    /* Members land in production — the provider resolves mode from the stored
       preference; claiming already flipped it for fresh invitees. Refresh
       authorization first: a member admitted via a claimed invite may still
       hold the sign-in-time `authorized=false` verdict. */
    if (session) await saveStoredMode(session.user.id, 'production')
    await refreshAuthorization()
    navigate('/app/home')
  }

  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center px-[20px] py-[56px]">
      <div className="mb-[24px] text-center">
        <div className="mx-auto mb-[16px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent-soft text-accent">
          <Building2 size={24} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h1 className="m-0 font-display text-[26px] font-bold tracking-[-0.01em] text-text">
          {x(M.careers_employer_title)}
        </h1>
        <p className="mx-auto mt-[8px] max-w-[420px] text-[14px] leading-[1.55] text-text-muted">
          {x(M.careers_employer_lead)}
        </p>
      </div>

      {status !== 'signed-in' ? (
        <div className="w-full max-w-[420px]">
          <CandidateAuthPanel next="/employer" />
        </div>
      ) : membership === 'loading' ? (
        <div className="flex items-center gap-[8px] text-[14px] text-text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          {x(M.careers_loading)}
        </div>
      ) : membership === 'member' ? (
        <div className={`${cardClass} w-full max-w-[420px] text-center`}>
          <p className="m-0 text-[14px] leading-[1.55] text-text-2">
            {x(M.careers_employer_member_body)}
          </p>
          <button
            type="button"
            onClick={() => void openWorkspace()}
            className={`${primaryBtnClass} mt-[18px]`}
          >
            {x(M.careers_employer_open_workspace)}
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className={`${cardClass} w-full max-w-[420px]`}>
          <h2 className="m-0 font-display text-[17px] font-semibold text-text">
            {x(M.careers_employer_create_title)}
          </h2>
          <p className="m-0 mt-[6px] mb-[18px] text-[13px] leading-[1.5] text-text-muted">
            {x(M.careers_employer_create_body)}
          </p>
          <form onSubmit={onCreate} className="flex flex-col gap-[14px]">
            <div>
              <label className={labelClass} htmlFor="employer-org-name">
                {x(M.careers_employer_org_name)}
              </label>
              <input
                id="employer-org-name"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={x(M.careers_employer_org_name_placeholder)}
                className={fieldClass}
              />
            </div>
            {createError && (
              <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
                {x(
                  createError === 'capacity'
                    ? M.careers_employer_create_capacity
                    : createError === 'waitlist'
                      ? M.careers_employer_create_waitlist
                      : M.careers_employer_create_error,
                )}
              </p>
            )}
            <button type="submit" disabled={creating || !orgName.trim()} className={primaryBtnClass}>
              {creating && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {creating ? x(M.careers_employer_creating) : x(M.careers_employer_create_cta)}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
