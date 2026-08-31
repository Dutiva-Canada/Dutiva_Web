import { describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { useDoclib } from './doclibContext'
import { DoclibProvider } from './DoclibProvider'
import type { DocRecipient } from './data'

function TestHarness({
  onDoclib,
}: {
  readonly onDoclib: (value: ReturnType<typeof useDoclib>) => void
}) {
  const value = useDoclib()
  onDoclib(value)
  return <div data-testid="loaded">{value.data ? 'loaded' : 'loading'}</div>
}

function setup() {
  let captured: ReturnType<typeof useDoclib> | undefined
  renderApp(
    <DoclibProvider>
      <TestHarness
        onDoclib={(value) => {
          captured = value
        }}
      />
    </DoclibProvider>,
    { route: '/app/documents', path: '/app/documents' },
  )
  return { get: () => captured }
}

describe('DoclibProvider e-signature workflow', () => {
  it('loads the demo library and exposes mutation helpers', async () => {
    const harness = setup()
    await waitFor(() => expect(harness.get()?.data).toBeTruthy())
    expect(harness.get()?.sendForSignature).toBeTypeOf('function')
    expect(harness.get()?.applySignature).toBeTypeOf('function')
    expect(harness.get()?.getDocumentForEnvelope).toBeTypeOf('function')
  })

  it('sends an approved document for signature', async () => {
    const harness = setup()
    await waitFor(() => expect(harness.get()?.data).toBeTruthy())
    const doclib = harness.get()
    expect(doclib).toBeDefined()
    const approvedDoc = doclib!.data!.documents.find((d) => d.status === 'approved')
    expect(approvedDoc).toBeDefined()

    const recipient: DocRecipient = {
      name: 'Test Signer',
      type: 'employee',
      email: 'signer@example.com',
      order: 1,
      status: 'pending',
    }

    const updated = doclib!.sendForSignature(approvedDoc!.id, [recipient])
    expect(updated).toBeDefined()
    expect(updated!.status).toBe('sent_for_signature')
    expect(updated!.signatureStatus).toBe('sent')
    expect(updated!.signature).toBeDefined()
    expect(updated!.signature!.provider).toBe('dutiva_embedded')
    expect(updated!.signature!.envelopeId).toMatch(/^ENV-[A-Z0-9]+$/)
    expect(updated?.recipients[0]?.status).toBe('pending')

    const found = doclib!.getDocumentForEnvelope(updated!.signature!.envelopeId)
    expect(found).toBeDefined()
    expect(found!.id).toBe(approvedDoc!.id)
  })

  it('applies a signature and updates aggregate statuses', async () => {
    const harness = setup()
    await waitFor(() => expect(harness.get()?.data).toBeTruthy())
    const doclib = harness.get()
    expect(doclib).toBeDefined()
    const approvedDoc = doclib!.data!.documents.find((d) => d.status === 'approved')
    expect(approvedDoc).toBeDefined()

    const recipient: DocRecipient = {
      name: 'Test Signer',
      type: 'employee',
      email: 'signer@example.com',
      order: 1,
      status: 'pending',
    }

    const sent = doclib!.sendForSignature(approvedDoc!.id, [recipient])
    expect(sent).toBeDefined()

    const signed = doclib!.applySignature(sent!.signature!.envelopeId, recipient.email, {
      signedName: 'Test Signer',
      image: 'data:image/png;base64,FAKE',
    })
    expect(signed).toBeDefined()
    expect(signed!.status).toBe('signed')
    expect(signed!.signatureStatus).toBe('signed')
    expect(signed?.recipients[0]?.status).toBe('signed')
    expect(signed?.recipients[0]?.signedName).toBe('Test Signer')
    expect(signed?.recipients[0]?.signatureImage).toBe('data:image/png;base64,FAKE')
    expect(signed!.audit.some((event) => event.event === 'signature_completed')).toBe(true)
  })

  it('rejects an apply when the envelope is unknown', async () => {
    const harness = setup()
    await waitFor(() => expect(harness.get()?.data).toBeTruthy())
    const doclib = harness.get()
    expect(doclib).toBeDefined()

    const updated = doclib!.applySignature('ENV-UNKNOWN', 'noone@example.com', {
      signedName: 'Nobody',
      image: '',
    })
    expect(updated).toBeUndefined()
  })
})
