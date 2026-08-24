import { ProgressFill } from '@/components/ProgressFill'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ChevronRight, Circle, FileText, RotateCcw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { flowsMessages as M } from '@/i18n/messages/flows'
import { templateByTid } from '@/features/app/documents/data'
import { customTemplateByTid } from '@/features/app/documents/customTemplates'
import { flowBySlug } from './data'
import {
  advance,
  back,
  bandFor,
  currentStep,
  flowRecord,
  inputValues,
  isComplete,
  progress,
  scoreRun,
  startRun,
} from './flowEngine'
import type { FlowRun } from './flowEngine'
import { isFormula, isResult } from './flowModel'
import type { Flow } from './flowModel'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Runs a guided flow — the surface Ring 2's decision-tree tools needed
 * (docs/FOUR_RING_FRAMEWORK.md).
 *
 * All state is the `FlowRun` from the engine, held here and never mutated;
 * every transition goes through `advance` / `back` so the rules live in one
 * tested place rather than in event handlers.
 *
 * Nothing is persisted. A run is a thinking tool, and what belongs on the
 * file is the document the outcome hands off to — which is why the completed
 * view leads with those rather than offering to save this.
 */

/* Same dual resolution as DocStudioProvider: doclib first, then the ported
   legacy templates. */
const templateFor = (tid: string) => templateByTid.get(tid) ?? customTemplateByTid.get(tid)

export function FlowRunner() {
  const { slug } = useParams<{ slug: string }>()
  const flow = slug === undefined ? undefined : flowBySlug.get(slug)
  if (!flow) return <FlowMissing />
  /* Keyed so switching flows resets the run rather than carrying a path from
     one graph into another, where its step ids mean nothing. */
  return <FlowBody key={flow.slug} flow={flow} />
}

function FlowMissing() {
  const { x } = useI18n()
  return (
    <AppPage width="narrow">
        <p className="text-[14px] text-text-2">{x(M.flows_not_found)}</p>
        <Link
          to="/app/workflows"
          className="mt-[12px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {x(M.flows_back_to_workflows)}
        </Link>
    </AppPage>
  )
}

function FlowBody({ flow }: { readonly flow: Flow }) {
  const { x } = useI18n()
  const [run, setRun] = useState<FlowRun>(() => startRun(flow))

  const step = currentStep(flow, run)
  const done = isComplete(flow, run)
  const pct = Math.round(progress(flow, run) * 100)

  return (
    <AppPage width="narrow">
        <Link
          to="/app/workflows"
          className="mb-[14px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-text-muted"
        >
          <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
          {x(M.flows_back_to_workflows)}
        </Link>

        <h1 className="font-display text-[22px] leading-[1.3] font-bold text-text">
          {x(flow.title)}
        </h1>
        <p className="mt-[6px] text-[13px] leading-[1.55] text-text-2">{x(flow.summary)}</p>

        <div
          role="progressbar"
          aria-label={x(M.flows_progress_aria)}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-[18px] h-[5px] w-full overflow-hidden rounded-full bg-inset"
        >
          <ProgressFill pct={pct} className="h-full w-full rounded-full text-accent" />
        </div>

        <div className="mt-[20px] rounded-[14px] border border-border bg-surface px-[22px] py-[20px]">
          <h2 className="font-display text-[17px] leading-[1.35] font-bold text-text">
            {x(step.title)}
          </h2>
          <p className="mt-[8px] text-[13.5px] leading-[1.6] text-text-2">{x(step.body)}</p>

          {step.kind === 'task' && (
            <ul className="mt-[14px] flex flex-col gap-[8px]">
              {step.points.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-[9px] text-[13px] leading-[1.55] text-text-2"
                >
                  <Circle
                    size={6}
                    strokeWidth={0}
                    fill="currentColor"
                    className="mt-[7px] shrink-0 text-gold-dot"
                    aria-hidden="true"
                  />
                  <span>{x(point)}</span>
                </li>
              ))}
            </ul>
          )}

          {step.caution !== undefined && (
            <div className="mt-[14px] flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[13px] py-[10px]">
              <AlertTriangle
                size={14}
                strokeWidth={1.9}
                className="mt-px shrink-0 text-gold-fg"
                aria-hidden="true"
              />
              <div className="text-[12.5px] leading-[1.55] text-gold-fg">
                <span className="font-bold">{x(M.flows_watch_for)}: </span>
                {x(step.caution)}
              </div>
            </div>
          )}

          {step.kind === 'choice' && (
            <div className="mt-[16px] flex flex-col gap-[9px]">
              {step.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRun(advance(flow, run, option.id))}
                  className="flex cursor-pointer items-start gap-[10px] rounded-[11px] border border-border bg-bg-soft px-[15px] py-[13px] text-left font-sans transition-[border-color,background-color] hover:border-(--accent-soft-border) hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <ChevronRight
                    size={15}
                    strokeWidth={2.1}
                    className="mt-[2px] shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-text">
                      {x(option.label)}
                    </span>
                    {option.detail !== undefined && (
                      <span className="mt-[3px] block text-[12.5px] leading-[1.5] text-text-muted">
                        {x(option.detail)}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step.kind === 'input' && (
            <FlowInputForm
              key={step.id}
              label={x(step.label)}
              unit={x(step.unit)}
              numberKind={step.numberKind ?? 'integer'}
              onSubmit={(value) => setRun(advance(flow, run, String(value)))}
            />
          )}

          {step.kind === 'task' && (
            <button
              type="button"
              onClick={() => setRun(advance(flow, run))}
              className="mt-[16px] cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[9px] font-sans text-[13px] font-bold text-white"
            >
              {x(M.flows_continue)}
            </button>
          )}

          {isFormula(step) && <FormulaResult flow={flow} run={run} />}

          {isResult(step) && <ScoredResult flow={flow} run={run} />}

          {done && <OutcomeActions flow={flow} run={run} />}
        </div>

        <div className="mt-[14px] flex flex-wrap items-center gap-[10px]">
          {run.path.length > 1 && (
            <button
              type="button"
              onClick={() => setRun(back(run))}
              className="inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text"
            >
              <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
              {x(M.flows_back)}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRun(startRun(flow))}
            className="inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
          >
            <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
            {x(M.flows_restart)}
          </button>
        </div>

        {done && <PathTaken flow={flow} run={run} />}

        <Disclaimer variant="block" className="mt-[18px]" />
    </AppPage>
  )
}

const BAND_TONE: Record<'ok' | 'caution' | 'risk', string> = {
  ok: 'border-ok-border bg-ok-bg text-ok-fg',
  caution: 'border-gold-border bg-gold-bg text-gold-fg',
  risk: 'border-risk-border bg-risk-bg text-risk-fg',
}

/**
 * A scored ending: the band the total landed in, then the per-factor
 * breakdown weakest-first.
 *
 * The breakdown is the point. A single percentage tells someone how they are
 * doing and nothing about what to change, and an average high enough to feel
 * reassuring can still hide the one factor people are actually living with —
 * so the weakest factor is the first thing on the page after the verdict.
 */
function ScoredResult({ flow, run }: { readonly flow: Flow; readonly run: FlowRun }) {
  const { x } = useI18n()
  const step = currentStep(flow, run)
  if (!isResult(step)) return null

  const score = scoreRun(flow, run)
  const band = bandFor(step, score.percent)
  const byDomain = [...score.byDomain].sort((a, b) => a.total / a.max - b.total / b.max)

  return (
    <div className="mt-[18px]">
      <div className="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px]">
        <span className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
          {x(M.flows_score_label)}
        </span>
        <span className="font-display text-[26px] font-bold text-text">{score.percent}%</span>
        <span className="text-[12.5px] text-text-muted">
          {score.total} {x(M.flows_score_of)} {score.max}
        </span>
      </div>

      {band && (
        <div
          className={`mt-[12px] rounded-[12px] border px-[16px] py-[13px] ${BAND_TONE[band.tone]}`}
        >
          <div className="text-[14px] font-bold">{x(band.title)}</div>
          <div className="mt-[5px] text-[13px] leading-[1.6]">{x(band.body)}</div>
        </div>
      )}

      {byDomain.length > 0 && (
        <div className="mt-[18px]">
          <div className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
            {x(M.flows_by_factor)}
          </div>
          <p className="mt-[4px] text-[12px] text-text-muted">{x(M.flows_by_factor_intro)}</p>
          <ul aria-label={x(M.flows_by_factor)} className="mt-[10px] flex flex-col gap-[8px]">
            {byDomain.map((entry) => {
              const pct = entry.max === 0 ? 0 : Math.round((entry.total / entry.max) * 100)
              return (
                <li key={entry.domain.en} className="flex items-center gap-[10px]">
                  <span className="min-w-0 flex-1 text-[12.5px] text-text-2">
                    {x(entry.domain)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-[6px] w-[90px] shrink-0 overflow-hidden rounded-full bg-inset"
                  >
                    <ProgressFill pct={pct} className="block h-full w-full rounded-full text-navy" />
                  </span>
                  <span className="w-[38px] shrink-0 text-right text-[12px] font-semibold text-text-3">
                    {pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * The documents a finished run hands off to — what actually goes on the file.
 * Reads them off the outcome, or off the band a scored run landed in, since
 * what to do next depends on the score rather than on reaching the end.
 */
function OutcomeActions({ flow, run }: { readonly flow: Flow; readonly run: FlowRun }) {
  const { x } = useI18n()
  const step = currentStep(flow, run)
  const tids = isResult(step)
    ? (bandFor(step, scoreRun(flow, run).percent)?.documents ?? [])
    : step.kind === 'outcome' || step.kind === 'formula'
      ? (step.documents ?? [])
      : []

  /* An ending that deliberately produces no document says so, rather than
     rendering nothing — the absence is the instruction. */
  if (tids.length === 0) {
    const reason =
      step.kind === 'outcome' || step.kind === 'formula' ? step.noDocument : undefined
    if (!reason) return null
    return (
      <div className="mt-[18px] border-t border-inset pt-[16px]">
        <div className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
          {x(M.flows_no_document)}
        </div>
        <p className="mt-[8px] text-[13px] leading-[1.6] text-text-soft">{x(reason)}</p>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-inset pt-[16px]">
      <div className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
        {x(M.flows_next_documents)}
      </div>
      <div className="mt-[10px] flex flex-col gap-[8px]">
        {tids.map((tid) => {
          const template = templateFor(tid)
          if (!template) return null
          return (
            <Link
              key={tid}
              to={`/app/documents/templates/${template.tid}`}
              className="flex items-center gap-[10px] rounded-[10px] border border-border bg-bg-soft px-[14px] py-[11px]"
            >
              <FileText
                size={15}
                strokeWidth={1.9}
                className="shrink-0 text-gold-fg"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 text-[13px] font-semibold text-text">
                {x(template.name)}
              </span>
              <span className="shrink-0 text-[12px] font-semibold text-accent">
                {x(M.flows_open_template)}
              </span>
            </Link>
          )
        })}
      </div>
      <p className="mt-[10px] text-[11.5px] leading-[1.55] text-text-muted">
        {x(M.flows_record_note)}
      </p>
    </div>
  )
}

/** The run's path, so the reasoning can be copied onto the file. */
function PathTaken({ flow, run }: { readonly flow: Flow; readonly run: FlowRun }) {
  const { x } = useI18n()
  const record = flowRecord(flow, run)

  return (
    <div className="mt-[18px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
      <div className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
        {x(M.flows_your_path)}
      </div>
      <ol className="mt-[10px] flex flex-col gap-[8px]">
        {record.entries.map((entry, i) => (
          <li key={`${entry.step.id}-${i}`} className="text-[12.5px] leading-[1.55] text-text-2">
            <span className="font-semibold text-text">{x(entry.step.title)}</span>
            {entry.chosen && <span> — {x(entry.chosen.label)}</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Collects a non-negative integer for an `input` step. The value is passed to
 * `advance` as a string so the engine can reuse the option-id path.
 */
function FlowInputForm({
  label,
  unit,
  numberKind,
  onSubmit,
}: {
  readonly label: string
  readonly unit: string
  readonly numberKind: 'integer' | 'decimal'
  readonly onSubmit: (value: number) => void
}) {
  const { x } = useI18n()
  const [raw, setRaw] = useState('')
  const [invalid, setInvalid] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = raw.trim().replace(',', '.')
    const value = Number(trimmed)
    const okInteger = numberKind === 'integer' && Number.isInteger(value) && value >= 0
    const okDecimal = numberKind === 'decimal' && Number.isFinite(value) && value >= 0
    if (trimmed === '' || !(okInteger || okDecimal)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    onSubmit(value)
  }

  return (
    <form onSubmit={submit} className="mt-[16px] flex flex-col gap-[10px]">
      <label className="flex flex-col gap-[6px]">
        <span className="text-[12.5px] font-semibold text-text">{label}</span>
        <span className="flex items-center gap-[8px]">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={numberKind === 'decimal' ? '0.01' : 1}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              setInvalid(false)
            }}
            placeholder={x(M.flows_input_placeholder)}
            aria-invalid={invalid}
            className="w-[140px] rounded-[9px] border border-border bg-bg-soft px-[12px] py-[9px] font-sans text-[13.5px] text-text"
          />
          <span className="text-[12.5px] text-text-muted">{unit}</span>
        </span>
      </label>
      {invalid && (
        <p className="text-[12.5px] leading-[1.5] text-risk-fg">{x(M.flows_input_invalid)}</p>
      )}
      <button
        type="submit"
        className="w-fit cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[9px] font-sans text-[13px] font-bold text-white"
      >
        {x(M.flows_input_submit)}
      </button>
    </form>
  )
}

function FormulaResult({ flow, run }: { readonly flow: Flow; readonly run: FlowRun }) {
  const { x } = useI18n()
  const step = currentStep(flow, run)
  if (!isFormula(step)) return null

  const values = inputValues(flow, run)
  const lines = step.evaluate((id) => values.get(id))
  if (!lines || lines.length === 0) return null

  return (
    <div className="mt-[16px] flex flex-col gap-[10px] rounded-[12px] border border-gold-border bg-gold-bg px-[16px] py-[14px]">
      {lines.map((line) => (
        <div key={line.label.en} className="flex flex-wrap items-baseline justify-between gap-[8px]">
          <span className="text-[12.5px] font-semibold text-gold-fg">{x(line.label)}</span>
          <span className="font-display text-[18px] font-bold text-text">{x(line.value)}</span>
        </div>
      ))}
    </div>
  )
}
