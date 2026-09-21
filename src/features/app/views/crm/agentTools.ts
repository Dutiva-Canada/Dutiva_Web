import { bi } from '@/i18n/core'
import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str, today } from '@/features/app/agent/match'
import { CRM_ACTIVITY_TYPES, CRM_CONTACT_STATUSES, CRM_DEAL_STAGES } from './crmUtils'
import type { UseCrmDataReturn } from './useCrmData'
import type { CrmActivityType, CrmContactStatus, CrmDealStage } from './types'

/**
 * CRM agent tools — the first module wired end-to-end (docs/AGENT_LAYER.md).
 *
 * Every `run` executes against the mounted workspace's `UseCrmDataReturn` —
 * the same seam the tabs use — so a confirmed action does exactly what the
 * equivalent UI edit does, in whichever mode (demo fixtures or the org's
 * production localStorage state) the workspace is in.
 *
 * Nothing here sends anything. `log_activity` records that a call, email or
 * meeting happened; it never places one — same boundary the module itself
 * keeps.
 */

const MODULE = 'crm'
const moduleLabel = M.agent_crm_module

type CrmCtx = UseCrmDataReturn

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<CrmCtx>({
  id: 'crm.search_contacts',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_crm_search_label,
  description: M.agent_crm_search_desc,
  params: [
    { name: 'query', type: 'string', description: M.agent_crm_p_query, maxLength: 200 },
    {
      name: 'status',
      type: 'enum',
      enum: CRM_CONTACT_STATUSES,
      description: M.agent_crm_p_status,
    },
  ],
  run: (crm, params) => {
    const query = str(params, 'query')?.toLowerCase()
    const status = str(params, 'status') as CrmContactStatus | undefined
    const matches = crm.state.contacts.filter(
      (contact) =>
        (!status || contact.status === status) &&
        (!query ||
          contact.name.toLowerCase().includes(query) ||
          (contact.email ?? '').toLowerCase().includes(query)),
    )
    if (matches.length === 0) {
      return { status: 'completed', message: M.agent_crm_result_no_contacts }
    }
    const names = matches.slice(0, 5).map((contact) => contact.name)
    const extra = matches.length - names.length
    return ok({
      en: `${matches.length} contact${matches.length === 1 ? '' : 's'}: ${names.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${matches.length} contact${matches.length === 1 ? '' : 's'} : ${names.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<CrmCtx>({
  id: 'crm.pipeline',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_crm_pipeline_label,
  description: M.agent_crm_pipeline_desc,
  params: [],
  run: (crm) => {
    const open = crm.state.deals.filter((deal) => deal.stage !== 'won' && deal.stage !== 'lost')
    if (open.length === 0) {
      return { status: 'completed', message: M.agent_crm_result_no_deals }
    }
    const lines = CRM_DEAL_STAGES.filter((stage) => stage !== 'won' && stage !== 'lost')
      .map((stage) => {
        const deals = open.filter((deal) => deal.stage === stage)
        return deals.length > 0 ? `${stage} — ${deals.map((d) => d.title).join(', ')}` : null
      })
      .filter((line): line is string => line !== null)
    return ok({
      en: `${open.length} open deal${open.length === 1 ? '' : 's'}: ${lines.join('; ')}.`,
      fr: `${open.length} occasion${open.length === 1 ? '' : 's'} ouverte${open.length === 1 ? '' : 's'} : ${lines.join('; ')}.`,
    })
  },
})

defineTool<CrmCtx>({
  id: 'crm.upcoming_followups',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_crm_followups_label,
  description: M.agent_crm_followups_desc,
  params: [],
  run: (crm) => {
    const now = today()
    const horizon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const due = crm.state.activities.filter(
      (activity) =>
        activity.followUpDate && activity.followUpDate >= now && activity.followUpDate <= horizon,
    )
    if (due.length === 0) {
      return { status: 'completed', message: M.agent_crm_result_no_followups }
    }
    const lines = due
      .slice(0, 5)
      .map((activity) => `${activity.followUpDate}: ${activity.summary.en}`)
    const extra = due.length - lines.length
    return ok({
      en: `${due.length} follow-up${due.length === 1 ? '' : 's'} due — ${lines.join('; ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${due.length} suivi${due.length === 1 ? '' : 's'} prévu${due.length === 1 ? '' : 's'} — ${lines.join('; ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<CrmCtx>({
  id: 'crm.add_contact',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_crm_add_contact_label,
  description: M.agent_crm_add_contact_desc,
  params: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: M.agent_crm_p_name,
      maxLength: 120,
    },
    { name: 'email', type: 'string', description: M.agent_crm_p_email, maxLength: 200 },
    { name: 'phone', type: 'string', description: M.agent_crm_p_phone, maxLength: 40 },
    { name: 'company', type: 'string', description: M.agent_crm_p_company, maxLength: 160 },
    { name: 'role', type: 'string', description: M.agent_crm_p_role, maxLength: 120 },
    {
      name: 'status',
      type: 'enum',
      enum: CRM_CONTACT_STATUSES,
      description: M.agent_crm_p_contact_status,
    },
  ],
  run: (crm, params) => {
    const company = findByName(crm.state.companies, str(params, 'company'), (c) => c.name)
    const created = crm.addContact({
      name: str(params, 'name') ?? '',
      email: str(params, 'email'),
      phone: str(params, 'phone'),
      companyId: company?.id,
      role: str(params, 'role'),
      status: (str(params, 'status') as CrmContactStatus | undefined) ?? 'lead',
    })
    return ok(
      { en: `Contact added — ${created.name}.`, fr: `Contact ajouté — ${created.name}.` },
      created.id,
    )
  },
})

defineTool<CrmCtx>({
  id: 'crm.log_activity',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_crm_log_activity_label,
  description: M.agent_crm_log_activity_desc,
  params: [
    {
      name: 'type',
      type: 'enum',
      required: true,
      enum: CRM_ACTIVITY_TYPES,
      description: M.agent_crm_p_activity_type,
    },
    {
      name: 'summary',
      type: 'string',
      required: true,
      description: M.agent_crm_p_summary,
      maxLength: 500,
    },
    { name: 'contact', type: 'string', description: M.agent_crm_p_contact_name, maxLength: 120 },
    { name: 'company', type: 'string', description: M.agent_crm_p_company, maxLength: 160 },
    { name: 'deal', type: 'string', description: M.agent_crm_p_deal_title, maxLength: 200 },
    { name: 'date', type: 'date', description: M.agent_crm_p_date },
    { name: 'followUpDate', type: 'date', description: M.agent_crm_p_follow_up },
  ],
  run: (crm, params) => {
    const contact = findByName(crm.state.contacts, str(params, 'contact'), (c) => c.name)
    const company = findByName(crm.state.companies, str(params, 'company'), (c) => c.name)
    const deal = findByName(crm.state.deals, str(params, 'deal'), (d) => d.title)
    const text = str(params, 'summary') ?? ''
    const created = crm.addActivity({
      contactId: contact?.id,
      companyId: company?.id ?? contact?.companyId,
      dealId: deal?.id,
      type: str(params, 'type') as CrmActivityType,
      date: str(params, 'date') ?? today(),
      summary: bi(text, text),
      followUpDate: str(params, 'followUpDate'),
    })
    return ok({ en: `Activity logged — ${text}.`, fr: `Activité consignée — ${text}.` }, created.id)
  },
})

defineTool<CrmCtx>({
  id: 'crm.move_deal_stage',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_crm_move_deal_label,
  description: M.agent_crm_move_deal_desc,
  params: [
    {
      name: 'deal',
      type: 'string',
      required: true,
      description: M.agent_crm_p_deal_title,
      maxLength: 200,
    },
    {
      name: 'stage',
      type: 'enum',
      required: true,
      enum: CRM_DEAL_STAGES,
      description: M.agent_crm_p_stage,
    },
  ],
  run: (crm, params) => {
    const deal = findByName(crm.state.deals, str(params, 'deal'), (d) => d.title)
    if (!deal) {
      return {
        status: 'failed',
        code: 'invalid_params',
        message: M.agent_crm_result_deal_not_found,
      }
    }
    const stage = str(params, 'stage') as CrmDealStage
    const updated = crm.updateDeal(deal.id, { stage })
    if (!updated) {
      return { status: 'failed', message: M.agent_err_failed }
    }
    return ok(
      {
        en: `Deal moved — ${updated.title} → ${stage}.`,
        fr: `Occasion déplacée — ${updated.title} → ${stage}.`,
      },
      updated.id,
    )
  },
})
