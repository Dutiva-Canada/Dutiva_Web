import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { CommsWorkspaceState } from './types'

/**
 * Factory hooks that build the repetitive add / update / remove callbacks
 * shared by every comms domain. Each callback calls the Supabase-backed API
 * function, then updates the matching slice of `CommsWorkspaceState` in the
 * provider's local state. Domains with side effects (e.g. cascade deletes,
 * status transitions) keep their own custom callbacks in `CommsDataProvider`.
 *
 * These are custom hooks (prefixed `use`) because they call `useCallback`
 * internally; they must be invoked from within a component or another hook.
 */

export function useAddCallback<T extends { id: string }>(
  orgId: string | undefined,
  isLive: boolean,
  setState: Dispatch<SetStateAction<CommsWorkspaceState>>,
  key: keyof CommsWorkspaceState,
  addFn: (orgId: string, item: Omit<T, 'id'>) => Promise<T>,
) {
  return useCallback(
    async (item: Omit<T, 'id'>): Promise<T | null> => {
      if (!isLive || !orgId) return null
      try {
        const created = await addFn(orgId, item)
        setState((prev) => ({ ...prev, [key]: [created, ...(prev[key] as T[])] }))
        return created
      } catch {
        return null
      }
    },
    [isLive, orgId, addFn, setState, key],
  )
}

export function useUpdateCallback<T extends { id: string }>(
  orgId: string | undefined,
  isLive: boolean,
  setState: Dispatch<SetStateAction<CommsWorkspaceState>>,
  key: keyof CommsWorkspaceState,
  updateFn: (orgId: string, id: string, patch: Partial<T>) => Promise<T | null>,
) {
  return useCallback(
    async (id: string, patch: Partial<T>): Promise<T | null> => {
      if (!isLive || !orgId) return null
      try {
        const updated = await updateFn(orgId, id, patch)
        if (updated) {
          setState((prev) => ({
            ...prev,
            [key]: (prev[key] as T[]).map((item) => (item.id === id ? updated : item)),
          }))
        }
        return updated
      } catch {
        return null
      }
    },
    [isLive, orgId, updateFn, setState, key],
  )
}

export function useRemoveCallback<T extends { id: string }>(
  orgId: string | undefined,
  isLive: boolean,
  setState: Dispatch<SetStateAction<CommsWorkspaceState>>,
  key: keyof CommsWorkspaceState,
  removeFn: (orgId: string, id: string) => Promise<void>,
) {
  return useCallback(
    async (id: string): Promise<void> => {
      if (!isLive || !orgId) return
      try {
        await removeFn(orgId, id)
        setState((prev) => ({ ...prev, [key]: (prev[key] as T[]).filter((item) => item.id !== id) }))
      } catch {
        // keep current state on failure
      }
    },
    [isLive, orgId, removeFn, setState, key],
  )
}
