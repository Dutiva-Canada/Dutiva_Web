import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { DoclibProvider } from '../DoclibProvider'
import { DocumentDetailScreen } from './DocumentDetailScreen'

const DOC1 = { route: '/app/documents/doc_001', path: '/app/documents/:docId' }

function renderDetail(options: { route: string; path: string } = DOC1) {
  return renderApp(
    <DoclibProvider>
      <DocumentDetailScreen />
      <ToastHost />
    </DoclibProvider>,
    options,
  )
}

afterEach(() => {
  localStorage.removeItem('dutiva-lang')
})

/* Every tab section stays mounted inside the single tabpanel and is toggled
   with the `hidden` attribute, so text queries must skip hidden sections. */
const visible = (el: HTMLElement) => el.closest('[hidden]') === null

describe('DocumentDetailScreen', () => {
  it('renders the doc_001 header: title, four status chips, tabs, and the Supabase metadata rail', async () => {
    renderDetail()

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Offer of employment — Gabriel Dubois',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Back to repository')).toBeInTheDocument()

    /* Four header chips: status Signed, review Approved for use, signature
       Signed, risk Medium risk. */
    expect(screen.getAllByText('Signed').filter(visible)).toHaveLength(2)
    expect(screen.getByText('Approved for use')).toBeInTheDocument()
    expect(screen.getByText('Careful review')).toBeInTheDocument()

    /* Tabs — Preview selected by default. */
    expect(screen.getAllByRole('tab')).toHaveLength(5)
    expect(screen.getByRole('tab', { name: 'Preview', selected: true })).toBeInTheDocument()

    /* Metadata rail labels each row with its Supabase column (handoff content). */
    expect(screen.getByText('documents.id / ref')).toBeInTheDocument()
    expect(screen.getByText('documents.jurisdiction')).toBeInTheDocument()
    expect(screen.getByText('documents.current_version_id')).toBeInTheDocument()
    expect(screen.getByText('v2 / 2')).toBeInTheDocument()
    expect(screen.getByText('T09 · Québec offer letter')).toBeInTheDocument()
  })

  it('switches to Versions and Audit trail tabs', async () => {
    renderDetail()

    fireEvent.click(await screen.findByRole('tab', { name: 'Versions' }))
    expect(screen.getByText('Salary corrected after HR review; finalized')).toBeInTheDocument()
    expect(screen.getByText('Generated from T09 v2 (guided questions)')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Audit trail' }))
    /* signature_completed → humanized/localized label + its actor (scoped to
       the panel — the metadata rail also names Gabriel Dubois, and the hidden
       fields/recipients sections do too). */
    const panel = within(screen.getByRole('tabpanel'))
    expect(panel.getByText('Signature completed')).toBeInTheDocument()
    expect(panel.getAllByText('Gabriel Dubois').filter(visible)).toHaveLength(1)
    expect(panel.getByText('v2 — salary corrected')).toBeInTheDocument()
  })

  it('gates actions by role: the default hr role gets Export/Archive on a signed doc, and actions fire demo toasts', async () => {
    renderDetail()

    const exportBtn = await screen.findByRole('button', { name: 'Export' })
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
    /* hr can't restore/void, and a signed document is no longer editable. */
    expect(screen.queryByRole('button', { name: 'Void' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()

    fireEvent.click(exportBtn)
    expect(await screen.findByRole('status')).toHaveTextContent('Exported')
  })

  it('re-localizes to French from the persisted language preference', async () => {
    localStorage.setItem('dutiva-lang', 'fr')
    renderDetail()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Offre d’emploi — Gabriel Dubois' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Retour au dépôt')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Aperçu', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Juridiction')).toBeInTheDocument()
  })

  it('redirects to the repository for an unknown document id', async () => {
    const { container } = renderDetail({
      route: '/app/documents/doc_does_not_exist',
      path: '/app/documents/:docId',
    })

    /* Navigate fires once data resolves; the :docId route no longer matches. */
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })
})
