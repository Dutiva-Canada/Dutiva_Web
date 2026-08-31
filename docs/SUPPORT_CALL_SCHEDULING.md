# Scheduled-call booking

How a scheduled support call gets from "we should talk" to a calendar event
with a Meet link, what's built, and the owner steps that turn it on.
Decided (TODO.md D3, 2026-08-06): **Google Calendar, full loop.** See
[SUPPORT_ARCHITECTURE.md](SUPPORT_ARCHITECTURE.md) for where this sits in the
overall support model — scheduled calls are an exceptional case, not a
primary channel (see [SUPPORT_RUNBOOK.md § When to schedule a
call](SUPPORT_RUNBOOK.md)).

## The flow

1. **Propose.** From the admin ticket view, propose up to 3 candidate times
   and a duration (10–120 minutes). This calls `support-agent-action`'s
   `propose_call` action, which writes a row to `support_scheduled_calls`,
   moves the ticket to `scheduled_call`, and queues a `call_proposed`
   notification to the customer.
2. **Confirm.** The customer opens their own ticket (`/app/support/requests/
:id`) and picks one of the proposed times. This calls
   `support-confirm-call` (checks the caller is the ticket's own requester —
   a scheduled call is a personal appointment, not something a workspace
   peer can pick on someone else's behalf), which:
   - creates a Google Calendar event with an auto-generated Meet link and
     invites the customer as an attendee, **if** Calendar is configured
     (below) — and records the confirmation either way (see "Honest by
     construction" below);
   - queues a `call_confirmed` notification to the customer.
3. **Reminder.** Every 15 minutes, `support-call-scheduler` sends the one
   reminder this flow sends, once a confirmed call is within 24 hours out.
4. **Follow-up.** The same sweep flags a call for a written follow-up once
   its end time is more than 2 hours in the past — a `call_followup_needed`
   notification to the operator, prompting the written summary
   [SUPPORT_RUNBOOK.md § Document a call](SUPPORT_RUNBOOK.md) already asks
   for.

## Honest by construction

Confirmation **always succeeds** once the customer's chosen slot is valid,
whether or not Google Calendar is configured or reachable at that moment —
matching `support-notify`'s own rule for a missing email provider. If the
Calendar secrets aren't set, or the API call fails, `support-confirm-call`
records a `support_ticket_events` row (`calendar_sync_skipped` /
`calendar_sync_failed`) instead of blocking the customer, and the admin
ticket view shows a note to add the appointment by hand. Nothing about the
customer's experience depends on infrastructure they can't see.

## Owner setup

Three independent pieces. Each fails closed on its own if left unconfigured
— the flow above still works without Calendar, just without an automatic
invite.

### 1. Google Calendar service account

1. In a Google Cloud project, enable the **Google Calendar API**.
2. Create a **service account** and generate a JSON key for it.
3. In Google Calendar (the calendar you want appointments to land on —
   likely the founder's own), **share it with the service account's email
   address** (`…@…iam.gserviceaccount.com`), granting **"Make changes to
   events."** Domain-wide delegation is not needed for a single shared
   calendar.
4. Set three edge-function secrets:
   - `GOOGLE_CALENDAR_CLIENT_EMAIL` — the service account's `client_email`.
   - `GOOGLE_CALENDAR_PRIVATE_KEY` — the service account's `private_key`
     (the JSON key's literal `\n` sequences are fine; the client unescapes
     them — see `supabase/functions/_shared/googleCalendar.ts`).
   - `GOOGLE_CALENDAR_ID` — the calendar's id (the shared calendar's email
     address, or `primary` if it's the service account's own — it isn't,
     here).

Until all three are set, `support-confirm-call` skips calendar sync (see
"Honest by construction" above) — a deliberate no-op, not an error.

### 2. Deploy the three edge functions

Merging this doc's PR does not deploy anything (AGENTS.md's two-halves
rule). Deploy:

- `support-agent-action` (existing function, extended with `propose_call`)
- `support-confirm-call` (new)
- `support-call-scheduler` (new)

### 3. Apply migration `0045` and schedule the sweep

`0045_support_scheduled_calls.sql` creates the table, RLS policy, the two
new `support_notifications` kinds, and schedules
`support-call-scheduler-sweep` via `pg_cron` (every 15 minutes) — but, same
shape as `trigger_law_monitor` (0035) and `trigger_attachment_scan` (0038),
the cron job needs a service-role key in Vault before it can actually call
the function:

```sql
select vault.create_secret(
  '<service-role or secret key>',
  'support_scheduler_service_key',
  'Service key used by the support-call-scheduler cron job'
);
```

Until that secret exists, the job runs, finds no key, logs a warning, and
returns — the reminder/follow-up sweep is a no-op, not a nightly error. This
does **not** block propose/confirm, which work as soon as the functions are
deployed; only the automatic reminder and follow-up prompt depend on it.

## Verifying it's running

One query, service-role (SQL editor):

```sql
select * from public.support_call_scheduler_status();
```

| Column              | Healthy value                                            |
| ------------------- | -------------------------------------------------------- |
| `secret_configured` | `true`                                                   |
| `job_scheduled`     | `true`                                                   |
| `awaiting_reminder` | Confirmed calls due a reminder on the next sweep         |
| `awaiting_followup` | Confirmed calls due a follow-up prompt on the next sweep |

Trigger a sweep by hand: `select public.trigger_support_call_scheduler();`

## What this does NOT do

- **No rescheduling flow beyond re-proposing.** An admin proposing new times
  on a ticket that already has a confirmed call overwrites the row
  (`support_scheduled_calls.ticket_id` is unique) — there's no "cancel and
  notify" step; that's a manual reply today.
- **No per-statute — sorry, per-call — history.** One row per ticket, not an
  append-only log of every proposal/reschedule. The audit trail lives in
  `support_ticket_events` instead.
- **One reminder, not a series.** No second reminder closer to the call
  (e.g. 1 hour out). Add a second `rowsNeedingReminder`-style window in
  `supabase/functions/_shared/scheduledCalls.ts` if that's ever wanted.
- **No public (unauthenticated) ticket support.** Confirming a call requires
  being signed in as the ticket's own requester — a public-intake customer
  without an app account keeps arranging calls fully by email, same as
  today.
