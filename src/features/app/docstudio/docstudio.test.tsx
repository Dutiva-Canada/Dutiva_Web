import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { appendExportAudit, clearExportAudit, decodeInvisibleTag } from '@/lib/exportProtection'
import { PlanContext } from '@/features/app/billing/planContext'
import type { PlanContextValue } from '@/features/app/billing/planContext'
import { makePlanContextValue } from '@/features/app/billing/planContext'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import type { WorkspaceModeContextValue } from '@/features/app/workspaceMode/workspaceModeContext'
import { DocStudioProvider } from './DocStudioProvider'
import { DocStudioOverlay } from './DocStudioOverlay'
import { useDocStudio } from './docStudioContext'

/* Downloads: jsdom implements createObjectURL but not anchor navigation, so
   the delivery step is stubbed — captured here so tests can assert on the
   artifact that would have been saved. */
const downloads = vi.hoisted(() => ({ list: [] as { filename: string; blob: Blob }[] }))
vi.mock('@/lib/exportProtection/artifacts/download', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exportProtection/artifacts/download')>()
  return {
    ...actual,
    triggerDownload: (filename: string, blob: Blob) => {
      downloads.list.push({ filename, blob })
      return true
    },
  }
})

function Opener() {
  const { openDocStudio } = useDocStudio()
  return (
    <div>
      <button onClick={() => openDocStudio('Offboarding Checklist')}>open-checklist</button>
      <button onClick={() => openDocStudio('Termination Letter')}>open-termination</button>
    </div>
  )
}

/* PlanGate wraps the export buttons and reads usePlan + useWorkspaceMode.
   Tests render in demo mode with pro plan so gates pass — the studio's
   export behavior is tested independently of plan gating (see PlanGate.test). */
const DEMO_MODE_CTX: WorkspaceModeContextValue = {
  mode: 'demo',
  isAdmin: false,
  identity: {
    companyName: 'Northgate Logistics Inc.',
    user: {
      name: 'Riley Chen',
      initials: 'RC',
      role: { en: 'HR Manager', fr: 'Gestionnaire RH' },
      email: 'riley@northgate.ca',
    },
  },
  companyName: 'Northgate Logistics Inc.',
  organizationId: null,
  memberRole: null,
  isOrgAdmin: false,
  setMode: vi.fn(),
  admissionStatus: 'idle',
  clearAdmissionStatus: vi.fn(),
  refreshIdentity: vi.fn(),
}
const PRO_PLAN_CTX: PlanContextValue = makePlanContextValue({
  plan: 'pro',
  subscriptionStatus: 'active',
  stripeCustomerId: null,
  organizationId: null,
  isAdmin: false,
  loading: false,
})

function renderStudio({ withToastHost = false } = {}) {
  return render(
    <LangProvider>
      <WorkspaceModeContext.Provider value={DEMO_MODE_CTX}>
        <PlanContext.Provider value={PRO_PLAN_CTX}>
          <ToastsProvider>
            <DocStudioProvider>
              <Opener />
              <DocStudioOverlay />
              {withToastHost && <ToastHost />}
            </DocStudioProvider>
          </ToastsProvider>
        </PlanContext.Provider>
      </WorkspaceModeContext.Provider>
    </LangProvider>,
  )
}

function openTemplate(name: string) {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
  /* Prototype generation delay (750ms) — sections appear once it elapses. */
  act(() => {
    vi.advanceTimersByTime(750)
  })
}

describe('Document Studio', () => {
  beforeEach(() => {
    /* shouldAdvanceTime: the export pipeline is genuinely async (WebCrypto
       digest, React 19's timer-driven async act). Frozen fake timers deadlock
       it; advancing ones keep `advanceTimersByTime(750)` for the generation
       shimmer while letting the pipeline's own microtasks/timers run. */
    vi.useFakeTimers({ shouldAdvanceTime: true })
    clearExportAudit()
    downloads.list.length = 0
  })
  afterEach(() => {
    vi.useRealTimers()
    clearExportAudit()
  })

  it('renders nothing until opened, then shows the fixture sections after generation', () => {
    renderStudio()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-checklist' }))
    })
    const dialog = screen.getByRole('dialog', { name: 'Document Studio' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveFocus()

    /* While generating: shimmer visible, sections not yet rendered. */
    expect(screen.getByText('Advisor is drafting…')).toBeInTheDocument()
    expect(
      screen.queryByText('Offboarding Checklist — Jordan Mensah, last day July 19, 2026'),
    ).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(750)
    })
    expect(screen.queryByText('Advisor is drafting…')).not.toBeInTheDocument()
    expect(
      screen.getByText('Offboarding Checklist — Jordan Mensah, last day July 19, 2026'),
    ).toBeInTheDocument()
    /* Standard (non-high-risk) chip and the doc-studio disclaimer. */
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(
      screen.getByText(/does not provide legal advice\. For high-risk employment decisions/),
    ).toBeInTheDocument()

    const details = screen.getByRole('button', { name: 'Document details' })
    expect(details).toHaveAttribute('aria-controls', 'docstudio-details')
    fireEvent.click(details)
    expect(details).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('docstudio-details')).toBeInTheDocument()

    const sendForSignature = screen.getByRole('button', { name: 'Send for e-signature' })
    sendForSignature.focus()
    fireEvent.keyDown(sendForSignature, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Edit draft' })).toHaveFocus()

    /* Escape closes the overlay. */
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('gates exports on high-risk templates and proceeds after confirmation', async () => {
    renderStudio()
    openTemplate('open-termination')

    expect(screen.getByText('High-risk document')).toBeInTheDocument()

    /* Export attempt opens the review gate instead of exporting. */
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))
    })
    const gate = screen.getByRole('alertdialog', { name: 'Review before sending' })
    expect(gate).toBeInTheDocument()
    expect(gate).toHaveTextContent('This document involves a high-risk HR decision.')

    /* Confirm — the gate closes and the deferred export completes (the
       pipeline is async now: authorize → watermark → deliver). */
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and continue' }))
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Document details' }))
    })
    expect(await screen.findByText('Exported as PDF')).toBeInTheDocument()

    /* The confirmed export produced a real watermarked PDF download. */
    expect(downloads.list).toHaveLength(1)
    expect(downloads.list[0]?.filename).toMatch(/^dutiva-termination-letter.*\.pdf$/)

    /* Once confirmed, the gate is not shown again (e-signature goes straight through). */
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send for e-signature' }))
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Signature requested — awaiting response')).toBeInTheDocument()
  })

  it('cancelling the gate leaves the document unexported', () => {
    renderStudio()
    openTemplate('open-termination')

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Export Word' }))
    })
    expect(screen.getByRole('alertdialog', { name: 'Review before sending' })).toBeInTheDocument()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Document details' }))
    })
    expect(screen.getByText('Not exported')).toBeInTheDocument()
  })

  it('exports directly (setting export status) on standard templates', async () => {
    renderStudio()
    openTemplate('open-checklist')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export Word' }))
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Document details' }))
    })
    expect(await screen.findByText('Exported as Word')).toBeInTheDocument()
  })

  it('Word exports carry the watermark: decodable invisible tag + visible notice', async () => {
    renderStudio()
    openTemplate('open-checklist')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export Word' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Document details' }))
    })
    await screen.findByText('Exported as Word')

    expect(downloads.list).toHaveLength(1)
    const download = downloads.list[0]!
    expect(download.filename).toMatch(/\.docx$/)
    const bytes = new Uint8Array(await download.blob.arrayBuffer())
    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(bytes)
    const documentXml = await zip.file('word/document.xml')!.async('string')
    expect(decodeInvisibleTag(documentXml)).toMatch(/^[0-9a-f-]{36}$/)
    expect(documentXml).toContain('Exported from Dutiva')
    /* The mock workspace identity is Riley Chen — exports carry the real
       actor label, not the "Demo session" fallback. */
    expect(documentXml).toContain('Riley Chen')
  })

  it('refuses a bulk-export burst, leaves the document unexported, and says when to retry', async () => {
    /* 12 exports already recorded on this device inside the burst window —
       the scripted "walk out with the library" shape the guard exists for. */
    for (let i = 0; i < 12; i += 1) {
      appendExportAudit({
        exportId: `seed-${i}`,
        surface: 'docstudio',
        kind: 'pdf',
        title: 'Seed',
        contentSha256: 'a'.repeat(64),
        contentChars: 10,
        lang: 'en',
        actorLabel: 'seed',
        at: new Date().toISOString(),
        recordedRemotely: false,
      })
    }
    renderStudio({ withToastHost: true })
    openTemplate('open-checklist')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))
    })
    expect(await screen.findByText(/Export limit reached/)).toBeInTheDocument()
    expect(downloads.list).toHaveLength(0)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Document details' }))
    })
    expect(screen.getByText('Not exported')).toBeInTheDocument()
  })
})
