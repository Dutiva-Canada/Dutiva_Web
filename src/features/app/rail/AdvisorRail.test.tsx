import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { bi } from '@/i18n/core'
import { ADVISOR_STREAM_TICK_MS, ADVISOR_THINK_MS } from '@/features/app/advisor/useAdvisorEngine'
import { AdvisorRail } from './AdvisorRail'
import { RailProvider } from './RailProvider'
import { useRail } from './railContext'

const INTRO = bi('Two things stand out.', 'Deux éléments ressortent.')

function OpenProbe() {
  const { openRail } = useRail()
  return (
    <button
      onClick={() =>
        openRail(
          bi('Jordan Mensah', 'Jordan Mensah'),
          {
            text: INTRO,
            cards: [
              {
                tone: 'risk',
                title: bi('Notice exposure risk', 'Risque d’exposition au préavis'),
                body: bi(
                  'No termination clause on file.',
                  'Aucune clause de licenciement au dossier.',
                ),
              },
            ],
          },
          { chips: [bi('Ontario', 'Ontario')], initials: 'JM' },
        )
      }
    >
      ask
    </button>
  )
}

function renderRail() {
  return render(
    <MemoryRouter>
      <LangProvider>
        <RailProvider>
          <OpenProbe />
          <AdvisorRail />
        </RailProvider>
      </LangProvider>
    </MemoryRouter>,
  )
}

describe('AdvisorRail', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is hidden until openRail, then shows title, streams the intro, and renders cards', () => {
    renderRail()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'ask' }))
    })
    const dialog = screen.getByRole('dialog', { name: 'Ask Advisor' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Ontario')).toBeInTheDocument()

    /* Intro turn starts in the thinking state. */
    expect(screen.getByText('Thinking')).toBeInTheDocument()
    expect(screen.queryByText('Notice exposure risk')).not.toBeInTheDocument()

    /* Focus lands on the rail composer. */
    expect(screen.getByPlaceholderText('Ask a follow-up…')).toHaveFocus()

    /* Complete the stream: cards appear once the turn is done. */
    act(() => {
      vi.advanceTimersByTime(ADVISOR_THINK_MS + 60 * ADVISOR_STREAM_TICK_MS)
    })
    expect(screen.queryByText('Thinking')).not.toBeInTheDocument()
    expect(screen.getByText(INTRO.en)).toBeInTheDocument()
    expect(screen.getByText('Notice exposure risk')).toBeInTheDocument()
    expect(screen.getByText('No termination clause on file.')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderRail()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'ask' }))
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sends a follow-up: user bubble appears and the canned ack streams in', () => {
    renderRail()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'ask' }))
    })
    act(() => {
      vi.advanceTimersByTime(ADVISOR_THINK_MS + 60 * ADVISOR_STREAM_TICK_MS)
    })

    const textarea = screen.getByPlaceholderText('Ask a follow-up…')
    fireEvent.change(textarea, { target: { value: 'What about severance?' } })
    act(() => {
      fireEvent.keyDown(textarea, { key: 'Enter' })
    })
    expect(screen.getByText('What about severance?')).toBeInTheDocument()
    expect(textarea).toHaveValue('')

    act(() => {
      vi.advanceTimersByTime(ADVISOR_THINK_MS + 200 * ADVISOR_STREAM_TICK_MS)
    })
    expect(screen.getByText(/open this in Advisor Home/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Advisor Home' })).toBeInTheDocument()
  })
})
