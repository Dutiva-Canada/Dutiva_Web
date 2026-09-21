import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str, today } from '@/features/app/agent/match'
import type {
  SecurityAccessReview,
  SecurityIncident,
  SecurityIncidentStatus,
  SecurityRisk,
  SecuritySeverity,
  SecurityVendorReview,
} from './data/types'

/**
 * Security agent tools — the trust-posture slice of the security seam
 * (docs/AGENT_LAYER.md).
 *
 * The module is a five-register security workspace (assets, access reviews,
 * incidents, risks, vendor reviews). The agent surface is the operational
 * part a founder touches when something happens: incidents and access
 * reviews. Reads cover the whole posture; commits record and close the
 * operational registers through the same `SecurityDataValue` mutators the
 * screens call — working in demo (fixture state) and production
 * (`security_*` tables) alike, since `SecurityDataProvider` binds one
 * context for both. All three commits carry an `admin` floor: a security
 * register entry is a compliance record, not a sticky note.
 *
 * What is NOT a tool, and why:
 * - `remove*` — deleting a register row is destructive; humans own it.
 * - Asset register, vendor review writes — structural admin, not the
 *   weekly "something happened" path.
 * - Risk register writes — risk posture is deliberate strategy; the form
 *   owns likelihood/impact/mitigation detail.
 * - Incident assignment/remediation detail — rich fields stay in the form;
 *   the agent records the incident and closes it.
 * Absence is the enforcement.
 */

const MODULE = 'security'
const moduleLabel = M.agent_sec_module

const INCIDENT_STATUSES: readonly SecurityIncidentStatus[] = [
  'open',
  'contained',
  'resolved',
  'closed',
]
const SEVERITIES: readonly SecuritySeverity[] = ['critical', 'high', 'medium', 'low']
const RISK_STATUSES = ['open', 'mitigated', 'accepted', 'closed'] as const
const ACCESS_REVIEW_OPEN: readonly string[] = ['pending', 'in_progress', 'overdue']

const INCIDENT_STATUS_FR: Record<SecurityIncidentStatus, string> = {
  open: 'ouvert',
  contained: 'contenu',
  resolved: 'résolu',
  closed: 'fermé',
}
const SEVERITY_FR: Record<SecuritySeverity, string> = {
  critical: 'critique',
  high: 'élevée',
  medium: 'moyenne',
  low: 'faible',
}
const incidentStatusLabel = (s: SecurityIncidentStatus) => ({
  en: s,
  fr: INCIDENT_STATUS_FR[s],
})

export interface SecurityAgentContext {
  incidents(): readonly SecurityIncident[]
  risks(): readonly SecurityRisk[]
  vendorReviews(): readonly SecurityVendorReview[]
  accessReviews(): readonly SecurityAccessReview[]
  addIncident(incident: SecurityIncident): void | Promise<void>
  updateIncident(incident: SecurityIncident): void | Promise<void>
  updateAccessReview(review: SecurityAccessReview): void | Promise<void>
}

function mintId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<SecurityAgentContext>({
  id: 'security.incidents',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_sec_incidents_label,
  description: M.agent_sec_incidents_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: INCIDENT_STATUSES,
      description: M.agent_sec_p_incident_status,
    },
  ],
  run: (sec, params) => {
    const status = str(params, 'status') as SecurityIncidentStatus | undefined
    const items = sec
      .incidents()
      .filter((i) => (status ? i.status === status : i.status !== 'closed'))
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_sec_incidents_none }
    }
    const titles = items.slice(0, 5).map((i) => `${i.title} — ${i.severity} (${i.status})`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} incident${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} incident${items.length === 1 ? '' : 's'} : ${items
        .slice(0, 5)
        .map((i) => `${i.title} — ${SEVERITY_FR[i.severity]} (${incidentStatusLabel(i.status).fr})`)
        .join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<SecurityAgentContext>({
  id: 'security.risks',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_sec_risks_label,
  description: M.agent_sec_risks_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: RISK_STATUSES,
      description: M.agent_sec_p_risk_status,
    },
  ],
  run: (sec, params) => {
    const status = str(params, 'status')
    const items = sec.risks().filter((r) => (status ? r.status === status : r.status === 'open'))
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_sec_risks_none }
    }
    const titles = items.slice(0, 5).map((r) => {
      const li = [r.likelihood, r.impact].filter(Boolean).join('/')
      return `${r.title}${li ? ` — ${li}` : ''}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} risk${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} risque${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<SecurityAgentContext>({
  id: 'security.vendor_reviews',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_sec_vendors_label,
  description: M.agent_sec_vendors_desc,
  params: [],
  run: (sec) => {
    const items = sec.vendorReviews()
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_sec_vendors_none }
    }
    const now = today()
    const titles = items.slice(0, 5).map((v) => {
      const due = v.next_review_date ?? ''
      const late = due !== '' && due < now ? ' ⚠' : ''
      const dpa = v.privacy_agreement === false ? ' — no privacy agreement' : ''
      return `${v.vendor_name} — next review ${due || 'unset'}${dpa}${late}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} vendor review${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} évaluation de fournisseur : ${items
        .slice(0, 5)
        .map((v) => {
          const due = v.next_review_date ?? ''
          const late = due !== '' && due < now ? ' ⚠' : ''
          const dpa = v.privacy_agreement === false ? ' — aucune entente de confidentialité' : ''
          return `${v.vendor_name} — prochaine évaluation ${due || 'non prévue'}${dpa}${late}`
        })
        .join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<SecurityAgentContext>({
  id: 'security.access_reviews',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_sec_access_label,
  description: M.agent_sec_access_desc,
  params: [],
  run: (sec) => {
    const items = sec.accessReviews().filter((r) => ACCESS_REVIEW_OPEN.includes(r.status))
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_sec_access_none }
    }
    const now = today()
    const titles = items.slice(0, 5).map((r) => {
      const late = r.review_due_date !== null && r.review_due_date < now ? ' ⚠' : ''
      return `${r.title} — ${r.status}${r.review_due_date ? ` — due ${r.review_due_date}` : ''}${late}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} open access review${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} revue d’accès en cours : ${items
        .slice(0, 5)
        .map((r) => {
          const late = r.review_due_date !== null && r.review_due_date < now ? ' ⚠' : ''
          return `${r.title} — ${r.status}${r.review_due_date ? ` — échéance ${r.review_due_date}` : ''}${late}`
        })
        .join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<SecurityAgentContext>({
  id: 'security.report_incident',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  minRole: 'admin',
  label: M.agent_sec_report_label,
  description: M.agent_sec_report_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_sec_p_incident_title,
      maxLength: 200,
    },
    {
      name: 'severity',
      type: 'enum',
      enum: SEVERITIES,
      description: M.agent_sec_p_severity,
    },
    {
      name: 'summary',
      type: 'string',
      description: M.agent_sec_p_summary,
      maxLength: 400,
    },
  ],
  run: async (sec, params) => {
    const title = str(params, 'title') ?? ''
    const severity = (str(params, 'severity') as SecuritySeverity | undefined) ?? 'medium'
    const now = new Date().toISOString()
    const incident: SecurityIncident = {
      id: mintId('si'),
      organization_id: '',
      title,
      severity,
      status: 'open',
      reported_by: null,
      assigned_to: null,
      reported_at: now,
      resolved_at: null,
      summary: str(params, 'summary') ?? null,
      impact: null,
      remediation: null,
      created_by: null,
      created_at: now,
      updated_at: now,
    }
    await sec.addIncident(incident)
    return ok(
      {
        en: `Incident logged — ${title} — ${severity}.`,
        fr: `Incident consigné — ${title} — ${SEVERITY_FR[severity]}.`,
      },
      incident.id,
    )
  },
})

defineTool<SecurityAgentContext>({
  id: 'security.resolve_incident',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  minRole: 'admin',
  label: M.agent_sec_resolve_label,
  description: M.agent_sec_resolve_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_sec_p_match_incident,
      maxLength: 200,
    },
  ],
  run: async (sec, params) => {
    const incident = findByName(sec.incidents(), str(params, 'title'), (i) => i.title)
    if (!incident) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_sec_incident_not_found }
    }
    if (incident.status === 'resolved') {
      return ok(
        { en: `Already resolved — ${incident.title}.`, fr: `Déjà résolu — ${incident.title}.` },
        incident.id,
      )
    }
    if (incident.status === 'closed') {
      return { status: 'failed', code: 'invalid_params', message: M.agent_sec_incident_closed }
    }
    const now = new Date().toISOString()
    await sec.updateIncident({
      ...incident,
      status: 'resolved',
      resolved_at: now,
      updated_at: now,
    })
    return ok(
      { en: `Resolved — ${incident.title}.`, fr: `Résolu — ${incident.title}.` },
      incident.id,
    )
  },
})

defineTool<SecurityAgentContext>({
  id: 'security.complete_access_review',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  minRole: 'admin',
  label: M.agent_sec_complete_label,
  description: M.agent_sec_complete_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_sec_p_match_review,
      maxLength: 200,
    },
  ],
  run: async (sec, params) => {
    const review = findByName(sec.accessReviews(), str(params, 'title'), (r) => r.title)
    if (!review) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_sec_review_not_found }
    }
    if (review.status === 'completed') {
      return ok(
        { en: `Already completed — ${review.title}.`, fr: `Déjà terminée — ${review.title}.` },
        review.id,
      )
    }
    const now = new Date().toISOString()
    await sec.updateAccessReview({
      ...review,
      status: 'completed',
      completed_date: today(),
      updated_at: now,
    })
    return ok(
      {
        en: `Access review completed — ${review.title}.`,
        fr: `Revue d’accès terminée — ${review.title}.`,
      },
      review.id,
    )
  },
})
