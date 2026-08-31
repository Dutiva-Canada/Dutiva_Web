import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import { loadDoclibData, loadProductionDoclibCatalogue } from './api'
import type { DoclibData } from './api'
import { defaultOrgProfile } from './data'
import type {
  DocRecipient,
  DocStatus,
  GeneratedDoc,
  Jurisdiction,
  OrgProfile,
  SignatureStatus,
  WorkspaceRole,
} from './data'
import { DoclibContext } from './doclibContext'

const ROLE_KEY = 'dutiva-doclib-role'

function orgProfileForIdentity(identity: WorkspaceIdentity): OrgProfile {
  const province = identity.province?.trim().toUpperCase()
  const primaryJurisdiction: Jurisdiction =
    province === 'QC' || province === 'QUÉBEC' || province === 'QUEBEC' ? 'QC' : 'ON'
  return {
    ...defaultOrgProfile,
    name: identity.companyName,
    primaryJurisdiction,
  }
}

function initialRole(): WorkspaceRole {
  try {
    const stored = sessionStorage.getItem(ROLE_KEY)
    if (
      stored === 'owner' ||
      stored === 'hr' ||
      stored === 'manager' ||
      stored === 'viewer' ||
      stored === 'external'
    )
      return stored
  } catch {
    /* sessionStorage unavailable */
  }
  return 'hr'
}

function clone<T>(value: T): T {
  /* Data is plain JSON-compatible objects; a deep clone keeps the bundled
     fixtures immutable while the demo mutates documents in memory. */
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

function makeEnvelopeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ENV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  }
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const rand = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return `ENV-${rand.toUpperCase()}`
  }
  const rand = Math.random().toString(36).slice(2, 10)
  return `ENV-${rand.toUpperCase()}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export function DoclibProvider({ children }: { readonly children: ReactNode }) {
  const { mode, identity } = useWorkspaceMode()
  const [data, setData] = useState<DoclibData | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  const [role, setRole] = useState<WorkspaceRole>(initialRole)
  const [org, setOrg] = useState<OrgProfile>(defaultOrgProfile)

  useEffect(() => {
    let cancelled = false
    setData(null)
    const loader = mode === 'production' ? loadProductionDoclibCatalogue : loadDoclibData
    void loader().then((loaded) => {
      if (!cancelled) setData(mode === 'production' ? loaded : clone(loaded))
    })
    return () => {
      cancelled = true
    }
  }, [mode])

  useEffect(() => {
    setOrg(mode === 'production' ? orgProfileForIdentity(identity) : defaultOrgProfile)
  }, [mode, identity])

  const sendForSignature = useCallback((docId: string, recipients: DocRecipient[]) => {
    const ts = nowIso()
    const envelopeId = makeEnvelopeId()

    const current = dataRef.current
    if (!current) return undefined
    const next = clone(current)
    const index = next.documents.findIndex((d) => d.id === docId)
    if (index === -1) return undefined

    const doc = next.documents[index]
    if (!doc) return undefined

    const ordered = [...recipients]
      .sort((a, b) => a.order - b.order)
      .map((r, i) => ({
        ...r,
        order: i + 1,
        status: r.status === 'signed' ? r.status : 'pending',
      }))

    const updated: GeneratedDoc = {
      ...doc,
      status: 'sent_for_signature',
      signatureStatus: 'sent',
      recipients: ordered,
      signature: {
        provider: 'dutiva_embedded',
        envelopeId,
        status: 'sent',
        sentAt: ts,
      },
      audit: [
        ...doc.audit,
        { event: 'sent_for_signature', actor: 'You', at: ts, meta: `envelope: ${envelopeId}` },
      ],
      updatedAt: ts,
      updatedBy: 'You',
    }
    next.documents[index] = updated
    dataRef.current = next
    setData(next)

    return updated
  }, [])

  const applySignature = useCallback(
    (
      envelopeId: string,
      email: string,
      payload: { text?: string; image?: string; signedName: string },
    ) => {
      const ts = nowIso()

      const current = dataRef.current
      if (!current) return undefined
      const next = clone(current)
      const index = next.documents.findIndex((d) => d.signature?.envelopeId === envelopeId)
      if (index === -1) return undefined

      const doc = next.documents[index]
      if (!doc || !doc.signature) return undefined

      const recipients = doc.recipients.map((r) =>
        r.email === email
          ? {
              ...r,
              status: 'signed',
              signedAt: ts,
              signedName: payload.signedName,
              signatureImage: payload.image,
              signatureText: payload.text,
            }
          : r,
      )

      const allSigned = recipients.every((r) => r.status === 'signed')
      const someSigned = recipients.some((r) => r.status === 'signed')

      let signatureStatus: SignatureStatus
      let docStatus: DocStatus
      if (allSigned) {
        signatureStatus = 'signed'
        docStatus = 'signed'
      } else if (someSigned) {
        signatureStatus = 'partially_signed'
        docStatus = 'partially_signed'
      } else {
        signatureStatus = 'sent'
        docStatus = 'sent_for_signature'
      }

      const audit: typeof doc.audit = [
        ...doc.audit,
        {
          event: 'signature_viewed',
          actor: payload.signedName,
          at: ts,
          meta: `recipient: ${email}`,
        },
      ]
      if (allSigned) {
        audit.push({
          event: 'signature_completed',
          actor: payload.signedName,
          at: ts,
          meta: 'all recipients signed',
        })
      }

      const updated: GeneratedDoc = {
        ...doc,
        status: docStatus,
        signatureStatus,
        recipients,
        signature: {
          ...doc.signature,
          status: signatureStatus,
          signedAt: allSigned ? ts : doc.signature.signedAt,
        },
        audit,
        updatedAt: ts,
        updatedBy: payload.signedName,
      }
      next.documents[index] = updated
      dataRef.current = next
      setData(next)

      return updated
    },
    [],
  )

  const getDocumentForEnvelope = useCallback(
    (envelopeId: string) =>
      dataRef.current?.documents.find((d) => d.signature?.envelopeId === envelopeId),
    [],
  )

  const value = useMemo(
    () => ({
      data,
      role,
      setRole: (next: WorkspaceRole) => {
        setRole(next)
        try {
          sessionStorage.setItem(ROLE_KEY, next)
        } catch {
          /* non-fatal */
        }
      },
      org,
      setOrg,
      sendForSignature,
      applySignature,
      getDocumentForEnvelope,
    }),
    [data, role, org, sendForSignature, applySignature, getDocumentForEnvelope],
  )

  return <DoclibContext.Provider value={value}>{children}</DoclibContext.Provider>
}

export type { DoclibData }
