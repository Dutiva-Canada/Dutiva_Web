import { readPref, writePref } from '@/lib/prefs'

/**
 * Device-local progress for the production setup path (empty Home checklist
 * + the Keep-going card that survives first records). The guided-process
 * step completes when the user opens the Workflows catalog or a flow runner;
 * every other step derives from live org data — see setupPath.ts.
 *
 * localStorage (not sessionStorage): the path spans days, and the card would
 * nag every session if soft marks reset. Keys are org-scoped; no new table.
 * See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */

export type EmptyWorkspaceSessionProgress = {
  studioVisited: boolean
  workflowVisited: boolean
}

const emptyProgress = (): EmptyWorkspaceSessionProgress => ({
  studioVisited: false,
  workflowVisited: false,
})

const storageKey = (organizationId: string): string =>
  `dutiva.emptyWorkspaceOnboarding.v2.${organizationId}`

export function readEmptyWorkspaceProgress(
  organizationId: string | null,
): EmptyWorkspaceSessionProgress {
  if (!organizationId) return emptyProgress()
  try {
    const raw = readPref(storageKey(organizationId), '')
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<EmptyWorkspaceSessionProgress>
    return {
      studioVisited: parsed.studioVisited === true,
      workflowVisited: parsed.workflowVisited === true,
    }
  } catch {
    return emptyProgress()
  }
}

function writeProgress(organizationId: string, next: EmptyWorkspaceSessionProgress): void {
  writePref(storageKey(organizationId), JSON.stringify(next))
}

export function markEmptyWorkspaceStudioVisited(organizationId: string | null): void {
  if (!organizationId) return
  const current = readEmptyWorkspaceProgress(organizationId)
  if (current.studioVisited) return
  writeProgress(organizationId, { ...current, studioVisited: true })
}

export function markEmptyWorkspaceWorkflowVisited(organizationId: string | null): void {
  if (!organizationId) return
  const current = readEmptyWorkspaceProgress(organizationId)
  if (current.workflowVisited) return
  writeProgress(organizationId, { ...current, workflowVisited: true })
}

/**
 * Keep-going card dismissal — device-local, org-scoped. Dismissal only hides
 * the card on the populated Home; the empty Home always shows the full path.
 */
const dismissedKey = (organizationId: string): string =>
  `dutiva.setupCard.dismissed.v1.${organizationId}`

export function isSetupCardDismissed(organizationId: string | null): boolean {
  if (!organizationId) return false
  return readPref(dismissedKey(organizationId), '') === '1'
}

export function dismissSetupCard(organizationId: string | null): void {
  if (!organizationId) return
  writePref(dismissedKey(organizationId), '1')
}
