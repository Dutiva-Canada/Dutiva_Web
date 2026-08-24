import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { bi } from '@/i18n/core'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { WorkspaceModeProvider } from '@/features/app/workspaceMode/WorkspaceModeProvider'
import { mockProductionWorkspace } from '@/test/productionWorkspace'
import { searchMessages as M } from '@/i18n/messages/search'
import { SearchProvider } from './SearchProvider'
import { useSearch } from './searchContext'
import { SearchOverlay } from './SearchOverlay'
import { filterSearchEntries, searchEntries } from './searchCorpus'
import type { SearchEntry } from './searchCorpus'

function OpenTrigger() {
  const { openSearch } = useSearch()
  return (
    <button type="button" onClick={openSearch}>
      open-search
    </button>
  )
}

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </>
  )
}

function renderHarness() {
  /* Auth + workspace-mode providers: SearchOverlay reads useWorkspaceMode()
     (production empties the corpus). Supabase is unconfigured in the suite,
     so this resolves to demo and the corpus behaves exactly as before. */
  return render(
    <LangProvider>
      <AuthProvider>
        <WorkspaceModeProvider>
          <SearchProvider>
            <MemoryRouter initialEntries={['/app/home']}>
              <OpenTrigger />
              <SearchOverlay />
              <LocationProbe />
            </MemoryRouter>
          </SearchProvider>
        </WorkspaceModeProvider>
      </AuthProvider>
    </LangProvider>,
  )
}

async function openOverlay(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'open-search' }))
}

describe('searchCorpus', () => {
  it('indexes every entity domain', () => {
    const kinds = new Set(searchEntries.map((e) => e.kind))
    expect(kinds).toEqual(
      new Set([
        'person',
        'case',
        'chat',
        'document',
        'comms',
        'task',
        'compliance',
        'policy',
        'knowledge',
        'workflow',
      ]),
    )
  })

  it('matches a query across entity kinds', () => {
    const ids = filterSearchEntries('all', 'jordan', 'en').map((e) => e.id)
    expect(ids).toContain('emp-e1') // Person
    expect(ids).toContain('case-case1') // Case
    expect(ids).toContain('c1') // Conversation
    expect(ids).toContain('task-tk1') // Task
    expect(ids).toContain('ci-ci1') // Compliance
  })

  it('restricts results to the active tab', () => {
    const caseEntries = filterSearchEntries('cases', '', 'en')
    expect(caseEntries.length).toBeGreaterThan(0)
    expect(caseEntries.every((e) => e.kind === 'case')).toBe(true)

    const docEntries = filterSearchEntries('documents', 'termination', 'en')
    expect(docEntries.map((e) => e.id)).toContain('doc-T03')
    expect(docEntries.every((e) => e.kind === 'document')).toBe(true)
  })

  it('matches against the current language strings', () => {
    const fr = filterSearchEntries('all', 'cessation d’emploi', 'fr').map((e) => e.id)
    expect(fr).toContain('case-case1')
    const en = filterSearchEntries('all', 'cessation d’emploi', 'en').map((e) => e.id)
    expect(en).not.toContain('case-case1')
  })
})

describe('SearchOverlay', () => {
  it('renders nothing until opened, then focuses the input and shows pinned chats', async () => {
    const user = userEvent.setup()
    renderHarness()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await openOverlay(user)
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus()
    /* 'Pinned' is both the section label and the row's kind label; the pinned
       chat title also appears in the (unfiltered) results list below. */
    expect(screen.getAllByText('Pinned').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Terminating Jordan Mensah — Ontario').length).toBeGreaterThan(0)
  })

  it('filters results across kinds as you type and hides the pinned section', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    await user.keyboard('Jordan')
    expect(screen.queryByText('Pinned')).not.toBeInTheDocument()
    expect(screen.getByText('Person')).toBeInTheDocument()
    expect(screen.getByText('Case')).toBeInTheDocument()
    expect(screen.getByText('Conversation')).toBeInTheDocument()
    expect(screen.getByText('Task')).toBeInTheDocument()
    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('Jordan Mensah')).toBeInTheDocument()
  })

  it('shows only the active tab’s kind and the restricted badge on sensitive cases', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    await user.click(screen.getByRole('button', { name: 'Cases' }))
    expect(screen.getAllByText('Case').length).toBeGreaterThan(0)
    expect(screen.queryByText('Person')).not.toBeInTheDocument()
    expect(screen.queryByText('Conversation')).not.toBeInTheDocument()
    /* case1 is a Termination — sensitiveCaseTypes → lock badge. */
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0)
  })

  it('opens the first result on Enter and closes the overlay', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    await user.keyboard('Priya')
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/employees/e2')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves the active row with ArrowDown before opening on Enter', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    /* "Jordan" results, in All-tab order: person e1, case case1, chat c1, … */
    await user.keyboard('Jordan')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/cases/case1')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('navigates chat results to the Advisor with the chatId in router state', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    await user.keyboard('policy refresh')
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/advisor')
    expect(screen.getByTestId('state')).toHaveTextContent('{"chatId":"c3"}')
  })

  it('closes on Escape without navigating and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/home')
    expect(screen.getByRole('button', { name: 'open-search' })).toHaveFocus()
  })

  it('shows the empty state for a query with no matches', async () => {
    const user = userEvent.setup()
    renderHarness()
    await openOverlay(user)

    await user.keyboard('xyzq')
    expect(screen.getByText('No results for “xyzq”')).toBeInTheDocument()
    expect(
      screen.getByText('Try a name, case, document, task, policy, or obligation.'),
    ).toBeInTheDocument()
  })
})

describe('SearchOverlay in production mode', () => {
  const PROD_ENTRIES: SearchEntry[] = [
    {
      id: 'emp-e1',
      kind: 'person',
      kindLabel: M.search_kind_person,
      title: bi('Alex Chen', 'Alex Chen'),
      sub: bi('HR Manager · ON', 'Gestionnaire RH · ON'),
      restricted: false,
      match: bi('Alex Chen HR Manager', 'Alex Chen Gestionnaire RH'),
      nav: { kind: 'employee', employeeId: 'e1' },
    },
  ]

  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.doUnmock('./searchProductionCorpus')
    vi.resetModules()
  })

  async function renderProductionHarness() {
    vi.doMock('./searchProductionCorpus', async (importOriginal) => {
      const actual = await importOriginal<typeof import('./searchProductionCorpus')>()
      return {
        ...actual,
        buildProductionSearchEntries: vi.fn(async () => PROD_ENTRIES),
      }
    })
    mockProductionWorkspace({ tables: {} })
    vi.resetModules()

    const { LangProvider: Lang } = await import('@/i18n/LangProvider')
    const { AuthProvider: Auth } = await import('@/features/app/auth/AuthProvider')
    const { WorkspaceModeProvider: Wsm } = await import(
      '@/features/app/workspaceMode/WorkspaceModeProvider'
    )
    const { SearchProvider: Search } = await import('./SearchProvider')
    const { useSearch } = await import('./searchContext')
    const { SearchOverlay: Overlay } = await import('./SearchOverlay')

    function ProductionOpenTrigger() {
      const { openSearch } = useSearch()
      return (
        <button type="button" onClick={openSearch}>
          open-search
        </button>
      )
    }

    return render(
      <Lang>
        <Auth>
          <Wsm>
            <Search>
              <MemoryRouter initialEntries={['/app/home']}>
                <ProductionOpenTrigger />
                <Overlay />
              </MemoryRouter>
            </Search>
          </Wsm>
        </Auth>
      </Lang>,
    )
  }

  it('searches the production corpus instead of Northgate fixtures', async () => {
    const user = userEvent.setup()
    await renderProductionHarness()
    await user.click(screen.getByRole('button', { name: 'open-search' }))

    expect(await screen.findByText('Alex Chen')).toBeInTheDocument()
    expect(screen.queryByText('Jordan Mensah')).not.toBeInTheDocument()
    expect(screen.queryByText('Terminating Jordan Mensah — Ontario')).not.toBeInTheDocument()
  })
})
