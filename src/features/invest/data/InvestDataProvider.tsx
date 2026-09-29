import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EMPTY_INVEST_STATE, InvestDataContext } from './InvestDataContext'
import type { InvestState } from './api'
import { createAccount, loadInvestState } from './api'

/** Loads the signed-in user's invest_* rows once; shared across all tabs. */
export function InvestDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InvestState>(EMPTY_INVEST_STATE)
  const [loading, setLoading] = useState(true)
  /* First-run provisioning: a brand-new account gets one paper book so the
     empty-state copy ("a paper account is created for you") is true and the
     positions form has somewhere to record into. Once per mount — a failed
     create must not loop, and a user who deletes every account later isn't
     re-provisioned mid-session. */
  const provisioned = useRef(false)

  const refresh = useCallback(async () => {
    try {
      let next = await loadInvestState()
      if (next.accounts.length === 0 && !provisioned.current) {
        provisioned.current = true
        try {
          /* `seeded` carries a partial unique index (0188): a concurrent tab
             seeding the same book hits 23505 instead of double-creating. */
          await createAccount({ name: 'Paper book', kind: 'paper', seeded: true })
        } catch {
          /* Provisioning is best-effort — the Accounts form stays visible
             for a manual create, so a failed seed is not fatal. */
        }
        /* Reload either way — on a seed race the winner's book shows up, on
           success we get the row we just wrote. */
        next = await loadInvestState()
      }
      setState(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ state, loading, refresh }), [state, loading, refresh])
  return <InvestDataContext.Provider value={value}>{children}</InvestDataContext.Provider>
}
