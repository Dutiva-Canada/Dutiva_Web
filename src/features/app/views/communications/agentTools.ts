import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str } from '@/features/app/agent/match'
import {
  PRODUCTION_COMMUNICATION_CHANNELS,
  PRODUCTION_COMMUNICATION_STATUSES,
} from './productionApi'
import type {
  NewCommunication,
  ProductionCommunication,
  ProductionCommunicationChannel,
  ProductionCommunicationStatus,
} from './productionApi'

/**
 * Communications agent tools — the register seam (docs/AGENT_LAYER.md).
 *
 * The module's own boundary applies verbatim: Dutiva *records* what an
 * employer sent, to whom and how — nothing here delivers anything.
 * `mark_sent` flips a record's status, the same record-keeping the UI's
 * "Mark as sent" button performs; `log` appends a register entry. There is
 * deliberately no `send` tool because the module has no send path — absence
 * is the enforcement.
 *
 * The demo register is fixture-backed and cannot accept new entries, so the
 * demo binding leaves `add` unset and `log` fails with an explicit reason
 * rather than writing a row the view could never show.
 */

const MODULE = 'communications'
const moduleLabel = M.agent_comms_module

/** Register row normalized for the tools — the view localizes titles. */
export interface CommsAgentRow {
  id: string
  title: string
  status: ProductionCommunicationStatus
  audience?: string | null
  channel?: ProductionCommunicationChannel
}

/** Everything `NewCommunication` needs except `templateTid` — the template
    link stays a UI-only concern until tools expose it deliberately. */
export type CommsAgentNew = Omit<NewCommunication, 'templateTid'>

export interface CommunicationsAgentContext {
  list(): readonly CommsAgentRow[]
  add?(fields: CommsAgentNew): Promise<ProductionCommunication>
  markSent?(id: string): Promise<void> | void
}

type CommsCtx = CommunicationsAgentContext

function unavailable() {
  return {
    status: 'failed',
    code: 'module_unavailable',
    message: M.agent_err_capability_demo,
  } as const
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<CommsCtx>({
  id: 'communications.list',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_comms_list_label,
  description: M.agent_comms_list_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: PRODUCTION_COMMUNICATION_STATUSES,
      description: M.agent_comms_p_status_filter,
    },
  ],
  run: (comms, params) => {
    const status = str(params, 'status') as ProductionCommunicationStatus | undefined
    const items = comms.list().filter((row) => !status || row.status === status)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_comms_result_none }
    }
    const titles = items.slice(0, 5).map((row) => `${row.title} (${row.status})`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} communication${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} communication${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<CommsCtx>({
  id: 'communications.log',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_comms_log_label,
  description: M.agent_comms_log_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_comms_p_title,
      maxLength: 200,
    },
    { name: 'audience', type: 'string', description: M.agent_comms_p_audience, maxLength: 160 },
    {
      name: 'channel',
      type: 'enum',
      enum: PRODUCTION_COMMUNICATION_CHANNELS,
      description: M.agent_comms_p_channel,
    },
    {
      name: 'status',
      type: 'enum',
      enum: PRODUCTION_COMMUNICATION_STATUSES,
      description: M.agent_comms_p_status_initial,
    },
    { name: 'scheduledFor', type: 'date', description: M.agent_comms_p_scheduled },
    { name: 'note', type: 'string', description: M.agent_comms_p_note, maxLength: 500 },
  ],
  run: async (comms, params) => {
    if (!comms.add) return unavailable()
    const status = (str(params, 'status') as ProductionCommunicationStatus | undefined) ?? 'draft'
    const created = await comms.add({
      title: str(params, 'title') ?? '',
      audience: str(params, 'audience') ?? '',
      /* 'other' when the caller didn't name a channel — the register must
         not silently assert an email that may not have happened. */
      channel: (str(params, 'channel') as ProductionCommunicationChannel | undefined) ?? 'other',
      status,
      scheduledFor: str(params, 'scheduledFor') ?? '',
      note: str(params, 'note') ?? '',
    })
    return ok(
      {
        en: `Logged — ${created.title} (${created.status}).`,
        fr: `Consignée — ${created.title} (${created.status}).`,
      },
      created.id,
    )
  },
})

defineTool<CommsCtx>({
  id: 'communications.mark_sent',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_comms_mark_sent_label,
  description: M.agent_comms_mark_sent_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_comms_p_match_title,
      maxLength: 200,
    },
  ],
  run: async (comms, params) => {
    if (!comms.markSent) return unavailable()
    const row = findByName(comms.list(), str(params, 'title'), (r) => r.title)
    if (!row) {
      return {
        status: 'failed',
        code: 'invalid_params',
        message: M.agent_comms_result_not_found,
      }
    }
    if (row.status === 'sent') {
      return ok({
        en: `Already recorded as sent — ${row.title}.`,
        fr: `Déjà consignée comme envoyée — ${row.title}.`,
      })
    }
    await comms.markSent(row.id)
    return ok(
      {
        en: `Recorded as sent — ${row.title}.`,
        fr: `Consignée comme envoyée — ${row.title}.`,
      },
      row.id,
    )
  },
})
