import { createContext, useContext } from 'react'

/** Global search overlay (⌘K / topbar search) — tabbed results across entities. */
interface SearchContextValue {
  open: boolean
  openSearch: () => void
  closeSearch: () => void
}

export const SearchContext = createContext<SearchContextValue | null>(null)

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within a SearchProvider')
  return ctx
}
