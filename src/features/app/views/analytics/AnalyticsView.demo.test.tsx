import { afterEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { AnalyticsView } from './AnalyticsView'

describe('AnalyticsView (demo)', () => {
  afterEach(() => {
    localStorage.removeItem('dutiva-lang')
  })

  function scoreCard() {
    return within(screen.getByRole('region', { name: 'Compliance score' }))
  }

  it('renders the compliance score hero with its delta and windowed trend data', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })

    expect(screen.getByText('Workforce and compliance overview.')).toBeInTheDocument()

    const card = scoreCard()
    /* Hero 82/100, up 8 from February (74 → 82 across the six fixtures).
       Selector-scoped: the chart's table twin also carries an 82 cell. */
    expect(card.getByText('82', { selector: 'span' })).toBeInTheDocument()
    expect(card.getByText('/100')).toBeInTheDocument()
    expect(card.getByText('+8 vs February')).toBeInTheDocument()

    /* The chart's table twin carries every month/value pair. */
    const table = card.getByRole('table')
    expect(within(table).getByText('February')).toBeInTheDocument()
    expect(within(table).getByText('74')).toBeInTheDocument()
    expect(within(table).getByText('July')).toBeInTheDocument()

    /* Windowed axis is summarized to AT via the chart's aria-label. */
    expect(card.getByRole('img', { name: /Compliance score by month/ })).toBeInTheDocument()
  })

  it('breaks the score down by category and flags the lowest', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = scoreCard()

    expect(card.getByText('Score breakdown')).toBeInTheDocument()
    expect(card.getByText('Termination & notice')).toBeInTheDocument()
    expect(card.getByText('61')).toBeInTheDocument()
    expect(card.getByText('Language & jurisdiction')).toBeInTheDocument()
    /* Exactly one category (the 61) wears the flag. */
    expect(card.getAllByText('Lowest')).toHaveLength(1)
  })

  it('lists needs-attention items sorted overdue → soonest, with cert/document escalations', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Needs attention' }))

    const rows = card.getAllByRole('listitem')
    expect(rows).toHaveLength(5)

    /* Most overdue first: Devon's lapsed forklift ticket (Jun 28) leads,
       escalated from the certifications card and linking to his profile. */
    expect(
      within(rows[0]!).getByText(/Forklift operator certificate — Devon Clarke/),
    ).toBeInTheDocument()
    expect(within(rows[0]!).getByText('Overdue')).toBeInTheDocument()
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('href', '/app/employees/e5')

    /* Then the CASL consent audit (was due Jun 30). */
    expect(within(rows[1]!).getByText(/Marketing consent records/)).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Overdue')).toBeInTheDocument()

    /* Soonest due: the Remote Work Policy review (Jul 17 — 6 days out). */
    expect(within(rows[2]!).getByText(/Remote Work Policy/)).toBeInTheDocument()
    expect(within(rows[2]!).getByText('Due in 6 days')).toBeInTheDocument()

    /* Affected count + jurisdiction as the secondary line (AODA hires). */
    expect(card.getByText('3 employees · Ontario')).toBeInTheDocument()

    /* Chen's work permit (Jul 28, inside 30 days) is always escalated —
       an expiring work permit is a compliance event. */
    expect(within(rows[4]!).getByText(/Work permit — Chen Wei/)).toBeInTheDocument()
    expect(within(rows[4]!).getByRole('link')).toHaveAttribute('href', '/app/employees/e8')

    /* Eight qualifying items; the cap cuts the rest (francization review
       among them). */
    expect(card.getByRole('link', { name: 'View all (8)' })).toHaveAttribute(
      'href',
      '/app/compliance',
    )
    expect(card.queryByText(/French-language workplace/)).not.toBeInTheDocument()
  })

  it('flags jurisdictions sitting 10+ points under the blended score', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = scoreCard()

    expect(card.getByText('Score by jurisdiction')).toBeInTheDocument()
    /* QC is 71 vs the blended 82 — flagged; Federal at 75 (−7) is not. */
    expect(card.getByText('71')).toBeInTheDocument()
    expect(card.getByText('−11 below overall')).toBeInTheDocument()
    expect(card.queryByText('−7 below overall')).not.toBeInTheDocument()
  })

  it('buckets certifications 1/2/3/1 and reveals the list in one tap', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Certifications & training' }))

    /* Tile row: Expired 1 · ≤30 2 · 31–60 3 · 61–90 1. */
    expect(card.getByText('Expired')).toBeInTheDocument()
    expect(card.getByText('≤ 30 days')).toBeInTheDocument()

    await user.click(card.getByRole('button', { name: 'Show list (7)' }))
    const rows = card.getAllByRole('listitem')
    expect(rows).toHaveLength(7)
    /* Soonest first: the expired forklift ticket leads with its chip. */
    expect(within(rows[0]!).getByText('Forklift operator certificate')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('Devon Clarke · Ontario')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('First Aid / CPR-C')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Noah Bergeron · Manitoba')).toBeInTheDocument()
  })

  it('lists service milestones within 30 days and flags the missing review task', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Service milestones due' }))

    const rows = card.getAllByRole('listitem')
    expect(rows).toHaveLength(2)

    /* Soonest first: Jasleen (Jul 21 — 10 days out), no review task yet. */
    expect(within(rows[0]!).getByText('Jasleen Kaur')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('10 days left')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('No review task yet')).toBeInTheDocument()

    /* Owen next (Jul 29 — 18 days out), review task in place. */
    expect(within(rows[1]!).getByText('Owen Tremblay')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('18 days left')).toBeInTheDocument()
    expect(card.getAllByText('No review task yet')).toHaveLength(1)
  })

  it('shows the leave overview grouped by imminent returns, protected leave marked', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Leave overview' }))

    expect(card.getByText('Returning within 14 days')).toBeInTheDocument()
    expect(card.getByText('Rosa Almeida')).toBeInTheDocument()

    expect(card.getByText('On leave now')).toBeInTheDocument()
    expect(card.getByText('Ingrid Halvorsen')).toBeInTheDocument()

    /* Parental and medical leave are statutorily protected. */
    expect(card.getAllByText('Protected')).toHaveLength(2)
  })

  it('renders the headcount trend with the improving turnover tile', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Headcount & turnover' }))

    expect(card.getByText('9.8%')).toBeInTheDocument()
    expect(card.getByText('Turnover (rolling 12 months)')).toBeInTheDocument()
    /* Falling turnover is good — the delta reads −1.4 pts vs June. */
    expect(card.getByText('−1.4 pts vs June')).toBeInTheDocument()

    const table = card.getByRole('table')
    expect(within(table).getByText('February')).toBeInTheDocument()
    expect(within(table).getByText('76')).toBeInTheDocument()
  })

  it('renders headcount by jurisdiction with the total and the Federal footnote', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Headcount by jurisdiction' }))

    expect(card.getByText('82 employees total')).toBeInTheDocument()
    expect(
      card.getByText('Federal = federally regulated roles under the Canada Labour Code.'),
    ).toBeInTheDocument()

    /* Table twin: every jurisdiction with its exact value. */
    const table = card.getByRole('table')
    for (const [jur, value] of [
      ['ON', '34'],
      ['BC', '21'],
      ['QC', '12'],
      ['AB', '9'],
      ['Federal', '6'],
    ]) {
      const rowCell = within(table).getByText(jur!)
      expect(within(rowCell.closest('tr')!).getByText(value!)).toBeInTheDocument()
    }
  })

  it('shows open-case aging tiles and rows that tap through to the case', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Open cases' }))

    /* Three open (case4 resolved); ages 9/21/151 days on July 11 → avg 60. */
    expect(card.getByText('Open now')).toBeInTheDocument()
    expect(card.getByText('3')).toBeInTheDocument()
    expect(card.getByText('Avg. age (days)')).toBeInTheDocument()
    expect(card.getByText('60')).toBeInTheDocument()
    expect(card.getByText('Oldest (days)')).toBeInTheDocument()
    expect(card.getByText('151')).toBeInTheDocument()

    /* Oldest first, linking through to the case record. */
    const rows = card.getAllByRole('listitem')
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('href', '/app/cases/case3')
    expect(within(rows[0]!).getByText('151 days')).toBeInTheDocument()
    expect(within(rows[2]!).getByRole('link')).toHaveAttribute('href', '/app/cases/case1')
  })

  it('shows the acknowledgment meter with the outstanding-signature action', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Policy acknowledgments' }))

    expect(card.getByText('Code of Conduct — annual attestation')).toBeInTheDocument()
    expect(card.getByText('74 / 82 signed')).toBeInTheDocument()
    expect(card.getByText('90%')).toBeInTheDocument()
    /* The suggested action links into the Communications program. */
    expect(
      card.getByRole('link', {
        name: 'Send a reminder to the 8 employees with outstanding signatures.',
      }),
    ).toHaveAttribute('href', '/app/communications')
  })

  it('renders the French strings when the language preference is fr', () => {
    localStorage.setItem('dutiva-lang', 'fr')
    renderApp(<AnalyticsView />, { route: '/app/analytics' })

    expect(screen.getByText('Aperçu de l’effectif et de la conformité.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Score de conformité' })).toBeInTheDocument()
    expect(screen.getByText('+8 c. février')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Attention requise' })).toBeInTheDocument()
    /* Two overdue rows now (lapsed certification + CASL audit). */
    expect(screen.getAllByText('En retard')).toHaveLength(2)
    expect(screen.getByRole('region', { name: 'Effectif par juridiction' })).toBeInTheDocument()
    expect(screen.getByText('82 employés au total')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dossiers ouverts' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Accusés de réception des politiques' }),
    ).toBeInTheDocument()
    expect(screen.getByText('74 / 82 signés')).toBeInTheDocument()

    /* Phase 2 cards, localized. */
    expect(screen.getByRole('region', { name: 'Attestations et formations' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Jalons de service à venir' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Expirations de documents' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Aperçu des congés' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Effectif et roulement' })).toBeInTheDocument()
    expect(screen.getByText('9,8 %')).toBeInTheDocument()
    expect(screen.getByText('Score par juridiction')).toBeInTheDocument()
  })
})
