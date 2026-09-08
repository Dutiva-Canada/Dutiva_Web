import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { CrmView } from './CrmView'

function renderAt(route: string) {
  return renderApp(
    <Routes>
      <Route path="/app/crm" element={<CrmView />} />
    </Routes>,
    { route, path: '*' },
  )
}

describe('CrmView', () => {
  it('renders the CRM workspace with the dashboard tab and demo data', () => {
    renderAt('/app/crm')

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Contacts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Companies' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deals' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activities' })).toBeInTheDocument()
  })

  it('shows the demo pipeline and follow-ups on the dashboard', () => {
    renderAt('/app/crm')

    expect(screen.getByText('Lakeside Manufacturing — Team Plan')).toBeInTheDocument()
    expect(screen.getByText('Amara Okafor')).toBeInTheDocument()
  })

  it('switches to the contacts tab and lists demo contacts', () => {
    renderAt('/app/crm')

    fireEvent.click(screen.getByRole('button', { name: 'Contacts' }))

    expect(screen.getByText('Amara Okafor')).toBeInTheDocument()
    expect(screen.getByText('Sarah Whitmore')).toBeInTheDocument()
  })

  it('switches to the deals tab and lists the demo deal pipeline', () => {
    renderAt('/app/crm')

    fireEvent.click(screen.getByRole('button', { name: 'Deals' }))

    expect(screen.getByText('Summit Health — Compliance Bundle')).toBeInTheDocument()
  })
})
