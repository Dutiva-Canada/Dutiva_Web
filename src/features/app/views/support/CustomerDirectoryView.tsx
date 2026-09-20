import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import { isCurrentUserAdmin } from '@/features/support/supportAdminApi'
import { adminListOrganizations, adminListUsers } from '@/features/support/adminDirectoryApi'
import type {
  AdminDirectoryOrganization,
  AdminDirectoryUser,
} from '@/features/support/adminDirectoryApi'
import { useMdUp } from '@/lib/useMediaQuery'

const selectClass =
  'rounded-[8px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text'
const DIRECTORY_PLANS = ['free', 'starter', 'growth', 'pro', 'advanced', 'enterprise'] as const
const DIRECTORY_STATUSES = ['active', 'inactive', 'past_due', 'canceled', 'trialing'] as const

interface DirectoryFilters {
  plan: string
  status: string
}

function formatDate(iso: string | null, lang: 'en' | 'fr'): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function planLabel(plan: string | null): string {
  // No profiles row = free plan (migration 0013 convention).
  return plan ?? 'free'
}

function statusLabel(status: string | null): string {
  return status ?? 'inactive'
}

export function CustomerDirectoryView() {
  const { x, lang } = useI18n()
  const mdUp = useMdUp()
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [users, setUsers] = useState<AdminDirectoryUser[] | null>(null)
  const [orgs, setOrgs] = useState<AdminDirectoryOrganization[] | null>(null)
  const [search, setSearch] = useState('')
  const [accountFilters, setAccountFilters] = useState<DirectoryFilters>({ plan: '', status: '' })
  const [workspaceFilters, setWorkspaceFilters] = useState<DirectoryFilters>({
    plan: '',
    status: '',
  })
  const [error, setError] = useState(false)

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  useEffect(() => {
    if (admin !== true) return
    let cancelled = false
    setError(false)
    Promise.all([adminListUsers(), adminListOrganizations()])
      .then(([u, o]) => {
        if (cancelled) return
        setUsers(u)
        setOrgs(o)
      })
      .catch((e: unknown) => {
        console.error('customer directory: list failed', e)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [admin])

  const term = search.trim().toLowerCase()
  const filteredUsers = useMemo(() => {
    if (!users) return null
    return users.filter(
      (u) =>
        (!term ||
          u.email?.toLowerCase().includes(term) ||
          u.companyName?.toLowerCase().includes(term) ||
          u.roles.some((role) => role.toLowerCase().includes(term))) &&
        (!accountFilters.plan || planLabel(u.plan) === accountFilters.plan) &&
        (!accountFilters.status || statusLabel(u.subscriptionStatus) === accountFilters.status),
    )
  }, [users, term, accountFilters])
  const filteredOrgs = useMemo(() => {
    if (!orgs) return null
    return orgs.filter(
      (o) =>
        (!term ||
          o.name.toLowerCase().includes(term) ||
          o.legalName?.toLowerCase().includes(term)) &&
        (!workspaceFilters.plan || planLabel(o.plan) === workspaceFilters.plan) &&
        (!workspaceFilters.status || statusLabel(o.subscriptionStatus) === workspaceFilters.status),
    )
  }, [orgs, term, workspaceFilters])

  const accountFiltersActive = accountFilters.plan !== '' || accountFilters.status !== ''
  const workspaceFiltersActive = workspaceFilters.plan !== '' || workspaceFilters.status !== ''
  const resultLabel = (shown: number, total: number) =>
    x(M.support_admin_directory_filter_results)
      .replace('{shown}', String(shown))
      .replace('{total}', String(total))

  if (admin === false) {
    return (
      <div className="mx-auto max-w-[900px] px-[28px] pt-[24px]">
        <p className="m-0 rounded-[12px] border border-border bg-inset px-[16px] py-[12px] text-[14px] text-text-2">
          {x(M.support_admin_denied)}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-[28px] pt-[8px] pb-[64px] max-[640px]:px-[16px]">
        <header className="mb-[18px] flex flex-wrap items-baseline justify-between gap-[10px]">
          <h1 className="m-0 font-display text-[24px] font-semibold tracking-[-0.015em] text-text">
            {x(M.support_admin_directory_title)}
          </h1>
          {filteredUsers && (
            <span className="text-[13px] text-text-muted">
              {x(M.support_admin_directory_accounts)}:{' '}
              <span className="font-semibold text-text-2">{filteredUsers.length}</span>
            </span>
          )}
        </header>

        <div className="mb-[16px]">
          <input
            type="search"
            aria-label={x(M.support_admin_search)}
            placeholder={x(M.support_admin_search)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${selectClass} w-full min-w-[220px]`}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="m-0 rounded-[12px] border border-risk-border bg-risk-bg px-[16px] py-[12px] text-[14px] text-risk-fg"
          >
            {x(M.support_requests_error)}
          </p>
        )}

        <h2 className="m-0 mt-[24px] mb-[10px] font-display text-[17px] font-semibold text-text">
          {x(M.support_admin_directory_accounts)}
        </h2>
        {users && (
          <div className="mb-[10px] flex flex-wrap items-center gap-[8px]">
            <select
              aria-label={`${x(M.support_admin_directory_accounts)} — ${x(M.support_admin_directory_filter_plan)}`}
              value={accountFilters.plan}
              onChange={(e) => setAccountFilters((f) => ({ ...f, plan: e.target.value }))}
              className={selectClass}
            >
              <option value="">{x(M.support_admin_directory_filter_all_plans)}</option>
              {DIRECTORY_PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
            <select
              aria-label={`${x(M.support_admin_directory_accounts)} — ${x(M.support_admin_directory_filter_status)}`}
              value={accountFilters.status}
              onChange={(e) => setAccountFilters((f) => ({ ...f, status: e.target.value }))}
              className={selectClass}
            >
              <option value="">{x(M.support_admin_directory_filter_all_statuses)}</option>
              {DIRECTORY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {(term || accountFiltersActive) && (
              <>
                <span className="text-[12px] text-text-3">
                  {resultLabel(filteredUsers?.length ?? 0, users.length)}
                </span>
                {accountFiltersActive && (
                  <button
                    type="button"
                    onClick={() => setAccountFilters({ plan: '', status: '' })}
                    className="text-[12px] font-semibold text-accent hover:underline"
                  >
                    {x(M.support_admin_directory_filter_clear)}
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {filteredUsers && filteredUsers.length === 0 && !error && (
          <p className="m-0 text-[14px] text-text-3">{x(M.support_admin_empty)}</p>
        )}
        {filteredUsers && filteredUsers.length > 0 && mdUp && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] tracking-[0.04em] text-text-muted uppercase">
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_email)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_company)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_plan)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_status)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_signed_up)}
                  </th>
                  <th className="py-[8px] font-semibold">
                    {x(M.support_admin_directory_col_last_sign_in)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.userId} className="border-b border-inset hover:bg-inset">
                    <td className="py-[10px] pr-[12px] font-semibold text-navy">
                      {u.email ?? '—'}
                      {u.roles.length > 0 && (
                        <div className="text-[11.5px] font-normal text-text-muted">
                          {u.roles.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-[10px] pr-[12px]">{u.companyName ?? '—'}</td>
                    <td className="py-[10px] pr-[12px]">{planLabel(u.plan)}</td>
                    <td className="py-[10px] pr-[12px]">{statusLabel(u.subscriptionStatus)}</td>
                    <td className="py-[10px] pr-[12px]">{formatDate(u.createdAt, lang)}</td>
                    <td className="py-[10px]">{formatDate(u.lastSignInAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredUsers && filteredUsers.length > 0 && !mdUp && (
          <ul className="m-0 list-none space-y-[10px] p-0">
            {filteredUsers.map((u) => (
              <li
                key={u.userId}
                className="rounded-[12px] border border-border bg-surface px-[14px] py-[12px]"
              >
                <div className="font-semibold text-navy">{u.email ?? '—'}</div>
                <div className="mt-[2px] text-[12px] text-text-muted">
                  {u.companyName ?? '—'} · {planLabel(u.plan)} · {statusLabel(u.subscriptionStatus)}
                </div>
                <div className="mt-[2px] text-[12px] text-text-muted">
                  {x(M.support_admin_directory_col_signed_up)}: {formatDate(u.createdAt, lang)}
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="m-0 mt-[28px] mb-[10px] font-display text-[17px] font-semibold text-text">
          {x(M.support_admin_directory_orgs)}
        </h2>
        {orgs && (
          <div className="mb-[10px] flex flex-wrap items-center gap-[8px]">
            <select
              aria-label={`${x(M.support_admin_directory_orgs)} — ${x(M.support_admin_directory_filter_plan)}`}
              value={workspaceFilters.plan}
              onChange={(e) => setWorkspaceFilters((f) => ({ ...f, plan: e.target.value }))}
              className={selectClass}
            >
              <option value="">{x(M.support_admin_directory_filter_all_plans)}</option>
              {DIRECTORY_PLANS.slice(0, 4).map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
            <select
              aria-label={`${x(M.support_admin_directory_orgs)} — ${x(M.support_admin_directory_filter_status)}`}
              value={workspaceFilters.status}
              onChange={(e) => setWorkspaceFilters((f) => ({ ...f, status: e.target.value }))}
              className={selectClass}
            >
              <option value="">{x(M.support_admin_directory_filter_all_statuses)}</option>
              {DIRECTORY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {(term || workspaceFiltersActive) && (
              <>
                <span className="text-[12px] text-text-3">
                  {resultLabel(filteredOrgs?.length ?? 0, orgs.length)}
                </span>
                {workspaceFiltersActive && (
                  <button
                    type="button"
                    onClick={() => setWorkspaceFilters({ plan: '', status: '' })}
                    className="text-[12px] font-semibold text-accent hover:underline"
                  >
                    {x(M.support_admin_directory_filter_clear)}
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {filteredOrgs && filteredOrgs.length === 0 && !error && (
          <p className="m-0 text-[14px] text-text-3">{x(M.support_admin_empty)}</p>
        )}
        {filteredOrgs && filteredOrgs.length > 0 && mdUp && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] tracking-[0.04em] text-text-muted uppercase">
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_org)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_plan)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_status)}
                  </th>
                  <th className="py-[8px] pr-[12px] font-semibold">
                    {x(M.support_admin_directory_col_members)}
                  </th>
                  <th className="py-[8px] font-semibold">
                    {x(M.support_admin_directory_col_signed_up)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((o) => (
                  <tr key={o.organizationId} className="border-b border-inset hover:bg-inset">
                    <td className="py-[10px] pr-[12px] font-semibold text-navy">
                      {o.name}
                      {o.legalName && o.legalName !== o.name && (
                        <div className="text-[11.5px] font-normal text-text-muted">
                          {o.legalName}
                        </div>
                      )}
                    </td>
                    <td className="py-[10px] pr-[12px]">{planLabel(o.plan)}</td>
                    <td className="py-[10px] pr-[12px]">{statusLabel(o.subscriptionStatus)}</td>
                    <td className="py-[10px] pr-[12px]">{o.memberCount}</td>
                    <td className="py-[10px]">{formatDate(o.createdAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredOrgs && filteredOrgs.length > 0 && !mdUp && (
          <ul className="m-0 list-none space-y-[10px] p-0">
            {filteredOrgs.map((o) => (
              <li
                key={o.organizationId}
                className="rounded-[12px] border border-border bg-surface px-[14px] py-[12px]"
              >
                <div className="font-semibold text-navy">{o.name}</div>
                <div className="mt-[2px] text-[12px] text-text-muted">
                  {planLabel(o.plan)} · {statusLabel(o.subscriptionStatus)} ·{' '}
                  {x(M.support_admin_directory_col_members)}: {o.memberCount}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
