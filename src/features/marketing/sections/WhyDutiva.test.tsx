import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { FOUNDER } from '@/seo/site'
import { WhyDutiva } from './WhyDutiva'

describe('WhyDutiva', () => {
  it('names the founder with photo and LinkedIn, not an anonymous HR title', () => {
    renderApp(<WhyDutiva />, { route: '/', path: '/' })

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Built by someone')
    expect(heading).toHaveTextContent('who has done the work.')
    expect(heading).not.toHaveTextContent('HR operator')
    expect(heading).not.toHaveTextContent('HR professional')

    expect(screen.getByText(/I built Dutiva so you don’t have to guess/)).toBeInTheDocument()
    expect(screen.getByText(/— Martin Constantineau, Founder & CEO/)).toBeInTheDocument()

    expect(screen.getByText(FOUNDER.name)).toBeInTheDocument()
    const linkedin = screen.getByRole('link', { name: 'View Martin on LinkedIn' })
    expect(linkedin).toHaveAttribute('href', FOUNDER.linkedinUrl)
    expect(linkedin).toHaveAttribute('target', '_blank')
    expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByAltText('Martin Constantineau, Founder and CEO of Dutiva')).toHaveAttribute(
      'src',
      FOUNDER.photoPath,
    )

    expect(screen.getByText('Names the statute')).toBeInTheDocument()
    expect(screen.getByText('Bilingual by default')).toBeInTheDocument()
    expect(screen.getByText('Compliance-conscious')).toBeInTheDocument()
  })
})
