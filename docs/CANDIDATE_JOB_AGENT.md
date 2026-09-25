# Candidate job-search agent

The candidate portal's autonomous application pipeline — migration
`0179_candidate_job_agent.sql` + the `candidate-job-agent` edge function +
the portal Settings card and Applications log.

## What it does

An opted-in candidate configures the company job boards they want watched
(Greenhouse `boards-api.greenhouse.io` and Lever `api.lever.co` — both are
published, unauthenticated read APIs a company runs for its own postings).
The agent:

1. **Discovers** — fetches each configured board, filters postings against
   the candidate's target roles, locations, and remote preference, and
   persists new postings in `candidate_discovered_jobs`, deduped on
   `(candidate_id, source, external_id)`.
2. **Scores** — runs each new posting through the existing candidate-AI
   `match-score` model route; postings below `min_match_score` stop there.
3. **Prepares** — for matches, generates the tailored resume and cover
   letter (the same prompts the portal's AI tools use — never inventing
   experience) and inserts a `candidate_external_applications` row.
4. **Submits or queues** — `review` mode leaves the package `needs_review`
   for one-click approval; `auto_submit` mode attempts the submission
   immediately, bounded by `daily_apply_cap`.

## Submission honesty

Submissions are only attempted through a real application endpoint.
Greenhouse's job-board API accepts applications
(`POST /v1/boards/{board}/jobs/{job_id}`); Lever's public API is read-only,
so Lever and any other source land as `manual_required` with the prepared
package attached and an "Open posting" link. A Greenhouse 4xx (usually a
board asking custom questions a flat payload can't answer) degrades to
`manual_required`, not `failed` — the candidate always gets a path forward,
and the log never reports a submission that did not happen.

## Data model

- `candidate_agent_settings` — per-user opt-in: `enabled`, `autonomy`
  (`review` | `auto_submit`), `keywords[]`, `locations[]`, `remote_ok`,
  `min_match_score`, `boards` jsonb (`[{ats, slug}]`), `daily_apply_cap`.
  RLS: the candidate owns their row.
- `candidate_discovered_jobs` — postings found, with `match_score`,
  `status` (`discovered` → `needs_review`/`queued` → `submitted`/
  `manual_required`/`skipped`/`failed`), `url`, `apply_url`, `error`.
- `candidate_external_applications` — the application log: package
  (`tailored_resume`, `cover_letter`), `match_score`, `channel`
  (`greenhouse_api` | `manual`), `submitted_at`, `response`, `error`.

Candidates read their own rows and may update their own applications
(skip); all agent writes go through the edge function as service role.

## The edge function

`supabase/functions/candidate-job-agent` — three actions:

- `{action:'scan'}` — candidate JWT; scans the caller's boards now
  (portal's "Run a search now").
- `{action:'scan-all'}` — service key or `x-trigger-secret`; the nightly
  sweep over every enabled candidate. Fired by pg_cron job
  `candidate-job-agent-daily` (07:30 UTC) via `trigger_candidate_job_agent`,
  which reuses the existing `support_scheduler_service_key` /
  `support_notify_secret` vault pair — no new secrets.
- `{action:'submit', application_id}` — candidate JWT; approves a
  `needs_review` application and attempts the submission.

Guardrails: `MAX_JOBS_PER_SCAN = 25` bounds model spend per candidate per
run; `daily_apply_cap` bounds real submissions; model access reuses the
`candidate_ai` → `advisor_chat` route fallback, so a site that has AI
configured needs no extra setup.

## What it deliberately is not

- **Not a scraper** — no crawling of protected boards (LinkedIn, Indeed);
  only documented public job-board APIs the employer itself publishes.
- **Not guaranteed submission** — `manual_required` is a first-class
  outcome, not an error; unsupported boards still get the full package.
- **Not invisible** — every action lands in the candidate's Applications
  log with the materials used; nothing submits silently in `review` mode.
