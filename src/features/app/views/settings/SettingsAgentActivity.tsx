import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { formatStampTime } from '@/lib/exportProtection'
import { listAudit } from '@/features/app/agent/audit'
import { getTool } from '@/features/app/agent/registry'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { Card, Section, StatusChip } from './settingsPrimitives'

/**
 * Advisor activity — the agent audit list for this session. Every confirmed
 * *and* refused execution attempt lands here; rows resolve tool ids back to
 * their bilingual labels via the registry. Session-only until the durable
 * `agent_audit` table is applied (see docs/AGENT_LAYER.md).
 */
export function SettingsAgentActivity() {
  const { x } = useI18n()
  const [agentTrail] = useState(() => listAudit().slice(-12).reverse())

  return (
    <Section label={x(M.settings_agent_activity)}>
      <Card>
        {agentTrail.length === 0 && (
          <div className="px-[18px] py-[13px] text-[12.5px] text-text-muted">
            {x(M.settings_agent_activity_empty)}
          </div>
        )}
        {agentTrail.map((rec) => {
          const tool = getTool(rec.toolId)
          return (
            <div
              key={rec.id}
              className="flex items-start gap-[12px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
            >
              <StatusChip tone={rec.status === 'completed' ? 'success' : 'warning'}>
                {x(
                  rec.status === 'completed'
                    ? M.settings_agent_status_done
                    : M.settings_agent_status_failed,
                )}
              </StatusChip>
              <div className="min-w-0 flex-1 text-[12.5px] leading-normal text-text-2">
                {tool ? x(tool.label) : rec.toolId} · {tool ? x(tool.moduleLabel) : rec.module}
              </div>
              <span className="shrink-0 text-[11.5px] text-text-faint">
                {formatStampTime(new Date(rec.finishedAt))}
              </span>
            </div>
          )
        })}
        <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
          {x(M.settings_agent_activity_note)}
        </div>
      </Card>
    </Section>
  )
}
