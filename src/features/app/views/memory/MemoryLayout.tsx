import { Outlet } from 'react-router-dom'

/**
 * Advisor Memory shell. The redundant internal left-side "Memory manager"
 * navigation column is removed — the global Dutiva navigation stays, and the
 * four primary tabs (Memories / Review queue / Activity / Governance) live
 * inside the manager surface (`MemoryManagerView`). Entity deep-links
 * (People / Cases / Conversations) render in the outlet as before, reachable
 * from the memory details drawer and subject links.
 */
export function MemoryLayout() {
  return <Outlet />
}
