/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { Suspense, lazy } from 'react'
import { LangProvider } from '@/i18n/LangProvider'
import { AppBootSkeleton } from '@/features/app/shell/AppBootSkeleton'
import { ForcedWorkspaceLangProvider } from '@/i18n/ForcedWorkspaceLangProvider'
import type { Lang } from '@/i18n/core'
import { AppProviders } from '@/features/app/AppProviders'
import { PublicDemoProvider } from '@/features/app/workspaceRoot/PublicDemoProvider'

/**
 * Lazily composed /app route elements. The provider stack (Auth → Supabase
 * client, workspace mode, toasts, rail, …) lives in this chunk rather than
 * the route table, so marketing visitors never download the app
 * dependencies. Language on the app surface follows the persisted
 * preference (LangProvider), not the URL — private routes have no locale
 * URLs and are noindex.
 */
const EntryStage = lazy(() =>
  import('@/features/app/shell/EntryStage').then((m) => ({ default: m.EntryStage })),
)
const AppShell = lazy(() =>
  import('@/features/app/shell/AppShell').then((m) => ({ default: m.AppShell })),
)
const RequireAdminSession = lazy(() =>
  import('@/features/app/auth/RequireAdminSession').then((m) => ({
    default: m.RequireAdminSession,
  })),
)
const AuthConfirm = lazy(() =>
  import('@/features/app/auth/AuthConfirm').then((m) => ({ default: m.AuthConfirm })),
)

/* This chunk is the gateway for every /app* route, and each of its children
   is one more lazy hop — warm the small ones the moment it evaluates so the
   auth check and the next render never wait on a serial round trip. Same
   specifiers as the lazy() calls above, so those resolve from the in-flight
   import rather than starting a second fetch. AppShell is deliberately NOT
   warmed here: it pulls the whole workspace dependency tree, and a signed-out
   visitor only ever needs the welcome gate. RequireAdminSession warms it
   itself once a session is confirmed, parallel with the membership check. */
const warm = (p: Promise<unknown>) => {
  p.catch(() => {})
}
void warm(import('@/features/app/auth/RequireAdminSession'))
void warm(import('@/features/app/shell/EntryStage'))
void warm(import('@/features/app/auth/AuthConfirm'))

/** /app/auth/confirm — magic-link landing: verifies the token_hash (see
    AuthConfirm) and enters the workspace. Ungated by design — the visitor is
    mid-sign-in and has no session yet. */
export function AppAuthConfirm() {
  return (
    <LangProvider>
      <Suspense fallback={null}>
        <AuthConfirm />
      </Suspense>
    </LangProvider>
  )
}

/** /app/welcome — app entry stage, the sign-in gate (invite-only). */
export function AppWelcome() {
  return (
    <LangProvider>
      <AppProviders>
        <Suspense fallback={<AppBootSkeleton />}>
          <EntryStage />
        </Suspense>
      </AppProviders>
    </LangProvider>
  )
}

/** /app — workspace shell; RequireAdminSession bounces anyone who isn't the
    one allowed account back to /app/welcome. */
export function Workspace() {
  return (
    <LangProvider>
      <AppProviders>
        <Suspense fallback={<AppBootSkeleton />}>
          <RequireAdminSession>
            <AppShell />
          </RequireAdminSession>
        </Suspense>
      </AppProviders>
    </LangProvider>
  )
}

/** /demo — public read-only Northgate preview with guided tour rail. */
export function PublicDemoWorkspace({ root = '/demo' }: { readonly root?: '/demo' | '/fr/demo' }) {
  const lang: Lang = root === '/fr/demo' ? 'fr' : 'en'
  return (
    <ForcedWorkspaceLangProvider lang={lang}>
      <PublicDemoProvider root={root}>
        <AppProviders>
          <Suspense fallback={null}>
            <AppShell />
          </Suspense>
        </AppProviders>
      </PublicDemoProvider>
    </ForcedWorkspaceLangProvider>
  )
}
