import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Bi } from '@/i18n/core'
import { homeMessages as M } from '@/i18n/messages/home'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import { listTasks } from '@/features/app/views/tasks/productionApi'
import type { ProductionTask } from '@/features/app/views/tasks/productionApi'
import { listFindings } from '@/features/app/views/compliance/productionApi'
import { listPolicies } from '@/features/app/views/policies/productionApi'

export interface HomeProductionData {
  employees: number
  cases: ProductionCase[]
  tasks: ProductionTask[]
  openFindings: number
  policiesNeedingAttention: number
}

export interface HomeDueItem {
  key: string
  kind: Bi
  title: string
  dueDate: string
  to: string
  overdue: boolean
}

const today = (): string => new Date().toISOString().slice(0, 10)

export function useHomeProductionStats() {
  const { organizationId } = useWorkspaceMode()
  const [data, setData] = useState<HomeProductionData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) {
      setData(null)
      setLoadFailed(false)
      return
    }
    setLoadFailed(false)
    try {
      const [employees, cases, tasks, findings, policies] = await Promise.all([
        listEmployees(organizationId),
        listCases(organizationId),
        listTasks(organizationId),
        listFindings(organizationId),
        listPolicies(organizationId),
      ])
      setData({
        employees: employees.length,
        cases,
        tasks,
        openFindings: findings.filter((f) => !f.resolved).length,
        policiesNeedingAttention: policies.filter((p) => p.status !== 'up_to_date').length,
      })
    } catch {
      setData(null)
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const totalRecords = useMemo(() => {
    if (!data) return 0
    return (
      data.employees +
      data.cases.length +
      data.tasks.length +
      data.openFindings +
      data.policiesNeedingAttention
    )
  }, [data])

  const stats = useMemo(() => {
    if (!data) return []
    const openCases = data.cases.filter((c) => c.status !== 'resolved')
    const openTasks = data.tasks.filter((t) => !t.done)
    return [
      { value: data.employees, label: M.home_prod_stat_employees, to: '/app/employees' },
      { value: openCases.length, label: M.home_prod_stat_open_cases, to: '/app/cases' },
      { value: openTasks.length, label: M.home_prod_stat_open_tasks, to: '/app/tasks' },
      { value: data.openFindings, label: M.home_prod_stat_open_findings, to: '/app/compliance' },
    ]
  }, [data])

  const dueItems = useMemo((): HomeDueItem[] => {
    if (!data) return []
    const now = today()
    const openCases = data.cases.filter((c) => c.status !== 'resolved')
    const openTasks = data.tasks.filter((t) => !t.done)
    return [
      ...openCases
        .filter((c) => c.dueDate !== null)
        .map((c) => ({
          key: `case-${c.id}`,
          kind: M.home_prod_kind_case,
          title: c.title,
          dueDate: c.dueDate ?? '',
          to: '/app/cases',
          overdue: (c.dueDate ?? '') < now,
        })),
      ...openTasks
        .filter((t) => t.dueDate !== null)
        .map((t) => ({
          key: `task-${t.id}`,
          kind: M.home_prod_kind_task,
          title: t.title,
          dueDate: t.dueDate ?? '',
          to: '/app/tasks',
          overdue: (t.dueDate ?? '') < now,
        })),
    ]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  }, [data])

  return {
    data,
    loadFailed,
    loading: organizationId !== null && data === null && !loadFailed,
    reload: load,
    stats,
    dueItems,
    totalRecords,
  }
}
