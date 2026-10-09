import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangContext } from '@/i18n/context'
import { buildLangContextValue } from '@/i18n/lang'
import { messages } from '@/i18n/messages'
import { CalculatorWidget } from './CalculatorWidget'
import { ontarioOvertimeSpec, ontarioTerminationPaySpec } from './prebuiltWidgets'

function wrap(ui: React.ReactElement, lang: 'en' | 'fr' = 'en') {
  return render(
    <LangContext value={buildLangContextValue(lang, () => {}, messages)}>
      {ui}
    </LangContext>,
  )
}

describe('CalculatorWidget', () => {
  it('computes the ESA termination-pay minimum — 3 years, $60k → $3,461.54', () => {
    wrap(<CalculatorWidget spec={ontarioTerminationPaySpec()} />)
    /* Defaults are already 3 years / $60,000 — the result is correct on first
       paint, no interaction needed. */
    expect(screen.getByText('$3,461.54')).toBeInTheDocument()
    /* Breakdown shows 3 weeks at $1,153.85/week. */
    expect(screen.getByText('Weeks of notice (ESA minimum)')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('$1,153.85')).toBeInTheDocument()
  })

  it('recomputes live as inputs change — 8+ years caps at 8 weeks', () => {
    wrap(<CalculatorWidget spec={ontarioTerminationPaySpec()} />)
    const years = screen.getByLabelText('Completed years of service')
    fireEvent.change(years, { target: { value: '10' } })
    /* 8 weeks × $1,153.85 = $9,230.80 (rounding: 60000/52×8 = 9230.769… → $9,230.77) */
    expect(screen.getByText('$9,230.77')).toBeInTheDocument()
  })

  it('computes Ontario overtime — 50 h at $20 → $180', () => {
    wrap(<CalculatorWidget spec={ontarioOvertimeSpec()} />)
    expect(screen.getByText('$180.00')).toBeInTheDocument()
  })

  it('shows the estimate disclaimer for regulated calculators', () => {
    wrap(<CalculatorWidget spec={ontarioTerminationPaySpec()} />)
    expect(
      screen.getByText(/Estimate — verify against current legislation before relying on it\./),
    ).toBeInTheDocument()
  })

  it('renders the disclaimer in French under a French locale', () => {
    wrap(<CalculatorWidget spec={ontarioTerminationPaySpec()} />, 'fr')
    expect(screen.getByText(/Estimation — vérifiez la législation en vigueur/)).toBeInTheDocument()
    expect(screen.getByLabelText('Salaire annuel')).toBeInTheDocument()
  })

  it('announces the result through an aria-live region', () => {
    wrap(<CalculatorWidget spec={ontarioTerminationPaySpec()} />)
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
    expect(liveRegion?.textContent).toContain('Minimum termination pay')
  })

  it('shows an em dash rather than garbage when an input is empty', () => {
    const { container } = wrap(<CalculatorWidget spec={ontarioTerminationPaySpec()} />)
    fireEvent.change(screen.getByLabelText('Annual salary'), { target: { value: '' } })
    expect(container.querySelector('.cw-calc-result-value')?.textContent).toBe('—')
  })
})
