import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useI18n } from '@/i18n/context'
import { renderApp } from '@/test/renderApp'
import { Sidebar } from './Sidebar'

const SECTION_PREFS_KEY = 'dutiva.sidebar.sections.v1'

function FrenchToggle() {
  const { setLang } = useI18n()
  return (
    <button type="button" onClick={() => setLang('fr')}>
      FR
    </button>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the new hierarchy and labels in English', () => {
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })

    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/app/home')
    expect(within(nav).getByRole('link', { name: 'AI Advisor' })).toHaveAttribute(
      'href',
      '/app/advisor',
    )
    expect(within(nav).getByRole('link', { name: /Workflows/ })).toHaveAttribute(
      'href',
      '/app/workflows',
    )

    expect(within(nav).getByRole('button', { name: /Records/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'People' })).toHaveAttribute(
      'href',
      '/app/employees',
    )
    expect(within(nav).getByRole('link', { name: /Cases/ })).toHaveAttribute('href', '/app/cases')
    expect(within(nav).getByRole('link', { name: 'Documents' })).toHaveAttribute(
      'href',
      '/app/documents/hr-library',
    )
    expect(within(nav).getByRole('link', { name: 'Knowledge' })).toHaveAttribute(
      'href',
      '/app/knowledge',
    )

    expect(within(nav).getByRole('button', { name: /Programs/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Compliance/ })).toHaveAttribute(
      'href',
      '/app/compliance',
    )
    expect(within(nav).getByRole('link', { name: 'Workforce Planning' })).toHaveAttribute(
      'href',
      '/app/planning/tasks',
    )

    /* Analytics is a top-level item — no 'Insights' section wraps (and
       hides) it anymore. */
    expect(within(nav).queryByRole('button', { name: /Insights/i })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Analytics' })).toHaveAttribute(
      'href',
      '/app/analytics',
    )

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/app/settings')
  })

  it('renders French labels when the language is FR', async () => {
    const user = userEvent.setup()
    renderApp(
      <>
        <FrenchToggle />
        <Sidebar mode="expanded" />
      </>,
      { route: '/app/home' },
    )

    await user.click(screen.getByRole('button', { name: 'FR' }))

    const nav = await screen.findByRole('navigation', { name: 'Navigation principale' })
    expect(within(nav).getByRole('link', { name: 'Accueil' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Conseiller IA' })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /Registres/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /Programmes/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Analytique' })).toBeInTheDocument()
  })

  it('marks the active route with aria-current="page"', () => {
    renderApp(<Sidebar mode="expanded" />, { route: '/app/cases' })

    const casesLink = screen.getByRole('link', { name: /Cases/ })
    expect(casesLink).toHaveAttribute('aria-current', 'page')

    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink).not.toHaveAttribute('aria-current')
  })

  it('expands and collapses Records and Programs sections', async () => {
    const user = userEvent.setup()
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    const recordsToggle = screen.getByRole('button', { name: /Records/i })
    const programsToggle = screen.getByRole('button', { name: /Programs/i })
    expect(recordsToggle).toHaveAttribute('aria-expanded', 'true')
    expect(programsToggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(recordsToggle)
    expect(recordsToggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(recordsToggle)
    expect(recordsToggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps Analytics reachable regardless of section collapse state', async () => {
    /* The old 'Insights' section shipped default-collapsed with Analytics as
       its only child — the destination was hidden until discovered. Promoted
       to top level, it must stay visible even with every section collapsed. */
    const user = userEvent.setup()
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    await user.click(screen.getByRole('button', { name: /Records/i }))
    await user.click(screen.getByRole('button', { name: /Programs/i }))

    expect(screen.getByRole('link', { name: 'Analytics' })).toBeVisible()
    expect(localStorage.getItem(SECTION_PREFS_KEY)).toContain('"records":false')
  })

  it('auto-expands the Records group when a nested route is active', () => {
    renderApp(<Sidebar mode="expanded" />, { route: '/app/cases/case1' })

    const recordsToggle = screen.getByRole('button', { name: /Records/i })
    expect(recordsToggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders the Create menu with functional and disabled items', async () => {
    const user = userEvent.setup()
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    const createButton = screen.getByRole('button', { name: /Create/i })
    expect(createButton).toHaveAttribute('aria-haspopup', 'menu')

    await user.click(createButton)
    const menu = screen.getByRole('menu', { name: /Create/i })

    expect(within(menu).getByRole('menuitem', { name: /Conversation/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(within(menu).getByRole('menuitem', { name: /Document/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(within(menu).getByRole('menuitem', { name: /Case/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )

    const workflowItem = within(menu).getByRole('menuitem', { name: /Workflow/i })
    expect(workflowItem).toHaveAttribute('aria-disabled', 'true')
  })

  it('supports keyboard operation inside the Create menu', async () => {
    const user = userEvent.setup()
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    const createButton = screen.getByRole('button', { name: /Create/i })
    createButton.focus()
    await user.keyboard('{Enter}')

    const menu = screen.getByRole('menu', { name: /Create/i })
    const firstItem = within(menu).getAllByRole('menuitem')[0]
    expect(document.activeElement).toBe(firstItem)

    await user.keyboard('{ArrowDown}')
    const secondItem = within(menu).getAllByRole('menuitem')[1]
    expect(document.activeElement).toBe(secondItem)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: /Create/i })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(createButton)
  })

  it('renders semantic badge variants and accessible descriptions', () => {
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    const workflowsLink = screen.getByRole('link', { name: /Workflows/ })
    const badge = within(workflowsLink).getByText('3')
    expect(badge).toHaveAttribute('aria-label', '3 active workflows')
  })

  it('switches between expanded and compact modes', () => {
    const { unmount } = renderApp(<Sidebar mode="expanded" onToggleExpanded={() => {}} />, {
      route: '/app/home',
    })

    expect(screen.getByRole('button', { name: /Create/i })).toHaveTextContent('Create')

    unmount()
    renderApp(<Sidebar mode="compact" onToggleExpanded={() => {}} />, { route: '/app/home' })

    expect(screen.getByRole('button', { name: /Create/i })).not.toHaveTextContent('Create')
  })

  it('shows all section nav items in compact mode', () => {
    renderApp(<Sidebar mode="compact" onToggleExpanded={() => {}} />, { route: '/app/home' })

    const people = screen.getByRole('link', { name: 'People' })
    const cases = screen.getByRole('link', { name: /Cases/ })
    const compliance = screen.getByRole('link', { name: 'Compliance' })

    expect(people).toBeInTheDocument()
    expect(cases).toBeInTheDocument()
    expect(compliance).toBeInTheDocument()

    const panel = people.closest('div.block, div[class*="grid-rows"]')
    expect(panel).toBeInTheDocument()
    expect(panel?.className).not.toContain('opacity-0')
  })

  it('drawer mode shows a close button and calls onClose on route click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderApp(<Sidebar mode="drawer" onCloseDrawer={onClose} />, { route: '/app/home' })

    const closeButton = screen.getByRole('button', { name: /Close menu/i })
    expect(closeButton).toBeInTheDocument()

    await user.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps Settings and profile controls outside the scrollable nav region', () => {
    renderApp(<Sidebar mode="expanded" />, { route: '/app/home' })

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    const settingsLink = screen.getByRole('link', { name: 'Settings' })
    expect(nav).not.toContainElement(settingsLink)
  })
})
