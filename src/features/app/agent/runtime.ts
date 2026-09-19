/**
 * Module context bindings — how a tool's executor reaches the module's live
 * data seam.
 *
 * Each module that exposes agent tools binds its data context while mounted
 * (for CRM, the `UseCrmDataReturn` the workspace already holds). The binding
 * is what makes "the agent does what the user could do" literal: the tool
 * calls the same functions the UI calls, on the same state, under the same
 * session — nothing bypasses the module's own seam.
 *
 * Bindings are intentionally mount-scoped. Writing to a module's persistence
 * behind React's back would diverge from mounted state, so a module that
 * isn't mounted reports `module_unavailable` and the card asks the user to
 * open it first. Supabase-backed modules whose productionApi is call-
 * stateless can register a standing binding instead — same contract.
 */

const bindings = new Map<string, unknown>()

/**
 * Register the module's live context. Returns an unbind — modules call it
 * from a `useEffect` cleanup so the executor never touches a stale snapshot.
 */
export function bindModuleContext(module: string, context: unknown): () => void {
  bindings.set(module, context)
  return () => {
    if (bindings.get(module) === context) bindings.delete(module)
  }
}

export function moduleContext(module: string): unknown {
  return bindings.get(module)
}

/** Test hook. */
export function resetModuleContextsForTest(): void {
  bindings.clear()
}
