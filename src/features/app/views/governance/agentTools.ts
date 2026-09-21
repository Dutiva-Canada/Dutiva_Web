import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str, today } from '@/features/app/agent/match'
import type {
  GovernanceDecision,
  GovernanceDecisionStatus,
  GovernanceOfficer,
  GovernanceRecord,
  GovernanceRecordStatus,
  GovernanceRecordType,
} from './data/types'

/**
 * Governance agent tools — the corporate register seam (docs/AGENT_LAYER.md).
 *
 * The register covers four entity families: governance records (articles,
 * by-laws, resolutions, minutes, registers), board decisions, officers, and
 * shareholders. Tools expose the operations a founder actually performs
 * weekly: list what's on file, record a decision, adopt a proposed decision,
 * and file a new governance record.
 *
 * Unlike tasks/communications, `GovernanceDataProvider` mutators work in the
 * demo workspace too (local state prepend), so both modes bind the same full
 * context — no capability gap. Production writes go through the same
 * `governance_*` tables the screens use.
 */

const MODULE = 'governance'
const moduleLabel = M.agent_gov_module

const RECORD_TYPES: readonly GovernanceRecordType[] = [
  'articles',
  'bylaw',
  'resolution',
  'minutes',
  'register',
]
const RECORD_STATUSES: readonly GovernanceRecordStatus[] = [
  'active',
  'superseded',
  'pending_review',
]
const DECISION_STATUSES: readonly GovernanceDecisionStatus[] = ['proposed', 'adopted', 'rescinded']

export interface GovernanceAgentContext {
  records(): readonly GovernanceRecord[]
  decisions(): readonly GovernanceDecision[]
  officers(): readonly GovernanceOfficer[]
  addRecord(record: GovernanceRecord): void | Promise<void>
  addDecision(decision: GovernanceDecision): void | Promise<void>
  updateDecision(decision: GovernanceDecision): void | Promise<void>
}

function mintId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<GovernanceAgentContext>({
  id: 'governance.records',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_gov_records_label,
  description: M.agent_gov_records_desc,
  params: [
    {
      name: 'recordType',
      type: 'enum',
      enum: RECORD_TYPES,
      description: M.agent_gov_p_record_type,
    },
    {
      name: 'status',
      type: 'enum',
      enum: RECORD_STATUSES,
      description: M.agent_gov_p_record_status,
    },
  ],
  run: (gov, params) => {
    const recordType = str(params, 'recordType') as GovernanceRecordType | undefined
    const status = str(params, 'status') as GovernanceRecordStatus | undefined
    const items = gov
      .records()
      .filter(
        (r) => (!recordType || r.record_type === recordType) && (!status || r.status === status),
      )
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_gov_records_none }
    }
    const titles = items.slice(0, 5).map((r) => {
      const due = r.review_due_date && r.review_due_date <= today() ? ' ⚠' : ''
      return `${r.title} (${r.status})${due}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} record${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} document${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<GovernanceAgentContext>({
  id: 'governance.decisions',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_gov_decisions_label,
  description: M.agent_gov_decisions_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: DECISION_STATUSES,
      description: M.agent_gov_p_decision_status,
    },
  ],
  run: (gov, params) => {
    const status = str(params, 'status') as GovernanceDecisionStatus | undefined
    const items = gov.decisions().filter((d) => !status || d.status === status)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_gov_decisions_none }
    }
    const titles = items.slice(0, 5).map((d) => `${d.title} (${d.status})`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} decision${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} décision${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<GovernanceAgentContext>({
  id: 'governance.officers',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_gov_officers_label,
  description: M.agent_gov_officers_desc,
  params: [],
  run: (gov) => {
    const items = gov.officers().filter((o) => o.is_active)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_gov_officers_none }
    }
    const names = items
      .slice(0, 6)
      .map((o) => `${o.name} (${o.role.replace('officer_', '').replace('_', ' ')})`)
    const extra = items.length - names.length
    return ok({
      en: `${items.length} active officer${items.length === 1 ? '' : 's'}: ${names.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} dirigeant${items.length === 1 ? '' : 's'} actif${items.length === 1 ? '' : 's'} : ${names.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<GovernanceAgentContext>({
  id: 'governance.add_decision',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_gov_add_decision_label,
  description: M.agent_gov_add_decision_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_gov_p_title,
      maxLength: 200,
    },
    {
      name: 'status',
      type: 'enum',
      enum: DECISION_STATUSES,
      description: M.agent_gov_p_decision_initial,
    },
    { name: 'decidedBy', type: 'string', description: M.agent_gov_p_decided_by, maxLength: 160 },
    { name: 'rationale', type: 'string', description: M.agent_gov_p_rationale, maxLength: 500 },
    { name: 'date', type: 'date', description: M.agent_gov_p_date },
  ],
  run: async (gov, params) => {
    const now = new Date().toISOString()
    const decision: GovernanceDecision = {
      id: mintId('gd'),
      organization_id: '',
      title: str(params, 'title') ?? '',
      decision_date: str(params, 'date') ?? today(),
      decided_by: str(params, 'decidedBy') ?? null,
      rationale: str(params, 'rationale') ?? null,
      status: (str(params, 'status') as GovernanceDecisionStatus | undefined) ?? 'proposed',
      viewer_visible: false,
      related_record_id: null,
      created_by: null,
      created_at: now,
      updated_at: now,
    }
    await gov.addDecision(decision)
    return ok(
      {
        en: `Decision recorded — ${decision.title} (${decision.status}).`,
        fr: `Décision consignée — ${decision.title} (${decision.status}).`,
      },
      decision.id,
    )
  },
})

defineTool<GovernanceAgentContext>({
  id: 'governance.adopt_decision',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_gov_adopt_decision_label,
  description: M.agent_gov_adopt_decision_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_gov_p_match_decision,
      maxLength: 200,
    },
  ],
  run: async (gov, params) => {
    const decision = findByName(gov.decisions(), str(params, 'title'), (d) => d.title)
    if (!decision) {
      return {
        status: 'failed',
        code: 'invalid_params',
        message: M.agent_gov_decision_not_found,
      }
    }
    if (decision.status === 'adopted') {
      return ok({
        en: `Already adopted — ${decision.title}.`,
        fr: `Déjà adoptée — ${decision.title}.`,
      })
    }
    if (decision.status === 'rescinded') {
      return {
        status: 'failed',
        code: 'invalid_params',
        message: M.agent_gov_decision_rescinded,
      }
    }
    await gov.updateDecision({
      ...decision,
      status: 'adopted',
      decision_date: decision.decision_date ?? today(),
      updated_at: new Date().toISOString(),
    })
    return ok(
      {
        en: `Adopted — ${decision.title}.`,
        fr: `Adoptée — ${decision.title}.`,
      },
      decision.id,
    )
  },
})

defineTool<GovernanceAgentContext>({
  id: 'governance.add_record',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_gov_add_record_label,
  description: M.agent_gov_add_record_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_gov_p_title,
      maxLength: 200,
    },
    {
      name: 'recordType',
      type: 'enum',
      enum: RECORD_TYPES,
      required: true,
      description: M.agent_gov_p_record_type,
    },
    {
      name: 'jurisdiction',
      type: 'string',
      description: M.agent_gov_p_jurisdiction,
      maxLength: 120,
    },
    { name: 'effectiveDate', type: 'date', description: M.agent_gov_p_effective },
    { name: 'reviewDueDate', type: 'date', description: M.agent_gov_p_review_due },
  ],
  run: async (gov, params) => {
    const now = new Date().toISOString()
    const record: GovernanceRecord = {
      id: mintId('gr'),
      organization_id: '',
      title: str(params, 'title') ?? '',
      record_type: (str(params, 'recordType') as GovernanceRecordType | undefined) ?? 'register',
      jurisdiction: str(params, 'jurisdiction') ?? null,
      effective_date: str(params, 'effectiveDate') ?? today(),
      review_due_date: str(params, 'reviewDueDate') ?? null,
      status: 'active',
      viewer_visible: false,
      document_id: null,
      created_by: null,
      created_at: now,
      updated_at: now,
    }
    await gov.addRecord(record)
    return ok(
      {
        en: `Filed — ${record.title} (${record.record_type}).`,
        fr: `Classé — ${record.title} (${record.record_type}).`,
      },
      record.id,
    )
  },
})
