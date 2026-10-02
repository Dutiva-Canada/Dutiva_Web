import { createContext, useContext } from 'react'
import { writePref } from './prefs'

export type Theme = 'light' | 'dark'

/** The persisted preference: an explicit theme or 'auto' (follow the OS).
    `theme` stays the resolved value — what the document actually shows —
    so existing consumers see no change; `themePref` only differs when the
    user picked Auto. */
export type ThemePref = 'auto' | Theme

interface ThemeContextValue {
  theme: Theme
  themePref: ThemePref
  setTheme: (theme: ThemePref) => void
  toggleTheme: () => void
}

export const THEME_KEY = 'dutiva-theme'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

let warned = false

function osTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

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
  const apply = (next: ThemePref) => {
    const resolved = next === 'auto' ? osTheme() : next
    if (root) root.dataset.theme = resolved
    writePref(THEME_KEY, next)
  }
  return {
    theme,
    themePref: theme,
    setTheme: apply,
    toggleTheme: () => apply(theme === 'dark' ? 'light' : 'dark'),
  }
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
