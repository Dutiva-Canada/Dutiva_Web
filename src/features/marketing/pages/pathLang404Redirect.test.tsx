/**
 * Unknown-slug redirects must follow the URL locale (pathLang), not the UI
 * language preference. Production marketing routes wrap ForcedLangProvider so
 * the two usually match; LangProvider (preference-scoped) can diverge — the
 * redirect still has to stay on the French or English index matching the URL.
 */
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ForcedLangProvider } from '@/i18n/ForcedLangProvider'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { GuideArticlePage } from './ArticlePage'
import { HelpArticlePage } from './HelpArticlePage'
import { PolicyPage } from './PolicyPage'

function Loc() {
  const { pathname } = useLocation()
  return <div data-testid="loc">{pathname}</div>
}

function renderPref({
  route,
  path,
  element,
}: {
  route: string
  path: string
  element: ReactElement
}) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={element} />
            <Route path="/guides" element={<Loc />} />
            <Route path="/fr/guides" element={<Loc />} />
            <Route path="/help" element={<Loc />} />
            <Route path="/fr/aide" element={<Loc />} />
            <Route path="/legal" element={<Loc />} />
            <Route path="/fr/juridique" element={<Loc />} />
          </Routes>
        </MemoryRouter>
      </LangProvider>
    </ThemeProvider>,
  )
}

function renderForced({
  route,
  path,
  lang,
  element,
}: {
  route: string
  path: string
  lang: 'en' | 'fr'
  element: ReactElement
}) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>
        <ForcedLangProvider lang={lang}>
          <Routes>
            <Route path={path} element={element} />
            <Route path="/guides" element={<Loc />} />
            <Route path="/fr/guides" element={<Loc />} />
            <Route path="/help" element={<Loc />} />
            <Route path="/fr/aide" element={<Loc />} />
            <Route path="/legal" element={<Loc />} />
            <Route path="/fr/juridique" element={<Loc />} />
          </Routes>
        </ForcedLangProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('404 redirects follow URL locale', () => {
  it('keeps a French guide 404 on /fr/guides even when UI lang is English', () => {
    renderPref({
      route: '/fr/guides/not-a-real-guide',
      path: '/fr/guides/:slug',
      element: <GuideArticlePage />,
    })
    expect(screen.getByTestId('loc')).toHaveTextContent('/fr/guides')
  })

  it('keeps a French help 404 on /fr/aide even when UI lang is English', () => {
    renderPref({
      route: '/fr/aide/pas-un-vrai-article',
      path: '/fr/aide/:slug',
      element: <HelpArticlePage />,
    })
    expect(screen.getByTestId('loc')).toHaveTextContent('/fr/aide')
  })

  it('keeps a French legal 404 on /fr/juridique even when UI lang is English', () => {
    renderPref({
      route: '/fr/juridique/pas-un-vrai-doc',
      path: '/fr/juridique/:slug',
      element: <PolicyPage />,
    })
    expect(screen.getByTestId('loc')).toHaveTextContent('/fr/juridique')
  })

  it('keeps ForcedLangProvider French guide 404 on /fr/guides', () => {
    renderForced({
      route: '/fr/guides/not-a-real-guide',
      path: '/fr/guides/:slug',
      lang: 'fr',
      element: <GuideArticlePage />,
    })
    expect(screen.getByTestId('loc')).toHaveTextContent('/fr/guides')
  })
})
