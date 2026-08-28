import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '@/i18n/LangProvider'
import { TemplateSamplePanel } from './TemplateSamplePanel'

function renderPanel(tid: string, defaultExpanded = false) {
  return render(
    <LangProvider>
      <TemplateSamplePanel tid={tid} defaultExpanded={defaultExpanded} />
    </LangProvider>,
  )
}

describe('TemplateSamplePanel', () => {
  it('shows the description first and reveals the preview on click', async () => {
    const user = userEvent.setup()
    renderPanel('T03')

    expect(screen.getByText('Termination letter (without cause)')).toBeInTheDocument()
    expect(screen.queryByText('Termination of Employment')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Preview sample/i }))
    expect(screen.getByRole('button', { name: /Hide preview/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Termination of Employment')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Hide preview/i }))
    expect(screen.getByRole('button', { name: /Preview sample/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Termination of Employment')).not.toBeVisible()
  })

  it('can start expanded for tests or deep links', () => {
    renderPanel('T01', true)
    expect(screen.getByText('Offer of Employment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hide preview/i })).toHaveAttribute('aria-expanded', 'true')
  })
})
