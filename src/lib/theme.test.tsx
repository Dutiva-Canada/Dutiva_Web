import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './theme'
import { useTheme } from './themeContext'

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  )
}

/** index.html ships a light/dark `<meta name="theme-color">` pair for iOS
 *  Safari's chrome tint. jsdom starts with an empty head, so install a stand-in
 *  pair — seeded with a colour matching neither theme, so a passing assertion
 *  can only mean the provider wrote it. */
function installThemeColorTags(): void {
  for (const media of ['(prefers-color-scheme: light)', '(prefers-color-scheme: dark)']) {
    const tag = document.createElement('meta')
    tag.setAttribute('name', 'theme-color')
    tag.setAttribute('media', media)
    tag.setAttribute('content', '#ff00ff')
    document.head.append(tag)
  }
}

function themeColors(): readonly string[] {
  return [...document.querySelectorAll('meta[name="theme-color"]')].map(
    (tag) => tag.getAttribute('content') ?? '',
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false } as MediaQueryList))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => tag.remove())
  })

  it('defaults to light and stamps data-theme on <html>', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('uses the operating system theme when no preference has been persisted', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true } as MediaQueryList))
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('toggles, persists, and re-stamps the attribute', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(localStorage.getItem('dutiva-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('honours the persisted theme on mount', () => {
    localStorage.setItem('dutiva-theme', 'light')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  /* The `theme-color` tags drive the browser chrome around the page — iOS
     Safari tints its status/toolbar area from them. They are media-scoped to
     the OS preference in index.html, so a persisted theme that disagrees only
     lands if the provider re-points every tag. */
  it('points every theme-color tag at the theme resolved on mount', () => {
    localStorage.setItem('dutiva-theme', 'light')
    installThemeColorTags()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(themeColors()).toEqual(['#f6f2e9', '#f6f2e9'])
  })

  it('re-stamps theme-color on toggle so the chrome follows the page', async () => {
    localStorage.setItem('dutiva-theme', 'light')
    installThemeColorTags()
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(themeColors()).toEqual(['#060f1e', '#060f1e'])
  })
})

describe('useTheme without a provider', () => {
  it('fails loudly in development', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
    consoleError.mockRestore()
  })

  /* In production a missing provider must degrade, not blank the site: the
     consumer reads the theme off <html> and can still flip it. */
  it('falls back to the DOM theme in production', async () => {
    vi.stubEnv('DEV', false)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    document.documentElement.dataset.theme = 'light'
    try {
      const user = userEvent.setup()
      render(<Probe />)
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      await user.click(screen.getByRole('button', { name: 'toggle' }))
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('dutiva-theme')).toBe('dark')
      expect(consoleError).toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
      vi.unstubAllEnvs()
    }
  })
})
