import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsContact, CommsOrganization } from './types'
import { initialCommsState } from './fixtures'
import {
  addContact as addContactApi,
  addOrganization as addOrganizationApi,
  listContacts as listContactsApi,
  listOrganizations as listOrganizationsApi,
  removeContact as removeContactApi,
  removeOrganization as removeOrganizationApi,
  updateContact as updateContactApi,
  updateOrganization as updateOrganizationApi,
} from './stakeholdersApi'

export interface UseStakeholdersResult {
  contacts: CommsContact[]
  organizations: CommsOrganization[]
  loading: boolean
  canWrite: boolean
  addContact: (item: Omit<CommsContact, 'id'>) => Promise<CommsContact | null>
  updateContact: (id: string, patch: Partial<CommsContact>) => Promise<CommsContact | null>
  removeContact: (id: string) => Promise<void>
  addOrganization: (item: Omit<CommsOrganization, 'id'>) => Promise<CommsOrganization | null>
  updateOrganization: (id: string, patch: Partial<CommsOrganization>) => Promise<CommsOrganization | null>
  removeOrganization: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useStakeholders(): UseStakeholdersResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [contacts, setContacts] = useState<CommsContact[]>(initialCommsState.contacts)
  const [organizations, setOrganizations] = useState<CommsOrganization[]>(initialCommsState.organizations)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setContacts(initialCommsState.contacts)
      setOrganizations(initialCommsState.organizations)
      return
    }
    setLoading(true)
    try {
      const [c, o] = await Promise.all([
        listContactsApi(organizationId!).catch((err) => {
          showToast(err instanceof Error ? err.message : 'Failed to load contacts', 'info')
          return []
        }),
        listOrganizationsApi(organizationId!).catch((err) => {
          showToast(err instanceof Error ? err.message : 'Failed to load organizations', 'info')
          return []
        }),
      ])
      setContacts(c)
      setOrganizations(o)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addContact = useCallback(
    async (item: Omit<CommsContact, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addContactApi(organizationId!, item)
        setContacts((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add contact', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateContact = useCallback(
    async (id: string, patch: Partial<CommsContact>) => {
      if (!isProduction) return null
      try {
        const updated = await updateContactApi(organizationId!, id, patch)
        if (updated) {
          setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update contact', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeContact = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeContactApi(organizationId!, id)
        setContacts((prev) => prev.filter((c) => c.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove contact', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  const addOrganization = useCallback(
    async (item: Omit<CommsOrganization, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addOrganizationApi(organizationId!, item)
        setOrganizations((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add organization', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateOrganization = useCallback(
    async (id: string, patch: Partial<CommsOrganization>) => {
      if (!isProduction) return null
      try {
        const updated = await updateOrganizationApi(organizationId!, id, patch)
        if (updated) {
          setOrganizations((prev) => prev.map((o) => (o.id === id ? updated : o)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update organization', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeOrganization = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeOrganizationApi(organizationId!, id)
        setOrganizations((prev) => prev.filter((o) => o.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove organization', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    contacts,
    organizations,
    loading,
    canWrite: isProduction,
    addContact,
    updateContact,
    removeContact,
    addOrganization,
    updateOrganization,
    removeOrganization,
    refresh: load,
  }
}
