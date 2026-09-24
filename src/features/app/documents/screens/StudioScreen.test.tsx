import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { allTemplates } from '../catalogue'
import { DoclibProvider } from '../DoclibProvider'
import { DocumentsLayout } from '../DocumentsLayout'
import { StudioScreen } from './StudioScreen'

const CATALOGUE_SIZE = allTemplates.length

function stubDesktopLayout() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(min-width: 1024px)' || query === '(min-width: 768px)',
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  )
}

const renderStudio = () =>
  renderApp(
    <DoclibProvider>
      <StudioScreen />
      <AdvisorRail />
    </DoclibProvider>,
    { route: '/app/documents/studio', path: '/app/documents/studio' },
  )

describe('StudioScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    stubDesktopLayout()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the recommendation-first catalogue with a derived result count', async () => {
    renderStudio()

    expect(
      await screen.findByRole('heading', {
        name: 'Recommended for your organization',
      }),
    ).toBeInTheDocument()

    const listbox = screen.getByRole('listbox', { name: 'Templates' })
    expect(within(listbox).getByText('Offer of employment letter')).toBeInTheDocument()
    expect(within(listbox).getByText('Confidentiality agreement')).toBeInTheDocument()
    expect(within(listbox).getAllByRole('option')).toHaveLength(CATALOGUE_SIZE)
    expect(screen.getByText(`${CATALOGUE_SIZE} templates found`)).toBeInTheDocument()
  })

  it('exposes labelled filters and narrows results by search', async () => {
    renderStudio()
    await screen.findByRole('listbox', { name: 'Templates' })

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByRole('radiogroup', { name: 'Category' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Jurisdiction' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Review level' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Show results/ }))

    fireEvent.change(screen.getByLabelText('Search templates…'), {
      target: { value: 'offer' },
    })

    const matches = allTemplates.filter((tpl) =>
      `${tpl.tid} ${tpl.name.en} ${tpl.name.fr} ${tpl.desc.en} ${tpl.desc.fr}`
        .toLowerCase()
        .includes('offer'),
    ).length
    expect(matches).toBeLessThan(CATALOGUE_SIZE)
    const listbox = screen.getByRole('listbox', { name: 'Templates' })
    expect(within(listbox).getAllByRole('option')).toHaveLength(matches)
    expect(screen.getByText(`${matches} templates found`)).toBeInTheDocument()
    expect(screen.queryByText('Confidentiality agreement')).not.toBeInTheDocument()
  })

  it('maps review level and opens Advisor with safe template context', async () => {
    renderStudio()
    await within(await screen.findByRole('listbox', { name: 'Templates' })).findByText('Offer of employment letter')

    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: /Offer of employment letter/i,
      }),
    )

    const detail = await screen.findByRole('article', { name: /Offer of employment letter/i })
    expect(detail).toHaveTextContent('Standard review')
    expect(detail).not.toHaveTextContent('Low risk')

    fireEvent.click(screen.getByRole('button', { name: 'Ask Advisor about this template' }))
    expect(await screen.findByRole('dialog', { name: 'Ask Advisor' })).toBeInTheDocument()
  })

  it('updates the detail panel when a template is selected', async () => {
    renderStudio()
    await within(await screen.findByRole('listbox', { name: 'Templates' })).findByText('Offer of employment letter')

    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: /Confidentiality agreement/i,
      }),
    )

    const detail = await screen.findByRole('article', { name: /Confidentiality agreement/i })
    expect(
      within(detail).getByRole('heading', { name: 'Confidentiality agreement' }),
    ).toBeInTheDocument()
    expect(within(detail).getByRole('link', { name: 'Create document' })).toHaveAttribute(
      'href',
      '/app/documents/generate/tpl_t05',
    )
    expect(within(detail).getByRole('link', { name: 'Preview full template' })).toHaveAttribute(
      'href',
      '/app/documents/templates/T05',
    )
  })

  it('reselects deterministically when filters remove the current template', async () => {
    renderStudio()
    await within(await screen.findByRole('listbox', { name: 'Templates' })).findByText('Offer of employment letter')

    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: /Confidentiality agreement/i,
      }),
    )
    await screen.findByRole('article', { name: /Confidentiality agreement/i })

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Hiring & onboarding' }))

    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => {
      expect(
        screen.queryByRole('article', { name: /Confidentiality agreement/i }),
      ).not.toBeInTheDocument()
    })
  })

  it('shows Required in the detail panel only when the size trigger fires', async () => {
    renderStudio()
    await within(await screen.findByRole('listbox', { name: 'Templates' })).findByText('Group termination notice')

    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: /Group termination notice/i,
      }),
    )
    await waitFor(() => {
      expect(screen.getByRole('article')).toHaveTextContent(/Group termination notice/i)
    })
    expect(screen.getByRole('article')).toHaveTextContent('Available for your jurisdiction')
    expect(screen.getByRole('article')).not.toHaveTextContent('Required based on your profile')

    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Headcount' }), {
      target: { value: '60' },
    })

    await waitFor(() => {
      expect(screen.getByRole('article')).toHaveTextContent('Required based on your profile')
    })
  })
})

describe('DocumentsLayout tabs', () => {
  it('shows Templates and My documents with correct selected state', async () => {
    renderApp(
      <Routes>
        <Route path="/app/documents" element={<DocumentsLayout />}>
          <Route index element={<div>My documents body</div>} />
          <Route path="studio" element={<StudioScreen />} />
        </Route>
      </Routes>,
      { route: '/app/documents/studio', path: '*' },
    )

    const templatesTab = await screen.findByRole('link', { name: 'Templates' })
    const myDocsTab = screen.getByRole('link', { name: 'My documents' })
    expect(templatesTab).toHaveAttribute('aria-current', 'page')
    expect(myDocsTab).not.toHaveAttribute('aria-current')
    expect(screen.queryByRole('link', { name: 'Studio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Library' })).not.toBeInTheDocument()
  })
})
