/* agentCatalog.ts — the server-side mirror of the client agent registry
   (src/features/app/agent/registry.ts + each module's `agentTools.ts`).

   The edge function can't import the client registry — different runtime —
   so this file carries the same catalog as plain data: which tools exist,
   their param names, types, required flags and enum vocabularies. It feeds
   two things: the extraction prompt (what the model may propose) and the
   validator (what a proposal is allowed to contain).

   DRIFT GUARD: `agentCatalog.test.ts` imports the real client registry and
   fails when this mirror falls out of sync — a new/changed tool must be
   mirrored here in the same change, or CI catches it.

   Dependency-free on purpose: Deno serves it, vitest imports it. */

export type AgentCatalogParamType = 'string' | 'number' | 'boolean' | 'date' | 'enum'

export interface AgentCatalogParam {
  name: string
  type: AgentCatalogParamType
  required?: boolean
  enum?: readonly string[]
}

export interface AgentCatalogTool {
  id: string
  /** One line for the extraction prompt — capability, not copy. */
  purpose: string
  params: readonly AgentCatalogParam[]
}

const CRM_CONTACT_STATUSES = ['lead', 'prospect', 'customer', 'partner', 'churned'] as const
const CRM_DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const
const CRM_ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'task'] as const
const LIST_FILTERS = ['open', 'done', 'all'] as const
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
const COMMS_STATUSES = ['draft', 'scheduled', 'sent'] as const
const COMMS_CHANNELS = ['email', 'meeting', 'intranet', 'letter', 'other'] as const
const RECORD_TYPES = ['articles', 'bylaw', 'resolution', 'minutes', 'register'] as const
const RECORD_STATUSES = ['active', 'superseded', 'pending_review'] as const
const DECISION_STATUSES = ['proposed', 'adopted', 'rescinded'] as const
const INVOICE_STATUSES = [
  'draft',
  'issued',
  'partial',
  'paid',
  'overdue',
  'disputed',
  'written_off',
  'cancelled',
] as const
const REQUEST_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'committed',
  'cancelled',
] as const
const OBLIGATION_STATUSES = [
  'planned',
  'in_preparation',
  'reviewed',
  'filed',
  'paid',
  'confirmed',
  'overdue',
  'withdrawn',
] as const
const TAX_TYPES = [
  'income_tax',
  'gst_hst',
  'qst',
  'payroll_source_deductions',
  'employer_contributions',
  'other',
] as const
const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP'] as const
const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const
const DOC_STATUSES = [
  'draft',
  'in_review',
  'needs_revision',
  'approved',
  'sent_for_signature',
  'partially_signed',
  'signed',
  'exported',
  'archived',
  'voided',
  'deleted',
] as const
const INCIDENT_STATUSES = ['open', 'contained', 'resolved', 'closed'] as const
const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const RISK_STATUSES = ['open', 'mitigated', 'accepted', 'closed'] as const
const VENDOR_TYPES = ['supplier', 'logistics', 'technology', 'professional_service'] as const
const VENDOR_STATUSES = ['active', 'inactive', 'under_review'] as const

export const AGENT_TOOLS: readonly AgentCatalogTool[] = [
  /* ── CRM ── */
  {
    id: 'crm.search_contacts',
    purpose: 'Search CRM contacts by name or company, optional status filter.',
    params: [
      { name: 'query', type: 'string' },
      { name: 'status', type: 'enum', enum: CRM_CONTACT_STATUSES },
    ],
  },
  { id: 'crm.pipeline', purpose: 'List open deals grouped by stage.', params: [] },
  {
    id: 'crm.upcoming_followups',
    purpose: 'List CRM follow-ups due in the next week.',
    params: [],
  },
  {
    id: 'crm.add_contact',
    purpose: 'Add a CRM contact.',
    params: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string' },
      { name: 'phone', type: 'string' },
      { name: 'company', type: 'string' },
      { name: 'role', type: 'string' },
      { name: 'status', type: 'enum', enum: CRM_CONTACT_STATUSES },
    ],
  },
  {
    id: 'crm.log_activity',
    purpose: 'Log a CRM activity (call, email, meeting, note or task) — records it, sends nothing.',
    params: [
      { name: 'type', type: 'enum', required: true, enum: CRM_ACTIVITY_TYPES },
      { name: 'summary', type: 'string', required: true },
      { name: 'contact', type: 'string' },
      { name: 'company', type: 'string' },
      { name: 'deal', type: 'string' },
      { name: 'date', type: 'date' },
      { name: 'followUpDate', type: 'date' },
    ],
  },
  {
    id: 'crm.move_deal_stage',
    purpose: 'Move a CRM deal to a different stage by title match.',
    params: [
      { name: 'deal', type: 'string', required: true },
      { name: 'stage', type: 'enum', required: true, enum: CRM_DEAL_STAGES },
    ],
  },

  /* ── Tasks ── */
  {
    id: 'tasks.list',
    purpose: 'List compliance tasks — open, done or all.',
    params: [{ name: 'status', type: 'enum', enum: LIST_FILTERS }],
  },
  {
    id: 'tasks.create',
    purpose: 'Create a compliance task.',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'priority', type: 'enum', enum: TASK_PRIORITIES },
      { name: 'dueDate', type: 'date' },
    ],
  },
  {
    id: 'tasks.complete',
    purpose: 'Mark a task done by title match.',
    params: [{ name: 'title', type: 'string', required: true }],
  },

  /* ── Communications register ── */
  {
    id: 'communications.list',
    purpose: 'List communication-register entries, optional status filter.',
    params: [{ name: 'status', type: 'enum', enum: COMMS_STATUSES }],
  },
  {
    id: 'communications.log',
    purpose: 'Append a communication-register entry — a record, never a delivery.',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'audience', type: 'string' },
      { name: 'channel', type: 'enum', enum: COMMS_CHANNELS },
      { name: 'status', type: 'enum', enum: COMMS_STATUSES },
      { name: 'scheduledFor', type: 'date' },
      { name: 'note', type: 'string' },
    ],
  },
  {
    id: 'communications.mark_sent',
    purpose: 'Record a register entry as sent by title match — stamps the record, sends nothing.',
    params: [{ name: 'title', type: 'string', required: true }],
  },

  /* ── Governance register ── */
  {
    id: 'governance.records',
    purpose: 'List governance register records, optional type/status filter.',
    params: [
      { name: 'recordType', type: 'enum', enum: RECORD_TYPES },
      { name: 'status', type: 'enum', enum: RECORD_STATUSES },
    ],
  },
  {
    id: 'governance.decisions',
    purpose: 'List governance decisions, optional status filter.',
    params: [{ name: 'status', type: 'enum', enum: DECISION_STATUSES }],
  },
  { id: 'governance.officers', purpose: 'List active officers and directors.', params: [] },
  {
    id: 'governance.add_decision',
    purpose: 'Record a governance decision — proposed by default.',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'status', type: 'enum', enum: DECISION_STATUSES },
      { name: 'decidedBy', type: 'string' },
      { name: 'rationale', type: 'string' },
      { name: 'date', type: 'date' },
    ],
  },
  {
    id: 'governance.adopt_decision',
    purpose: 'Adopt a proposed decision by title match — refuses a rescinded one.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
  {
    id: 'governance.add_record',
    purpose: 'File a governance record entry (the register row, not the document).',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'recordType', type: 'enum', required: true, enum: RECORD_TYPES },
      { name: 'jurisdiction', type: 'string' },
      { name: 'effectiveDate', type: 'date' },
      { name: 'reviewDueDate', type: 'date' },
    ],
  },

  /* ── Finance ── */
  {
    id: 'finance.invoices',
    purpose: 'List invoices, optional status filter.',
    params: [{ name: 'status', type: 'enum', enum: INVOICE_STATUSES }],
  },
  {
    id: 'finance.spend_requests',
    purpose: 'List spend requests, optional status filter.',
    params: [{ name: 'status', type: 'enum', enum: REQUEST_STATUSES }],
  },
  {
    id: 'finance.obligations',
    purpose: 'List tax/filing obligations, optional status filter.',
    params: [{ name: 'status', type: 'enum', enum: OBLIGATION_STATUSES }],
  },
  {
    id: 'finance.mark_invoice_paid',
    purpose: 'Mark an invoice paid — resolves by number or customer name.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
  {
    id: 'finance.add_spend_request',
    purpose: 'File a spend request and submit it for approval.',
    params: [
      { name: 'purpose', type: 'string', required: true },
      { name: 'amount', type: 'number', required: true },
      { name: 'currency', type: 'enum', enum: CURRENCIES },
      { name: 'requester', type: 'string' },
    ],
  },
  {
    id: 'finance.approve_spend',
    purpose: 'Approve a submitted spend request by purpose match.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
  {
    id: 'finance.add_obligation',
    purpose: 'Put a filing deadline on file — a reminder, not a filed return.',
    params: [
      { name: 'type', type: 'enum', required: true, enum: TAX_TYPES },
      { name: 'period', type: 'string', required: true },
      { name: 'dueDate', type: 'date', required: true },
      { name: 'estimatedAmount', type: 'number' },
      { name: 'jurisdiction', type: 'string' },
    ],
  },

  /* ── Operations ── */
  {
    id: 'operations.projects',
    purpose: 'List workspace projects, optional status filter.',
    params: [{ name: 'status', type: 'enum', enum: PROJECT_STATUSES }],
  },
  {
    id: 'operations.vendors',
    purpose: 'List vendors, optional type/status filter.',
    params: [
      { name: 'vendorType', type: 'enum', enum: VENDOR_TYPES },
      { name: 'status', type: 'enum', enum: VENDOR_STATUSES },
    ],
  },
  {
    id: 'operations.logistics',
    purpose: 'List shipments still in transit or delayed.',
    params: [],
  },
  {
    id: 'operations.add_vendor',
    purpose: 'Add a vendor record — active by default.',
    params: [
      { name: 'name', type: 'string', required: true },
      { name: 'vendorType', type: 'enum', enum: VENDOR_TYPES },
      { name: 'contractExpiry', type: 'date' },
      { name: 'notes', type: 'string' },
    ],
  },
  {
    id: 'operations.deliver_shipment',
    purpose: 'Record a shipment as delivered by title match — records arrival, no carrier booking.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
  {
    id: 'operations.update_project',
    purpose: 'Change a project status by title match.',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'status', type: 'enum', required: true, enum: PROJECT_STATUSES },
    ],
  },

  /* ── Documents ── */
  {
    id: 'documents.list',
    purpose: 'List generated documents with status.',
    params: [{ name: 'status', type: 'enum', enum: DOC_STATUSES }],
  },
  {
    id: 'documents.templates',
    purpose: 'List document templates — filter by name, key or category.',
    params: [{ name: 'match', type: 'string' }],
  },
  {
    id: 'documents.pending_signatures',
    purpose: 'List documents out for signature and unsigned recipients.',
    params: [],
  },
  {
    id: 'documents.approve',
    purpose: 'Approve a generated document by title or reference match.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
  {
    id: 'documents.send_for_signature',
    purpose:
      'Send an approved document to one recipient for signature — emails a real invite in production.',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'name', type: 'string' },
    ],
  },

  /* ── Security ── */
  {
    id: 'security.incidents',
    purpose: 'List security incidents — open by default, filter by status.',
    params: [{ name: 'status', type: 'enum', enum: INCIDENT_STATUSES }],
  },
  {
    id: 'security.risks',
    purpose: 'List the risk register — open by default.',
    params: [{ name: 'status', type: 'enum', enum: RISK_STATUSES }],
  },
  {
    id: 'security.vendor_reviews',
    purpose: 'List vendor security reviews — overdue and missing-agreement flags.',
    params: [],
  },
  {
    id: 'security.access_reviews',
    purpose: 'List open access reviews.',
    params: [],
  },
  {
    id: 'security.report_incident',
    purpose: 'Log a security incident — open, with a severity.',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'severity', type: 'enum', enum: SEVERITIES },
      { name: 'summary', type: 'string' },
    ],
  },
  {
    id: 'security.resolve_incident',
    purpose: 'Mark an open or contained incident resolved by title match.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
  {
    id: 'security.complete_access_review',
    purpose: 'Mark an open access review completed by title match.',
    params: [{ name: 'title', type: 'string', required: true }],
  },
]

export function findCatalogTool(id: string): AgentCatalogTool | undefined {
  return AGENT_TOOLS.find((t) => t.id === id)
}
