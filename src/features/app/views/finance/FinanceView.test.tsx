import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { FinanceView } from './FinanceView'
import { Overview } from './screens/Overview'
import { Transactions } from './screens/Transactions'
import { Sales } from './screens/Sales'
import { Purchases } from './screens/Purchases'
import { Payroll } from './screens/Payroll'
import { Accounting } from './screens/Accounting'
import { Plans } from './screens/Plans'
import { Treasury } from './screens/Treasury'
import { Portfolio } from './screens/Portfolio'
import { Deals } from './screens/Deals'
import { Governance } from './screens/Governance'
import { Entities } from './screens/Entities'
import { Tax } from './screens/Tax'
import { Evidence } from './screens/Evidence'

function renderAt(route: string) {
  return renderApp(
    <Routes>
      <Route path="/app/finance/*" element={<FinanceView />}>
        <Route path="overview" element={<Overview />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="sales" element={<Sales />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="plans" element={<Plans />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="deals" element={<Deals />} />
        <Route path="governance" element={<Governance />} />
        <Route path="entities" element={<Entities />} />
        <Route path="tax" element={<Tax />} />
        <Route path="evidence" element={<Evidence />} />
      </Route>
    </Routes>,
    { route, path: '*' },
  )
}

describe('FinanceView', () => {
  it('renders the workspace shell with all navigation tabs', () => {
    renderAt('/app/finance/overview')

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Transactions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sales & collections' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Purchases & expenses' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Payroll' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Accounting' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plans & budgets' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Treasury' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Portfolio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Deals' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Governance' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tax' })).toBeInTheDocument()
  })

  it('shows cash position and upcoming obligations on the overview', () => {
    renderAt('/app/finance/overview')

    // Account names can also appear in the exceptions list — allow multiples.
    expect(screen.getAllByText('Operating account').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tax reserve account').length).toBeGreaterThan(0)
  })

  it('lists invoices on the sales tab', () => {
    renderAt('/app/finance/sales')

    expect(screen.getByText('INV-2026-0042')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-0038')).toBeInTheDocument()
  })

  it('lists spend requests on the purchases tab', () => {
    renderAt('/app/finance/purchases')

    expect(screen.getByText('New warehouse laptops (3 units)')).toBeInTheDocument()
  })

  it('lists pay runs on the payroll tab', () => {
    renderAt('/app/finance/payroll')

    expect(screen.getByText('Pay period 18 — Aug 24 to Sep 6')).toBeInTheDocument()
  })

  it('lists journals on the accounting tab', () => {
    renderAt('/app/finance/accounting')

    expect(screen.getByText(/JE-2026-0150/)).toBeInTheDocument()
  })

  it('lists budgets on the plans tab', () => {
    renderAt('/app/finance/plans')

    expect(screen.getByText('2026 annual budget')).toBeInTheDocument()
  })

  it('lists reserve goals on the treasury tab', () => {
    renderAt('/app/finance/treasury')

    expect(screen.getByText('Q3 tax instalment reserve')).toBeInTheDocument()
    expect(screen.getByText('Payroll reserve — 2 cycles')).toBeInTheDocument()
  })

  it('surfaces derived attention items on the overview', () => {
    renderAt('/app/finance/overview')

    expect(
      screen.getByRole('heading', { name: 'Needs attention' }),
    ).toBeInTheDocument()
    // The notified tranche is due 2026-10-10 (inside 30 days).
    expect(screen.getByText('Call due soon')).toBeInTheDocument()
    expect(screen.getByText(/250000\.00 · 2026-10-10/)).toBeInTheDocument()
    // The fixture debt matures inside 90 days.
    expect(screen.getByText('Maturing soon')).toBeInTheDocument()
    // The financing deal passed its target date while still in agreement.
    expect(screen.getByText('Behind target')).toBeInTheDocument()
    expect(screen.getByText('Holdco credit facility')).toBeInTheDocument()
    // Links resolve to the tab that owns each item.
    expect(screen.getAllByRole('link', { name: 'Growth equity commitment' })[0]).toHaveAttribute(
      'href',
      '/app/finance/deals',
    )
    expect(screen.getByRole('link', { name: 'Business line of credit' })).toHaveAttribute(
      'href',
      '/app/finance/treasury',
    )
  })

  it('lists cash sweeps on the treasury tab with their lifecycle', () => {
    renderAt('/app/finance/treasury')

    expect(screen.getByRole('heading', { name: 'Cash sweeps' })).toBeInTheDocument()
    // Executed + scheduled fixture sweeps, both operating → tax reserve.
    expect(screen.getAllByText(/Operating account → Tax reserve account/)).toHaveLength(2)
    expect(screen.getByText(/CAD 4000\.00 · 2026-09-15/)).toBeInTheDocument()
    expect(screen.getByText(/CAD 2500\.00 · 2026-10-01/)).toBeInTheDocument()
    expect(screen.getByText('Executed')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
    expect(screen.getByText(/Q3 instalment sweep/)).toBeInTheDocument()
    expect(screen.getByText(/Q4 instalment sweep/)).toBeInTheDocument()
    // Demo mode is read-only — the write controls stay hidden.
    expect(screen.queryByText('Mark executed')).not.toBeInTheDocument()
    expect(screen.queryByText('Record a sweep')).not.toBeInTheDocument()
  })

  it('shows covenant, notice, and the maturing marker on treasury debt', () => {
    renderAt('/app/finance/treasury')

    expect(screen.getByText('Business line of credit')).toBeInTheDocument()
    // Covenant + notice columns render together on the terms line.
    expect(screen.getByText(/Covenant: DSC ≥ 1\.25×/)).toBeInTheDocument()
    expect(screen.getByText(/Notice period: 60 days/)).toBeInTheDocument()
    // The fixture matures 2026-11-30 — inside the 90-day window.
    expect(screen.getByText('Maturing soon')).toBeInTheDocument()
  })

  it('renders the deal pipeline grouped by stage with capital partners', () => {
    renderAt('/app/finance/deals')

    // Summary strip + section heading share the same label — target the h2.
    expect(screen.getByRole('heading', { name: 'Deal pipeline' })).toBeInTheDocument()
    // Stage groups
    expect(screen.getByText('Diligence')).toBeInTheDocument()
    expect(screen.getByText('Negotiation')).toBeInTheDocument()
    expect(screen.getByText('Agreement')).toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()
    // Deal rows
    expect(screen.getByText('Verdun Freight Lines — tuck-in')).toBeInTheDocument()
    expect(screen.getByText('Great Lakes Cold Storage — minority stake')).toBeInTheDocument()
    // Capital partners section surfaces investor/lender parties.
    expect(screen.getByText('Capital partners')).toBeInTheDocument()
    expect(screen.getByText('Laurentian Growth Partners')).toBeInTheDocument()
    // Commitment ledger renders committed/called/uncalled under each partner.
    expect(screen.getByText('Growth equity commitment')).toBeInTheDocument()
    expect(screen.getByText('Acquisition credit facility')).toBeInTheDocument()
    expect(screen.getAllByText(/Uncalled 900000\.00/).length).toBe(1)
    expect(screen.getByText(/Next call: 2026-10-10/)).toBeInTheDocument()
    // Capital calls render as the event log under their commitment.
    expect(screen.getByText(/Call notice 2026-01/)).toBeInTheDocument()
    expect(screen.getByText(/Call notice 2026-02/)).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
    expect(screen.getByText('Notified')).toBeInTheDocument()
    // Partner contact details (0173) render on the card.
    expect(screen.getByText(/Amélie Bouchard/)).toBeInTheDocument()
    // The hedging note stays on the record/workflow wording.
    expect(
      screen.getByText(/does not broker deals or provide investment advice/),
    ).toBeInTheDocument()
  })

  it('renders the board governance view: cap table, partner roster, audit trail', () => {
    renderAt('/app/finance/governance')

    expect(screen.getByRole('heading', { name: 'Cap table' })).toBeInTheDocument()
    // Both entities render; the child carries its ownership edge.
    expect(screen.getByText('Northgate Holdings Inc.')).toBeInTheDocument()
    expect(screen.getByText('Northgate Logistics Inc.')).toBeInTheDocument()
    expect(screen.getByText(/100% · Parent: Northgate Holdings Inc\./)).toBeInTheDocument()
    // Capital partners with commitment totals across the roster.
    expect(screen.getByRole('heading', { name: 'Capital partners' })).toBeInTheDocument()
    expect(screen.getByText('Laurentian Growth Partners')).toBeInTheDocument()
    expect(screen.getByText(/Committed CAD 1500000\.00/)).toBeInTheDocument()
    expect(screen.getByText(/Uncalled CAD 900000\.00/)).toBeInTheDocument()
    // Full audit trail — newest first, including finance-lifecycle events.
    expect(screen.getByRole('heading', { name: 'Audit trail' })).toBeInTheDocument()
    expect(screen.getByText(/Advanced deal stage/)).toBeInTheDocument()
    expect(screen.getByText(/Recorded capital call receipt/)).toBeInTheDocument()
    expect(screen.getByText(/Created capital commitment/)).toBeInTheDocument()
    // The trail sorts newest first: 2026-09-18 before 2026-07-02.
    const trail = screen.getByRole('heading', { name: 'Audit trail' }).closest('section')!
    const texts = Array.from(trail.querySelectorAll('li')).map((li) => li.textContent ?? '')
    expect(texts[0]).toContain('Advanced deal stage')
    expect(texts[texts.length - 1]).toContain('Created capital commitment')
  })

  it('renders linked documents on deal cards and holding rows', () => {
    renderAt('/app/finance/deals')

    // The deal card's Documents block shows the snapshot + deep link.
    expect(screen.getByText('Employment agreement — Grace Osei · DOC-2026-0151')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Employment agreement — Grace Osei · DOC-2026-0151' }),
    ).toHaveAttribute('href', '/app/documents/doc_002')
  })

  it('renders linked documents under holdings on the portfolio tab', () => {
    renderAt('/app/finance/portfolio')

    expect(screen.getByText('Termination letter — Jordan Mensah · DOC-2026-0138')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Termination letter — Jordan Mensah · DOC-2026-0138' }),
    ).toHaveAttribute('href', '/app/documents/doc_003')
  })

  it('renders the ownership structure tree on the entities tab', () => {
    renderAt('/app/finance/entities')

    expect(
      screen.getByRole('heading', { name: 'Ownership structure' }),
    ).toBeInTheDocument()
    // Both entities appear once in the registry list and once in the tree.
    expect(screen.getAllByText('Northgate Holdings Inc.').length).toBe(2)
    expect(screen.getAllByText('Northgate Logistics Inc.').length).toBe(2)
    // The child's ownership edge renders as a percentage badge.
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
  })

  it('lists tax obligations on the tax tab', () => {
    renderAt('/app/finance/tax')

    expect(screen.getByText('GST/HST — Q3 2026')).toBeInTheDocument()
    expect(screen.getByText('Income tax — 2026 T2')).toBeInTheDocument()
  })

  it('shows the tax scenario disclaimer on the tax tab', () => {
    renderAt('/app/finance/tax')

    expect(
      screen.getByText(
        'A tax scenario is a planning record, not a filed return. Estimated reductions are not guaranteed tax savings.',
      ),
    ).toBeInTheDocument()
  })

  it('renders the evidence checklist on the evidence tab', () => {
    renderAt('/app/finance/evidence')

    expect(screen.getByText('Evidence checklist')).toBeInTheDocument()
  })
})
