import { createContext, useContext } from 'react'
import type { DoclibData } from './api'
import type { DocRecipient, GeneratedDoc, OrgProfile, WorkspaceRole } from './data'

/**
 * Feature-scoped state: the loaded catalogue, the demo "Viewing as" role
 * (prototype-only permission demo control — real auth is out of scope for
 * this phase), and the editable org compliance profile that drives the
 * applicability engine live.
 */
export interface DoclibContextValue {
  /** null while the catalogue is loading (screens render skeletons). */
  data: DoclibData | null
  role: WorkspaceRole
  setRole: (role: WorkspaceRole) => void
  org: OrgProfile
  setOrg: (org: OrgProfile) => void
  /** Send an approved document for signature, replacing any previous recipients. */
  sendForSignature: (docId: string, recipients: DocRecipient[]) => GeneratedDoc | undefined
  /** Record a captured signature for one recipient and update aggregate status. */
  applySignature: (
    envelopeId: string,
    email: string,
    payload: { text?: string; image?: string; signedName: string },
  ) => GeneratedDoc | undefined
  /** Look up a document by its signing envelope id. */
  getDocumentForEnvelope: (envelopeId: string) => GeneratedDoc | undefined
}

export const DoclibContext = createContext<DoclibContextValue | null>(null)

export function useDoclib(): DoclibContextValue {
  const ctx = useContext(DoclibContext)
  if (!ctx) throw new Error('useDoclib must be used within DoclibProvider')
  return ctx
}
