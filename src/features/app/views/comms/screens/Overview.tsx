import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { ACTION_LABEL, CHANNEL_LABEL, CONTENT_STATUS_LABEL, DELIVERY_STATUS_LABEL, DOMAIN_LABEL, INITIATIVE_STATUS_LABEL, RISK_LABEL } from '../commsLabels'

export function Overview() {
  const { x, lang } = useI18n()
  const { state } = useCommsData()

  const upcoming = useMemo(
    () =>
      [...state.contentItems]
        .filter((c) => c.dueDate)
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
    [state.contentItems],
  )

  const approvals = useMemo(
    () =>
      state.contentItems.filter(
        (c) => c.status === 'in_review' || c.status === 'changes_requested',
      ),
    [state.contentItems],
  )

  const pausedInitiatives = useMemo(
    () => state.initiatives.filter((i) => i.status === 'paused'),
    [state.initiatives],
  )

  const reconcileQueue = useMemo(
    () => state.contentItems.filter((c) => c.deliveryStatus === 'unknown' || c.deliveryStatus === 'failed'),
    [state.contentItems],
  )

  const activity = useMemo(
    () => [...state.executionEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20),
    [state.executionEvents],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_overview_upcoming)}</h2>
        {upcoming.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_overview_no_upcoming)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {upcoming.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(item.title)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(CHANNEL_LABEL[item.channel])} · {item.dueDate}
                  </div>
                </div>
                <span className={statusChipClass(item.status === 'approved' ? 'success' : 'warning')}>
                  {x(CONTENT_STATUS_LABEL[item.status])}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_overview_recent)}</h2>
        {state.initiatives.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_initiatives_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.initiatives.map((init) => (
              <li key={init.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <Link
                    to={`/app/comms/initiatives/${init.id}`}
                    className="text-[13px] font-semibold text-accent no-underline hover:underline"
                  >
                    {x(init.title)}
                  </Link>
                  <div className="text-[12px] text-text-muted">
                    {x(DOMAIN_LABEL[init.domain])} · {init.owner} · {x(RISK_LABEL[init.risk])}
                  </div>
                </div>
                <span className={statusChipClass(init.status === 'active' ? 'success' : 'neutral')}>
                  {x(INITIATIVE_STATUS_LABEL[init.status])}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_overview_approvals)}</h2>
        {approvals.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_overview_no_upcoming)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {approvals.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(item.title)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(CHANNEL_LABEL[item.channel])} · {item.owner}
                  </div>
                </div>
                <span className={statusChipClass('warning')}>{x(CONTENT_STATUS_LABEL[item.status])}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pausedInitiatives.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_initiative_paused_notice)}</h2>
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {pausedInitiatives.map((init) => (
              <li key={init.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <Link
                    to={`/app/comms/initiatives/${init.id}`}
                    className="text-[13px] font-semibold text-accent no-underline hover:underline"
                  >
                    {x(init.title)}
                  </Link>
                  <div className="text-[12px] text-text-muted">
                    {x(DOMAIN_LABEL[init.domain])} · {init.owner}
                  </div>
                </div>
                <span className={statusChipClass('warning')}>{x(INITIATIVE_STATUS_LABEL[init.status])}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reconcileQueue.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_content_reconcile)}</h2>
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {reconcileQueue.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(item.title)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(CHANNEL_LABEL[item.channel])} · {x(DELIVERY_STATUS_LABEL[item.deliveryStatus])}
                  </div>
                </div>
                <span className={statusChipClass(item.deliveryStatus === 'failed' ? 'risk' : 'warning')}>
                  {x(DELIVERY_STATUS_LABEL[item.deliveryStatus])}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activity.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_overview_activity)}</h2>
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {activity.map((event) => {
              const item = state.contentItems.find((c) => c.id === event.contentItemId)
              return (
                <li key={event.id} className="flex flex-col gap-[2px] rounded-[8px] bg-inset p-[12px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <div>
                      <div className="text-[13px] font-semibold text-text">{x(ACTION_LABEL[event.action])}</div>
                      <div className="text-[12px] text-text-muted">
                        {item ? x(item.title) : event.contentItemId}
                        {event.actor ? ` · ${event.actor}` : ''}
                      </div>
                    </div>
                    <time className="text-[12px] text-text-2" dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  {(event.previousStatus || event.newStatus) && (
                    <div className="text-[12px] text-text-2">
                      {event.previousStatus && (
                        <span>
                          {x(M.comms_execution_previous_status)}: {x(DELIVERY_STATUS_LABEL[event.previousStatus])}
                        </span>
                      )}
                      {event.previousStatus && event.newStatus && ' → '}
                      {event.newStatus && (
                        <span>
                          {x(M.comms_execution_new_status)}: {x(DELIVERY_STATUS_LABEL[event.newStatus])}
                        </span>
                      )}
                    </div>
                  )}
                  {event.note && <div className="text-[12px] text-text-2">{x(event.note)}</div>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_overview_health)}</h2>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 md:grid-cols-4">
          {Object.entries(DOMAIN_LABEL).map(([key, label]) => (
            <div key={key} className="rounded-[8px] bg-inset px-[12px] py-[10px]">
              <div className="text-[12px] text-text-muted">{x(label)}</div>
              <div className="mt-[4px] flex items-center gap-[6px] text-[12px] font-semibold text-text">
                <span className="h-[8px] w-[8px] rounded-full bg-ok-fg" aria-hidden="true" />
                {x(M.comms_status_active)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
