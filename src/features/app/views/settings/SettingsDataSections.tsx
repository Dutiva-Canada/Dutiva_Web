import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'

import { useI18n } from '@/i18n/context'
import { formatStampTime } from '@/lib/exportProtection'
import type { ExportAuditEntry } from '@/lib/exportProtection/localAudit'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { exportProtectionMessages as XP } from '@/i18n/messages/exportProtection'
import { retentionRows, roleRows, securityRows } from './settingsData'
import { Card, StatusChip } from './settingsPrimitives'

/**
 * Static settings sections backed by settingsData.ts fixtures (roles matrix,
 * retention and security tables) plus the device-local export trail card.
 * Split from SettingsView.tsx to stay within the 800-line architecture
 * budget — these cards take no settings state, only display props.
 */

export function RolesCard({ mdUp }: { mdUp: boolean }) {
  const { x } = useI18n()
  return (
    <Card>
      {mdUp ? (
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr_1fr] gap-[8px] bg-inset px-[18px] py-[10px] text-[10.5px] font-bold tracking-[0.03em] text-text-muted uppercase">
              <div>{x(M.settings_col_role)}</div>
              <div>{x(M.settings_col_records)}</div>
              <div>{x(M.settings_col_comp)}</div>
              <div>{x(M.settings_col_cases)}</div>
              <div>{x(M.settings_col_signals)}</div>
            </div>
            {roleRows.map((ro) => (
              <div
                key={ro.role.en}
                className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr_1fr] items-center gap-[8px] border-t border-inset px-[18px] py-[11px] text-[12.5px]"
              >
                <div className="font-semibold text-text">{x(ro.role)}</div>
                <div className="text-text-2">{x(ro.a)}</div>
                <div className="text-text-2">{x(ro.b)}</div>
                <div className="text-text-2">{x(ro.c)}</div>
                <div className="text-text-2">{x(ro.d)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {roleRows.map((ro) => (
            <div
              key={ro.role.en}
              className="rounded-[11px] border border-inset px-[14px] py-[12px]"
            >
              <div className="text-[13.5px] font-semibold text-text">{x(ro.role)}</div>
              <dl className="mt-[8px] grid grid-cols-1 gap-y-[6px] text-[12px]">
                <div className="flex items-baseline justify-between gap-[12px]">
                  <dt className="text-text-muted">{x(M.settings_col_records)}</dt>
                  <dd className="m-0 text-right text-text-2">{x(ro.a)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-[12px]">
                  <dt className="text-text-muted">{x(M.settings_col_comp)}</dt>
                  <dd className="m-0 text-right text-text-2">{x(ro.b)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-[12px]">
                  <dt className="text-text-muted">{x(M.settings_col_cases)}</dt>
                  <dd className="m-0 text-right text-text-2">{x(ro.c)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-[12px]">
                  <dt className="text-text-muted">{x(M.settings_col_signals)}</dt>
                  <dd className="m-0 text-right text-text-2">{x(ro.d)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
        {x(M.settings_roles_note)}
      </div>
    </Card>
  )
}

export function RetentionCard() {
  const { x } = useI18n()
  return (
    <Card>
      {retentionRows.map((rt) => (
        <div
          key={rt.t.en}
          className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px]"
        >
          <div className="text-[13px] font-semibold text-text">{x(rt.t)}</div>
          <div className="text-right text-[12.5px] text-text-2">{x(rt.v)}</div>
        </div>
      ))}
      <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
        {x(M.settings_retention_note)}
      </div>
    </Card>
  )
}

export function SecurityCard() {
  const { x } = useI18n()
  return (
    <Card>
      {securityRows.map((sec) => (
        <div
          key={sec.t.en}
          className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px]"
        >
          <div className="text-[13px] font-semibold text-text">{x(sec.t)}</div>
          <div className="text-right text-[12.5px] text-text-2">{x(sec.v)}</div>
        </div>
      ))}
      <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
        {x(M.settings_security_note)}
      </div>
    </Card>
  )
}

/** The real device-local export trail — actual events, not fixture data. */
export function ExportTrailCard({
  entries,
  isAdmin,
}: {
  entries: readonly ExportAuditEntry[]
  isAdmin: boolean
}) {
  const { x } = useI18n()
  return (
    <Card>
      {entries.length === 0 && (
        <div className="px-[18px] py-[13px] text-[12.5px] text-text-muted">
          {x(XP.exportprot_audit_empty)}
        </div>
      )}
      {entries.map((entry) => (
        <div
          key={`${entry.exportId}-${entry.at}`}
          className="flex items-start gap-[12px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
        >
          <StatusChip tone="info">{x(M.settings_audit_kind_export)}</StatusChip>
          <div className="min-w-0 flex-1 text-[12.5px] leading-normal text-text-2">
            {entry.title} · {entry.kind.toUpperCase()} · {x(XP.exportprot_audit_row_by)}{' '}
            {entry.actorLabel}
          </div>
          <span className="shrink-0 text-[11.5px] text-text-faint">
            {formatStampTime(new Date(entry.at))}
          </span>
        </div>
      ))}
      <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
        {x(XP.exportprot_audit_device_note)}
      </div>
      {isAdmin && (
        <Link
          to="/app/support/admin/exports"
          className="block border-t border-inset px-[18px] py-[12px] text-[12.5px] font-semibold text-accent no-underline hover:bg-inset"
        >
          {x(M.settings_export_admin_link)}
        </Link>
      )}
    </Card>
  )
}
