import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { PersonMemoryView } from './PersonMemoryView'
import { CaseMemoryView } from './CaseMemoryView'
import { ChatRecallView } from './ChatRecallView'
import { MemoryManagerView } from './MemoryManagerView'
import { resetMemoryStore } from './memoryStore'

describe('Advisor Memory surfaces', () => {
  beforeEach(() => {
    resetMemoryStore()
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width:'),
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    )
  })

  describe('PersonMemoryView', () => {
    const renderPerson = () =>
      renderApp(<PersonMemoryView />, {
        route: '/app/settings/memory/people/e1',
        path: '/app/settings/memory/people/:personId',
      })

    it('links Open case to the case record and Review case memory to Memory', () => {
      renderPerson()

      expect(screen.getByRole('button', { name: /Open case/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Review case memory/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Ask Advisor about/ })).toBeInTheDocument()
    })

    it('renders the profile header, category groups, and governed rows', () => {
      renderPerson()

      expect(screen.getByText('Jordan Mensah')).toBeInTheDocument()
      expect(screen.getByText('Case open · high risk')).toBeInTheDocument()
      /* Category eyebrows in the prototype order. */
      expect(screen.getByText('Employment')).toBeInTheDocument()
      expect(screen.getByText('Compensation')).toBeInTheDocument()
      expect(screen.getByText('Current matter')).toBeInTheDocument()
      /* Provenance: source · learned/confirmed · visibility. */
      expect(
        screen.getByText('Employment agreement contains no termination clause'),
      ).toBeInTheDocument()
      expect(screen.getAllByText(/People record/).length).toBeGreaterThan(0)
      expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0)
      /* 2 inferred facts for Jordan are flagged for review. */
      expect(screen.getByText(/2 items are inferred and waiting/)).toBeInTheDocument()
    })

    it('Confirm promotes an inferred row (badge + review note update)', () => {
      renderPerson()

      const confirmButtons = screen.getAllByRole('button', { name: 'Confirm' })
      expect(confirmButtons).toHaveLength(2)
      fireEvent.click(confirmButtons[0]!)
      expect(screen.getAllByRole('button', { name: 'Confirm' })).toHaveLength(1)
      expect(screen.getByText(/1 item is inferred and waiting/)).toBeInTheDocument()
    })

    it('Correct edits the statement inline', () => {
      renderPerson()

      expect(screen.getByText('Booked vacation Jul 14–18')).toBeInTheDocument()
      fireEvent.click(screen.getAllByRole('button', { name: 'Correct' }).at(-1)!)
      const input = screen.getByLabelText('Correct this memory')
      fireEvent.change(input, { target: { value: 'Booked vacation Jul 21–25' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(screen.getByText('Booked vacation Jul 21–25')).toBeInTheDocument()
      expect(screen.queryByText('Booked vacation Jul 14–18')).not.toBeInTheDocument()
    })

    it('Forget removes the memory row', () => {
      renderPerson()

      expect(screen.getByText('Booked vacation Jul 14–18')).toBeInTheDocument()
      fireEvent.click(screen.getAllByRole('button', { name: 'Forget' }).at(-1)!)
      expect(screen.queryByText('Booked vacation Jul 14–18')).not.toBeInTheDocument()
    })
  })

  describe('CaseMemoryView', () => {
    it('renders the resume banner, case memory, timeline, and what-I-know rail', () => {
      renderApp(<CaseMemoryView />, {
        route: '/app/settings/memory/cases/case1',
        path: '/app/settings/memory/cases/:caseId',
      })

      expect(screen.getByText('Picking up where you left off')).toBeInTheDocument()
      expect(screen.getByText(/counsel hasn’t responded/)).toBeInTheDocument()
      expect(screen.getByText(/common-law exposure estimated at 9–12 months/)).toBeInTheDocument()
      expect(screen.getByText('What changed while you were away')).toBeInTheDocument()
      /* Timeline sessions + the dashed gap + the Now chip. */
      expect(screen.getByText('Case opened')).toBeInTheDocument()
      expect(screen.getByText('6 days — no activity')).toBeInTheDocument()
      expect(screen.getByText('Now')).toBeInTheDocument()
      /* Rail: sourced facts + the memory ≠ analysis note. */
      expect(screen.getByText('What I know')).toBeInTheDocument()
      expect(screen.getByText('Next steps')).toBeInTheDocument()
      expect(screen.getByText('Memory isn’t this turn’s analysis')).toBeInTheDocument()
    })
  })

  describe('ChatRecallView', () => {
    it('renders the resumed pill, sourced highlights, and the recall accordion', () => {
      renderApp(<ChatRecallView />, {
        route: '/app/settings/memory/conversations/c1',
        path: '/app/settings/memory/conversations/:threadId',
      })

      expect(screen.getByText(/Resumed from Jul 5/)).toBeInTheDocument()
      /* Inline memory highlight carries its provenance as the title. */
      const highlight = screen.getByText('9–12 months’ common-law reasonable notice')
      expect(highlight).toHaveAttribute('title', expect.stringContaining('Remembered'))
      /* Recall accordions list the sourced facts with Correct actions. */
      expect(screen.getAllByText('Memory used in this answer')).toHaveLength(2)
      expect(screen.getAllByRole('button', { name: 'Correct' }).length).toBeGreaterThan(0)
      expect(screen.getByText('Remembering from earlier in this conversation')).toBeInTheDocument()
      expect(screen.getByText('Recall is always sourced')).toBeInTheDocument()
    })
  })

  describe('MemoryManagerView', () => {
    const renderManager = () => renderApp(<MemoryManagerView />, { route: '/app/settings/memory' })

    it('shows the review banner and live tab counts', () => {
      renderManager()

      expect(screen.getByText(/4 inferred memories are waiting for review/)).toBeInTheDocument()
      const allTab = screen.getByRole('tab', { name: /All/ })
      expect(allTab).toHaveTextContent('18')
      expect(screen.getByRole('tab', { name: /Needs review/ })).toHaveTextContent('4')
    })

    it('filters to needs-review via the banner action', () => {
      renderManager()

      fireEvent.click(screen.getByRole('button', { name: 'Review now' }))
      /* Only the 3 inferred rows remain — all show a Confirm action. */
      expect(screen.getAllByRole('button', { name: 'Confirm' })).toHaveLength(4)
      expect(screen.queryByText('Reports to Morgan Chen')).not.toBeInTheDocument()
    })

    it('searches memory statements', () => {
      renderManager()

      fireEvent.change(screen.getByPlaceholderText('Search memory…'), {
        target: { value: 'vacation' },
      })
      expect(screen.getByText('Booked vacation Jul 14–18')).toBeInTheDocument()
      expect(screen.queryByText('Reports to Morgan Chen')).not.toBeInTheDocument()
    })

    it('records confirm actions in the audit log', () => {
      renderManager()

      fireEvent.click(screen.getByRole('tab', { name: /Needs review/ }))
      fireEvent.click(screen.getAllByRole('button', { name: 'Confirm' })[0]!)
      expect(screen.getByText(/Today — Riley confirmed/)).toBeInTheDocument()
    })
  })
})

describe('Advisor Memory in production mode', () => {
  it('MemoryManagerProductionView shows the org empty state when no facts exist', async () => {
    const { mockProductionWorkspace, listChain } = await import('@/test/productionWorkspace')
    mockProductionWorkspace({
      tables: {
        hr_advisor_memory_facts: () => ({ select: () => ({ eq: () => listChain([]) }) }),
        hr_advisor_memory_audit: () => ({ select: () => ({ eq: () => listChain([]) }) }),
        employees: () => ({ select: () => ({ eq: () => listChain([]) }) }),
        hr_cases: () => ({ select: () => ({ eq: () => listChain([]) }) }),
      },
    })
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { MemoryManagerView: MemoryManagerViewFresh } = await import('./MemoryManagerView')

    renderAppFresh(<MemoryManagerViewFresh />, { route: '/app/settings/memory' })

    expect(
      await screen.findByText(/Confirmed and inferred facts for people, cases, and conversations/i),
    ).toBeInTheDocument()

    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })
})
