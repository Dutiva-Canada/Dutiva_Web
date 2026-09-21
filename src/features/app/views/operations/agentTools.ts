import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str, today } from '@/features/app/agent/match'
import type {
  OperationsLogistics,
  OperationsLogisticsStatus,
  OperationsProject,
  OperationsProjectStatus,
  OperationsVendor,
  OperationsVendorStatus,
  OperationsVendorType,
} from './data/types'

/**
 * Operations agent tools — the run-the-business seam (docs/AGENT_LAYER.md).
 *
 * The module tracks projects, vendors, quality checks, technology systems
 * and shipments. The agent surface is the weekly slice: what's in flight,
 * who supplies us, what arrived — plus the three writes a founder actually
 * makes from a chat: onboard a vendor, record a delivery, move a project's
 * status.
 *
 * `OperationsDataProvider` mutators work in demo too (local state prepend),
 * so both modes bind the same full context — no capability gap. Production
 * writes go through the `operations_*` tables the screens use.
 */

const MODULE = 'operations'
const moduleLabel = M.agent_ops_module

const PROJECT_STATUSES: readonly OperationsProjectStatus[] = [
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled',
]
const VENDOR_TYPES: readonly NonNullable<OperationsVendorType>[] = [
  'supplier',
  'logistics',
  'technology',
  'professional_service',
]
const VENDOR_STATUSES: readonly OperationsVendorStatus[] = ['active', 'inactive', 'under_review']
const SHIPMENT_OPEN: readonly OperationsLogisticsStatus[] = ['in_transit', 'delayed']

const STATUS_LABEL_FR: Record<OperationsProjectStatus, string> = {
  planning: 'en planification',
  active: 'actif',
  on_hold: 'en pause',
  completed: 'terminé',
  cancelled: 'annulé',
}
const statusLabel = (s: OperationsProjectStatus) => ({
  en: s.replace('_', ' '),
  fr: STATUS_LABEL_FR[s],
})

export interface OperationsAgentContext {
  projects(): readonly OperationsProject[]
  vendors(): readonly OperationsVendor[]
  logistics(): readonly OperationsLogistics[]
  addVendor(vendor: OperationsVendor): void | Promise<void>
  updateLogistics(logistics: OperationsLogistics): void | Promise<void>
  updateProject(project: OperationsProject): void | Promise<void>
}

function mintId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<OperationsAgentContext>({
  id: 'operations.projects',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_ops_projects_label,
  description: M.agent_ops_projects_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: PROJECT_STATUSES,
      description: M.agent_ops_p_project_status,
    },
  ],
  run: (ops, params) => {
    const status = str(params, 'status') as OperationsProjectStatus | undefined
    const items = ops.projects().filter((p) => !status || p.status === status)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_ops_projects_none }
    }
    const titles = items.slice(0, 5).map((p) => `${p.title} (${p.status})`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} project${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} projet${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<OperationsAgentContext>({
  id: 'operations.vendors',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_ops_vendors_label,
  description: M.agent_ops_vendors_desc,
  params: [
    {
      name: 'vendorType',
      type: 'enum',
      enum: VENDOR_TYPES,
      description: M.agent_ops_p_vendor_type,
    },
    {
      name: 'status',
      type: 'enum',
      enum: VENDOR_STATUSES,
      description: M.agent_ops_p_vendor_status,
    },
  ],
  run: (ops, params) => {
    const vendorType = str(params, 'vendorType') as OperationsVendorType | undefined
    const status = str(params, 'status') as OperationsVendorStatus | undefined
    const items = ops
      .vendors()
      .filter(
        (v) => (!vendorType || v.vendor_type === vendorType) && (!status || v.status === status),
      )
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_ops_vendors_none }
    }
    const titles = items.slice(0, 5).map((v) => {
      const expired = v.contract_expiry && v.contract_expiry <= today() ? ' ⚠' : ''
      return `${v.name} (${v.status})${expired}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} vendor${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} fournisseur${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<OperationsAgentContext>({
  id: 'operations.logistics',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_ops_logistics_label,
  description: M.agent_ops_logistics_desc,
  params: [],
  run: (ops) => {
    const items = ops.logistics().filter((l) => SHIPMENT_OPEN.includes(l.status))
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_ops_logistics_none }
    }
    const titles = items.slice(0, 5).map((l) => {
      const late = l.expected_date && l.expected_date < today() ? ' ⚠' : ''
      return `${l.title} (${l.status}${l.expected_date ? ` — ${l.expected_date}` : ''})${late}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} open shipment${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} livraison${items.length === 1 ? '' : 's'} en cours : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<OperationsAgentContext>({
  id: 'operations.add_vendor',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_ops_add_vendor_label,
  description: M.agent_ops_add_vendor_desc,
  params: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: M.agent_ops_p_name,
      maxLength: 200,
    },
    {
      name: 'vendorType',
      type: 'enum',
      enum: VENDOR_TYPES,
      description: M.agent_ops_p_vendor_type,
    },
    { name: 'contractExpiry', type: 'date', description: M.agent_ops_p_contract_expiry },
    { name: 'notes', type: 'string', description: M.agent_ops_p_notes, maxLength: 500 },
  ],
  run: async (ops, params) => {
    const now = new Date().toISOString()
    const vendor: OperationsVendor = {
      id: mintId('ov'),
      organization_id: '',
      finance_party_id: null,
      name: str(params, 'name') ?? '',
      vendor_type: (str(params, 'vendorType') as OperationsVendorType | undefined) ?? null,
      status: 'active',
      contract_expiry: str(params, 'contractExpiry') ?? null,
      notes: str(params, 'notes') ?? null,
      created_at: now,
      updated_at: now,
    }
    await ops.addVendor(vendor)
    return ok(
      {
        en: `Vendor added — ${vendor.name} (active).`,
        fr: `Fournisseur ajouté — ${vendor.name} (actif).`,
      },
      vendor.id,
    )
  },
})

defineTool<OperationsAgentContext>({
  id: 'operations.deliver_shipment',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_ops_deliver_label,
  description: M.agent_ops_deliver_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_ops_p_match_shipment,
      maxLength: 200,
    },
  ],
  run: async (ops, params) => {
    const shipment = findByName(ops.logistics(), str(params, 'title'), (l) => l.title)
    if (!shipment) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_ops_shipment_not_found }
    }
    if (shipment.status === 'delivered') {
      return ok({
        en: `Already delivered — ${shipment.title}.`,
        fr: `Déjà livrée — ${shipment.title}.`,
      })
    }
    if (shipment.status === 'returned') {
      return { status: 'failed', code: 'invalid_params', message: M.agent_ops_shipment_returned }
    }
    await ops.updateLogistics({
      ...shipment,
      status: 'delivered',
      delivered_date: today(),
      updated_at: new Date().toISOString(),
    })
    return ok(
      {
        en: `Marked as delivered — ${shipment.title}.`,
        fr: `Marquée comme livrée — ${shipment.title}.`,
      },
      shipment.id,
    )
  },
})

defineTool<OperationsAgentContext>({
  id: 'operations.update_project',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_ops_update_project_label,
  description: M.agent_ops_update_project_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_ops_p_match_project,
      maxLength: 200,
    },
    {
      name: 'status',
      type: 'enum',
      enum: PROJECT_STATUSES,
      required: true,
      description: M.agent_ops_p_project_new_status,
    },
  ],
  run: async (ops, params) => {
    const project = findByName(ops.projects(), str(params, 'title'), (p) => p.title)
    if (!project) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_ops_project_not_found }
    }
    const status = str(params, 'status') as OperationsProjectStatus | undefined
    if (!status) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_ops_status_missing }
    }
    if (project.status === status) {
      return ok({
        en: `Already ${statusLabel(status).en} — ${project.title}.`,
        fr: `Déjà ${statusLabel(status).fr} — ${project.title}.`,
      })
    }
    await ops.updateProject({
      ...project,
      status,
      updated_at: new Date().toISOString(),
    })
    return ok(
      {
        en: `Project ${statusLabel(status).en} — ${project.title}.`,
        fr: `Projet ${statusLabel(status).fr} — ${project.title}.`,
      },
      project.id,
    )
  },
})
