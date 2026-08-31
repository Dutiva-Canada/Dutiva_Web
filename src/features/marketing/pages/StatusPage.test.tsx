import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const getServiceStatus = vi.hoisted(() => vi.fn())
vi.mock('@/features/support/statusApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/support/statusApi')>()
  return { ...actual, getServiceStatus }
})

import { StatusPage } from './StatusPage'

const allOperational = [
  { component: 'platform', status: 'operational', message: null, updatedAt: '' },
  { component: 'advisor', status: 'operational', message: null, updatedAt: '' },
  { component: 'documents', status: 'operational', message: null, updatedAt: '' },
  { component: 'support', status: 'operational', message: null, updatedAt: '' },
]

describe('StatusPage', () => {
  beforeEach(() => getServiceStatus.mockReset().mockResolvedValue(allOperational))

  it('reports all systems operational and lists every component', async () => {
    renderApp(<StatusPage />, { route: '/status', path: '/status' })
    expect(screen.getByRole('heading', { level: 1, name: 'Service status' })).toBeInTheDocument()
    expect(await screen.findByText('All systems operational')).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    for (const name of ['Platform', 'AI Advisor', 'HR documents', 'Support']) {
      expect(main.getByText(name)).toBeInTheDocument()
    }
  })

  it('surfaces a live incident and rolls the banner up to affected', async () => {
    getServiceStatus.mockResolvedValue([
      ...allOperational.slice(0, 1),
      {
        component: 'advisor',
        status: 'degraded',
        message: 'Slower than usual while we investigate.',
        updatedAt: '',
      },
      ...allOperational.slice(2),
    ])
    renderApp(<StatusPage />, { route: '/status', path: '/status' })
    expect(await screen.findByText('Some systems are affected')).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByText('Degraded')).toBeInTheDocument()
    expect(main.getByText('Slower than usual while we investigate.')).toBeInTheDocument()
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<StatusPage />, { route: '/status', path: '/status' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    expect(screen.getByRole('heading', { level: 1, name: 'État des services' })).toBeInTheDocument()
  })
})
