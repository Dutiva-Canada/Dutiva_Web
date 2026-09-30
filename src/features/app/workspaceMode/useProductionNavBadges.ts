import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { countOpenCases } from '@/features/app/views/cases/productionApi'
import { countOpenTasks } from '@/features/app/views/tasks/productionApi'
import { countOpenFindings } from '@/features/app/views/compliance/productionApi'
import type { NavBadgeTone } from '@/features/app/shell/navConfig'
import { useWorkspaceMode } from './workspaceModeContext'

type ProductionNavBadges = Partial<Record<string, { value: string; tone: NavBadgeTone }>>

/**
 * Live nav badges for production mode — real open counts (server-side head
 * counts) for the modules on real persistence, keyed by nav-item key.
 * Refreshes on every route change so completing work updates the rail as
 * you navigate. Demo mode returns {} (fixture badges render as-is); count
 * failures also return {} — a nav badge is never worth an error state.
 */
export function useProductionNavBadges(): ProductionNavBadges {
  const { mode, organizationId } = useWorkspaceMode()
  const { pathname } = useLocation()
  const [badges, setBadges] = useState<ProductionNavBadges>({})

  useEffect(() => {
    if (mode !== 'production' || !organizationId) {
      setBadges({})
      return
    }
    let cancelled = false

    async function load(orgId: string) {
      try {
        const [cases, tasks, findings] = await Promise.all([
          countOpenCases(orgId),
          countOpenTasks(orgId),
          countOpenFindings(orgId),
        ])
        if (cancelled) return
        const next: ProductionNavBadges = {}
        if (cases > 0) next.cases = { value: String(cases), tone: 'neutral' }
        if (tasks > 0) next.planning = { value: String(tasks), tone: 'neutral' }
        if (findings > 0) next.compliance = { value: String(findings), tone: 'warn' }
        setBadges(next)
      } catch {
        /* A transient count failure keeps the last good badges rather than
           blanking the rail — counts must be stable for unchanged data; a
           real drop still lands via the next successful fetch. */
      }
    }

    void load(organizationId)
    return () => {
      cancelled = true
    }
  }, [mode, organizationId, pathname])

  return badges
}
