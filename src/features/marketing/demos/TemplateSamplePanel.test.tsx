import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '@/i18n/LangProvider'
import { TemplateSamplePanel } from './TemplateSamplePanel'

function renderPanel(tid: string, defaultOpen = false) {
  return render(
    <LangProvider>
      <TemplateSamplePanel tid={tid} defaultOpen={defaultOpen} />
    </LangProvider>,
  )
}

describe('TemplateSamplePanel', () => {
  it('shows the description first and opens a modal preview on click', async () => {
    const user = userEvent.setup()
    renderPanel('T03')

    expect(screen.getByText('Termination letter (without cause)')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Preview sample/i }))
    expect(screen.getByRole('dialog', { name: 'Termination letter (without cause)' })).toBeInTheDocument()
    expect(screen.getByText('Termination of Employment')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Close preview/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('can start open for tests', () => {
    renderPanel('T01', true)
    expect(screen.getByRole('dialog', { name: 'Offer of employment letter (Ontario)' })).toBeInTheDocument()
    expect(screen.getByText('Offer of Employment')).toBeInTheDocument()
  })
})
