import { agentMessages as M } from '@/i18n/messages/agent'
import type { Bi, LText } from '@/i18n/core'
import { roleAtLeast } from '@/features/app/workspaceMode/roles'
import { appendAudit } from './audit'
import { getTool } from './registry'
import { moduleContext } from './runtime'
import type {
  AgentAuditRecord,
  AgentTool,
  AgentToolErrorCode,
  AgentToolExecution,
  AgentToolOutcome,
  AgentToolParam,
  AgentToolProposal,
} from './types'

/**
 * The executor — the "deterministic code disposes" half of the agent layer.
 *
 * Every proposal, whoever wrote it (a parser today, a model tomorrow, a
 * queued server-side job eventually), passes the same gate in order:
 *
 *   tool exists → params validate → role clears `minRole` → module bound →
 *   `tool.run` on the module's own seam → outcome + audit record.
 *
 * Refusals are outcomes, not exceptions: a failed proposal returns a
 * bilingual reason the card can show, and still lands in the audit log.
 */

let auditSeq = 0

function auditId(): string {
  auditSeq += 1
  return `audit-${Date.now()}-${auditSeq}`
}

function fail(code: AgentToolErrorCode, message: Bi, detail?: LText): AgentToolOutcome {
  return { status: 'failed', code, message, ...(detail !== undefined ? { detail } : {}) }
}

function paramTypeOk(param: AgentToolParam, value: unknown): boolean {
  switch (param.type) {
    case 'string':
      return typeof value === 'string' && value.trim() !== ''
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    case 'enum':
      return typeof value === 'string' && (param.enum ?? []).includes(value)
  }
}

/**
 * Validate `params` against the tool's declared schema. Returns the cleaned
 * param record (declared keys only — undeclared input never reaches `run`)
 * or a failure outcome naming the first problem.
 */
function validateParams(
  tool: AgentTool,
  params: Record<string, unknown>,
): { ok: true; clean: Record<string, unknown> } | { ok: false; outcome: AgentToolOutcome } {
  const declared = new Set(tool.params.map((p) => p.name))
  const unknown = Object.keys(params).filter((key) => !declared.has(key))
  if (unknown.length > 0) {
    return {
      ok: false,
      outcome: fail('invalid_params', M.agent_err_unknown_param, unknown[0]),
    }
  }
  const clean: Record<string, unknown> = {}
  for (const param of tool.params) {
    const value = params[param.name]
    if (value === undefined || value === null) {
      if (param.required) {
        return { ok: false, outcome: fail('invalid_params', M.agent_err_missing_param, param.name) }
      }
      continue
    }
    if (!paramTypeOk(param, value)) {
      return { ok: false, outcome: fail('invalid_params', M.agent_err_bad_param, param.name) }
    }
    if (
      param.maxLength !== undefined &&
      typeof value === 'string' &&
      value.length > param.maxLength
    ) {
      return { ok: false, outcome: fail('invalid_params', M.agent_err_bad_param, param.name) }
    }
    clean[param.name] = value
  }
  return { ok: true, clean }
}

/** Default role floor: reads need membership, writes need member-or-above. */
function minRoleFor(tool: AgentTool) {
  return tool.minRole ?? (tool.tier === 'read' ? 'viewer' : 'member')
}

export interface AgentExecutionResult {
  readonly outcome: AgentToolOutcome
  readonly audit: AgentAuditRecord
}

export async function executeAgentProposal(
  proposal: AgentToolProposal,
  exec: AgentToolExecution,
): Promise<AgentExecutionResult> {
  const startedAt = new Date().toISOString()
  const tool = getTool(proposal.toolId)

  const record = (outcome: AgentToolOutcome): AgentExecutionResult => {
    const audit: AgentAuditRecord = {
      id: auditId(),
      toolId: proposal.toolId,
      module: tool?.module ?? proposal.toolId.split('.')[0] ?? 'unknown',
      tier: tool?.tier ?? 'commit',
      params: proposal.params,
      mode: exec.mode,
      role: exec.role,
      organizationId: exec.organizationId,
      status: outcome.status,
      errorCode: outcome.status === 'failed' ? outcome.code : undefined,
      startedAt,
      finishedAt: new Date().toISOString(),
    }
    appendAudit(audit)
    return { outcome, audit }
  }

  if (!tool) return record(fail('unknown_tool', M.agent_err_unknown_tool))

  const check = validateParams(tool, proposal.params)
  if (!check.ok) return record(check.outcome)

  /* Demo runs as the simulated workspace owner; production enforces the
     real membership role — the same rule write surfaces already apply. */
  if (exec.mode === 'production' && !roleAtLeast(exec.role, minRoleFor(tool))) {
    return record(fail('forbidden', M.agent_err_forbidden))
  }

  const ctx = moduleContext(tool.module)
  if (ctx === undefined) {
    return record(fail('module_unavailable', M.agent_err_module_closed, tool.moduleLabel))
  }

  try {
    return record(await tool.run(ctx, check.clean, exec))
  } catch {
    return record({ status: 'failed', code: 'invalid_params', message: M.agent_err_failed })
  }
}
