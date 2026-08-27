import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { Workflows } from './Workflows'

describe('Workflows', () => {
  it('renders termination and accommodation sample workflow cards', () => {
    renderApp(<Workflows />, { route: '/#workflows', path: '/' })
    expect(screen.getByText('Step 4 of 7')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
    expect(screen.getByText('Legal review requested')).toBeInTheDocument()
    expect(screen.getByText('Document functional limitations')).toBeInTheDocument()
  })
})
