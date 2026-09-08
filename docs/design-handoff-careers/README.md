# Careers — Candidate Portal Design Handoff

## Overview

Dutiva Careers is a B2C product surface that lets candidates browse job postings
from Canadian employers, create profiles, and apply with optional AI assistance.

It is a two-sided platform: employers post jobs through the existing B2B hiring
module (`/app/hiring`), candidates discover and apply through the public job
board (`/careers`), and applications flow back into the employer's hiring pipeline.

## Product positioning

- **Not** a job aggregator like Indeed. Only jobs posted through Dutiva appear.
- **Not** a replacement for the employer's ATS. Applications land in the
  existing `hr_candidates` pipeline; the employer manages them there.
- **AI-first but optional.** Every AI feature can be skipped. The candidate
  can apply with a plain resume and no cover letter.

## URL structure

| Route | Surface | Auth |
|-------|---------|------|
| `/careers` | Public job board | None |
| `/careers/jobs/:postingId` | Job detail | None |
| `/careers/portal` | Portal home | Required |
| `/careers/portal/profile` | Profile editor | Required |
| `/careers/portal/applications` | Applications list | Required |
| `/careers/portal/jobs/:postingId/apply` | Apply form + AI tools | Required |

The careers surface is a third surface — not marketing (no locale URLs, no SEO
registry) and not the workspace (no org membership, no admin gate). It uses
`LangProvider` (persisted language preference) so both the public board and the
portal share one language state.

## Architecture

### Database (migration 0153)

Three new tables:

- `candidate_profiles` — candidate profile linked to `auth.users` (not org-scoped)
- `candidate_applications` — applications linking candidates to `hr_job_postings`
- `candidate_resumes` — resume versions (base + AI-tailored per job)

Plus one RLS change:

- `hr_job_postings` — public read access for active postings (additive policy)

All candidate tables are RLS-protected: users can only read/write their own
data (`user_id = auth.uid()` via `candidate_profiles`).

### API layer

- `src/features/careers/data/jobBoardApi.ts` — public job board (list/get active postings)
- `src/features/careers/data/candidateApi.ts` — candidate profile CRUD
- `src/features/careers/data/applicationsApi.ts` — applications CRUD
- `src/features/careers/data/candidateAi.ts` — AI feature calls to edge function

### AI edge function

`supabase/functions/candidate-ai/` — handles four optional AI features:

1. **Resume tailoring** — highlights experience relevant to a specific job
2. **Cover letter generation** — drafts a cover letter from profile + job posting
3. **Match scoring** — scores how well the profile matches the job (0-100) + suggestions
4. **Interview prep** — generates practice questions and talking points

All AI features are optional. The candidate can apply without any AI assistance.

### Auth

Reuses Supabase auth (same magic-link flow as the workspace). A user can be both
a workspace member AND a candidate — same auth account, different profile context.
The candidate portal has its own auth gate (CandidateAuthPanel) that renders when
the user is not signed in.

### i18n

`src/i18n/messages/careers.ts` — all careers-specific messages, registered in the
workspace catalogue. French is self-authored (`[FR self-authored]`).

### Message scoping

The careers surface lives in `src/features/careers/` which is not scanned by
`check-message-scopes` (it only scans `src/features/app/` and `src/features/marketing/`).
Careers messages are registered in the workspace catalogue and available via
`useI18n().x(M.careers_*)`.

## B2B integration

Candidates apply to the same `hr_job_postings` that org admins create. Applications
are stored in `candidate_applications` (candidate-scoped) and visible to org members
via an RLS policy that allows reading applications to their org's job postings.

The employer's hiring pipeline (`hr_candidates`) is separate — a candidate applying
through the portal does not automatically become an `hr_candidates` row. The employer
can import promising applications into their pipeline manually. This keeps the B2C
application flow simple and the B2B pipeline controlled.

## Future considerations

- Locale URLs (`/fr/careers`) and SEO registry entries for the public job board
- Application sync from `candidate_applications` to `hr_candidates` for employers
- Resume file uploads (currently text paste only)
- Saved job alerts and notifications
- Employer-branded application pages
