import { useMemo, useState } from 'react'
import { ListPlus, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { addDealFollowupTask } from '../../tasks/productionApi'
import {
  CURRENCY_LABEL,
  DEAL_KIND_LABEL,
  DEAL_STAGE_LABEL,
  DEAL_STAGE_ORDER,
} from '../financeLabels'
import { CommitmentForm, DealDecisionForm, DealForm } from './DealForms'
import type { FinanceCommitment, FinanceDeal, FinanceDealStage } from '../data/types'

/**
 * Finance → Deals — the transaction pipeline for orgs acting like a
 * holding / investment firm (acquisitions, minority stakes, financing
 * rounds) on top of the existing finance stack (migration 0171).
 *
 * Rows hang off finance_entities; counterparties that are capital partners
 * also appear in the partners section via finance_parties' investor/lender
 * types. Dutiva records where each deal stands — it does not broker deals
 * or provide investment advice.
 */

function toAmount(v: string | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const STAGE_TONE: Record<FinanceDealStage, ChipTone> = {
  sourcing: 'neutral',
  diligence: 'info',
  negotiation: 'warning',
  agreement: 'info',
  closed: 'success',
  passed: 'neutral',
}

/** Stages that still count toward the pipeline — closed and passed don't. */
const ACTIVE_STAGES: ReadonlySet<FinanceDealStage> = new Set([
  'sourcing',
  'diligence',
  'negotiation',
  'agreement',
])

export function Deals() {
  const { x, lang } = useI18n()
  const {
    state,
    canWrite,
    addDeal,
    updateDeal,
    transitionDealStage,
    removeDeal,
    addDecisionEntry,
    addCommitment,
    updateCommitment,
    removeCommitment,
  } = useFinanceData()
  const { organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()

  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; deal: FinanceDeal } | null>(
    null,
  )
  const [decisionFor, setDecisionFor] = useState<string | null>(null)
  const [taskBusy, setTaskBusy] = useState<string | null>(null)
  const [commitForm, setCommitForm] = useState<
    { mode: 'add'; partyId: string } | { mode: 'edit'; commitment: FinanceCommitment } | null
  >(null)

  const activeDeals = useMemo(
    () => state.deals.filter((d) => ACTIVE_STAGES.has(d.stage)),
    [state.deals],
  )
  const pipelineValue = useMemo(
    () => activeDeals.reduce((sum, d) => sum + toAmount(d.value), 0),
    [activeDeals],
  )
  const nextTarget = useMemo(() => {
    const dates = activeDeals
      .map((d) => d.targetDate)
      .filter((d): d is string => Boolean(d))
      .sort()
    return dates[0]
  }, [activeDeals])
  const closedCount = useMemo(
    () => state.deals.filter((d) => d.stage === 'closed').length,
    [state.deals],
  )
  const capitalPartners = useMemo(
    () => state.parties.filter((p) => p.type === 'investor' || p.type === 'lender'),
    [state.parties],
  )

  const entityName = (id: string) =>
    state.entities.find((e) => e.id === id)?.legalName ?? '—'

  const firstEntityId = state.entities[0]?.id ?? ''

  /* Deal → task hand-off: the follow-up lands in compliance_tasks with
     metadata.deal_id, which the task detail links back from. */
  const onAddTask = async (d: FinanceDeal) => {
    if (!organizationId || taskBusy) return
    setTaskBusy(d.id)
    try {
      const name = pickL(d.name, lang)
      const details = x(M.finance_deals_task_details)
        .replace('{deal}', name)
        .replace('{kind}', pickL(DEAL_KIND_LABEL[d.kind], lang))
        .replace('{stage}', pickL(DEAL_STAGE_LABEL[d.stage], lang))
        .replace('{entity}', entityName(d.entityId))
      const task = await addDealFollowupTask(
        organizationId,
        d.id,
        x(M.finance_deals_task_title).replace('{deal}', name),
        d.targetDate ?? null,
        details + (d.counterparty ? ` · ${d.counterparty}` : ''),
      )
      /* The toast carries the deep link — without it the new task is a dead
         end, the same complaint that produced the task-detail route. */
      showToast(M.finance_deals_task_added, 'ok', {
        label: M.finance_deals_task_open,
        to: `/app/planning/tasks/${task.id}`,
      })
    } catch {
      showToast(M.finance_deals_task_failed, 'info')
    } finally {
      setTaskBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Summary strip */}
      <section className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_deals_title)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">{activeDeals.length}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_deals_active_count).replace('{count}', String(activeDeals.length))}
          </div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_deals_pipeline_value)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">
            CAD {pipelineValue.toFixed(2)}
          </div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_deals_closed_count).replace('{count}', String(closedCount))}
          </div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_deals_next_target)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">{nextTarget ?? '—'}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_deals_passed_count).replace(
              '{count}',
              String(state.deals.length - activeDeals.length - closedCount),
            )}
          </div>
        </div>
      </section>

      <p className="text-[12px] leading-[1.5] text-text-muted">{x(M.finance_deals_note)}</p>

      {/* Pipeline — grouped by stage */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_deals_title)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setForm({ mode: 'add' })}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_deals_create)}
            </button>
          )}
        </div>
        {form && canWrite && (
          <DealForm
            key={form.mode === 'edit' ? form.deal.id : 'add'}
            entities={state.entities}
            defaultEntityId={firstEntityId}
            initial={form.mode === 'edit' ? form.deal : undefined}
            onSubmit={async (item) => {
              if (form.mode === 'edit') {
                const updated = await updateDeal(form.deal.id, item)
                if (!updated) throw new Error('updateDeal returned null')
              } else {
                const created = await addDeal(item)
                if (!created) throw new Error('addDeal returned null')
              }
              setForm(null)
            }}
            onCancel={() => setForm(null)}
          />
        )}
        {state.deals.length === 0 && !form ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_deals_empty)}</p>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {DEAL_STAGE_ORDER.map((stage) => {
              const stageDeals = state.deals.filter((d) => d.stage === stage)
              if (stageDeals.length === 0) return null
              return (
                <div key={stage}>
                  <div className="mb-[8px] flex items-center gap-[8px]">
                    <span className={statusChipClass(STAGE_TONE[stage])}>
                      {x(DEAL_STAGE_LABEL[stage])}
                    </span>
                    <span className="text-[11.5px] text-text-faint">{stageDeals.length}</span>
                  </div>
                  <ul className="m-0 flex flex-col gap-[10px] p-0">
                    {stageDeals.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-[10px] bg-inset px-[12px] py-[10px]"
                      >
                        <div className="flex items-start justify-between gap-[8px]">
                          <div className="flex min-w-0 flex-col gap-[4px]">
                            <div className="flex flex-wrap items-center gap-[8px]">
                              <span className="text-[13px] font-semibold text-text">
                                {x(d.name)}
                              </span>
                              <span className={statusChipClass('neutral')}>
                                {x(DEAL_KIND_LABEL[d.kind])}
                              </span>
                            </div>
                            <div className="text-[12px] text-text-muted">
                              {entityName(d.entityId)}
                              {d.counterparty && ` · ${d.counterparty}`}
                              {d.value &&
                                ` · ${x(CURRENCY_LABEL[d.currency])} ${toAmount(d.value).toFixed(2)}`}
                            </div>
                            <div className="text-[12px] text-text-muted">
                              {d.targetDate &&
                                `${x(M.finance_deals_target_date)}: ${d.targetDate}`}
                              {d.owner && `${d.targetDate ? ' · ' : ''}${d.owner}`}
                            </div>
                            {d.notes && (
                              <div className="mt-[2px] text-[12px] leading-[1.5] text-text-2">
                                {x(d.notes)}
                              </div>
                            )}
                          </div>
                          {canWrite && (
                            <div className="flex shrink-0 items-center gap-[4px]">
                              <button
                                type="button"
                                onClick={() => setForm({ mode: 'edit', deal: d })}
                                className="rounded-[6px] p-[4px] text-text-muted hover:bg-surface hover:text-text"
                                aria-label={x(M.finance_deals_edit)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm(x(M.finance_deals_remove_confirm))) return
                                  await removeDeal(d.id)
                                }}
                                className="rounded-[6px] p-[4px] text-text-muted hover:bg-surface hover:text-red-600"
                                aria-label={x(M.finance_deals_remove)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        {canWrite && (
                          <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
                            <select
                              value={d.stage}
                              onChange={(e) =>
                                void transitionDealStage(
                                  d.id,
                                  e.target.value as FinanceDealStage,
                                )
                              }
                              aria-label={x(M.finance_deals_stage)}
                              className="rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2"
                            >
                              {DEAL_STAGE_ORDER.map((s) => (
                                <option key={s} value={s}>
                                  {x(M.finance_deals_move_to).replace(
                                    '{stage}',
                                    pickL(DEAL_STAGE_LABEL[s], lang),
                                  )}
                                </option>
                              ))}
                            </select>
                            {/* Lifecycle links — a deal feeds the decision
                                journal and the shared task list. */}
                            <button
                              type="button"
                              onClick={() =>
                                setDecisionFor((cur) => (cur === d.id ? null : d.id))
                              }
                              className="flex items-center gap-[5px] rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:border-(--accent-soft-border)"
                            >
                              <NotebookPen size={12} aria-hidden />
                              {x(M.finance_deals_log_decision)}
                            </button>
                            <button
                              type="button"
                              disabled={!organizationId || taskBusy === d.id}
                              onClick={() => void onAddTask(d)}
                              className="flex items-center gap-[5px] rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:border-(--accent-soft-border) disabled:opacity-60"
                            >
                              <ListPlus size={12} aria-hidden />
                              {x(M.finance_deals_add_task)}
                            </button>
                          </div>
                        )}
                        {canWrite && decisionFor === d.id && (
                          <DealDecisionForm
                            deal={d}
                            onSubmit={async (entry) => {
                              await addDecisionEntry(entry)
                              setDecisionFor(null)
                            }}
                            onCancel={() => setDecisionFor(null)}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Capital partners — investor/lender parties live in the shared
          party table; this section surfaces them beside the pipeline. */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">
            {x(M.finance_partners_title)}
          </h2>
          <NavLink
            to="../purchases"
            className="text-[12.5px] font-semibold text-accent hover:underline"
          >
            {x(M.finance_tab_purchases)}
          </NavLink>
        </div>
        {capitalPartners.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_partners_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {capitalPartners.map((p) => {
              const commitments = state.commitments.filter((c) => c.partyId === p.id)
              return (
                <li key={p.id} className="rounded-[10px] bg-inset px-[12px] py-[10px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text">{p.name}</div>
                      <div className="text-[12px] text-text-muted">
                        {x(M[`finance_party_type_${p.type}` as keyof typeof M])} ·{' '}
                        {entityName(p.entityId)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-[6px]">
                      {p.bankingDetailsOnFile && (
                        <span className={statusChipClass('success')}>
                          {x(M.finance_party_banking_on_file)}
                        </span>
                      )}
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() =>
                            setCommitForm((cur) =>
                              cur?.mode === 'add' && cur.partyId === p.id
                                ? null
                                : { mode: 'add', partyId: p.id },
                            )
                          }
                          className="flex items-center gap-[4px] rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:border-(--accent-soft-border)"
                        >
                          <Plus size={11} aria-hidden />
                          {x(M.finance_commitment_add)}
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Commitment ledger — committed / called / uncalled per
                      partner, plus the next call date when one is set. */}
                  {commitments.map((c) => {
                    const uncalled = Math.max(0, toAmount(c.committed) - toAmount(c.called))
                    return (
                      <div key={c.id} className="mt-[8px] border-t border-border pt-[8px]">
                        <div className="flex items-start justify-between gap-[8px]">
                          <div className="flex min-w-0 flex-col gap-[2px]">
                            <div className="text-[12.5px] font-semibold text-text">
                              {c.label ? x(c.label) : x(M.finance_commitment_committed)}
                            </div>
                            <div className="text-[12px] text-text-muted">
                              {x(M.finance_commitment_committed)} {x(CURRENCY_LABEL[c.currency])}{' '}
                              {c.committed} · {x(M.finance_commitment_called)} {c.called} ·{' '}
                              {x(M.finance_commitment_uncalled)} {uncalled.toFixed(2)}
                            </div>
                            {c.nextCallDate && c.status === 'active' && (
                              <div className="text-[11.5px] text-text-faint">
                                {x(M.finance_commitment_next_call)}: {c.nextCallDate}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-[4px]">
                            <span
                              className={statusChipClass(
                                c.status === 'active' ? 'success' : 'neutral',
                              )}
                            >
                              {x(
                                c.status === 'active'
                                  ? M.finance_commitment_status_active
                                  : M.finance_commitment_status_closed,
                              )}
                            </span>
                            {canWrite && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCommitForm({ mode: 'edit', commitment: c })
                                  }
                                  className="rounded-[6px] p-[4px] text-text-muted hover:bg-surface hover:text-text"
                                  aria-label={x(M.finance_commitment_edit)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm(x(M.finance_commitment_remove_confirm))) return
                                    await removeCommitment(c.id)
                                  }}
                                  className="rounded-[6px] p-[4px] text-text-muted hover:bg-surface hover:text-red-600"
                                  aria-label={x(M.finance_commitment_remove)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {canWrite &&
                          commitForm?.mode === 'edit' &&
                          commitForm.commitment.id === c.id && (
                            <CommitmentForm
                              partyId={p.id}
                              entities={state.entities}
                              defaultEntityId={p.entityId}
                              initial={c}
                              onSubmit={async (item) => {
                                const updated = await updateCommitment(c.id, item)
                                if (!updated) throw new Error('updateCommitment returned null')
                                setCommitForm(null)
                              }}
                              onCancel={() => setCommitForm(null)}
                            />
                          )}
                      </div>
                    )
                  })}
                  {canWrite && commitForm?.mode === 'add' && commitForm.partyId === p.id && (
                    <CommitmentForm
                      partyId={p.id}
                      entities={state.entities}
                      defaultEntityId={p.entityId}
                      onSubmit={async (item) => {
                        const created = await addCommitment(item)
                        if (!created) throw new Error('addCommitment returned null')
                        setCommitForm(null)
                      }}
                      onCancel={() => setCommitForm(null)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
