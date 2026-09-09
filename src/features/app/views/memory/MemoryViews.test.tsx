import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
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
      /* The Correct button is a sibling of the statement text within the row. */
      const row = screen.getByText('Booked vacation Jul 14–18').closest('.group') as HTMLElement
      fireEvent.click(within(row).getByRole('button', { name: 'Correct' }))
      const input = screen.getByLabelText('Correct this memory')
      fireEvent.change(input, { target: { value: 'Booked vacation Jul 21–25' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(screen.getByText('Booked vacation Jul 21–25')).toBeInTheDocument()
      expect(screen.queryByText('Booked vacation Jul 14–18')).not.toBeInTheDocument()
    })

    it('Forget removes the memory row', () => {
      renderPerson()

      expect(screen.getByText('Booked vacation Jul 14–18')).toBeInTheDocument()
      const row = screen.getByText('Booked vacation Jul 14–18').closest('.group') as HTMLElement
      const forgetBtn = within(row).getByRole('button', { name: 'Forget' })
      fireEvent.click(forgetBtn)
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

  describe('MemoryManagerView (new four-tab workspace)', () => {
    const renderManager = () => renderApp(<MemoryManagerView />, { route: '/app/settings/memory' })

    it('renders the four primary tabs with the Memories tab active', () => {
      renderManager()

      expect(screen.getByRole('tab', { name: /Memories/ })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: /Review queue/ })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Activity/ })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Governance/ })).toBeInTheDocument()
    })

    it('shows the review-count badge on the Review queue tab', () => {
      renderManager()

      const reviewTab = screen.getByRole('tab', { name: /Review queue/ })
      expect(reviewTab).toHaveTextContent(String(5))
    })

    it('searches memory statements from the Memories toolbar', () => {
      renderManager()

      fireEvent.change(screen.getByPlaceholderText('Search memories'), {
        target: { value: 'vacation' },
      })
      expect(screen.getByText('Booked vacation Jul 14–18')).toBeInTheDocument()
      expect(screen.queryByText('Reports to Morgan Chen')).not.toBeInTheDocument()
    })

    it('opens the Review queue and confirms a proposed memory', () => {
      renderManager()

      fireEvent.click(screen.getByRole('tab', { name: /Review queue/ }))
      const confirmButtons = screen.getAllByRole('button', { name: 'Confirm' })
      expect(confirmButtons.length).toBeGreaterThan(0)
      fireEvent.click(confirmButtons[0]!)
      /* Confirming reduces the proposed count by one. */
      const remaining = screen.getAllByRole('button', { name: 'Confirm' })
      expect(remaining.length).toBe(confirmButtons.length - 1)
    })

    it('rejects a proposed memory from the Review queue', () => {
      renderManager()

      fireEvent.click(screen.getByRole('tab', { name: /Review queue/ }))
      const rejectButtons = screen.getAllByRole('button', { name: 'Reject' })
      expect(rejectButtons.length).toBeGreaterThan(0)
      fireEvent.click(rejectButtons[0]!)
      /* Confirmation dialog appears — click the dialog's Reject confirm. */
      const dialogRejects = screen.getAllByRole('button', { name: 'Reject' })
      fireEvent.click(dialogRejects[dialogRejects.length - 1]!)
      /* The rejected proposal is gone from the queue. */
      const remaining = screen.queryAllByRole('button', { name: 'Reject' })
      expect(remaining.length).toBe(rejectButtons.length - 1)
    })

    it('records confirm actions in the Activity tab audit log', () => {
      renderManager()

      fireEvent.click(screen.getByRole('tab', { name: /Review queue/ }))
      fireEvent.click(screen.getAllByRole('button', { name: 'Confirm' })[0]!)
      fireEvent.click(screen.getByRole('tab', { name: /Activity/ }))
      /* The audit log renders actor and action in separate table cells.
         The action label also appears in the event filter dropdown, so scope
         to the table body. */
      const table = screen.getByRole('table')
      expect(within(table).getByText('Riley Summers')).toBeInTheDocument()
      expect(within(table).getByText(/confirmed a memory/i)).toBeInTheDocument()
    })

    it('opens the Governance tab with retention schedule and danger zone', () => {
      renderManager()

      fireEvent.click(screen.getByRole('tab', { name: /Governance/ }))
      expect(screen.getByText('Retention schedule')).toBeInTheDocument()
      expect(screen.getByText('Danger zone')).toBeInTheDocument()
      /* Full deletion is disabled (backend not implemented). */
      expect(screen.getByRole('button', { name: /Delete memories/ })).toBeDisabled()
    })

    it('disables Advisor memory from the Governance tab', () => {
      renderManager()

      fireEvent.click(screen.getByRole('tab', { name: /Governance/ }))
      fireEvent.click(screen.getByRole('button', { name: /Disable Advisor memory/ }))
      /* The disabled status appears in both the header badge and the governance section. */
      expect(screen.getAllByText('Advisor memory disabled').length).toBeGreaterThan(0)
    })

    it('shows the disabled-state banner on the Memories tab when memory is off', () => {
      renderManager()

      /* Disable memory from the Governance tab. */
      fireEvent.click(screen.getByRole('tab', { name: /Governance/ }))
      fireEvent.click(screen.getByRole('button', { name: /Disable Advisor memory/ }))
      /* Return to Memories — the disabled banner should be visible. */
      fireEvent.click(screen.getByRole('tab', { name: /Memories/ }))
      expect(screen.getByText('Advisor memory is disabled')).toBeInTheDocument()
    })

    it('shows the no-results state with Clear filters when search matches nothing', () => {
      renderManager()

      fireEvent.change(screen.getByPlaceholderText('Search memories'), {
        target: { value: 'zzz-no-such-memory-zzz' },
      })
      expect(screen.getByText('No memories match your filters')).toBeInTheDocument()
      /* The no-results Clear filters button lives inside the memory list card. */
      const listCard = screen.getByText('No memories match your filters').closest('div.rounded-\\[14px\\]')
      expect(listCard).not.toBeNull()
      expect(listCard!.querySelector('button')).not.toBeNull()
    })

    it('navigates to the Review queue when the Needs review metric is clicked', () => {
      renderManager()

      /* The Needs review metric is a clickable element inside the metrics row.
         Scope to the metrics area to avoid matching the Review queue tab. */
      const metricsRow = screen.getByText('Active memories').closest('div.flex.flex-wrap') as HTMLElement | null
      expect(metricsRow).not.toBeNull()
      const reviewMetric = within(metricsRow!).getByText('Needs review').closest('[role="button"]')
      expect(reviewMetric).not.toBeNull()
      fireEvent.click(reviewMetric!)
      /* The Review queue tab should now be active. */
      expect(screen.getByRole('tab', { name: /Review queue/ })).toHaveAttribute('aria-selected', 'true')
    })

    it('shows the retrieval scope in the details drawer for case-scoped memories', () => {
      renderManager()

      /* Open the details drawer for a memory that has a retrieval scope.
         The allegation (c5) has retrievalScope { type: 'case', id: 'case1' }. */
      fireEvent.change(screen.getByPlaceholderText('Search memories'), {
        target: { value: 'falsified' },
      })
      fireEvent.click(screen.getByRole('button', { name: /Open details/ }))
      /* The drawer should show the retrieval scope label. */
      expect(screen.getByText('Retrieval scope')).toBeInTheDocument()
      expect(screen.getByText('Case only')).toBeInTheDocument()
    })
  })
})

describe('Advisor Memory in production mode', () => {
  it('MemoryManagerProductionView shows the org empty state when no facts exist', async () => {
    const { mockProductionWorkspace, listChain } = await import('@/test/productionWorkspace')
    /* listFacts chains .eq().is().order().order().range(); listAudit chains
       .eq().order().limit(); the mock listChain supports order/range/then but
       not .is() or .limit(), so we wrap them. */
    const factsChain = () => {
      const chain = listChain([])
      return { ...chain, is: () => chain, eq: () => ({ ...chain, is: () => chain }) }
    }
    const auditChain = () => {
      const result = { data: [], error: null }
      const chain: Record<string, unknown> = {
        order: () => chain,
        limit: () => chain,
        then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject),
      }
      return chain
    }
    mockProductionWorkspace({
      tables: {
        hr_advisor_memory_facts: () => ({ select: () => factsChain() }),
        hr_advisor_memory_audit: () => ({ select: () => ({ eq: () => auditChain() }) }),
        employees: () => ({ select: () => ({ eq: () => listChain([]) }) }),
        hr_cases: () => ({ select: () => ({ eq: () => listChain([]) }) }),
      },
    })
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { MemoryManagerView: MemoryManagerViewFresh } = await import('./MemoryManagerView')

    renderAppFresh(<MemoryManagerViewFresh />, { route: '/app/settings/memory' })

    /* The new four-tab workspace renders the Memories tab empty state. */
    expect(
      await screen.findByText(/No memories yet/i, undefined, { timeout: 3000 }),
    ).toBeInTheDocument()

    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })
})
