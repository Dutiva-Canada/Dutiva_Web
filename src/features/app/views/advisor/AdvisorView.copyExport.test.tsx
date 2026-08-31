import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { DocStudioOverlay } from '@/features/app/docstudio/DocStudioOverlay'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { encodeInvisibleTag } from '@/lib/exportProtection'
import { AdvisorView } from './AdvisorView'
import { resetAdvisorSession } from './advisorSession'

const exportMocks = vi.hoisted(() => ({
  authorizeExport: vi.fn(),
}))

vi.mock('@/lib/exportProtection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exportProtection')>()
  return {
    ...actual,
    authorizeExport: exportMocks.authorizeExport,
  }
})

const EXPORT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const OFFER_REPLY =
  "I've got enough to draft a baseline offer — salary and start date can stay as placeholders until you confirm."

const clipboardWrite = vi.fn()

function renderAdvisorWithStudio() {
  return renderApp(
    <>
      <AdvisorView />
      <DocStudioOverlay />
      <ToastHost />
    </>,
    { route: '/app/advisor' },
  )
}

function openOfferLetterThread() {
  renderAdvisorWithStudio()
  fireEvent.click(screen.getByRole('button', { name: /Offer letter — Senior Analyst, Ontario/ }))
}

describe('AdvisorView copy/export actions', () => {
  beforeEach(() => {
    resetAdvisorSession()
    exportMocks.authorizeExport.mockReset()
    exportMocks.authorizeExport.mockResolvedValue({
      allowed: true,
      recordedRemotely: false,
      stamp: { exportId: EXPORT_ID },
    })
    clipboardWrite.mockReset()
    clipboardWrite.mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: clipboardWrite } })
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width:'),
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    )
  })

  it('runs Copy through authorizeExport and writes a tagged clipboard payload', async () => {
    openOfferLetterThread()
    expect(await screen.findByText('Ontario-specific note')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => {
      expect(exportMocks.authorizeExport).toHaveBeenCalledWith(
        expect.objectContaining({
          surface: 'advisor',
          kind: 'text',
          content: OFFER_REPLY,
        }),
      )
    })
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(OFFER_REPLY + encodeInvisibleTag(EXPORT_ID))
    })
    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument()
  })

  it('shows the export-protection denial toast when copy is blocked', async () => {
    exportMocks.authorizeExport.mockResolvedValue({
      allowed: false,
      scope: 'daily',
      retryAfterSeconds: 60,
    })

    openOfferLetterThread()
    expect(await screen.findByText('Ontario-specific note')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(await screen.findByText(/Daily export limit reached/i)).toBeInTheDocument()
    expect(clipboardWrite).not.toHaveBeenCalled()
  })

  it('opens Doc Studio on Export with the advisor message as initial content', async () => {
    openOfferLetterThread()
    expect(await screen.findByText('Ontario-specific note')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Export' }))

    expect(await screen.findByText('Drafting document...')).toBeInTheDocument()
    expect(await screen.findByText('Remote & hybrid work policy')).toBeInTheDocument()
    expect(await screen.findByText(OFFER_REPLY, undefined, { timeout: 2000 })).toBeInTheDocument()
  })
})
