import { useCallback, useEffect, useMemo, useState } from 'react'
import { bi } from '@/i18n/core'
import { initialCrmState } from './fixtures'
import type { CrmActivity, CrmCompany, CrmContact, CrmDeal, CrmState } from './types'

const STORAGE_KEY = (orgId: string) => `dutiva-crm-${orgId}`

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function defaultCurrency(): string {
  return 'CAD'
}

export interface UseCrmDataReturn {
  state: CrmState
  addCompany: (item: Omit<CrmCompany, 'id'>) => CrmCompany
  updateCompany: (id: string, patch: Partial<CrmCompany>) => CrmCompany | null
  removeCompany: (id: string) => void
  addContact: (item: Omit<CrmContact, 'id'>) => CrmContact
  updateContact: (id: string, patch: Partial<CrmContact>) => CrmContact | null
  removeContact: (id: string) => void
  addDeal: (item: Omit<CrmDeal, 'id'>) => CrmDeal
  updateDeal: (id: string, patch: Partial<CrmDeal>) => CrmDeal | null
  removeDeal: (id: string) => void
  addActivity: (item: Omit<CrmActivity, 'id'>) => CrmActivity
  updateActivity: (id: string, patch: Partial<CrmActivity>) => CrmActivity | null
  removeActivity: (id: string) => void
  companyName: (id?: string) => string
  contactName: (id?: string) => string
  dealTitle: (id?: string) => string
}

export function useCrmData(mode: 'demo' | 'production', orgId: string | undefined): UseCrmDataReturn {
  const isLive = mode === 'production' && orgId != null && orgId !== ''
  const [state, setState] = useState<CrmState>(() => {
    if (!isLive || !orgId) return initialCrmState
    try {
      const raw = localStorage.getItem(STORAGE_KEY(orgId))
      if (raw) return JSON.parse(raw) as CrmState
    } catch {
      // ignore
    }
    return {
      companies: [],
      contacts: [],
      deals: [],
      activities: [],
    }
  })

  useEffect(() => {
    if (isLive && orgId) {
      try {
        localStorage.setItem(STORAGE_KEY(orgId), JSON.stringify(state))
      } catch {
        // ignore
      }
    }
  }, [isLive, orgId, state])

  const replace = useCallback((next: CrmState) => {
    setState(next)
  }, [])

  const addCompany = useCallback(
    (item: Omit<CrmCompany, 'id'>) => {
      const created: CrmCompany = { ...item, id: createId('company') }
      replace({ ...state, companies: [created, ...state.companies] })
      return created
    },
    [state, replace],
  )

  const updateCompany = useCallback(
    (id: string, patch: Partial<CrmCompany>) => {
      let result: CrmCompany | null = null
      const next = {
        ...state,
        companies: state.companies.map((c) => {
          if (c.id !== id) return c
          result = { ...c, ...patch }
          return result
        }),
      }
      replace(next)
      return result
    },
    [state, replace],
  )

  const removeCompany = useCallback(
    (id: string) => {
      replace({
        ...state,
        companies: state.companies.filter((c) => c.id !== id),
        contacts: state.contacts.map((c) => (c.companyId === id ? { ...c, companyId: undefined } : c)),
        deals: state.deals.map((d) => (d.companyId === id ? { ...d, companyId: undefined } : d)),
        activities: state.activities.map((a) =>
          a.companyId === id ? { ...a, companyId: undefined } : a
        ),
      })
    },
    [state, replace],
  )

  const addContact = useCallback(
    (item: Omit<CrmContact, 'id'>) => {
      const created: CrmContact = { ...item, id: createId('contact') }
      replace({ ...state, contacts: [created, ...state.contacts] })
      return created
    },
    [state, replace],
  )

  const updateContact = useCallback(
    (id: string, patch: Partial<CrmContact>) => {
      let result: CrmContact | null = null
      const next = {
        ...state,
        contacts: state.contacts.map((c) => {
          if (c.id !== id) return c
          result = { ...c, ...patch }
          return result
        }),
      }
      replace(next)
      return result
    },
    [state, replace],
  )

  const removeContact = useCallback(
    (id: string) => {
      replace({
        ...state,
        contacts: state.contacts.filter((c) => c.id !== id),
        deals: state.deals.map((d) => (d.contactId === id ? { ...d, contactId: undefined } : d)),
        activities: state.activities.map((a) =>
          a.contactId === id ? { ...a, contactId: undefined } : a
        ),
      })
    },
    [state, replace],
  )

  const addDeal = useCallback(
    (item: Omit<CrmDeal, 'id'>) => {
      const created: CrmDeal = { ...item, id: createId('deal'), currency: item.currency || defaultCurrency() }
      replace({ ...state, deals: [created, ...state.deals] })
      return created
    },
    [state, replace],
  )

  const updateDeal = useCallback(
    (id: string, patch: Partial<CrmDeal>) => {
      let result: CrmDeal | null = null
      const next = {
        ...state,
        deals: state.deals.map((d) => {
          if (d.id !== id) return d
          result = { ...d, ...patch }
          return result
        }),
      }
      replace(next)
      return result
    },
    [state, replace],
  )

  const removeDeal = useCallback(
    (id: string) => {
      replace({
        ...state,
        deals: state.deals.filter((d) => d.id !== id),
        activities: state.activities.map((a) => (a.dealId === id ? { ...a, dealId: undefined } : a)),
      })
    },
    [state, replace],
  )

  const addActivity = useCallback(
    (item: Omit<CrmActivity, 'id'>) => {
      const summary = item.summary ?? bi('', '')
      const created: CrmActivity = { ...item, summary, id: createId('activity') }
      replace({ ...state, activities: [created, ...state.activities] })
      return created
    },
    [state, replace],
  )

  const updateActivity = useCallback(
    (id: string, patch: Partial<CrmActivity>) => {
      let result: CrmActivity | null = null
      const next = {
        ...state,
        activities: state.activities.map((a) => {
          if (a.id !== id) return a
          result = { ...a, ...patch }
          return result
        }),
      }
      replace(next)
      return result
    },
    [state, replace],
  )

  const removeActivity = useCallback(
    (id: string) => {
      replace({
        ...state,
        activities: state.activities.filter((a) => a.id !== id),
      })
    },
    [state, replace],
  )

  const lookup = useMemo(() => {
    const companies = new Map(state.companies.map((c) => [c.id, c.name]))
    const contacts = new Map(state.contacts.map((c) => [c.id, c.name]))
    const deals = new Map(state.deals.map((d) => [d.id, d.title]))
    return { companies, contacts, deals }
  }, [state])

  const companyName = useCallback((id?: string) => (id ? lookup.companies.get(id) ?? '' : ''), [lookup])
  const contactName = useCallback((id?: string) => (id ? lookup.contacts.get(id) ?? '' : ''), [lookup])
  const dealTitle = useCallback((id?: string) => (id ? lookup.deals.get(id) ?? '' : ''), [lookup])

  return {
    state,
    addCompany,
    updateCompany,
    removeCompany,
    addContact,
    updateContact,
    removeContact,
    addDeal,
    updateDeal,
    removeDeal,
    addActivity,
    updateActivity,
    removeActivity,
    companyName,
    contactName,
    dealTitle,
  }
}
