import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { bi } from '@/i18n/core'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import { useDoclib } from '../doclibContext'
import { Skel } from '../components'
import type { DocCase, DocEmployee } from '../data'
import { GenerateWizard } from './generateScreen/GenerateWizard'
import { STUDIO_PATH, provinceToJurisdiction } from './generateScreen/wizardUi'

/** Skeleton mirroring the wizard layout while the catalogue loads. */
function GenerateSkeleton() {
  return (
    <div>
      <Skel className="h-5.5 w-85" />
      <Skel className="mt-2 h-3.5 w-60" />
      <div className="mt-4 flex items-center justify-between border-y border-border py-2.5">
        <Skel className="h-4 w-17.5" />
        <Skel className="h-6 w-75" />
        <Skel className="h-4 w-27.5" />
      </div>
      <Skel className="mt-4 h-10 w-full" />
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] gap-6 max-[1023px]:grid-cols-1">
        <Skel className="h-80" />
        <Skel className="h-105" />
      </div>
    </div>
  )
}

/**
 * Generate wizard — /app/documents/generate/:templateId. Three steps
 * (context → guided questions → review & risk) with a sticky live preview
 * rendered through the shared engine + DocPaper. Demo posture: answers are
 * local component state only; nothing is persisted. Production persists via
 * createDocument (migration 0076) and navigates to the new detail route.
 */
export function GenerateScreen() {
  const { templateId } = useParams()
  const { data } = useDoclib()
  const { mode, organizationId } = useWorkspaceMode()
  const [prodEmployees, setProdEmployees] = useState<DocEmployee[] | null>(null)
  const [prodCases, setProdCases] = useState<DocCase[] | null>(null)

  useEffect(() => {
    if (mode !== 'production' || !organizationId) {
      setProdEmployees(null)
      setProdCases(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [emps, cases] = await Promise.all([
          listEmployees(organizationId),
          listCases(organizationId),
        ])
        if (cancelled) return
        setProdEmployees(
          emps.map((e) => ({
            id: e.id,
            name: e.name,
            jurisdiction: provinceToJurisdiction(e.province),
          })),
        )
        setProdCases(
          cases.map((c) => ({
            id: c.id,
            title: bi(c.title, c.title),
            employeeId: c.employeeId ?? '',
            jurisdiction: provinceToJurisdiction(c.province),
            risk: 'medium' as const,
          })),
        )
      } catch {
        if (!cancelled) {
          setProdEmployees([])
          setProdCases([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, organizationId])

  if (!data) return <GenerateSkeleton />
  if (mode === 'production' && organizationId && (prodEmployees === null || prodCases === null)) {
    return <GenerateSkeleton />
  }

  const template = data.templates.find((candidate) => candidate.id === templateId)
  if (!template) return <Navigate to={STUDIO_PATH} replace />

  const employees = mode === 'production' ? (prodEmployees ?? []) : data.employees
  const cases = mode === 'production' ? (prodCases ?? []) : data.cases

  return (
    <GenerateWizard
      key={template.id}
      template={template}
      employees={employees}
      cases={cases}
    />
  )
}
