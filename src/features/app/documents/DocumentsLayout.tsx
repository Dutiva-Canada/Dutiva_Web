import { Link, Outlet, useLocation } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { isDoclibStudioPath } from '@/features/app/shell/navConfig'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  useWorkspaceRoot,
  workspacePath,
  workspaceSegments,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import { AppPage } from '@/features/app/shell/AppPage'
import { DoclibProvider } from './DoclibProvider'
import { useDoclib } from './doclibContext'
import { workspaceRoles } from './data'
import type { WorkspaceRole } from './data'

/**
 * Tab switcher for /app/documents/*.
 *
 * Demo: Templates (legacy HR Library) | Library | Studio — three real
 * destinations. Production: Studio | Library only — the Templates tab used
 * to redirect to Studio, so two tabs pointed at one place.
 */
function DocumentsTabs() {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const { root } = useWorkspaceRoot()
  const { mode } = useWorkspaceMode()
  const production = mode === 'production'
  const segments = workspaceSegments(pathname)
  const studio = isDoclibStudioPath(pathname)
  const hrLibrary = !production && segments[0] === 'documents' && segments[1] === 'hr-library'
  const library = segments[0] === 'documents' && !hrLibrary && !studio
  const linkClass = (active: boolean) =>
    `shrink-0 rounded-none border-b-2 px-[14px] py-[9px] font-sans text-[13px] font-semibold whitespace-nowrap ${
      active ? 'border-navy text-text' : 'border-transparent text-text-muted'
    }`

  if (production) {
    return (
      <nav
        aria-label={x(M.shell_nav_library)}
        className="mb-[16px] flex gap-[2px] overflow-x-auto border-b border-border"
      >
        <Link
          to={workspacePath(root, 'documents/studio')}
          aria-current={studio ? 'page' : undefined}
          className={linkClass(studio)}
        >
          {x(M.shell_hr_studio_studio)}
        </Link>
        <Link
          to={workspacePath(root, 'documents')}
          aria-current={library ? 'page' : undefined}
          className={linkClass(library)}
        >
          {x(M.shell_hr_studio_library)}
        </Link>
      </nav>
    )
  }

  return (
    <nav
      aria-label={x(M.shell_nav_library)}
      className="mb-[16px] flex gap-[2px] overflow-x-auto border-b border-border"
    >
      <Link
        to={workspacePath(root, 'documents/hr-library')}
        aria-current={hrLibrary ? 'page' : undefined}
        className={linkClass(hrLibrary)}
      >
        {x(M.shell_hr_studio_templates)}
      </Link>
      <Link
        to={workspacePath(root, 'documents')}
        aria-current={library ? 'page' : undefined}
        className={linkClass(library)}
      >
        {x(M.shell_hr_studio_library)}
      </Link>
      <Link
        to={workspacePath(root, 'documents/studio')}
        aria-current={studio ? 'page' : undefined}
        className={linkClass(studio)}
      >
        {x(M.shell_hr_studio_studio)}
      </Link>
    </nav>
  )
}

/**
 * Shared frame for every /app/documents route: mounts the feature provider
 * and the "Viewing as" bar — the prototype's permission-demo control (kept
 * per the handoff; real auth is out of scope for the demo phase). Hidden in
 * production: org membership role from useWorkspaceMode() is the real gate.
 */
function ViewingAsBar() {
  const { t, x } = useI18n()
  const { role, setRole } = useDoclib()
  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
        <UserRound size={13} aria-hidden="true" />
        {t('doclib_app_viewingAs')}
      </span>
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as WorkspaceRole)}
        aria-label={t('doclib_app_viewingAs')}
        className="max-w-[190px] truncate rounded-[9px] border border-border bg-surface px-[10px] py-[5px] text-[12.5px] font-semibold text-text"
      >
        {workspaceRoles.map((info) => (
          <option key={info.key} value={info.key}>
            {x(info.label)}
          </option>
        ))}
      </select>
    </div>
  )
}

function DocumentsChrome() {
  const { mode } = useWorkspaceMode()
  return (
    <>
      <DocumentsTabs />
      {mode === 'demo' && <ViewingAsBar />}
      <Outlet />
    </>
  )
}

export function DocumentsLayout() {
  return (
    <DoclibProvider>
      {/* Shared scroll chrome so tabs and Studio content share one left edge.
          width=studio (1240) matches the catalogue layout budget. */}
      <AppPage width="studio" responsivePad>
        <DocumentsChrome />
      </AppPage>
    </DoclibProvider>
  )
}
