/**
 * Session-scoped progress for the empty-production Home checklist.
 * Studio / guided-process steps complete when the user opens those surfaces;
 * “add a person” is derived from live employee count (and graduates Home off
 * the empty state once any records exist — see HomeProductionView).
 *
 * No new table: sessionStorage only, keyed by organizationId.
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
  `dutiva.emptyWorkspaceOnboarding.v1.${organizationId}`

export function readEmptyWorkspaceProgress(
  organizationId: string | null,
): EmptyWorkspaceSessionProgress {
  if (!organizationId || typeof sessionStorage === 'undefined') return emptyProgress()
  try {
    const raw = sessionStorage.getItem(storageKey(organizationId))
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

function writeProgress(
  organizationId: string,
  next: EmptyWorkspaceSessionProgress,
): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(storageKey(organizationId), JSON.stringify(next))
  } catch {
    /* Quota / private mode — checklist simply won't persist this session. */
  }
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
