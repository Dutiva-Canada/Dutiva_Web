import { useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Database,
  FileText,
  Gavel,
  Lock,
  Power,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { employees } from '@/data'
import { useMemoryStore, memoryActions } from './memoryStore'
import { exportMemoryRecord } from './exportMemoryRecord'
import { RETENTION_CATEGORY_LABELS } from './memoryModel'

/**
 * Governance tab — seven sections: Advisor memory status, Privacy
 * configuration, Automatic memory proposal settings, Retention schedule,
 * Access controls, Data management, Danger zone. Configuration-aware and
 * jurisdiction-neutral; never claims PIPEDA + Québec Law 25 apply to every
 * workspace, nor a blanket seven-year retention.
 */
const cardClass = 'rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]'
const sectionTitleClass = 'mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-text'
const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text outline-none'

export function MemoryGovernanceTab() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { session } = useAuth()
  const { identity } = useWorkspaceMode()
  const { facts, memoryEnabled, privacyConfig, retentionSchedule } = useMemoryStore()

  const [forgetPersonId, setForgetPersonId] = useState('')
  const [forgetting, setForgetting] = useState(false)

  const personFacts = facts.filter((f) => f.scope === 'person')
  const peopleWithFacts = employees.filter((e) =>
    personFacts.some((f) => f.entityId === e.id && (f.status ?? 'confirmed') !== 'removed'),
  )

  const exportRecord = async () => {
    const result = await exportMemoryRecord({
      facts,
      lang,
      actorLabel: `${identity.user.name} (${identity.user.email})`,
      workspaceLabel: identity.companyName,
      session,
    })
    if (!result.ok) {
      showToast(result.denial, 'info')
      return
    }
    memoryActions.logExport(facts)
    showToast(M.memory_mgr_export_toast, 'ok')
  }

  const onBulkRemovePerson = async () => {
    if (!forgetPersonId || forgetting) return
    const targetId = forgetPersonId
    const name = employees.find((e) => e.id === targetId)?.name ?? targetId
    const count = personFacts.filter(
      (f) => f.entityId === targetId && (f.status ?? 'confirmed') !== 'removed',
    ).length
    if (count === 0) return
    const tmpl = count === 1 ? M.memory_gov_data_remove_person_confirm_one : M.memory_gov_data_remove_person_confirm_many
    if (!window.confirm(pick(tmpl, lang).replace('{count}', String(count)).replace('{name}', name))) return
    setForgetting(true)
    /* Remove each active person memory from Advisor retrieval. */
    for (const f of personFacts.filter((f) => f.entityId === targetId && (f.status ?? 'confirmed') !== 'removed')) {
      memoryActions.remove(f.id)
    }
    setForgetPersonId('')
    setForgetting(false)
    const doneTmpl = count === 1 ? M.memory_gov_data_remove_person_done_one : M.memory_gov_data_remove_person_done_many
    showToast({ en: pick(doneTmpl, 'en').replace('{count}', String(count)).replace('{name}', name), fr: pick(doneTmpl, 'fr').replace('{count}', String(count)).replace('{name}', name) }, 'ok')
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        <div className="flex flex-col gap-[14px]">
          {/* 1. Advisor memory status */}
          <section className={cardClass}>
            <div className={sectionTitleClass}>
              <Power size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_status_title)}
            </div>
            <div className="mb-[10px] flex items-center gap-[10px]">
              <span
                className={`inline-flex items-center gap-[5px] rounded-[100px] border px-[9px] py-[3px] text-[11px] font-bold ${
                  memoryEnabled
                    ? 'border-ok-border bg-ok-bg text-ok-fg'
                    : 'border-border bg-inset text-text-muted'
                }`}
              >
                <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
                {memoryEnabled ? x(M.memory_ws_enabled) : x(M.memory_ws_disabled)}
              </span>
            </div>
            <p className="m-0 mb-[12px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_status_note)}</p>
            <button
              type="button"
              onClick={() => memoryActions.setMemoryEnabled(!memoryEnabled)}
              className={`cursor-pointer rounded-[9px] border px-[14px] py-[9px] font-sans text-[13px] font-bold ${
                memoryEnabled
                  ? 'border-risk-border bg-surface text-risk-dot'
                  : 'border-navy bg-navy text-white'
              }`}
            >
              {memoryEnabled ? x(M.memory_gov_status_disable) : x(M.memory_gov_status_enable)}
            </button>
          </section>

          {/* 2. Privacy configuration */}
          <section className={cardClass}>
            <div className={sectionTitleClass}>
              <ShieldCheck size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_privacy_title)}
            </div>
            <p className="m-0 mb-[12px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_privacy_note)}</p>
            <dl className="m-0 mb-[10px]">
              <div className="flex gap-[10px] py-[3px]">
                <dt className="w-[150px] shrink-0 text-[12px] font-semibold text-text-faint">{x(M.memory_gov_privacy_jurisdictions)}</dt>
                <dd className="m-0 text-[12.5px] text-text-2">{privacyConfig.jurisdictions.join(', ') || '—'}</dd>
              </div>
            </dl>
            <p className="m-0 text-[12px] leading-normal text-text-faint">{x(M.memory_gov_privacy_rights)}</p>
          </section>

          {/* 3. Automatic memory proposal settings */}
          <section className={cardClass}>
            <div className={sectionTitleClass}>
              <Database size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_privacy_auto)}
            </div>
            <p className="m-0 mb-[12px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_privacy_auto_note)}</p>
            <label className="flex cursor-pointer items-center gap-[8px]">
              <input
                type="checkbox"
                checked={privacyConfig.autoProposalsEnabled}
                onChange={(e) => memoryActions.setAutoProposalsEnabled(e.target.checked)}
                className="h-[16px] w-[16px] cursor-pointer"
              />
              <span className="text-[13px] text-text-2">{x(M.memory_gov_privacy_auto)}</span>
            </label>
            <label className="mt-[8px] flex cursor-pointer items-center gap-[8px]">
              <input
                type="checkbox"
                checked={privacyConfig.restrictAdvisorRetrieval}
                onChange={(e) => memoryActions.setRestrictedRetrieval(e.target.checked)}
                className="h-[16px] w-[16px] cursor-pointer"
              />
              <span className="text-[13px] text-text-2">{x(M.memory_gov_privacy_restrict)}</span>
            </label>
          </section>

          {/* 4. Retention schedule */}
          <section className={cardClass}>
            <div className={sectionTitleClass}>
              <Clock size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_retention_title)}
            </div>
            <div className="overflow-hidden rounded-[10px] border border-border-soft">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-soft text-[10.5px] font-bold tracking-wider text-text-faint uppercase">
                    <th scope="col" className="px-[10px] py-[7px]">{x(M.memory_gov_retention_rule)}</th>
                    <th scope="col" className="px-[10px] py-[7px] hidden md:table-cell">{x(M.memory_gov_retention_trigger)}</th>
                    <th scope="col" className="px-[10px] py-[7px] hidden lg:table-cell">{x(M.memory_gov_retention_basis)}</th>
                    <th scope="col" className="px-[10px] py-[7px]">{x(M.memory_gov_retention_enabled)}</th>
                  </tr>
                </thead>
                <tbody>
                  {retentionSchedule.map((rule) => (
                    <tr key={rule.category} className="border-t border-inset align-top">
                      <td className="px-[10px] py-[8px]">
                        <div className="text-[12.5px] font-semibold text-text-2">
                          {pick(RETENTION_CATEGORY_LABELS[rule.category], lang)}
                        </div>
                        <div className="text-[11.5px] text-text-faint">{pick(rule.rule, lang)}</div>
                      </td>
                      <td className="px-[10px] py-[8px] text-[11.5px] text-text-muted hidden md:table-cell">
                        {pick(rule.trigger, lang)}
                      </td>
                      <td className="px-[10px] py-[8px] text-[11.5px] text-text-muted hidden lg:table-cell">
                        {pick(rule.basis, lang)}
                      </td>
                      <td className="px-[10px] py-[8px]">
                        <span className={`inline-flex items-center gap-[4px] text-[11px] font-semibold ${rule.enabled ? 'text-ok-fg' : 'text-text-faint'}`}>
                          {rule.enabled ? '●' : '○'}
                          {rule.enabled ? x(M.memory_gov_retention_enabled) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Access controls */}
          <section className={cardClass}>
            <div className={sectionTitleClass}>
              <Lock size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_access_title)}
            </div>
            <p className="m-0 text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_access_note)}</p>
          </section>

          {/* 6. Data management */}
          <section className={cardClass}>
            <div className={sectionTitleClass}>
              <FileText size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_data_title)}
            </div>
            <p className="m-0 mb-[12px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_data_export_note)}</p>
            <button
              type="button"
              onClick={() => void exportRecord()}
              className="mb-[16px] flex cursor-pointer items-center gap-[7px] rounded-[10px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-text-2"
            >
              <FileText size={15} strokeWidth={1.8} aria-hidden="true" />
              {x(M.memory_gov_data_export)}
            </button>

            <div className="rounded-[10px] border border-border-soft bg-surface-2 px-[12px] py-[11px]">
              <div className="mb-[6px] flex items-center gap-[6px]">
                <Trash2 size={14} strokeWidth={1.8} className="text-risk-dot" aria-hidden="true" />
                <span className="text-[12.5px] font-bold text-risk-dot">{x(M.memory_gov_data_remove_person)}</span>
              </div>
              <p className="m-0 mb-[10px] text-[12px] leading-normal text-text-muted">{x(M.memory_gov_data_remove_person_note)}</p>
              {peopleWithFacts.length === 0 ? (
                <div className="text-[12px] text-text-faint">{x(M.memory_gov_data_remove_person_none)}</div>
              ) : (
                <div className="flex flex-col gap-[8px] sm:flex-row">
                  <label className="sr-only" htmlFor="mem-gov-forget">{x(M.memory_gov_data_remove_person)}</label>
                  <select
                    id="mem-gov-forget"
                    value={forgetPersonId}
                    onChange={(e) => setForgetPersonId(e.target.value)}
                    className={`${inputClass} sm:flex-1`}
                  >
                    <option value="">{x(M.memory_gov_data_remove_person_select)}</option>
                    {peopleWithFacts.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!forgetPersonId || forgetting}
                    onClick={() => void onBulkRemovePerson()}
                    className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-risk-dot disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                    {x(M.memory_gov_data_remove_person)}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 7. Danger zone */}
          <section className="rounded-[13px] border border-risk-border bg-surface px-[15px] py-[14px]">
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-risk-dot">
              <AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" />
              {x(M.memory_gov_danger_title)}
            </div>
            <p className="m-0 mb-[10px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_danger_delete_note)}</p>
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-[7px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-risk-dot opacity-60"
              title={x(M.memory_gov_danger_delete_todo)}
            >
              <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
              {x(M.memory_gov_danger_delete)}
            </button>
            <p className="mt-[8px] flex items-start gap-[6px] text-[11.5px] leading-normal text-text-faint">
              <Gavel size={13} strokeWidth={1.7} className="mt-[1px] shrink-0" aria-hidden="true" />
              {x(M.memory_gov_danger_delete_todo)}
            </p>
          </section>
        </div>

        <Disclaimer className="mt-[16px]" />
      </div>
    </div>
  )
}

export { type Bi }
