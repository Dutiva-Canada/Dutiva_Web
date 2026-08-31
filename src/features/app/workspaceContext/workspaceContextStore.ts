import { createContext, useContext } from 'react'
import type { LText } from '@/i18n/core'
import type { Employee } from '@/data'

/**
 * Workspace context — prototype `workspaceContext` / `setContext` /
 * `contextFromEmployee` (logic 4096–4108). Opening an entity record (employee
 * profile, case detail, pay/wellbeing review) pins a gold "Advisor is using ·
 * …" banner under the topbar that persists across views until cleared.
 */
export type WorkspaceEntityType =
  'employee' | 'document' | 'compliance' | 'compensation' | 'wellbeing' | 'case'

export interface WorkspaceContextState {
  subject: string
  entityType: WorkspaceEntityType
  empId?: string
  initials: string
  meta: LText[]
}

export interface WorkspaceContextValue {
  context: WorkspaceContextState | null
  setContext: (ctx: WorkspaceContextState | null) => void
  clearContext: () => void
  removeContextMeta: (index: number) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspaceContext must be used within a WorkspaceContextProvider')
  return ctx
}

/** Demo `contextFromEmployee(emp, topic)` — meta = jurisdiction · role · topic/status. */
export function contextFromEmployee(
  emp: Employee,
  topic?: LText,
  entityType: WorkspaceEntityType = 'employee',
): WorkspaceContextState {
  return {
    subject: emp.name,
    entityType,
    empId: emp.id,
    initials: emp.initials,
    meta: [emp.jurisdiction, emp.role, topic ?? emp.status],
  }
}
