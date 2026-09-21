import type { Bi, LText } from '@/i18n/core'
import type { OrgMemberRole } from '@/features/app/workspaceMode/roles'

/**
 * Agent-layer vocabulary — the contract between anything that *proposes* a
 * business action (today: a deterministic intent parser in the rail; later:
 * an LLM tool-call emitted by the Advisor engine or a local model) and the
 * deterministic code that *disposes* it.
 *
 * The shape mirrors docs/AGENT_LAYER.md:
 *
 * - A **tool** is a module capability described once (id, params, risk tier,
 *   minimum role) plus a `run` bound to that module's live data seam.
 * - A **proposal** is an unexecuted tool call — model-proposed, human-confirmed.
 *   It carries a human-readable bilingual summary; the card that renders it
 *   is the approval surface.
 * - The **executor** validates the call against the registry (tool exists,
 *   params well-formed, role sufficient, module context mounted) before any
 *   module state changes. Nothing executes by proposal alone.
 *
 * Risk tiers:
 * - `read`   — returns existing org data; no mutation. Still org-scoped.
 * - `draft`  — produces a reviewable artifact without committing it
 *              (a message draft, a staged record). Reserved; the first
 *              modules ship read + commit.
 * - `commit` — mutates module state through the same seam the UI uses.
 *              Always human-confirmed in interactive use.
 *
 * There is deliberately no fourth tier for forbidden actions: what must not
 * run is never defined as a tool (send external comms, statutory drafting,
 * anything a module's own UI refuses to do). Absence is the enforcement.
 */

export type AgentRiskTier = 'read' | 'draft' | 'commit'

export type AgentParamType = 'string' | 'number' | 'boolean' | 'date' | 'enum'

export interface AgentToolParam {
  readonly name: string
  readonly type: AgentParamType
  readonly required?: boolean
  readonly description: Bi
  /** Closed vocabulary for `enum` params — validation rejects anything else. */
  readonly enum?: readonly string[]
  readonly maxLength?: number
}

/**
 * Who is executing, in which workspace. Built from `useWorkspaceMode()` —
 * the same context every write surface already reads. In demo mode `role`
 * is null and treated as the simulated owner; in production `role` is the
 * real `organization_members.role` and `minRole` is enforced. RLS remains
 * the enforcement layer for any seam that reaches Supabase.
 */
export interface AgentToolExecution {
  readonly mode: 'demo' | 'production'
  readonly role: OrgMemberRole | null
  readonly organizationId: string | null
}

export type AgentToolOutcome =
  | { readonly status: 'completed'; readonly message: Bi; readonly entityId?: string }
  | {
      readonly status: 'failed'
      readonly message: Bi
      readonly code?: AgentToolErrorCode
      /** Localizable context appended to `message` — a param name or module label. */
      readonly detail?: LText
    }

export type AgentToolErrorCode =
  'unknown_tool' | 'module_unavailable' | 'forbidden' | 'invalid_params'

/**
 * `ModuleContext` is whatever the module's data seam exposes — for CRM the
 * `UseCrmDataReturn` the mounted workspace already holds; for a Supabase-
 * backed module it would be its productionApi. The registry stores tools
 * context-erased; the executor resolves the live binding by `module` id.
 */
export interface AgentTool<ModuleContext = unknown> {
  /** Dotted id — `crm.log_activity`. Unique across the registry. */
  readonly id: string
  /** Module id matching the runtime binding (`crm`, `tasks`, …). */
  readonly module: string
  /** Human module name for unavailable-module errors. */
  readonly moduleLabel: Bi
  readonly tier: AgentRiskTier
  /** Confirm-card title. */
  readonly label: Bi
  /** Confirm-card description of what the tool does. */
  readonly description: Bi
  /** Minimum org role in production mode (default: viewer read / member write). */
  readonly minRole?: OrgMemberRole
  readonly params: readonly AgentToolParam[]
  readonly run: (
    moduleCtx: ModuleContext,
    params: Record<string, unknown>,
    exec: AgentToolExecution,
  ) => AgentToolOutcome | Promise<AgentToolOutcome>
}

/** An unexecuted tool call — the model's proposal, the human's decision. */
export interface AgentToolProposal {
  readonly id: string
  readonly toolId: string
  /** What the confirm card asks the user to approve — bilingual. */
  readonly summary: Bi
  readonly params: Record<string, unknown>
}

/** One recorded execution attempt — the audit unit. */
export interface AgentAuditRecord {
  readonly id: string
  readonly toolId: string
  readonly module: string
  readonly tier: AgentRiskTier
  readonly params: Record<string, unknown>
  readonly mode: 'demo' | 'production'
  readonly role: OrgMemberRole | null
  readonly organizationId: string | null
  readonly status: 'completed' | 'failed'
  readonly errorCode?: AgentToolErrorCode
  readonly startedAt: string
  readonly finishedAt: string
}
