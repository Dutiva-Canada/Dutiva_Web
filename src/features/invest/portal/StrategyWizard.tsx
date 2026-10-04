/**
 * New-strategy wizard — three steps per the approved prototype:
 *   1. Describe  (template chips feed real STRATEGY_TEMPLATES; free text
 *      goes through the invest-ai draft-strategy action)
 *   2. Review rules  (the shared accordion)
 *   3. Schedule & notifications  (cadence / scope / channels)
 * "Create strategy" persists via the API — always as a disabled draft, so
 * the editor opens with the draft banner and nothing runs until the user
 * enables + saves.
 */
import { useState } from 'react'
import { ChevronLeft, Loader2, Lock, Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { pick } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { draftStrategy } from '../data/api'
import { STRATEGY_TEMPLATES } from '../data/strategyTemplates'
import type { StrategyCadence, StrategyNotify } from '../data/types'
import { RulesAccordion } from './RulesAccordion'
import { toDrafts } from './ruleDrafts'
import type { RuleDraft } from './ruleDrafts'
import { CADENCE_LABEL, cadenceHelp, channelHelper, pl } from './strategyUi'
import type { StrategyDraft } from './strategyDraft'

interface Props {
  trackedSymbols: string[]
  onCancel: () => void
  onCreate: (draft: StrategyDraft, suggestionId?: string | null) => void
  busy: boolean
}

type WizardScope = 'all' | 'specific'

export function StrategyWizard({ trackedSymbols, onCancel, onCreate, busy }: Props) {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [desc, setDesc] = useState('')
  const [tplSlug, setTplSlug] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [rules, setRules] = useState<RuleDraft[]>([])
  const [cadence, setCadence] = useState<StrategyCadence>('daily')
  const [scope, setScope] = useState<WizardScope>('all')
  const [symbols, setSymbols] = useState<string[]>([])
  const [notify, setNotify] = useState<StrategyNotify>({ inApp: true, email: false })
  const [drafting, setDrafting] = useState(false)
  /* agent_suggestions row for the AI draft — carried through onCreate so a
     finished wizard resolves the queue row instead of orphaning it. */
  const [suggestionId, setSuggestionId] = useState<string | null>(null)

  const steps = [IM.invest_sb_wiz_describe, IM.invest_sb_wiz_review, IM.invest_sb_wiz_schedule]

  const head = (title: string) => (
    <>
      <button type="button" className="sb-backlink" onClick={onCancel}>
        <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
        {x(IM.invest_sb_back)}
      </button>
      <h1 style={{ marginTop: 2 }}>{title}</h1>
      <div className="sb-steps">
        {steps.map((s, i) => {
          const n = i + 1
          const st = n < step ? 'sb-done' : n === step ? 'sb-now' : ''
          return (
            <div className={`sb-st ${st}`} key={n}>
              <div className="sb-bar">
                <i />
              </div>
              <div className="sb-lb">
                {n}. {x(s)}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )

  const pickTemplate = (slug: string) => {
    const tpl = STRATEGY_TEMPLATES.find((t) => t.slug === slug)
    if (!tpl) return
    setTplSlug(slug)
    setDesc(pick(tpl.blurb, lang))
  }

  /* Step 1 → 2: template rules come straight from the gallery; free text
     goes to invest-ai; an empty textarea starts blank (the accordion is
     still fully usable in step 2). */
  const toReview = async () => {
    const tpl = tplSlug ? STRATEGY_TEMPLATES.find((t) => t.slug === tplSlug) : null
    if (tpl) {
      setName(pick(tpl.name, lang))
      setRules(toDrafts(tpl.rules.map((r) => ({ ...r }))))
      setCadence(tpl.cadence)
      setStep(2)
      return
    }
    if (desc.trim()) {
      setDrafting(true)
      try {
        const { draft: d, suggestionId: sid } = await draftStrategy(desc.trim(), lang)
        setName(d.name)
        setRules(toDrafts(d.rules))
        setCadence(d.cadence)
        setSuggestionId(sid)
        /* Queue write didn't land — the wizard flow is unaffected, but an
           abandoned draft won't be waiting on the strategies page. */
        if (sid === null) showToast(IM.invest_review_not_filed)
        setStep(2)
      } catch (e) {
        showToast(
          fill(x(IM.invest_sb_draft_failed), {
            error: e instanceof Error ? e.message : String(e),
          }),
        )
      } finally {
        setDrafting(false)
      }
      return
    }
    setName('')
    setRules([])
    setStep(2)
  }

  const create = () => {
    onCreate(
      {
        id: null,
        name: name.trim() || x(IM.invest_sb_untitled),
        enabled: false,
        cadence,
        scope: { watchlist: scope === 'all', symbols },
        notify,
        multiMatch: 'summary',
        template: tplSlug ? `tpl:${tplSlug}` : desc.trim() ? 'ai-draft' : '',
        rules,
      },
      suggestionId,
    )
  }

  const createDisabled = busy || (scope === 'specific' && symbols.length === 0)

  return (
    <div className="sb-wizard">
      {step === 1 && (
        <>
          {head(x(IM.invest_sb_wiz_step1_t))}
          <div className="sb-card sb-settings">
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="sb-wz-desc">
                {x(IM.invest_sb_wiz_what)}
              </label>
              <div className="sb-template-chips">
                {STRATEGY_TEMPLATES.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    aria-pressed={tplSlug === t.slug}
                    onClick={() => pickTemplate(t.slug)}
                  >
                    {x(t.name)}
                  </button>
                ))}
              </div>
              <textarea
                className="sb-input"
                id="sb-wz-desc"
                placeholder={x(IM.invest_sb_wiz_placeholder)}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value)
                  if (tplSlug) setTplSlug(null)
                }}
              />
              <p className="sb-helper">{x(IM.invest_sb_wiz_helper)}</p>
            </div>
          </div>
          <div className="sb-wiz-nav">
            <button type="button" className="sb-btn sb-btn-secondary" onClick={onCancel}>
              {x(IM.invest_sb_cancel)}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              disabled={drafting}
              onClick={() => void toReview()}
            >
              {drafting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  {x(IM.invest_sb_drafting)}
                </>
              ) : (
                x(IM.invest_sb_continue)
              )}
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {head(x(IM.invest_sb_wiz_step2_t))}
          <p className="sub">{x(IM.invest_sb_wiz_step2_sub)}</p>
          {rules.length === 0 && <p className="sub">{x(IM.invest_sb_wiz_step2_blank)}</p>}
          <RulesAccordion drafts={rules} onChange={setRules} idPrefix="wz" />
          <div className="sb-wiz-nav">
            <button type="button" className="sb-btn sb-btn-secondary" onClick={() => setStep(1)}>
              {x(IM.invest_sb_back_btn)}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              onClick={() => setStep(3)}
            >
              {x(IM.invest_sb_continue)}
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          {head(x(IM.invest_sb_wiz_step3_t))}
          <div className="sb-card sb-settings">
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="sb-wz-name">
                {x(IM.invest_sb_name)}
              </label>
              <input
                className="sb-input"
                id="sb-wz-name"
                value={name}
                maxLength={80}
                placeholder={x(IM.invest_sb_name_ph)}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="sb-wz-cad">
                {x(IM.invest_sb_cadence)}
              </label>
              <select
                className="sb-input"
                id="sb-wz-cad"
                value={cadence}
                onChange={(e) => setCadence(e.target.value as StrategyCadence)}
              >
                {(Object.keys(CADENCE_LABEL) as StrategyCadence[]).map((c) => (
                  <option key={c} value={c}>
                    {x(CADENCE_LABEL[c])}
                  </option>
                ))}
              </select>
              <p className="sb-helper">{cadenceHelp(lang, cadence)}</p>
            </div>
            <div className="sb-field">
              <span className="sb-flabel" id="sb-wz-scope-l">
                {x(IM.invest_sb_scope)}
              </span>
              <div className="sb-seg" role="group" aria-labelledby="sb-wz-scope-l">
                <button
                  type="button"
                  aria-pressed={scope === 'all'}
                  onClick={() => setScope('all')}
                >
                  {x(IM.invest_sb_scope_all)}
                </button>
                <button
                  type="button"
                  aria-pressed={scope === 'specific'}
                  onClick={() => setScope('specific')}
                >
                  {x(IM.invest_sb_scope_specific)}
                </button>
              </div>
              {scope === 'all' && trackedSymbols.length === 0 && (
                <p className="sb-helper">{x(IM.invest_sb_scope_none_tracked)}</p>
              )}
              {scope === 'specific' && symbols.length === 0 && (
                <p className="sb-helper">{x(IM.invest_sb_scope_need_sym)}</p>
              )}
              {scope === 'specific' && (
                <div style={{ marginTop: 12 }}>
                  <label className="sb-flabel" htmlFor="sb-wz-addsym" style={{ fontSize: 15 }}>
                    {x(IM.invest_sb_add_symbol)}
                  </label>
                  <input
                    className="sb-input"
                    id="sb-wz-addsym"
                    placeholder={x(IM.invest_sb_sym_placeholder)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      const v = e.currentTarget.value.trim().toUpperCase()
                      if (!v) return
                      if (!symbols.includes(v)) setSymbols([...symbols, v])
                      e.currentTarget.value = ''
                    }}
                  />
                  <div className="sb-chips">
                    {symbols.map((sym) => (
                      <span className="sb-chip-sym" key={sym}>
                        {sym}
                        <button
                          type="button"
                          aria-label={`${x(IM.invest_sb_remove_sym)} ${sym}`}
                          onClick={() => setSymbols(symbols.filter((s) => s !== sym))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sb-field">
              <span className="sb-flabel" id="sb-wz-chan-l">
                {x(IM.invest_sb_notify_via)}
              </span>
              <div className="sb-pills" role="group" aria-labelledby="sb-wz-chan-l">
                <button
                  type="button"
                  aria-pressed={notify.inApp}
                  onClick={() => setNotify({ ...notify, inApp: !notify.inApp })}
                >
                  {x(IM.invest_sb_chan_inapp)}
                </button>
                <button
                  type="button"
                  aria-pressed={notify.email}
                  onClick={() => setNotify({ ...notify, email: !notify.email })}
                >
                  {x(IM.invest_sb_chan_email)}
                </button>
              </div>
              <p className="sb-helper">{channelHelper(lang, notify)}</p>
            </div>
            <div className="sb-safety">
              <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{x(IM.invest_sb_safety)}</span>
            </div>
          </div>
          <div className="sb-wiz-nav">
            <button type="button" className="sb-btn sb-btn-secondary" onClick={() => setStep(2)}>
              {x(IM.invest_sb_back_btn)}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              disabled={createDisabled}
              onClick={create}
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              )}
              {x(IM.invest_sb_create)}
            </button>
          </div>
          <p className="sb-helper" style={{ textAlign: 'center' }}>
            {[
              name.trim() || x(IM.invest_sb_untitled),
              pl(lang, rules.length, IM.invest_sb_rule_one, IM.invest_sb_rule_many),
              pl(
                lang,
                scope === 'all' ? trackedSymbols.length : symbols.length,
                IM.invest_sb_tracked_one,
                IM.invest_sb_tracked_many,
              ),
            ].join(' · ')}
          </p>
        </>
      )}
    </div>
  )
}
