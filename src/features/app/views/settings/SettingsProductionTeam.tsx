import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, MailPlus, Trash2, UserRound } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { pickL } from '@/i18n/core'
import {
  inviteOrgMember,
  listOrgInvitations,
  listOrgMembers,
  removeOrgMember,
  revokeOrgInvitation,
  updateMemberRole,
  updateMemberScope,
} from '@/features/app/workspaceMode/api'
import type { OrgDirectoryMember, OrgInvitation } from '@/features/app/workspaceMode/api'
import type { OrgMemberRole } from '@/features/app/workspaceMode/roles'
import { isModuleScopedRole } from '@/features/app/workspaceMode/roles'
import {
  MODULE_LABELS,
  SCOPABLE_MODULES,
} from '@/features/app/workspaceMode/workspaceModules'
import { Card, Section } from './settingsPrimitives'

/** Roles an admin may grant through the invite form and role picker. */
const ASSIGNABLE_ROLES: OrgMemberRole[] = [
  'admin',
  'manager',
  'professional',
  'member',
  'consultant',
  'viewer',
]

function roleLabel(role: string | null, x: (m: { en: string; fr: string }) => string): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return x(M.settings_role_owner)
    case 'manager':
      return x(M.settings_role_manager)
    case 'professional':
      return x(M.settings_role_professional)
    case 'consultant':
      return x(M.settings_role_consultant)
    case 'member':
      return x(M.settings_role_member)
    case 'viewer':
      return x(M.settings_role_viewer)
    default:
      return x(M.settings_role_member)
  }
}

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || '·'

const fieldClass =
  'rounded-[9px] border border-border bg-bg px-[10px] py-[7px] text-[13px] text-text outline-none transition-[border-color] focus:border-navy'

/** date input value ('YYYY-MM-DD') → end-of-day UTC ISO; '' → null. */
function expiryFromInput(value: string): string | null {
  if (!value) return null
  const parsed = new Date(`${value}T23:59:59.999Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/** ISO timestamp → date input value ('YYYY-MM-DD'); null/'' → ''. */
function expiryToInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

interface ScopeFieldsProps {
  readonly modules: string[]
  readonly onToggleModule: (key: string) => void
  readonly expiry: string
  readonly onExpiryChange: (value: string) => void
  readonly disabled?: boolean
}

/**
 * The module-scope + expiry picker shared by the invite form and the
 * per-member scope editor (migration 0244). Rendered only for scoped roles
 * (consultant/viewer) — an empty module set means unscoped member access.
 */
function ScopeFields({
  modules,
  onToggleModule,
  expiry,
  onExpiryChange,
  disabled = false,
}: ScopeFieldsProps) {
  const { x, lang } = useI18n()
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <div>
        <span className="mb-[4px] block text-[12px] font-semibold text-text-muted">
          {x(M.settings_team_scope_label)}
        </span>
        <p className="m-0 mb-[6px] text-[11.5px] leading-[1.4] text-text-faint">
          {x(M.settings_team_scope_hint)}
        </p>
        <div className="grid grid-cols-2 gap-[6px] sm:grid-cols-3">
          {SCOPABLE_MODULES.map((key) => (
            <label key={key} className="flex items-center gap-[5px] text-[12px] text-text">
              <input
                type="checkbox"
                checked={modules.includes(key)}
                disabled={disabled}
                onChange={() => onToggleModule(key)}
              />
              {pickL(MODULE_LABELS[key], lang)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label
          htmlFor={disabled ? undefined : 'scope-expiry'}
          className="mb-[4px] block text-[12px] font-semibold text-text-muted"
        >
          {x(M.settings_team_expiry)}
        </label>
        <input
          id="scope-expiry"
          type="date"
          value={expiry}
          disabled={disabled}
          onChange={(e) => onExpiryChange(e.target.value)}
          className={fieldClass}
        />
      </div>
    </div>
  )
}

/**
 * Production team management — member directory, email invites, role changes
 * and removals. Backed by org_member_directory / organization_invitations
 * (migration 0168); write controls render only for org admins (owner/admin
 * membership or platform admin), matching the RLS policies.
 */
export function SettingsProductionTeam() {
  const { x, lang } = useI18n()
  const { identity, memberRole, isOrgAdmin, organizationId } = useWorkspaceMode()
  const { session } = useAuth()
  const { showToast } = useToasts()

  const [members, setMembers] = useState<OrgDirectoryMember[] | null>(null)
  const [invitations, setInvitations] = useState<OrgInvitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>('member')
  const [inviteModules, setInviteModules] = useState<string[]>([])
  const [inviteExpiry, setInviteExpiry] = useState('')
  const [inviting, setInviting] = useState(false)
  const [busyMember, setBusyMember] = useState<string | null>(null)
  const [scopeEditId, setScopeEditId] = useState<string | null>(null)
  const [scopeModules, setScopeModules] = useState<string[]>([])
  const [scopeExpiry, setScopeExpiry] = useState('')

  const selfUserId = session?.user.id ?? ''

  const load = useCallback(async () => {
    if (!organizationId) return
    const [m, i] = await Promise.all([
      listOrgMembers(organizationId),
      listOrgInvitations(organizationId),
    ])
    setMembers(m)
    setInvitations(i)
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const onInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!organizationId || inviting) return
    const email = inviteEmail.trim()
    if (!email) return
    setInviting(true)
    try {
      /* Module scope rides the invite so a consultant's first sign-in is
         already scoped — no window where they hold unscoped access. */
      const result = await inviteOrgMember(organizationId, email, inviteRole, {
        grantedModules: isModuleScopedRole(inviteRole) ? inviteModules : [],
        accessExpiresAt: isModuleScopedRole(inviteRole) ? expiryFromInput(inviteExpiry) : null,
      })
      if ('error' in result) {
        showToast(M.settings_team_invite_error, 'info')
      } else {
        showToast(
          result.emailed ? M.settings_team_invite_sent : M.settings_team_invite_saved,
          'ok',
        )
        setInviteEmail('')
        setInviteModules([])
        setInviteExpiry('')
        void load()
      }
    } finally {
      setInviting(false)
    }
  }

  const onRoleChange = async (member: OrgDirectoryMember, role: OrgMemberRole) => {
    if (busyMember) return
    setBusyMember(member.memberId)
    const ok = await updateMemberRole(member.memberId, role)
    showToast(ok ? M.settings_team_role_changed : M.settings_team_role_error, ok ? 'ok' : 'info')
    if (ok) void load()
    setBusyMember(null)
  }

  const onRemove = async (member: OrgDirectoryMember) => {
    if (busyMember) return
    const label = member.displayName || member.email
    if (!window.confirm(pickL(M.settings_team_remove_confirm, lang).replaceAll('{name}', label)))
      return
    setBusyMember(member.memberId)
    const ok = await removeOrgMember(member.memberId)
    showToast(ok ? M.settings_team_removed : M.settings_team_remove_error, ok ? 'ok' : 'info')
    if (ok) void load()
    setBusyMember(null)
  }

  const onRevoke = async (invitation: OrgInvitation) => {
    setBusyMember(invitation.id)
    const ok = await revokeOrgInvitation(invitation.id)
    showToast(ok ? M.settings_team_revoked : M.settings_team_remove_error, ok ? 'ok' : 'info')
    if (ok) void load()
    setBusyMember(null)
  }

  const openScopeEdit = (member: OrgDirectoryMember) => {
    setScopeEditId(member.memberId)
    setScopeModules(member.grantedModules)
    setScopeExpiry(expiryToInput(member.accessExpiresAt))
  }

  const onSaveScope = async (member: OrgDirectoryMember) => {
    if (busyMember) return
    setBusyMember(member.memberId)
    const ok = await updateMemberScope(member.memberId, {
      grantedModules: scopeModules,
      accessExpiresAt: expiryFromInput(scopeExpiry),
    })
    showToast(ok ? M.settings_team_scope_saved : M.settings_team_scope_error, ok ? 'ok' : 'info')
    if (ok) {
      setScopeEditId(null)
      void load()
    }
    setBusyMember(null)
  }

  const toggleModule = (list: string[], key: string): string[] =>
    list.includes(key) ? list.filter((k) => k !== key) : [...list, key]

  /* Last-owner guard: never let the UI offer removing/demoting the org's only
     owner — that would strand the tenant. */
  const ownerCount = (members ?? []).filter(
    (m) => m.status === 'active' && (m.role === 'owner' || m.role === 'admin'),
  ).length

  const canEditMember = (m: OrgDirectoryMember) => {
    if (!isOrgAdmin || m.userId === selfUserId) return false
    if ((m.role === 'owner' || m.role === 'admin') && ownerCount <= 1) return false
    return true
  }

  return (
    <Section label={x(M.settings_team)}>
      <Card>
        {/* Member directory */}
        <div className="flex flex-col divide-y divide-border-soft">
          {members === null ? (
            <div className="flex items-center gap-[8px] px-[18px] py-[13px] text-[12.5px] text-text-muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center gap-[10px] px-[18px] py-[13px]">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                {identity.user.initials}
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-text">{identity.user.name}</div>
                <div className="text-[12px] text-text-muted">
                  {roleLabel(memberRole, x)}
                  {identity.user.email ? ` · ${identity.user.email}` : ''}
                </div>
              </div>
            </div>
          ) : (
            members.map((m) => {
              const name = m.displayName || m.email
              const editable = canEditMember(m)
              const scoped = isModuleScopedRole(m.role)
              const scopeSummary = scoped
                ? m.grantedModules.length > 0
                  ? m.grantedModules
                      .map((key) =>
                        pickL(
                          MODULE_LABELS[key as keyof typeof MODULE_LABELS] ?? {
                            en: key,
                            fr: key,
                          },
                          lang,
                        ),
                      )
                      .join(', ')
                  : x(M.settings_team_scope_all)
                : null
              return (
                <div key={m.memberId} className="px-[18px] py-[11px]">
                  <div className="flex items-center gap-[10px]">
                    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                      {m.status === 'active' ? (
                        initialsOf(name)
                      ) : (
                        <UserRound size={14} strokeWidth={2} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-text">{name}</div>
                      {m.displayName && m.email && (
                        <div className="truncate text-[12px] text-text-muted">{m.email}</div>
                      )}
                      {scopeSummary !== null && (
                        <div className="truncate text-[11.5px] text-text-faint">
                          {scopeSummary}
                          {m.accessExpiresAt
                            ? ` · ${pickL(M.settings_team_expires_on, lang).replaceAll('{date}', m.accessExpiresAt.slice(0, 10))}`
                            : ''}
                        </div>
                      )}
                    </div>
                  {editable ? (
                    <select
                      value={m.role ?? 'member'}
                      disabled={busyMember === m.memberId}
                      onChange={(e) => void onRoleChange(m, e.target.value as OrgMemberRole)}
                      aria-label={x(M.settings_team_role_label)}
                      className={`${fieldClass} cursor-pointer`}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r, x)}
                        </option>
                      ))}
                      {/* Owner is not assignable — keep the current value visible. */}
                      {(m.role === 'owner') && <option value="owner">{roleLabel('owner', x)}</option>}
                    </select>
                  ) : (
                    <span className="text-[12px] font-semibold text-text-muted">
                      {roleLabel(m.role, x)}
                    </span>
                  )}
                  {editable && scoped && (
                    <button
                      type="button"
                      onClick={() =>
                        scopeEditId === m.memberId ? setScopeEditId(null) : openScopeEdit(m)
                      }
                      disabled={busyMember === m.memberId}
                      aria-label={x(M.settings_team_scope_edit)}
                      className="cursor-pointer rounded-[7px] border-none bg-transparent px-[9px] py-[4px] text-[12px] font-semibold text-text-muted transition-colors hover:bg-inset hover:text-text"
                    >
                      {x(M.settings_team_scope_edit)}
                    </button>
                  )}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => void onRemove(m)}
                      disabled={busyMember === m.memberId}
                      aria-label={pickL(M.settings_team_remove, lang).replaceAll('{name}', name)}
                      className="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent text-text-faint transition-colors hover:bg-risk-bg hover:text-risk-fg"
                    >
                      <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                  </div>
                  {scopeEditId === m.memberId && (
                    <div className="mt-[10px] flex flex-col gap-[10px] rounded-[9px] border border-border-soft bg-bg px-[14px] py-[12px]">
                      <ScopeFields
                        modules={scopeModules}
                        onToggleModule={(key) =>
                          setScopeModules((prev) => toggleModule(prev, key))
                        }
                        expiry={scopeExpiry}
                        onExpiryChange={setScopeExpiry}
                        disabled={busyMember === m.memberId}
                      />
                      <div className="flex justify-end gap-[8px]">
                        <button
                          type="button"
                          onClick={() => setScopeEditId(null)}
                          disabled={busyMember === m.memberId}
                          className="cursor-pointer rounded-[7px] border-none bg-transparent px-[9px] py-[4px] text-[12px] font-semibold text-text-muted hover:text-text"
                        >
                          {x(M.settings_team_scope_cancel)}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onSaveScope(m)}
                          disabled={busyMember === m.memberId}
                          className="cursor-pointer rounded-[7px] border-none bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white disabled:opacity-60"
                        >
                          {x(M.settings_team_scope_save)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Pending invitations */}
        {isOrgAdmin && invitations.length > 0 && (
          <div className="border-t border-border-soft px-[18px] py-[12px]">
            <div className="mb-[8px] text-[12px] font-semibold text-text-3">
              {x(M.settings_team_pending_heading)}
            </div>
            <div className="flex flex-col gap-[8px]">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-[10px]">
                  <MailPlus size={14} strokeWidth={2} className="shrink-0 text-text-faint" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text-2">{inv.email}</span>
                  <span className="text-[12px] font-semibold text-text-muted">
                    {roleLabel(inv.role, x)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void onRevoke(inv)}
                    disabled={busyMember === inv.id}
                    className="cursor-pointer rounded-[7px] border-none bg-transparent px-[9px] py-[4px] text-[12px] font-semibold text-text-muted transition-colors hover:bg-inset hover:text-text"
                  >
                    {x(M.settings_team_revoke)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite form */}
        {isOrgAdmin && organizationId && (
          <form
            onSubmit={onInvite}
            className="flex flex-wrap items-end gap-[10px] border-t border-border-soft px-[18px] py-[14px]"
          >
            <div className="min-w-[180px] flex-1">
              <label htmlFor="invite-email" className="mb-[4px] block text-[12px] font-semibold text-text-muted">
                {x(M.settings_team_invite_email)}
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={x(M.settings_team_invite_email_placeholder)}
                className={`${fieldClass} w-full`}
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="mb-[4px] block text-[12px] font-semibold text-text-muted">
                {x(M.settings_team_invite_role)}
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgMemberRole)}
                className={`${fieldClass} cursor-pointer`}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r, x)}
                  </option>
                ))}
              </select>
            </div>
            {isModuleScopedRole(inviteRole) && (
              <div className="w-full rounded-[9px] border border-border-soft bg-bg px-[14px] py-[12px]">
                <ScopeFields
                  modules={inviteModules}
                  onToggleModule={(key) =>
                    setInviteModules((prev) => toggleModule(prev, key))
                  }
                  expiry={inviteExpiry}
                  onExpiryChange={setInviteExpiry}
                  disabled={inviting}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex h-[34px] cursor-pointer items-center gap-[6px] rounded-[9px] border-none bg-navy px-[14px] text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-60"
            >
              {inviting ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <MailPlus size={14} strokeWidth={2} aria-hidden="true" />
              )}
              {x(M.settings_team_invite_send)}
            </button>
          </form>
        )}

        <div className="border-t border-inset px-[18px] py-[10px] text-[11px] leading-[1.45] text-text-faint">
          {x(isOrgAdmin ? M.settings_team_invite_note : M.settings_team_member_note)}
        </div>
      </Card>
    </Section>
  )
}
