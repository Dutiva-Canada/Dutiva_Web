# Magic-link sign-in — how it works and how to configure Supabase

The `/app` workspace is invite-only and signs in with a Supabase **magic link**
(passwordless email OTP). There is no password path. The single allowed account
is defined in `src/features/app/auth/allowedEmail.ts`.

## The intended flow

1. On `/app/welcome`, the user enters their email. `AuthProvider.signInWithEmail`
   calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo:
\`${window.location.origin}/app/auth/confirm\` } })`.
2. Supabase emails a link. The user clicks it and lands on
   **`/app/auth/confirm`** with a one-time `token_hash` in the query string.
3. `AuthConfirm` (`src/features/app/auth/AuthConfirm.tsx`) calls
   `verifyOtp({ token_hash, type })` **in the browser**, which mints the
   session and navigates to `/app/home`.

Verifying in the browser (rather than via Supabase's default
`/auth/v1/verify` GET link) is deliberate: email-provider link scanners
(Gmail/Outlook) prefetch URLs, and a GET verify link spends its one-time token
the moment a scanner touches it — the classic _"Email link is invalid or has
expired."_ A `token_hash` + `verifyOtp` link is only spent when JavaScript runs,
which scanners don't do. It also needs no PKCE code-verifier, so a link opened
on a different device than it was requested from still works.

## Required Supabase dashboard configuration

The code above only works if the Supabase project is configured to match.
These live in **Authentication** in the Supabase dashboard, **not** in this
repo, so they must be set once per project. If they drift, the magic link
silently misbehaves (see Symptoms below).

### 1. URL Configuration → Redirect URLs (allow-list)

`emailRedirectTo` is only honored if the URL is on the allow-list. **If it is
not, Supabase silently falls back to the Site URL** — which is why a click can
dump the user on the marketing home page, still signed out. Every origin the
app is served from needs an entry that covers the confirm path:

```text
https://dutiva.ca/**
http://localhost:5173/**                      # local dev (vite)
https://dutiva.vercel.app/**                  # production alias
https://dutiva-*-…-dutiva-canada.vercel.app/**  # preview deployments
```

**Wildcards match paths only if you ask them to.** `*` stops at `/`; `**`
spans separators; an entry with no path segment matches only the bare origin.
So `http://localhost:5173/auth` does _not_ allow
`http://localhost:5173/app/auth/confirm`, and neither does a bare
`https://dutiva-*-dutiva-canada.vercel.app`. This is exactly how the project
drifted: the allow-list still held exact-path entries from an older `/auth`
callback route, so local dev and the `dutiva.vercel.app` alias silently fell
back to the Site URL. Prefer the `origin/**` form.

Verified in the dashboard 2026-08-06: 19 entries, all three origins above
covered.

### 2. URL Configuration → Site URL

```text
https://dutiva.ca
```

This is the fallback target and should be the canonical apex origin (the app
already 301s `www.dutiva.ca` → `dutiva.ca` in `vercel.json`). Verified
2026-08-06.

### 3. Email Templates → Magic Link

Change the template body so the link points at the confirm route with a
`token_hash`, instead of the default `{{ .ConfirmationURL }}`:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink"> Sign in to Dutiva </a>
```

`{{ .RedirectTo }}` resolves to the `emailRedirectTo` we pass
(`…/app/auth/confirm`). Using `{{ .ConfirmationURL }}` instead keeps the
scanner-prefetch failure mode described above.

Verified 2026-08-06: the live template is on `.RedirectTo` / `.TokenHash`.

## Client-side safety net

Even with the config correct, a redirect can still land on the site root (an
older email, an implicit-flow fragment, a not-yet-allow-listed preview origin).
An inline script in `index.html` catches any auth artifact
(`token_hash` / `access_token` / `error…`) that lands on a non-`/app` URL and
forwards it — query and fragment intact — to `/app/auth/confirm`. This makes the
link resilient, but it is a net, not a substitute for the config above (it can't
stop a scanner from burning a `{{ .ConfirmationURL }}` token before the click).

## Symptoms → cause

| What the user sees                                                         | Most likely cause                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Click lands on `dutiva.ca` home page, still signed out                     | Confirm URL missing from **Redirect URLs**, so Supabase used the **Site URL**. Fix §1 (the safety net now also forwards these). |
| "Email link is invalid or has expired" without clicking, or on first click | Template still uses `{{ .ConfirmationURL }}`; a scanner burned the token. Fix §3.                                               |
| No email arrives                                                           | Email not the allowed account (`allowedEmail.ts`), or SMTP/rate limits in Supabase Auth.                                        |
| Confirm page shows "couldn't confirm"                                      | Token genuinely expired/reused, or `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` not set in the deployment.                    |

## Environment variables

The browser client (`src/lib/supabaseClient.ts`) needs, at build time:

```text
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_…
```

Without them, `supabase` is `null`, sign-in is disabled, and auth-gated features
degrade to their signed-out state.

## Session token storage & the XSS blast radius

The security audit (2026-08-08) flagged that the Supabase session — access
**and refresh** token — persists in `localStorage` (the supabase-js default,
`src/lib/supabaseClient.ts` passes no `auth` storage option). Any successful
XSS could therefore read the refresh token and mint sessions indefinitely:
durable account takeover, not just a stolen short-lived session.

**Decision (2026-08-08): keep `localStorage`; mitigate the impact, don't
move the tokens.** For a client-only SPA there is no storage that removes
this risk — `sessionStorage` is equally JS-readable (XSS still steals it) and
only costs persistence UX; in-memory logs the user out on every refresh; any
"encrypted" storage keeps its key in JS too, so XSS gets both. The only real
fix is to stop tokens being JS-readable at all, which means **httpOnly,
Secure, SameSite cookies set by a server** — an auth proxy or an SSR layer
this static SPA doesn't have. That is a scoped project, not a reactive
change, and rushing it risks locking users out.

What actually reduces the risk, and is in place or recommended:

- **Prevent the XSS in the first place** (the dominant control, already
  strong): no `dangerouslySetInnerHTML` in the app; model output renders
  through `react-markdown` with **no `rehype-raw`** (raw HTML never
  rendered) and a URL-protocol allow-list that strips `javascript:`; the
  chart block is `JSON.parse`, never `eval`.
- **Constrain exfiltration with CSP** — shipped 2026-08-08 (Report-Only;
  promote to enforcing per `docs/SECURITY_HEADERS.md`). A tight `connect-src`
  is what limits where a stolen token could be sent.
- **Shrink the value of a stolen refresh token** — _owner action:_ enable
  **refresh-token rotation with reuse detection** in the Supabase dashboard
  (Authentication → Sessions). With rotation on, a replayed refresh token
  revokes the session, so a token lifted from storage is far less durable.
- **Revisit the cookie-based auth project** if/when the app gains a server
  rendering or proxy layer — that is the point at which the clean fix becomes
  available without new infrastructure just for auth.
