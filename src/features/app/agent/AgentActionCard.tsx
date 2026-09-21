import { useState } from 'react'
import { CircleCheck, CircleSlash, LoaderCircle, Zap } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { agentMessages as M } from '@/i18n/messages/agent'
import { executeAgentProposal } from './executor'
import { getTool } from './registry'
import { useAgentExecution } from './useAgentExecution'
import type { AgentToolOutcome, AgentToolProposal } from './types'

/**
 * The approval surface — renders one proposed tool call as a confirm card
 * inside a chat transcript. The human reads the summary, sees the risk tier
 * and the exact params, then confirms or declines. Nothing runs until the
 * button is pressed; every attempt (including refusals) lands in the audit
 * log through `executeAgentProposal`.
 *
 * Tier copy: reads show "Run", commits show "Confirm" — the wording the
 * user sees scales with what the action does.
 */

type CardState = 'idle' | 'executing' | 'done' | 'declined'

export interface AgentActionCardProps {
  readonly proposal: AgentToolProposal
}

function outcomeLine(outcome: AgentToolOutcome, lang: 'en' | 'fr'): string {
  const detail =
    outcome.status === 'failed' && outcome.detail !== undefined
      ? ` — ${pickL(outcome.detail, lang)}`
      : ''
  return `${pickL(outcome.message, lang)}${detail}`
}

export function AgentActionCard({ proposal }: AgentActionCardProps) {
  const { x, lang } = useI18n()
  const exec = useAgentExecution()
  const [state, setState] = useState<CardState>('idle')
  const [outcome, setOutcome] = useState<AgentToolOutcome | null>(null)

  const tool = getTool(proposal.toolId)
  const tier = tool?.tier ?? 'commit'
  const title = tool ? pickL(tool.label, lang) : proposal.toolId
  const params = Object.entries(proposal.params)

  const confirm = async () => {
    setState('executing')
    const result = await executeAgentProposal(proposal, exec)
    setOutcome(result.outcome)
    setState('done')
  }

  if (state === 'declined') {
    return (
      <div className="flex items-center gap-[7px] rounded-[12px] border border-border-soft bg-surface-2 px-[16px] py-[10px] text-[12.5px] text-text-muted">
        <CircleSlash size={14} strokeWidth={1.8} aria-hidden="true" />
        {x(M.agent_declined)}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-[8px] rounded-[12px] border border-(--accent-soft-border) bg-accent-soft px-[16px] py-[14px]">
      <div className="flex items-center gap-[8px]">
        <Zap size={13} strokeWidth={2} className="shrink-0 text-accent" aria-hidden="true" />
        <div className="text-[10.5px] font-bold tracking-[0.04em] text-accent uppercase">
          {x(M.agent_action_eyebrow)}
        </div>
        <span className="ml-auto rounded-[100px] border border-(--accent-soft-border) bg-surface px-[8px] py-[1px] text-[10.5px] font-semibold text-text-3">
          {x(
            tier === 'read'
              ? M.agent_tier_read
              : tier === 'draft'
                ? M.agent_tier_draft
                : M.agent_tier_commit,
          )}
        </span>
      </div>

      <div className="text-[13.5px] font-bold text-text">{title}</div>
      <div className="text-[13.5px] leading-[1.55] text-text-2">
        {pickL(proposal.summary, lang)}
      </div>

      {params.length > 0 && (
        <dl className="m-0 flex flex-col gap-[3px] border-t border-(--accent-soft-border) pt-[8px] text-[12px] text-text-3">
          {params.map(([name, value]) => (
            <div key={name} className="flex gap-[8px]">
              <dt className="shrink-0 font-semibold text-text-muted">{name}</dt>
              <dd className="m-0 min-w-0 break-words">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {state === 'done' && outcome ? (
        <div
          className={`mt-[2px] flex items-start gap-[7px] border-t border-(--accent-soft-border) pt-[8px] text-[12.5px] font-semibold ${
            outcome.status === 'completed' ? 'text-accent' : 'text-risk-fg'
          }`}
        >
          <CircleCheck
            size={14}
            strokeWidth={1.8}
            className="mt-[1px] shrink-0"
            aria-hidden="true"
          />
          <span>{outcomeLine(outcome, lang)}</span>
        </div>
      ) : (
        <div className="mt-[2px] flex gap-[8px]">
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={state === 'executing'}
            className="flex cursor-pointer items-center gap-[6px] rounded-[7px] border-none bg-accent px-[13px] py-[7px] text-[12.5px] font-semibold text-white disabled:opacity-60"
          >
            {state === 'executing' && (
              <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
            )}
            {x(
              state === 'executing'
                ? M.agent_working
                : tier === 'read'
                  ? M.agent_run
                  : M.agent_confirm,
            )}
          </button>
          <button
            type="button"
            onClick={() => setState('declined')}
            disabled={state === 'executing'}
            className="cursor-pointer rounded-[7px] border border-border bg-transparent px-[13px] py-[7px] text-[12.5px] font-semibold text-text-3 disabled:opacity-60"
          >
            {x(M.agent_decline)}
          </button>
        </div>
      )}
    </div>
  )
}
