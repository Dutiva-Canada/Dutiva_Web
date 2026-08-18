import { describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { allTemplates } from '../catalogue'
import { DoclibProvider } from '../DoclibProvider'
import { StudioScreen } from './StudioScreen'

/* Derived, not hardcoded: the assertion worth making is "every template in
   the catalogue reaches the grid", and a literal count turns each catalogue
   addition into an unrelated test edit. */
const CATALOGUE_SIZE = allTemplates.length

const renderStudio = () =>
  renderApp(
    <DoclibProvider>
      <StudioScreen />
    </DoclibProvider>,
    { route: '/app/documents/studio', path: '/app/documents/studio' },
  )

describe('StudioScreen', () => {
  it('renders the whole catalogue grouped by category', async () => {
    renderStudio()

    /* Data loads async from fixtures — wait for the first card. */
    expect(await screen.findByText('Offer of employment letter (Ontario)')).toBeInTheDocument()
    /* Spot-check across categories: hiring / agreements / termination. */
    expect(screen.getByText('Confidentiality agreement')).toBeInTheDocument()
    expect(screen.getByText('Group termination notice')).toBeInTheDocument()
    /* customTemplates.ts additions (T17-T20) — ported from the legacy
       docstudio-only fixture, see that file's header comment. */
    expect(screen.getByText('Full & final release')).toBeInTheDocument()
    expect(screen.getByText('Accommodation documentation')).toBeInTheDocument()
    /* Authored in-repo (T21-T24) — Ring 2 Pillar B, see
       docs/FOUR_RING_FRAMEWORK.md. */
    expect(screen.getByText('Accommodation request form')).toBeInTheDocument()
    expect(screen.getByText('Undue hardship assessment')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(CATALOGUE_SIZE)
    expect(screen.getByText(`${CATALOGUE_SIZE} templates`)).toBeInTheDocument()
    /* Category group headings in handoff order, then the authored one. */
    expect(screen.getByRole('heading', { name: 'Hiring & onboarding' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Termination & offboarding' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accommodation' })).toBeInTheDocument()
  })

  it('search narrows the grid to offer templates and updates the count', async () => {
    renderStudio()
    await screen.findByText('Offer of employment letter (Ontario)')

    fireEvent.change(screen.getByPlaceholderText(`Search ${CATALOGUE_SIZE} templates…`), {
      target: { value: 'offer' },
    })

    expect(screen.getByText('Offer of employment letter (Ontario)')).toBeInTheDocument()
    expect(screen.getByText('Québec offer letter')).toBeInTheDocument()
    expect(screen.queryByText('Confidentiality agreement')).not.toBeInTheDocument()

    /* Derived from the same haystack StudioScreen searches, rather than a
       literal: "offer" once matched exactly the two offer letters, then a
       later template happened to use the word in its description and the
       count moved. What is being tested is that search narrows and the count
       follows it — not how many templates contain a particular word. */
    const matches = allTemplates.filter((tpl) =>
      `${tpl.tid} ${tpl.name.en} ${tpl.name.fr} ${tpl.desc.en} ${tpl.desc.fr}`
        .toLowerCase()
        .includes('offer'),
    ).length
    expect(matches).toBeLessThan(CATALOGUE_SIZE)
    expect(screen.getAllByRole('article')).toHaveLength(matches)
    expect(screen.getByText(`${matches} templates`)).toBeInTheDocument()
  })

  it('union toggle flips T03 to "Collective agreement governs"', async () => {
    renderStudio()
    await screen.findByText('Termination letter (without cause)')

    const card = () =>
      within(screen.getByRole('article', { name: 'Termination letter (without cause)' }))
    expect(card().getByText('Applies to you')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Unionized' }))

    expect(card().getByText('Collective agreement governs')).toBeInTheDocument()
  })

  it('raising headcount to 60 makes T15 "Required for you"', async () => {
    renderStudio()
    await screen.findByText('Group termination notice')

    const card = () => within(screen.getByRole('article', { name: 'Group termination notice' }))
    /* Default org is 42 employees — below the 50+ group-termination trigger. */
    expect(card().getByText('Applies above your size')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Headcount' }), {
      target: { value: '60' },
    })

    expect(card().getByText('Required for you')).toBeInTheDocument()
  })
})
