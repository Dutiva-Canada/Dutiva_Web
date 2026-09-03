import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { DoclibProvider } from '../DoclibProvider'
import { TemplateDetailScreen } from './TemplateDetailScreen'

const PATH = '/app/documents/templates/:tid'

function renderDetail(tid: string) {
  return renderApp(
    <DoclibProvider>
      <TemplateDetailScreen />
    </DoclibProvider>,
    { route: `/app/documents/templates/${tid}`, path: PATH },
  )
}

describe('TemplateDetailScreen', () => {
  it('renders T01 with statutory references, includes, back link, and generate CTA', async () => {
    renderDetail('T01')

    /* Data loads async from fixtures — first assertion awaits the header. */
    expect(await screen.findByText('Offer of employment letter (Ontario)')).toBeInTheDocument()

    /* Header chips + risk. */
    expect(screen.getByText('T01')).toBeInTheDocument()
    expect(screen.getByText('Standard review')).toBeInTheDocument()

    /* Statutory reference + what's-included items. */
    expect(
      screen.getByText('Employment Standards Act, 2000 — minimum standards'),
    ).toBeInTheDocument()
    expect(screen.getByText('Role, start date & reporting')).toBeInTheDocument()

    /* Per-jurisdiction legal notes. */
    expect(
      screen.getByText(
        'Written for Ontario employers. ESA, 2000 minimum standards cannot be contracted out of; a non-compliant termination clause can void the clause entirely (Waksdale v. Swegon, 2020 ONCA 391).',
      ),
    ).toBeInTheDocument()

    /* Back link + Generate CTA targets. */
    expect(screen.getByRole('link', { name: 'Back to templates' })).toHaveAttribute(
      'href',
      '/app/documents/studio',
    )
    expect(screen.getByRole('link', { name: 'Generate document' })).toHaveAttribute(
      'href',
      '/app/documents/generate/tpl_t01',
    )
  })

  it('redirects unknown template ids to the studio', async () => {
    const { container } = renderDetail('T99')

    /* Skeleton first (data loading), then <Navigate> leaves the route empty. */
    await waitFor(() => expect(container.querySelector('.animate-pulse')).toBeNull())
    expect(screen.queryByText('Offer of employment letter (Ontario)')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('shows the applicability verdict for the default org on T03', async () => {
    renderDetail('T03')

    expect(await screen.findByText('Termination letter (without cause)')).toBeInTheDocument()

    /* Default org: 42 headcount, non-union, ON → standard applicability. */
    expect(screen.getByText('Recommended for your organization')).toBeInTheDocument()

    /* T03 is lawyer-flagged — review chip + warning callout surface. */
    expect(screen.getByText('Lawyer review recommended')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This is a high-risk document. Lawyer review is recommended before it is sent or signed.',
      ),
    ).toBeInTheDocument()
  })
})
