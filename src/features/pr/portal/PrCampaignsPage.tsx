import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useState } from 'react'
import { Loader2, PenSquare, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addCampaign, deleteCampaign, updateCampaign } from '@/features/pr/data/api'
import { sendPrReaction } from '@/features/pr/data/chatApi'
import { PaigeNote } from './PaigeNote'
import { campaignItemCount } from '@/features/pr/data/prStats'
import type { PrCampaign, PrCampaignStatus, PrChannel } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  CAMPAIGN_STATUSES,
  campaignStatusLabel,
  CHANNELS,
  channelLabel,
  fmtCad,
  fmtDate,
} from './prUi'
import { usePrHead } from './usePrHead'

const STATUS_PILL: Record<PrCampaignStatus, string> = {
  draft: 'sb-pill sb-pill-draft',
  active: 'sb-pill sb-pill-ok',
  paused: 'sb-pill sb-pill-warn',
  done: 'sb-pill sb-pill-draft',
}

interface Draft {
  id: string | null
  name: string
  channel: PrChannel
  status: PrCampaignStatus
  objective: string
  budget: string
  startsOn: string
  endsOn: string
}

const EMPTY: Draft = {
  id: null,
  name: '',
  channel: 'mixed',
  status: 'draft',
  objective: '',
  budget: '',
  startsOn: '',
  endsOn: '',
}

export function PrCampaignsPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_camp_title, PM.pr_camp_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [paigeLine, setPaigeLine] = useState<string | null>(null)
  const [armDelete, setArmDelete] = useState<string | null>(null)

  const openNew = () => {
    setDraft(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (c: PrCampaign) => {
    setDraft({
      id: c.id,
      name: c.name,
      channel: c.channel,
      status: c.status,
      objective: c.objective,
      budget: c.budgetCad == null ? '' : String(c.budgetCad),
      startsOn: c.startsOn ?? '',
      endsOn: c.endsOn ?? '',
    })
    setFormOpen(true)
  }

  const submit = async () => {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    try {
      const budget = draft.budget.trim() === '' ? null : Number(draft.budget)
      const fields = {
        name: draft.name,
        channel: draft.channel,
        status: draft.status,
        objective: draft.objective,
        budgetCad: Number.isFinite(budget) ? budget : null,
        startsOn: draft.startsOn || null,
        endsOn: draft.endsOn || null,
      }
      const isNew = !draft.id
      if (draft.id) await updateCampaign(draft.id, fields)
      else await addCampaign(fields)
      await refresh()
      setDraft(EMPTY)
      setFormOpen(false)
      showToast(PM.pr_camp_saved)
      /* Paige notices new campaigns — best-effort: a throttled or failed
         reaction returns null and never disturbs the save. Edits stay
         quiet. */
      if (isNew) {
        sendPrReaction(
          { type: 'campaign_created', name: fields.name, channel: fields.channel },
          lang,
          setPaigeLine,
        )
          .then((r) => {
            if (r.reply) setPaigeLine(r.reply)
          })
          .catch(() => {})
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    await deleteCampaign(id)
    await refresh()
  }

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="sb prx sb-page">
        <p role="alert" className="sb-note">{x(PM.pr_load_error)}</p>
        <button type="button" className="sb-btn sb-btn-secondary" onClick={() => void refresh()}>
          {x(PM.pr_retry)}
        </button>
      </div>
    )
  }

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_camp_title)}</h1>
        <button type="button" className="sb-btn sb-btn-primary" onClick={openNew}>
          {x(PM.pr_camp_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_camp_sub)}</p>
      {paigeLine && <PaigeNote line={paigeLine} />}

      {formOpen && (
        <form
          className="sb-card sb-card-pad"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="sb-form-grid">
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-camp-name">{x(PM.pr_camp_name)}</label>
              <input
                id="pr-camp-name"
                className="sb-input"
                required
                value={draft.name}
                placeholder={x(PM.pr_camp_name_ph)}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-camp-channel">{x(PM.pr_camp_channel)}</label>
              <select
                id="pr-camp-channel"
                className="sb-input"
                value={draft.channel}
                onChange={(e) => setDraft({ ...draft, channel: e.target.value as PrChannel })}
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{channelLabel(c, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-camp-status">{x(PM.pr_camp_status)}</label>
              <select
                id="pr-camp-status"
                className="sb-input"
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as PrCampaignStatus })
                }
              >
                {CAMPAIGN_STATUSES.map((s) => (
                  <option key={s} value={s}>{campaignStatusLabel(s, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-camp-budget">{x(PM.pr_camp_budget)}</label>
              <input
                id="pr-camp-budget"
                className="sb-input"
                type="number"
                min="0"
                step="0.01"
                value={draft.budget}
                placeholder="$"
                onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-camp-start">{x(PM.pr_camp_start)}</label>
              <input
                id="pr-camp-start"
                className="sb-input"
                type="date"
                value={draft.startsOn}
                onChange={(e) => setDraft({ ...draft, startsOn: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-camp-end">{x(PM.pr_camp_end)}</label>
              <input
                id="pr-camp-end"
                className="sb-input"
                type="date"
                value={draft.endsOn}
                onChange={(e) => setDraft({ ...draft, endsOn: e.target.value })}
              />
            </div>
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-camp-obj">{x(PM.pr_camp_objective)}</label>
              <input
                id="pr-camp-obj"
                className="sb-input"
                value={draft.objective}
                placeholder={x(PM.pr_camp_objective_ph)}
                onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
              />
            </div>
            <div className="sb-form-actions">
              {draft.id && (
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary"
                  onClick={() => {
                    setDraft(EMPTY)
                    setFormOpen(false)
                  }}
                >
                  {x(PM.pr_camp_cancel)}
                </button>
              )}
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_camp_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="sb-card sb-card-pad">
        {state.campaigns.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_camp_empty)}</div>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>{x(PM.pr_camp_name)}</th>
                  <th>{x(PM.pr_camp_channel)}</th>
                  <th>{x(PM.pr_camp_status)}</th>
                  <th>{x(PM.pr_camp_start)}</th>
                  <th>{x(PM.pr_camp_budget)}</th>
                  <th>{x(PM.pr_tab_content)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.objective && (
                        <div style={{ fontSize: 12.5, color: 'var(--sb-muted)' }}>
                          {c.objective}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="prx-chip" data-plain>
                        {channelLabel(c.channel, lang)}
                      </span>
                    </td>
                    <td>
                      <span className={STATUS_PILL[c.status]}>
                        {campaignStatusLabel(c.status, lang)}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.startsOn ? fmtDate(c.startsOn, lang) : '—'}
                      {c.endsOn ? ` → ${fmtDate(c.endsOn, lang)}` : ''}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtCad(c.budgetCad, lang)}</td>
                    <td>
                      {x(PM.pr_camp_items).replace(
                        '{count}',
                        String(campaignItemCount(state.contentItems, c.id)),
                      )}
                    </td>
                    <td>
                      <div className="sb-row-actions">
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => openEdit(c)}
                        >
                          <PenSquare size={13} aria-hidden="true" />
                          {x(PM.pr_camp_edit)}
                        </button>
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => void remove(c.id)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          {armDelete === c.id
                            ? x(PM.pr_camp_delete_confirm)
                            : x(PM.pr_camp_delete)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
