import type { Bi } from '@/i18n/core'
import { shellMessages as M } from '@/i18n/messages/shell'

/** Strip `/app`, `/demo`, or `/fr/demo` prefix for segment parsing. */
function workspaceSegments(pathname: string): string[] {
  return pathname
    .replace(/^\/(?:app|demo|fr\/demo)\/?/, '')
    .split('/')
    .filter(Boolean)
}

/**
 * The route vocabulary of the workspace: which `/app/<segment>` maps to which
 * heading, and the two path predicates that go with it. Pure — a route string
 * in, a message out.
 *
 * Split out of navConfig.ts, which cannot be pure: its sidebar badges count
 * open cases and low-sentiment employees from the demo fixtures, so it
 * value-imports `@/data`. ModeGate needs only a label, and ModeGate is
 * reachable from `routes.tsx` without a lazy boundary in between (routes →
 * appViews → ModeGate) — so importing it from navConfig put 113kB of Northgate
 * fixtures in the eager entry graph, modulepreloaded on every marketing page.
 *
 * Keep this module free of `@/data`. `scripts/check-entry-graph.mjs` fails the
 * build if the fixtures come back.
 */

/* Topbar / mobile-topbar route titles (prototype `viewLabels`). */
export const VIEW_LABELS: Record<string, Bi> = {
  home: M.shell_v_home,
  advisor: M.shell_v_advisor,
  workflows: M.shell_v_workflows,
  cases: M.shell_v_cases,
  employees: M.shell_v_employees,
  hiring: M.shell_nav_hiring,
  compliance: M.shell_v_compliance,
  policies: M.shell_v_policies,
  analytics: M.shell_v_analytics,
  templates: M.shell_v_templates,
  knowledge: M.shell_v_knowledge,
  settings: M.shell_v_settings,
  compensation: M.shell_v_compensation,
  wellbeing: M.shell_v_wellbeing,
  communications: M.shell_v_communications,
  planning: M.shell_nav_planning,
}

/** Active when the route is the item or one of its children (/app/cases/:id …). */
export function isNavActive(to: string, pathname: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`)
}

/* Studio's subroutes (catalogue → generate flow), as opposed to the
   Repository (index + :docId). Single source of truth for both the topbar
   title and the Repository/Studio tab strip (DocumentsLayout.tsx). */
const DOCLIB_STUDIO_SUBPATHS = new Set(['studio', 'templates', 'generate'])

export function isDoclibStudioPath(pathname: string): boolean {
  const parts = workspaceSegments(pathname)
  return parts[0] === 'documents' && DOCLIB_STUDIO_SUBPATHS.has(parts[1] ?? '')
}

/**
 * Like `viewLabelFor`, but always the module's own label — no fixture-employee
 * name special case. Used by ModeGate to title production empty states, where
 * surfacing a fixture person's name would itself be a demo-data leak.
 */
export function moduleLabelFor(pathname: string): Bi {
  const segment = workspaceSegments(pathname)[0] ?? ''
  if (segment === 'documents') return M.shell_nav_library
  if (segment === 'planning') return M.shell_nav_planning
  return VIEW_LABELS[segment] ?? M.shell_v_home
}
