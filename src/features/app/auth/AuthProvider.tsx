/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useI18n } from '@/i18n/context'
import { authMessages as M } from '@/i18n/messages/auth'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { supabase } from '@/lib/supabaseClient'
import { AuthContext } from './authContext'
import type { AuthStatus } from './authContext'

/**
 * Tracks the Supabase auth session (magic-link only) and exposes it via
 * useAuth(). Without VITE_SUPABASE_URL/ANON_KEY configured, `supabase` is
 * null and this stays permanently signed-out — features that read it
 * degrade to their signed-out state rather than erroring.
 */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const { x } = useI18n()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'signed-out')
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return

    let fromAuthListener = false

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (fromAuthListener) return
        setSession(data.session)
        setStatus(data.session ? 'signed-in' : 'signed-out')
      })
      .catch((error) => {
        if (fromAuthListener) return
        console.error('auth: getSession failed —', error)
        setStatus('signed-out')
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      fromAuthListener = true
      setSession(nextSession)
      setStatus(nextSession ? 'signed-in' : 'signed-out')
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || status !== 'signed-in') {
      setAuthorized(null)
      return
    }
    /* Staff domain is admitted in SQL (0114); short-circuit here so the UI
       unlocks even if the membership RPC is briefly stale or unreachable. */
    if (isInternalDutivaAccount(session?.user.email)) {
      setAuthorized(true)
      return
    }
    let cancelled = false
    setAuthorized(null)
    supabase.rpc('current_user_is_workspace_member').then(
      ({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('auth: workspace membership check failed —', error)
          setAuthorized(false)
          return
        }
        setAuthorized(data === true)
      },
      (error) => {
        if (cancelled) return
        console.error('auth: workspace membership check rejected —', error)
        setAuthorized(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [status, session?.user.id, session?.user.email])

  const signInWithEmail = useCallback(
    async (email: string, opts?: { name?: string }) => {
      if (!supabase) return x(M.auth_not_configured)
      /* The sign-up tab collects a display name; carry it as user metadata on
         the same passwordless OTP call. signInWithOtp already creates the user
         on first sign-in, so "sign up" and "sign in" are the same magic-link
         action — the name just personalizes the created account. */
      const name = opts?.name?.trim()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        /* Land the magic link on the dedicated confirm route, which exchanges
           the token via verifyOtp (see AuthConfirm). A clean same-origin URL —
           not window.location.href — keeps the `#signin` fragment and any
           transient state out of the redirect target. Pair with a Supabase
           email template pointing at {{ .RedirectTo }}?token_hash=…&
           type=magiclink so scanner prefetches can't burn the one-time token. */
        options: {
          emailRedirectTo: `${window.location.origin}/app/auth/confirm`,
          ...(name ? { data: { full_name: name } } : {}),
        },
      })
      if (error) {
        /* Don't surface Supabase's raw English error.message — it would leak
           into the French UI. Log the specific failure, show a localized
           generic instead. */
        console.error('auth: magic-link request failed —', error)
        return x(M.auth_generic_error)
      }
      setStatus('sent-link')
      return undefined
    },
    [x],
  )

  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      if (!supabase) return x(M.auth_not_configured)
      /* People paste codes with the spaces the mail client renders. */
      const token = code.replace(/\s+/g, '')

      /* Which OTP type the emailed code carries depends on whether GoTrue
         treated the request as a first-time signup or a sign-in for an
         existing account — signInWithOtp creates the user on first use, so
         both happen on this one form. A type mismatch is a lookup miss, not a
         spend: the token survives a wrong guess, so trying the sign-in type
         first and falling back costs nothing and saves the new-account case
         from an unexplained failure. */
      let lastError: unknown
      for (const type of ['email', 'signup'] as const) {
        const { error } = await supabase.auth.verifyOtp({ email, token, type })
        if (!error) return undefined
        lastError = error
      }

      /* Same discipline as signInWithEmail: log the provider's English detail,
         show the localized message. */
      console.error('auth: sign-in code verification failed —', lastError)
      return x(M.auth_code_error)
    },
    [x],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({ status, session, authorized, signInWithEmail, verifyEmailCode, signOut }),
    [status, session, authorized, signInWithEmail, verifyEmailCode, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
