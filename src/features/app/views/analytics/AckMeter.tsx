import { Link } from 'react-router-dom'
import { CheckCircle2, Send } from 'lucide-react'
import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import type { AckProgress } from './aggregation'
import { fill } from './format'

/**
 * Policy-acknowledgment progress: "X / Y signed" over a meter, plus a
 * one-line suggested action while signatures are outstanding. When
 * `nudgeHref` is given, the suggestion links into the program that sends
 * the reminder (Communications — per the design mockup).
 */
export function AckMeter({
  ack,
  nudgeHref,
}: {
  readonly ack: AckProgress
  readonly nudgeHref?: string
}) {
  const { x } = useI18n()

  const suggestion =
    ack.outstanding === 0
      ? null
      : ack.outstanding === 1
        ? x(M.analytics_ack_action_one)
        : fill(x(M.analytics_ack_action), { n: ack.outstanding })

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="text-[13.5px] font-semibold text-text">
          {fill(x(M.analytics_ack_signed), { signed: ack.signed, total: ack.total })}
        </span>
        <span className="text-[12.5px] text-text-muted tabular-nums">{ack.pct}%</span>
      </div>
      <div
        role="img"
        aria-label={fill(x(M.analytics_ack_meter_aria), { signed: ack.signed, total: ack.total })}
        className="h-[10px] overflow-hidden rounded-[100px] bg-inset"
      >
        <ProgressFill pct={ack.pct} className="h-full w-full rounded-[100px] text-chart-mark" />
      </div>
      {suggestion !== null ? (
        nudgeHref ? (
          <Link
            to={nudgeHref}
            className="m-0 flex min-h-[36px] items-center gap-[7px] text-[12.5px] font-semibold text-accent no-underline"
          >
            <Send size={13} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
            {suggestion}
          </Link>
        ) : (
          <p className="m-0 flex items-center gap-[7px] text-[12.5px] text-text-2">
            <Send
              size={13}
              strokeWidth={1.9}
              className="shrink-0 text-text-muted"
              aria-hidden="true"
            />
            {suggestion}
          </p>
        )
      ) : (
        <p className="m-0 flex items-center gap-[7px] text-[12.5px] text-ok-fg">
          <CheckCircle2 size={13} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
          {x(M.analytics_ack_complete)}
        </p>
      )}
    </div>
  )
}
