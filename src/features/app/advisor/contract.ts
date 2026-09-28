import { z } from 'zod'

/**
 * AdvisorResponse — the machine-readable engine response contract
 * (Engineering Roadmap "response-contract quick reference", handoff open
 * gate #5). The engine (`POST /api/advisor/respond`) owns routing, risk,
 * jurisdiction and gating; the app only renders what this contract carries.
 *
 * Hard rules (AGENT.md + handoff "How to integrate cleanly"):
 * - the app never computes risk, jurisdiction or gating itself;
 * - a structured surface renders only while its `route.*Allowed` gate is
 *   true — flipping any gate false hides exactly its section;
 * - a fresh turn context is built every time; a prior turn's structured
 *   output is never carried forward.
 *
 * Strings are `LText` (plain string or `{ en, fr }`): fixtures ship bilingual
 * pairs, while a live engine may return a single already-localized string.
 */

/** `route.responseMode` — the actual internal mode, drives the mode chip. */
const responseModeSchema = z.enum(['hr', 'escalation', 'supportive'])
export type ResponseMode = z.infer<typeof responseModeSchema>

const jurisdictionStatusSchema = z.enum([
  'known',
  'assumed',
  'unknown',
  'conflict',
  'not_applicable',
])
export type JurisdictionStatus = z.infer<typeof jurisdictionStatusSchema>

const complianceRiskSchema = z.enum(['low', 'medium', 'high', 'critical'])
export type ComplianceRisk = z.infer<typeof complianceRiskSchema>

const safetyRiskSchema = z.enum(['none', 'watch', 'urgent', 'critical'])
export type SafetyRisk = z.infer<typeof safetyRiskSchema>

const professionalReviewTypeSchema = z.enum(['hr', 'legal', 'medical', 'union', 'emergency'])
export type ProfessionalReviewType = z.infer<typeof professionalReviewTypeSchema>

/** Web sources are ranked by authority — they are never legal citations. */
const webAuthoritySchema = z.enum([
  'legislation',
  'official',
  'regulator',
  'court',
  'secondary',
  'general',
])
export type WebAuthority = z.infer<typeof webAuthoritySchema>

/** `LText` boundary form: engine sends a string, fixtures send `{ en, fr }`. */
const lTextSchema = z.union([z.string(), z.object({ en: z.string(), fr: z.string() })])

const advisorRouteSchema = z.object({
  responseMode: responseModeSchema,
  /** Gate the whole structured payload. */
  workspaceAllowed: z.boolean(),
  /** Gate retrieved-guidance chips (jurisdiction + topic filtered). */
  retrievalAllowed: z.boolean(),
  /** Gate statute citations; false on unknown/conflicted jurisdiction. */
  legalBasisAllowed: z.boolean(),
  /** Gate suggested-document chips. */
  documentsAllowed: z.boolean(),
  /** Gate web sources; never carried across turns. */
  webSearchAllowed: z.boolean(),
  /**
   * Gate agent tool proposals (`proposedActions`). Optional so pre-agent
   * engines still validate; absent means withheld — never surfaced.
   * Supportive and crisis turns always leave this off.
   */
  actionsAllowed: z.boolean().optional(),
})

const jurisdictionReadSchema = z.object({
  status: jurisdictionStatusSchema,
  value: lTextSchema,
  note: lTextSchema.optional(),
})

/** Two independent ramps → the dual risk meters. */
const riskReadSchema = z.object({
  compliance: complianceRiskSchema,
  safety: safetyRiskSchema,
})

const professionalReviewSchema = z.object({
  type: professionalReviewTypeSchema,
  label: lTextSchema,
  reason: lTextSchema,
})

/** A statute section, each marked Valid or Needs-review (never raw). */
const legalBasisItemSchema = z.object({
  label: lTextSchema,
  valid: z.boolean(),
})

const legalBasisReadSchema = z.object({
  items: z.array(legalBasisItemSchema),
  /** Operator-facing reason shown when `legalBasisAllowed` is false. */
  withheldReason: lTextSchema.optional(),
})

const retrievalReadSchema = z.object({
  /** Uppercase corpus tags (e.g. "Termination · ON"). */
  items: z.array(lTextSchema),
  note: lTextSchema.optional(),
  /** Operator-facing reason shown when `retrievalAllowed` is false. */
  withheldReason: lTextSchema.optional(),
})

/** Org memory facts injected into this turn (not statute). Optional for older payloads. */
const memoryUsedItemSchema = z.object({
  label: lTextSchema,
  factId: z.string().optional(),
  /** When present, UI deep-links to the entity Memory surface. */
  scope: z.enum(['person', 'case', 'thread']).optional(),
  entityId: z.string().optional(),
})
const memoryUsedReadSchema = z.object({
  items: z.array(memoryUsedItemSchema),
  note: lTextSchema.optional(),
})
export type MemoryUsedRead = z.infer<typeof memoryUsedReadSchema>

/** Newly extracted facts persisted this turn (for Review-in-Memory toasts). */
export const memoryCreatedItemSchema = z.object({
  factId: z.string(),
  scope: z.enum(['person', 'case', 'thread']),
  entityId: z.string(),
  label: lTextSchema,
})
export type MemoryCreatedItem = z.infer<typeof memoryCreatedItemSchema>

const webSourceSchema = z.object({
  domain: z.string(),
  authority: webAuthoritySchema,
  title: lTextSchema,
})

/** Present only on current-info turns; `null` hides the block entirely. */
const webSearchReadSchema = z.object({
  sources: z.array(webSourceSchema),
  /** Shown when web search was requested but `webSearchAllowed` is false. */
  unavailableReason: lTextSchema.optional(),
})

const confidenceReadSchema = z.object({
  label: lTextSchema,
  /** 0–100 meter fill. */
  pct: z.number().min(0).max(100),
  note: lTextSchema.optional(),
})

/**
 * An agent tool call the engine proposes for user confirmation — the wire
 * form of `AgentToolProposal` (the id is minted client-side on ingest).
 * Rendered only while `route.actionsAllowed` is true; executed only after
 * the user confirms on the card. The engine proposes; the registry decides
 * whether the call can run at all.
 */
const proposedActionSchema = z.object({
  toolId: z.string(),
  summary: lTextSchema,
  params: z.record(z.string(), z.unknown()),
})
export type ProposedAction = z.infer<typeof proposedActionSchema>

export const advisorResponseSchema = z.object({
  route: advisorRouteSchema,
  jurisdiction: jurisdictionReadSchema,
  risk: riskReadSchema,
  professionalReview: professionalReviewSchema.nullable(),
  /** Supportive triage: the workspace shows "support mode — intentionally off". */
  supportNotice: z.boolean(),
  legalBasis: legalBasisReadSchema,
  retrieval: retrievalReadSchema,
  /** Confirmed org memory used this turn — optional so pre-memory engines still validate. */
  memory: memoryUsedReadSchema.nullable().optional(),
  webSearch: webSearchReadSchema.nullable(),
  confidence: confidenceReadSchema.nullable(),
  /** Agent tool calls proposed this turn — gated by `route.actionsAllowed`. */
  proposedActions: z.array(proposedActionSchema).optional(),
  /** Conflict / withheld notices surfaced to the operator. */
  warnings: z.array(lTextSchema),
  /** true → resources only, all gates off, cannot be overridden. */
  isCrisis: z.boolean(),
})
export type AdvisorResponse = z.infer<typeof advisorResponseSchema>

/**
 * Which structured surfaces may render for a response — the single gating
 * check every consumer goes through (never read a payload block directly
 * without its gate).
 */
export function allowedSurfaces(response: AdvisorResponse) {
  const gatesOff = response.isCrisis
  return {
    workspace: !gatesOff && response.route.workspaceAllowed,
    retrieval: !gatesOff && response.route.retrievalAllowed,
    legalBasis: !gatesOff && response.route.legalBasisAllowed,
    documents: !gatesOff && response.route.documentsAllowed,
    webSearch: !gatesOff && response.route.webSearchAllowed,
    actions: !gatesOff && (response.route.actionsAllowed ?? false),
  }
}
