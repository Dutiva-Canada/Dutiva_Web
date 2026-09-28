import { createContext, useContext } from 'react'
import { writePref } from './prefs'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const THEME_KEY = 'dutiva-theme'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

let warned = false

/**
 * Provider-less fallback. The page's colors come from the `data-theme`
 * attribute on <html> (stamped before first paint by the inline script in
 * index.html), not from React state, so a consumer that somehow renders
 * outside ThemeProvider can still read the active theme and flip it — only
 * React-driven bits (the toggle icon) lag until the next render.
 *
 * This exists so a missing provider degrades instead of taking the whole page
 * down with an uncaught render error: a broken theme toggle is a nuisance, a
 * blank site is an outage. The mistake still fails loudly in development
 * (see useTheme) and is reported to the console in production.
 */
function domTheme(): ThemeContextValue {
  const root = typeof document === 'undefined' ? null : document.documentElement
  const theme: Theme = root?.dataset.theme === 'light' ? 'light' : 'dark'
  const apply = (next: Theme) => {
    if (root) root.dataset.theme = next
    writePref(THEME_KEY, next)
  }
  return { theme, setTheme: apply, toggleTheme: () => apply(theme === 'dark' ? 'light' : 'dark') }
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx) return ctx
  if (import.meta.env.DEV) throw new Error('useTheme must be used within a ThemeProvider')
  if (!warned) {
    warned = true
    console.error('useTheme rendered outside a ThemeProvider — falling back to the DOM theme.')
  }
  return domTheme()
}
