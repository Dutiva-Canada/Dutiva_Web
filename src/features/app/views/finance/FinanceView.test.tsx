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
import { Tax } from './screens/Tax'

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
        <Route path="tax" element={<Tax />} />
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
    expect(screen.getByRole('link', { name: 'Tax' })).toBeInTheDocument()
  })

  it('shows cash position and upcoming obligations on the overview', () => {
    renderAt('/app/finance/overview')

    expect(screen.getByText('Operating account')).toBeInTheDocument()
    expect(screen.getByText('Tax reserve account')).toBeInTheDocument()
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
})
