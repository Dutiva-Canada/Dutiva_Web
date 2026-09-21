import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plug, Trash2, Unplug } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { supabase } from '@/lib/supabaseClient'
import { integrationsMessages as M } from '@/i18n/messages/integrations'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { INTEGRATION_CATALOG } from './integrationsCatalog'
import type { IntegrationConfigField, IntegrationProviderSpec } from './integrationsCatalog'
import {
  createIntegration,
  deleteIntegration,
  listInboundEmails,
  listIntegrationEvents,
  listIntegrations,
  runIntegrationAction,
} from './integrationsApi'
import type {
  InboundEmailRow,
  IntegrationEventRow,
  WorkspaceIntegrationRow,
} from './integrationsApi'
import { Card } from './settingsPrimitives'

/**
 * Settings → Connections (docs/INTEGRATIONS.md). Rows in
 * `workspace_integrations` are grouped under their catalog provider;
 * 'connected' is only ever written by the workspace-integration edge
 * function, so the UI never claims a link that wasn't verified.
 * inbound_webhook 'connect' mints a signed endpoint instead of taking a
 * token — URL + signing secret come back once and are shown in a
 * copy-now block. Providers without a working flow (OAuth, Signal)
 * render as 'Planned' — visible, honest, inert.
 */

const INPUT =
  'w-full rounded-[8px] border border-border bg-bg px-[11px] py-[8px] text-[13px] text-text outline-none placeholder:text-text-faint'
const LABEL = 'mb-[4px] block text-[11.5px] font-semibold text-text-muted'
const BTN =
  'cursor-pointer rounded-[8px] border border-border bg-accent-soft px-[13px] py-[7px] font-sans text-[12.5px] font-semibold text-accent disabled:cursor-default disabled:opacity-60'
const BTN_GHOST =
  'cursor-pointer rounded-[8px] border border-border bg-transparent px-[11px] py-[6px] font-sans text-[12px] font-semibold text-text-muted hover:text-text disabled:cursor-default disabled:opacity-60'

const STATUS_TONE: Record<string, ChipTone> = {
  connected: 'success',
  pending: 'warning',
  error: 'risk',
  disconnected: 'neutral',
}

function statusLabel(status: string, x: (v: { en: string; fr: string }) => string): string {
  if (status === 'connected') return x(M.integ_status_connected)
  if (status === 'error') return x(M.integ_status_error)
  if (status === 'disconnected') return x(M.integ_status_disconnected)
  return x(M.integ_status_pending)
}

function configFieldLabel(
  field: IntegrationConfigField,
  x: (v: { en: string; fr: string }) => string,
): string {
  if (field === 'instance_url') return x(M.integ_field_instance)
  if (field === 'smtp_host') return x(M.integ_field_smtp_host)
  if (field === 'smtp_port') return x(M.integ_field_smtp_port)
  return x(M.integ_field_smtp_user)
}

export function IntegrationsSection() {
  const { x } = useI18n()
  const { status: authStatus } = useAuth()
  const { isAdmin, organizationId } = useWorkspaceMode()
  const canRead = authStatus === 'signed-in' && organizationId != null && supabase != null

  return (
    <Card>
      <div className="px-[18px] py-[14px]">
        <div className="text-[13.5px] font-semibold text-text">{x(M.integ_title)}</div>
        <div className="mt-[2px] text-[12px] leading-[1.5] text-text-muted">{x(M.integ_note)}</div>
      </div>
      <ProviderList
        organizationId={canRead ? organizationId : null}
        canManage={canRead && isAdmin}
      />
      <div className="border-t border-inset px-[18px] py-[12px] text-[12px] leading-[1.5] text-text-muted">
        {x(M.integ_deferred_note)}
      </div>
    </Card>
  )
}

/* ───────────────────────────── provider list ───────────────────────────── */

function ProviderList({
  organizationId,
  canManage,
}: {
  readonly organizationId: string | null
  readonly canManage: boolean
}) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [rows, setRows] = useState<WorkspaceIntegrationRow[] | null>(null)
  const [openProvider, setOpenProvider] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  // Minted values (webhook URL+secret / inbound address), held only until
  // the admin dismisses the reveal block — webhook secrets never persist
  // to state beyond this page.
  const [minted, setMinted] = useState<Record<string, MintedRevealData>>({})

  const reload = useCallback(async () => {
    if (!organizationId) {
      setRows([])
      return
    }
    try {
      setRows(await listIntegrations(organizationId))
    } catch {
      setRows([])
    }
  }, [organizationId])

  useEffect(() => {
    void reload()
  }, [reload])

  const rowsByProvider = useMemo(() => {
    const map = new Map<string, WorkspaceIntegrationRow[]>()
    for (const row of rows ?? []) {
      map.set(row.provider, [...(map.get(row.provider) ?? []), row])
    }
    return map
  }, [rows])

  const act = async (
    row: WorkspaceIntegrationRow,
    action: 'test' | 'disconnect' | 'remove' | 'regenerate',
  ) => {
    if (busy) return
    setBusy(row.id + action)
    try {
      if (action === 'remove') {
        // Disconnect first so the Vault secret dies with the row.
        await runIntegrationAction('disconnect', row.id).catch(() => undefined)
        await deleteIntegration(row.id)
        showToast(M.integ_toast_disconnected, 'ok')
      } else if (action === 'regenerate') {
        // Re-mint the endpoint: new key + signing secret (webhook) or new
        // address key (inbound email).
        const result = await runIntegrationAction('connect', row.id)
        if (result.webhookUrl && result.signingSecret) {
          setMinted((prev) => ({
            ...prev,
            [row.id]: {
              title: M.integ_webhook_once,
              hint: M.integ_webhook_hint,
              items: [
                { label: M.integ_webhook_endpoint, value: result.webhookUrl! },
                { label: M.integ_webhook_secret, value: result.signingSecret! },
              ],
            },
          }))
          showToast(M.integ_toast_webhook_created, 'ok')
        } else if (result.inboundAddress) {
          setMinted((prev) => ({
            ...prev,
            [row.id]: {
              title: M.integ_email_ready,
              hint: M.integ_email_dns,
              items: [{ label: M.integ_email_address, value: result.inboundAddress! }],
            },
          }))
          showToast(M.integ_toast_address_created, 'ok')
        } else {
          showToast(M.integ_toast_check_failed, 'info')
        }
      } else {
        const result = await runIntegrationAction(action, row.id)
        if (result.status === 'connected' || result.status === 'disconnected') {
          if (action === 'disconnect') {
            setMinted((prev) => {
              const next = { ...prev }
              delete next[row.id]
              return next
            })
          }
          showToast(action === 'test' ? M.integ_toast_connected : M.integ_toast_disconnected, 'ok')
        } else {
          showToast(M.integ_toast_check_failed, 'info')
        }
      }
      await reload()
    } catch {
      showToast(M.integ_toast_check_failed, 'info')
    } finally {
      setBusy(null)
    }
  }

  const dismissMinted = (id: string) =>
    setMinted((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

  return (
    <div>
      {INTEGRATION_CATALOG.map((spec) => (
        <ProviderCard
          key={spec.key}
          spec={spec}
          rows={rowsByProvider.get(spec.key) ?? []}
          canManage={canManage}
          organizationId={organizationId}
          open={openProvider === spec.key}
          onToggleOpen={() => setOpenProvider(openProvider === spec.key ? null : spec.key)}
          busy={busy}
          onAct={act}
          onChanged={reload}
          showToast={showToast}
          minted={minted}
          onDismissMinted={dismissMinted}
        />
      ))}
      {rows != null && rows.length === 0 ? (
        <div className="border-t border-inset px-[18px] py-[10px] text-[12px] text-text-faint">
          {x(M.integ_empty)}
        </div>
      ) : null}
    </div>
  )
}

/* ───────────────────────────── single provider ─────────────────────────── */

function webhookEndpoint(row: WorkspaceIntegrationRow): string | null {
  const key = row.config?.webhook_key
  const base = import.meta.env.VITE_SUPABASE_URL
  if (typeof key !== 'string' || !key || !base) return null
  return `${base}/functions/v1/integration-webhook/${key}`
}

function inboundAddress(row: WorkspaceIntegrationRow): string | null {
  const addr = row.config?.inbound_address
  return typeof addr === 'string' && addr ? addr : null
}

function ProviderCard({
  spec,
  rows,
  canManage,
  organizationId,
  open,
  onToggleOpen,
  busy,
  onAct,
  onChanged,
  showToast,
  minted,
  onDismissMinted,
}: {
  readonly spec: IntegrationProviderSpec
  readonly rows: WorkspaceIntegrationRow[]
  readonly canManage: boolean
  readonly organizationId: string | null
  readonly open: boolean
  readonly onToggleOpen: () => void
  readonly busy: string | null
  readonly onAct: (
    row: WorkspaceIntegrationRow,
    action: 'test' | 'disconnect' | 'remove' | 'regenerate',
  ) => void
  readonly onChanged: () => Promise<void>
  readonly showToast: (msg: { en: string; fr: string }, tone: 'ok' | 'info') => void
  readonly minted: Record<string, MintedRevealData>
  readonly onDismissMinted: (id: string) => void
}) {
  const { x } = useI18n()
  const Icon = spec.icon
  const planned = spec.auth === 'planned'
  const isWebhook = spec.key === 'inbound_webhook'
  const isEmail = spec.key === 'inbound_email'

  return (
    <div className="border-t border-inset px-[18px] py-[14px]">
      <div className="flex items-start justify-between gap-[14px]">
        <div className="flex min-w-0 items-start gap-[10px]">
          <Icon className="mt-[1px] h-[16px] w-[16px] shrink-0 text-text-muted" />
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-text">{x(spec.name)}</div>
            <div className="mt-[2px] text-[12px] text-text-muted">{x(spec.blurb)}</div>
          </div>
        </div>
        {planned ? (
          <span className={statusChipClass('neutral')}>{x(M.integ_status_planned)}</span>
        ) : canManage && organizationId ? (
          <button type="button" className={BTN_GHOST} onClick={onToggleOpen}>
            <Plug className="mr-[5px] inline h-[12px] w-[12px]" />
            {x(M.integ_setup)}
          </button>
        ) : null}
      </div>

      {rows.map((row) => (
        <div key={row.id}>
          <div className="mt-[10px] flex items-center justify-between gap-[10px] rounded-[8px] border border-inset bg-bg px-[12px] py-[9px]">
            <div className="min-w-0">
              <div className="flex items-center gap-[8px]">
                <span className="truncate text-[12.5px] font-semibold text-text">
                  {row.display_name}
                </span>
                <span className={statusChipClass(STATUS_TONE[row.status] ?? 'neutral')}>
                  {statusLabel(row.status, x)}
                </span>
              </div>
              <div className="mt-[2px] text-[11.5px] text-text-muted">
                {typeof row.config?.account_login === 'string' ? (
                  <>
                    {x(M.integ_account)}: {row.config.account_login} ·{' '}
                  </>
                ) : null}
                {isWebhook && webhookEndpoint(row) ? (
                  <>
                    {x(M.integ_webhook_endpoint)}: {webhookEndpoint(row)} ·{' '}
                  </>
                ) : null}
                {isEmail && inboundAddress(row) ? (
                  <>
                    {x(M.integ_email_address)}: {inboundAddress(row)} ·{' '}
                  </>
                ) : null}
                {row.last_checked_at
                  ? x(M.integ_last_checked).replace(
                      '{when}',
                      new Date(row.last_checked_at).toLocaleString(),
                    )
                  : x(M.integ_never_checked)}
              </div>
            </div>
            {canManage ? (
              <div className="flex shrink-0 items-center gap-[6px]">
                {(isWebhook || isEmail) && row.status === 'connected' ? (
                  <button
                    type="button"
                    className={BTN_GHOST}
                    disabled={busy != null}
                    onClick={() => onAct(row, 'regenerate')}
                  >
                    {busy === row.id + 'regenerate' ? (
                      <Loader2 className="h-[12px] w-[12px] animate-spin" />
                    ) : (
                      x(M.integ_webhook_regenerate)
                    )}
                  </button>
                ) : null}
                {row.status === 'connected' ? (
                  <button
                    type="button"
                    className={BTN_GHOST}
                    disabled={busy != null}
                    onClick={() => onAct(row, 'test')}
                  >
                    {busy === row.id + 'test' ? (
                      <Loader2 className="h-[12px] w-[12px] animate-spin" />
                    ) : (
                      x(M.integ_test)
                    )}
                  </button>
                ) : null}
                {row.status !== 'disconnected' ? (
                  <button
                    type="button"
                    className={BTN_GHOST}
                    disabled={busy != null}
                    onClick={() => onAct(row, 'disconnect')}
                  >
                    <Unplug className="mr-[4px] inline h-[12px] w-[12px]" />
                    {x(M.integ_disconnect)}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={BTN_GHOST}
                  disabled={busy != null}
                  onClick={() => onAct(row, 'remove')}
                  aria-label={x(M.integ_remove)}
                >
                  <Trash2 className="h-[12px] w-[12px]" />
                </button>
              </div>
            ) : null}
          </div>
          {isWebhook && row.status === 'connected' ? <RecentEvents integrationId={row.id} /> : null}
          {isEmail && row.status === 'connected' ? <RecentMail integrationId={row.id} /> : null}
        </div>
      ))}

      {rows.map((row) => {
        const creds = minted[row.id]
        return creds ? (
          <MintedReveal
            key={`minted-${row.id}`}
            data={creds}
            onDone={() => onDismissMinted(row.id)}
            showToast={showToast}
          />
        ) : null
      })}

      {open && canManage && organizationId && !planned ? (
        <SetupForm
          spec={spec}
          organizationId={organizationId}
          onDone={async () => {
            onToggleOpen()
            await onChanged()
          }}
          showToast={showToast}
        />
      ) : null}
    </div>
  )
}

/* ───────────────────── minted webhook credentials ──────────────────────── */

interface MintedRevealData {
  title: { en: string; fr: string }
  hint: { en: string; fr: string }
  items: { label: { en: string; fr: string }; value: string }[]
}

function MintedReveal({
  data,
  onDone,
  showToast,
}: {
  readonly data: MintedRevealData
  readonly onDone: () => void
  readonly showToast: (msg: { en: string; fr: string }, tone: 'ok' | 'info') => void
}) {
  const { x } = useI18n()
  const copy = (value: string) => {
    void navigator.clipboard?.writeText(value).then(() => showToast(M.integ_webhook_copied, 'ok'))
  }
  return (
    <div className="mt-[10px] rounded-[8px] border border-border bg-accent-soft/40 px-[12px] py-[12px]">
      <div className="text-[11.5px] font-semibold text-text">{x(data.title)}</div>
      <div className="mt-[8px] space-y-[6px]">
        {data.items.map((item) => (
          <div key={item.label.en} className="flex items-center gap-[8px]">
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-text-faint">
                {x(item.label)}
              </div>
              <code className="block truncate text-[11.5px] text-text">{item.value}</code>
            </div>
            <button type="button" className={BTN_GHOST} onClick={() => copy(item.value)}>
              {x(M.integ_webhook_copy)}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-[8px] text-[11.5px] leading-[1.5] text-text-muted">{x(data.hint)}</div>
      <div className="mt-[10px]">
        <button type="button" className={BTN} onClick={onDone}>
          {x(M.integ_webhook_done)}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────── recent inbound deliveries ─────────────────────── */

/**
 * Last deliveries on a connected webhook endpoint — the read half of event
 * consumption (the write half is the ingest fan-out to workspace
 * notifications). payload.summary/title/message is surfaced truncated,
 * matching what the notification body carries.
 */
function RecentEvents({ integrationId }: { readonly integrationId: string }) {
  const { x } = useI18n()
  const [events, setEvents] = useState<IntegrationEventRow[] | null>(null)

  useEffect(() => {
    let live = true
    listIntegrationEvents(integrationId)
      .then((list) => {
        if (live) setEvents(list)
      })
      .catch(() => {
        if (live) setEvents([])
      })
    return () => {
      live = false
    }
  }, [integrationId])

  if (events == null) return null

  const detail = (e: IntegrationEventRow): string | null => {
    const p = e.payload
    if (typeof p !== 'object' || p === null) return null
    const v =
      (p as Record<string, unknown>).summary ??
      (p as Record<string, unknown>).title ??
      (p as Record<string, unknown>).message
    return typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : null
  }

  return (
    <div className="mt-[6px] rounded-[8px] border border-inset bg-bg px-[12px] py-[9px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-faint">
        {x(M.integ_events_title)}
      </div>
      {events.length === 0 ? (
        <div className="mt-[6px] text-[12px] text-text-muted">{x(M.integ_events_empty)}</div>
      ) : (
        <ul className="mt-[4px] divide-y divide-inset">
          {events.map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-[10px] py-[6px]">
              <div className="min-w-0">
                <span className="text-[12.5px] font-medium text-text">
                  {e.event_type ?? 'event'}
                </span>
                {detail(e) ? (
                  <span className="text-[12px] text-text-muted"> — {detail(e)}</span>
                ) : null}
                <div className="text-[11px] text-text-faint">
                  {new Date(e.received_at).toLocaleString()}
                </div>
              </div>
              <span className={statusChipClass(e.processed_at ? 'success' : 'neutral')}>
                {e.processed_at ? x(M.integ_events_notified) : x(M.integ_events_stored)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─────────────────────── recent inbound mail ──────────────────────────── */

/** Last deliveries to a connected inbound address (inbound_emails, 0164). */
function RecentMail({ integrationId }: { readonly integrationId: string }) {
  const { x } = useI18n()
  const [mails, setMails] = useState<InboundEmailRow[] | null>(null)

  useEffect(() => {
    let live = true
    listInboundEmails(integrationId)
      .then((list) => {
        if (live) setMails(list)
      })
      .catch(() => {
        if (live) setMails([])
      })
    return () => {
      live = false
    }
  }, [integrationId])

  if (mails == null) return null

  return (
    <div className="mt-[6px] rounded-[8px] border border-inset bg-bg px-[12px] py-[9px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-faint">
        {x(M.integ_mail_title)}
      </div>
      {mails.length === 0 ? (
        <div className="mt-[6px] text-[12px] text-text-muted">{x(M.integ_mail_empty)}</div>
      ) : (
        <ul className="mt-[4px] divide-y divide-inset">
          {mails.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between gap-[10px] py-[6px]">
              <div className="min-w-0">
                <span className="text-[12.5px] font-medium text-text">
                  {m.subject?.trim() || '(no subject)'}
                </span>
                <span className="text-[12px] text-text-muted"> — {m.from_address}</span>
                <div className="text-[11px] text-text-faint">
                  {new Date(m.received_at).toLocaleString()}
                  {Array.isArray(m.attachments) && m.attachments.length > 0
                    ? ` · ${m.attachments.length} attachment${m.attachments.length > 1 ? 's' : ''}`
                    : ''}
                </div>
              </div>
              <span className={statusChipClass(m.processed_at ? 'success' : 'neutral')}>
                {m.processed_at ? x(M.integ_events_notified) : x(M.integ_events_stored)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ───────────────────────────── setup form ──────────────────────────────── */

function SetupForm({
  spec,
  organizationId,
  onDone,
  showToast,
}: {
  readonly spec: IntegrationProviderSpec
  readonly organizationId: string
  readonly onDone: () => Promise<void>
  readonly showToast: (msg: { en: string; fr: string }, tone: 'ok' | 'info') => void
}) {
  const { x } = useI18n()
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [secret, setSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [mintedResult, setMintedResult] = useState<MintedRevealData | null>(null)
  const isWebhook = spec.auth === 'webhook'
  const isEmail = spec.auth === 'email'
  const isMinted = isWebhook || isEmail

  const submit = async () => {
    if (saving) return
    if (!name.trim() || (!isMinted && !secret.trim())) {
      showToast(M.integ_toast_save_failed, 'info')
      return
    }
    setSaving(true)
    try {
      const config: Record<string, unknown> = {}
      for (const f of spec.configFields ?? []) {
        const v = fields[f]?.trim()
        if (v) config[f] = f === 'smtp_port' ? Number(v) || v : v
      }
      const row = await createIntegration({
        organizationId,
        provider: spec.key,
        displayName: name.trim(),
        config,
      })
      const result = await runIntegrationAction(
        'connect',
        row.id,
        isMinted ? undefined : secret.trim(),
      )
      if (isWebhook && result.webhookUrl && result.signingSecret) {
        setMintedResult({
          title: M.integ_webhook_once,
          hint: M.integ_webhook_hint,
          items: [
            { label: M.integ_webhook_endpoint, value: result.webhookUrl },
            { label: M.integ_webhook_secret, value: result.signingSecret },
          ],
        })
        showToast(M.integ_toast_webhook_created, 'ok')
        return
      }
      if (isEmail && result.inboundAddress) {
        setMintedResult({
          title: M.integ_email_ready,
          hint: M.integ_email_dns,
          items: [{ label: M.integ_email_address, value: result.inboundAddress }],
        })
        showToast(M.integ_toast_address_created, 'ok')
        return
      }
      if (result.status === 'connected') {
        showToast(
          {
            en: M.integ_toast_connected.en.replace('{account}', result.account ?? ''),
            fr: M.integ_toast_connected.fr.replace('{account}', result.account ?? ''),
          },
          'ok',
        )
      } else if (result.stored) {
        showToast(M.integ_toast_saved, 'ok')
      } else {
        showToast(M.integ_toast_check_failed, 'info')
      }
      await onDone()
    } catch {
      showToast(M.integ_toast_save_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  if (mintedResult) {
    return <MintedReveal data={mintedResult} onDone={() => void onDone()} showToast={showToast} />
  }

  return (
    <div className="mt-[10px] rounded-[8px] border border-inset bg-bg px-[12px] py-[12px]">
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
        <div>
          <label className={LABEL}>{x(M.integ_field_name)}</label>
          <input
            className={INPUT}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={x(M.integ_field_name_hint)}
          />
        </div>
        {(spec.configFields ?? []).map((f) => (
          <div key={f}>
            <label className={LABEL}>{configFieldLabel(f, x)}</label>
            <input
              className={INPUT}
              value={fields[f] ?? ''}
              onChange={(e) => setFields((prev) => ({ ...prev, [f]: e.target.value }))}
              placeholder={f === 'instance_url' ? x(M.integ_field_instance_hint) : undefined}
            />
          </div>
        ))}
        {!isMinted ? (
          <div>
            <label className={LABEL}>
              {spec.auth === 'smtp' ? x(M.integ_field_smtp_password) : x(M.integ_field_token)}
            </label>
            <input
              className={INPUT}
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </div>
        ) : null}
      </div>
      {spec.tokenHint ? (
        <div className="mt-[8px] text-[11.5px] leading-[1.5] text-text-muted">
          {x(spec.tokenHint)}
        </div>
      ) : null}
      {spec.auth === 'smtp' ? (
        <div className="mt-[8px] text-[11.5px] leading-[1.5] text-text-muted">
          {x(M.integ_smtp_note)}
        </div>
      ) : null}
      {isWebhook ? (
        <div className="mt-[8px] text-[11.5px] leading-[1.5] text-text-muted">
          {x(M.integ_webhook_hint)}
        </div>
      ) : null}
      {isEmail ? (
        <div className="mt-[8px] text-[11.5px] leading-[1.5] text-text-muted">
          {x(M.integ_email_hint)} {x(M.integ_email_dns)}
        </div>
      ) : null}
      <div className="mt-[10px]">
        <button type="button" className={BTN} disabled={saving} onClick={() => void submit()}>
          {saving ? <Loader2 className="mr-[5px] inline h-[12px] w-[12px] animate-spin" /> : null}
          {isWebhook
            ? x(M.integ_webhook_create)
            : isEmail
              ? x(M.integ_email_create)
              : x(M.integ_connect)}
        </button>
      </div>
    </div>
  )
}
