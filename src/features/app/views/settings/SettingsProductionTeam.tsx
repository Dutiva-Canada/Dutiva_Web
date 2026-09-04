import { useI18n } from '@/i18n/context'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { Card, Section } from './settingsPrimitives'

function roleLabel(role: string | null, x: (m: { en: string; fr: string }) => string): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return x(M.settings_role_owner)
    case 'manager':
      return x(M.settings_role_manager)
    case 'member':
      return x(M.settings_role_hr)
    case 'viewer':
      return x(M.settings_role_viewer)
    default:
      return x(M.settings_role_owner)
  }
}

/** Production team card — current member only; invites are not shipped yet. */
export function SettingsProductionTeam() {
  const { x } = useI18n()
  const { identity, memberRole } = useWorkspaceMode()

  return (
    <Section label={x(M.settings_team)}>
      <Card>
        <div className="flex items-center gap-[12px] px-[18px] py-[13px]">
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
        <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
          {x(M.settings_team_production_note)}
        </div>
      </Card>
    </Section>
  )
}
