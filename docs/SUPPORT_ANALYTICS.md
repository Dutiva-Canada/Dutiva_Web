# Support Analytics

> **D2 — decided 2026-08-06.** Full support funnel, workspace-scoped (not
> user-scoped), 90-day raw retention with forever aggregates, first-party
> Supabase sink pinned to ca-central-1.
>
> **Update 2026-08-08.** The consent banner now ships
> (`src/features/marketing/analytics/ConsentBanner.tsx`), and BOTH sinks are
> gated behind it — the first-party Supabase sink as well as GA4. This is a
> more conservative posture than D2's original "first-party needs no consent":
> because every event carries a daily-rotated visitor id that profiles a visit,
> collection is now off by default under Quebec Law 25 s. 8.1. See §2 Legal
> basis. The final legal basis is the owner's to confirm with counsel; the code
> takes the safe default.

## 1. What this is

Support analytics measures the full support funnel: Help Centre searches,
article views, helpfulness votes, ticket submissions, and ticket status
changes. The privacy model was decided before any code was written —
TODO.md D2 explicitly deferred this work to the owner because "collecting
customer-behaviour data shouldn't be designed speculatively."

### Decisions

| Question | Decision | Rationale |
| --- | --- | --- |
| Scope | Full support funnel | Help Centre + deflection + ticket outcomes. The seam (`recordHelpfulness`) was already there; extending it to the full funnel is marginal work once the sink exists. |
| Identification | Workspace-scoped | Anonymous Help Centre events carry a daily-rotated opaque visitor id. Authenticated ticket events carry `workspace_id` (the organization), never `user_id`. Lets you say "Northgate searched X 12 times" without naming the person. |
| Retention | 90 days raw, forever aggregate | Raw rows kept 90 days for debugging, then auto-deleted by the daily rollup job. Daily aggregates kept indefinitely — they no longer identify an individual in a reasonably foreseeable way (per the Data Retention Policy § Anonymization). |
| Sink | Both (phased) | Supabase edge function for product/deflection events that need joining to tickets (first-party, ca-central-1, no third-party cookies). GA4 for marketing-side page analytics. Both are now consent-gated behind the shipped banner (see the 2026-08-08 update above). |

## 2. Privacy model

### What is collected

| Event type | Fields | Identification |
| --- | --- | --- |
| `helpfulness_vote` | `article_slug`, `vote_value` ('yes'/'no') | Anonymous (daily visitor id) |
| `help_search` | `search_query` (max 200 chars), `search_result_count` | Anonymous (daily visitor id) |
| `help_article_view` | `article_slug` | Anonymous (daily visitor id) |
| `ticket_submitted` | `ticket_reference`, `ticket_category`, `ticket_source` | Workspace-scoped (`workspace_id`) |
| `ticket_status_changed` | `ticket_reference`, `ticket_category`, `ticket_source` (new status) | Workspace-scoped (`workspace_id`) |

All events also carry `locale` ('en' or 'fr') and `occurred_at`.

### What is NOT collected

- **No user ids.** Ever. The `anonymous_visitor_id` is a daily-rotated random
  UUID in localStorage — it can't be joined to an account.
- **No ticket body text.** We store the `public_reference` (e.g. `SUP-00042`),
  not the ticket uuid — so analytics can't be joined back to the ticket body
  without already having admin DB access.
- **No document contents, chat transcripts, employee records, or HR case
  details.** The Cookie Policy already commits to this; the schema enforces
  it by not having fields for it.
- **No IP addresses.** No event row holds an IP or anything derived from one,
  and the edge function never logs one. Since `0051` the rate limiter does keep
  a keyed hash — HMAC-SHA256 of the IP under a required secret pepper, never a
  raw address and never a committed default — in `support_analytics_rate_limit`,
  a table decoupled from the events and holding no event content. It is swept
  for all sources on every ingest and purged hourly by `0052`, so a hash
  normally lives about a minute. Same treatment, and the same careful claim, as
  `client_error_rate_limit` in `0019`: a minimized, short-lived pseudonymous
  value used solely for rate limiting — not claimed to be fully anonymous.
- **No third-party cookies** (for the Supabase sink). GA4 is separate.
- **Nothing at all until the visitor consents.** Both sinks are gated on
  `hasAnalyticsConsent()` — no consent, no event queued, and no visitor id
  ever created (see the Legal basis note below).

### Legal basis

The first-party support analytics sink is described by the Privacy Policy
("measure aggregate feature usage, troubleshoot errors, prevent abuse,
enforce rate limits, and monitor service performance"), the Cookie Policy,
and the Data Retention Policy, all of which describe what is collected.

D2 originally reasoned that this first-party sink needed no consent banner —
first-party, no third-party cookies, data in Canada, within the legitimate
purpose of operating the service. As of 2026-08-08 the code takes the more
conservative position and gates it on consent anyway. The reason is the
daily-rotated `anonymous_visitor_id`: it exists to stitch a single visit's
search → article → vote sequence, which is *profiling a visit* within the
meaning of Quebec Law 25 s. 8.1 — technology whose identifying/profiling
functions must be deactivated by default. Off-by-default is also the safer
choice for a commercial operator and is reversible: if counsel later
concludes the pseudonymous first-party sink qualifies as legitimate-interest
collection that needs no opt-in, the gate is one line in `trackEvent()`.
**This is a legal judgment the owner should confirm with counsel; the code
does not assert it is settled.**

GA4 is the clearer case — a third-party subprocessor that sets cookies, so it
requires consent under Law 25 regardless. Both now load only after the
visitor accepts through the consent banner.

## 3. Architecture

```text
Client (browser)
  ├─ trackEvent() ──→ hasAnalyticsConsent()? ──→ queue (max 10 events or 2s debounce)
  │                     (no consent → no-op, no visitor id)
  │                     │
  │                     ↓ pagehide / threshold
  │                  fetch(keepalive) → support-analytics-event edge function
  │                                          │ (ca-central-1, peppered IP hash)
  │                                          ↓
  │                       ingest_support_analytics_events() — limit + insert,
  │                             one transaction, 120 events/min per source
  │                                          │
  │                                          ↓
  │                                  support_analytics_events (raw, 90-day)
  │                                          │
  │                                          ↓ daily rollup (01:00 UTC, pg_cron)
  │                                  support_analytics_daily (aggregate, forever)
  │
  └─ loadConsentedTags() ──→ GTM (`VITE_GTM_CONTAINER_ID`) or GA4 (`VITE_GA_MEASUREMENT_ID`)
                     + hasAnalyticsConsent()
                     (loads only after the visitor accepts)
```

### Components

- **Migration `0047`**: `support_analytics_events` (raw), `support_analytics_daily`
  (aggregate), `support_analytics_rollup()` (daily rollup + retention),
  `support_analytics_status()` (operational visibility), pg_cron schedule.
- **Migration `0051`**: `support_analytics_rate_limit` + the
  `ingest_support_analytics_events()` RPC. The endpoint runs `verify_jwt = false`
  and has to (§3, client bullet), so the limiter is the only thing standing
  between an anonymous caller and fabricated funnel data. Same shape as `0019`:
  keyed IP hash, transaction-scoped advisory lock, all-sources sweep,
  `security definer` granted to `service_role` alone. One difference — it counts
  **events, not requests**, because a request may carry 50.
- **Migration `0052`**: `purge_support_analytics_rate_limit()`, scheduled hourly.
  `0051`'s in-RPC sweep only runs when a request arrives, so on a quiet endpoint
  the last caller's hashes stay until somebody posts again; the hourly job is
  what actually bounds them. `0052` also widens `support_analytics_status()` with
  three limiter columns so "it is scheduled" is a query rather than a belief.
- **`_shared/supportAnalytics.ts`**: Pure event validation — `parseEvent()`
  validates and normalizes an incoming event payload. Same discipline as
  `scheduledCalls.ts` and `lawUpdateDigest.ts` (no I/O, callers pass `now`).
- **`support-analytics-event` edge function**: Receives a batch of events (max
  50), validates each with `parseEvent()`, and hands the valid ones to
  `ingest_support_analytics_events()` — the limit check and the insert are one
  transaction, never two round-trips. Pinned to ca-central-1 via
  `forceFunctionRegion`. Requires `SUPABASE_SERVICE_ROLE_KEY` **and** a pepper
  (`ERROR_REPORT_SALT`, falling back to `SUPPORT_NOTIFY_SECRET`) for the IP hash;
  it **fails closed with a 500 on every request** if the pepper is missing,
  because the alternative is a committed default an attacker could reproduce.
  A rate-limited batch is not an error: it returns `200 {inserted: 0,
  rate_limited: true}` and logs, since the client swallows errors by design and
  an error status would only invite retry storms.
- **`src/features/support/analytics/supportAnalytics.ts`**: Client module —
  `trackEvent()` queues events, `flush()` sends them as a batch via
  `fetch(keepalive)`, `installAnalyticsFlush()` registers a `pagehide`
  flush. Same inert-unless-configured discipline as `errorReporting`:
  inactive in dev, tests, and when `VITE_SUPABASE_URL` is unset — and, on top
  of that, `trackEvent()` no-ops until `hasAnalyticsConsent()` is true.
- **`src/features/support/analytics/visitorId.ts`**: Daily-rotated opaque
  visitor id in localStorage. Same storage-availability guard as
  `helpFeedback.ts`. Only ever called from inside a consented `trackEvent()`,
  so no id is created for a visitor who has not opted in.
- **`src/lib/analyticsConsent.ts`**: The shared consent state
  (`dutiva.analytics.consent`), read by both GA4 and the first-party sink.
  `hasAnalyticsConsent()` returns `false` until the banner records a choice;
  `hasConsentResponse()` distinguishes "declined" from "not yet asked".
- **`src/features/marketing/analytics/ConsentBanner.tsx`**: The consent banner
  itself (EN/FR, equal-weight Accept/Decline). Mounted site-wide on the public
  surface (`PublicShell` in `src/app/routes.tsx`), lazily so the GA4/consent
  machinery stays out of the eager marketing chunk. Reopened from the footer's
  "Cookie preferences" control via `cookiePreferences.ts`.
- **`src/features/marketing/analytics/gtm.ts`**: Tag Manager loader. Gated on
  `VITE_GTM_CONTAINER_ID` and `hasAnalyticsConsent()`. Injects `gtm.js` and
  the `ns.html` iframe after consent. When configured, it is preferred over
  the direct GA4 gtag loader.
- **`src/features/marketing/analytics/ga4.ts`**: GA4 loader. Gated on both
  `VITE_GA_MEASUREMENT_ID` and `hasAnalyticsConsent()`. Used when Tag Manager
  is not configured.

### Wiring points

| Event | Wired at | Trigger |
| --- | --- | --- |
| `helpfulness_vote` | `HelpfulnessWidget.tsx` | Vote button click |
| `help_search` | `HelpCenterPage.tsx` | Debounced (1s) after search input changes |
| `help_article_view` | `HelpArticlePage.tsx` | `useEffect` on article slug |
| `ticket_submitted` (app) | `SupportRequestForm.tsx` | After successful `createSupportTicket` |
| `ticket_submitted` (public) | `PublicSupportForm.tsx` | After successful `createPublicSupportTicket` |
| `ticket_status_changed` | `SupportAdminTicket.tsx` | After successful admin status change |

## 4. Querying the data

### Raw events (last 90 days)

```sql
-- Helpfulness votes by article, last 30 days
select article_slug, vote_value, count(*)
from public.support_analytics_events
where event_type = 'helpfulness_vote'
  and occurred_at > now() - interval '30 days'
group by article_slug, vote_value
order by article_slug;

-- Top search queries with zero results (content gap signal)
select search_query, count(*) as searches, search_result_count
from public.support_analytics_events
where event_type = 'help_search'
  and search_result_count = 0
  and occurred_at > now() - interval '30 days'
group by search_query, search_result_count
order by searches desc
limit 20;

-- Ticket submission rate by category and source
select ticket_category, ticket_source, count(*)
from public.support_analytics_events
where event_type = 'ticket_submitted'
  and occurred_at > now() - interval '30 days'
group by ticket_category, ticket_source
order by count(*) desc;
```

### Daily aggregates (forever)

```sql
-- Daily helpfulness trend
select day, sum(helpfulness_yes) as yes_votes, sum(helpfulness_no) as no_votes
from public.support_analytics_daily
where event_type = 'helpfulness_vote'
group by day
order by day desc
limit 30;

-- Deflection signal: searches vs ticket submissions over time
select day,
  sum(event_count) filter (where event_type = 'help_search') as searches,
  sum(event_count) filter (where event_type = 'ticket_submitted') as tickets
from public.support_analytics_daily
group by day
order by day desc
limit 30;
```

### Operational status

```sql
select * from public.support_analytics_status();
```

Both `rollup_scheduled` and `rate_limit_purge_scheduled` must be `true`. The
failure this is here to catch is `rate_limit_purge_scheduled = false` alongside
a non-zero `rate_limit_rows` whose `oldest_rate_limit_row` keeps ageing: the
limiter still works, but its IP hashes have stopped being swept.

## 5. Owner deployment steps

`0047` and `0051` are applied and the edge function is deployed and recording
(TODO.md OA17, verified 2026-08-06). What's left, and what to re-check on any
future redeploy:

1. **~~Apply `0052`.~~ Done 2026-08-06 — applied and verified.**
   `purge-support-analytics-rate-limit` is active on `17 * * * *` and
   `support_analytics_status()` returns `rate_limit_purge_scheduled: true`.
   Re-check that flag after any project restore or migration replay: everything
   else in `0051` keeps working without the job, so the only symptom is IP
   hashes quietly ceasing to be swept.

2. **Keep `verify_jwt = false` on redeploy.** Pinned in
   `supabase/config.toml`, and it must stay pinned: the client posts a bare body
   with no `apikey` and no `Authorization` so the flush survives page unload, so
   a CLI-default redeploy silently 401s every event at the gateway. That is the
   two-attempt story in OA17 and the reason the pin exists.

3. **A pepper must be set.** `ERROR_REPORT_SALT`, or `SUPPORT_NOTIFY_SECRET` as
   the fallback. Since `0051` the function fails closed — 500 on every request —
   without one, rather than hashing under a guessable default. Set it in the same
   change as any project or key rotation.

4. **No Vault secret needed.** Unlike the law-update digest and call
   scheduler, this edge function is invoked directly by the client (not via
   pg_cron), so it uses the standard Supabase service role key that's
   already configured as `SUPABASE_SERVICE_ROLE_KEY` in the edge function
   environment.

5. **Verify after deploy.** Open a Help Centre article in production, vote,
   and check:

   ```sql
   select * from public.support_analytics_events order by occurred_at desc limit 5;
   ```

6. **Tag Manager / GA4.** The consent banner now ships. Set
   `VITE_GTM_CONTAINER_ID` at build time (CI uses `GTM-P3C7386R`) so GTM
   loads after Accept. Put GA4 inside that container rather than also
   setting `VITE_GA_MEASUREMENT_ID`, or the two loaders will compete —
   GTM wins when both are set. Direct gtag still works if only a
   measurement ID is present. Either path loads only for visitors who
   accept analytics; with neither ID the Google loaders stay inert.

## 6. What this does NOT do

- **No analytics without consent.** As of 2026-08-08 the consent banner
  ships and gates both sinks; there is no longer an ungated first-party
  path. (The remaining open question is legal, not technical — whether the
  first-party sink strictly *requires* opt-in — and it is the owner's to
  settle with counsel. See §2 Legal basis.)
- **No analytics dashboard.** The data is queryable via SQL (§4). An admin
  dashboard is a separate product decision — the data model supports it,
  but building one speculatively would repeat the mistake D2 was created to
  prevent.
- **No deflection attribution.** The events are recorded (search → article
  view → no ticket), but attributing "this search deflected a ticket" is
  an analytical query on the data, not a feature to build — the data is
  there, the interpretation is an operator task.
- **No real-time streaming.** Events are batched (max 10 or 2s debounce)
  and flushed on page unload. This is sufficient for aggregate analytics;
  real-time monitoring is a different concern (and the error reporting
  sink already covers crash monitoring).
