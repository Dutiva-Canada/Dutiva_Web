import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangContext } from '@/i18n/context'
import { buildLangContextValue } from '@/i18n/lang'
import { messages } from '@/i18n/messages'
import { ChecklistWidget } from './ChecklistWidget'
import type { ChecklistSpec } from './widgetSpec'

const SPEC: ChecklistSpec = {
  type: 'checklist',
  title: { en: 'New-hire onboarding', fr: 'Intégration d’un nouvel employé' },
  data: {
    items: [
      { id: 'offer', label: { en: 'Offer letter signed', fr: 'Lettre d’offre signée' }, done: true },
      { id: 'sin', label: { en: 'SIN collected', fr: 'NAS recueilli' }, done: false },
      { id: 'buddy', label: { en: 'Buddy assigned', fr: 'Jumeau assigné' }, done: false },
    ],
    showProgress: true,
    copySummary: true,
  },
}

function wrap(ui: React.ReactElement, lang: 'en' | 'fr' = 'en') {
  return render(
    <LangContext value={buildLangContextValue(lang, () => {}, messages)}>
      {ui}
    </LangContext>,
  )
}

describe('ChecklistWidget', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reflects initial done state in the progress meter', () => {
    wrap(<ChecklistWidget spec={SPEC} />)
    const meter = screen.getByRole('progressbar')
    expect(meter).toHaveAttribute('aria-valuenow', '1')
    expect(meter).toHaveAttribute('aria-valuemax', '3')
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
  })

  it('updates the progress bar live as items are checked', () => {
    wrap(<ChecklistWidget spec={SPEC} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'SIN collected' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
    expect(screen.getByText('2 of 3 done')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
  })

  it('copies a plain-text summary in the active locale', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    wrap(<ChecklistWidget spec={SPEC} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy summary' }))

    expect(writeText).toHaveBeenCalledOnce()
    const summary = writeText.mock.calls[0]?.[0] as string
    expect(summary).toContain('New-hire onboarding')
    expect(summary).toContain('[x] Offer letter signed')
    expect(summary).toContain('[ ] SIN collected')
    expect(summary).toContain('1 of 3 done')
  })

  it('copies the French summary under a French locale', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    wrap(<ChecklistWidget spec={SPEC} />, 'fr')
    fireEvent.click(screen.getByRole('button', { name: 'Copier le résumé' }))

    const summary = writeText.mock.calls[0]?.[0] as string
    expect(summary).toContain('Intégration d’un nouvel employé')
    expect(summary).toContain('[x] Lettre d’offre signée')
    expect(summary).toContain('[ ] NAS recueilli')
    expect(summary).toContain('1 sur 3 terminés')
  })

  it('reports a clipboard failure instead of throwing', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) } })
    wrap(<ChecklistWidget spec={SPEC} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy summary' }))
    expect(
      await screen.findByText('Copy failed — clipboard unavailable'),
    ).toBeInTheDocument()
  })
})
