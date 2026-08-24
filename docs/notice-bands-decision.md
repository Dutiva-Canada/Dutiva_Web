# Notice bands — interim product decision (QC and FED)

**Date:** 2026-08-23  
**Status:** Active until a qualified reviewer signs [notice-bands-review-pack.md](notice-bands-review-pack.md) §4 with an explicit **Yes**.

## Decision

**Do not populate** `NOTICE_SCHEDULES` for Québec or Federal in code. Keep `bands: null` and the existing **hard UI hedges**:

| Surface | Hedge when `bands: null` |
| --- | --- |
| Document Studio (`statutoryFloor.ts` → `GenerateScreen`) | Shows `doclib_gen_floor_unavailable` — no “below minimum” alert; user must confirm against the statute |
| Advisor chat | No QC/FED notice injection in the prompt; cross-check returns `unverifiable` (never flags a mismatch from a table we do not ship) |
| Template jurisdiction notes (T03, etc.) | Qualitative statute pointers only — no numeric notice ladder outside Ontario |

This is the correct fail-safe for a compliance product: **hedge and point at primary sources** rather than emit unreviewed statutory figures.

## Why population is deferred (not forgotten)

The research pack is complete ([notice-bands-review-pack.md](notice-bands-review-pack.md)). Population awaits **qualified legal sign-off**, not engineering time. Two blockers documented in the pack:

1. **Québec:** LNT s. 82 bands are a *floor* only; CCQ art. 2091 reasonable notice sits above them. A flat `{ minMonths, weeks }` table can mislead even when technically derived from s. 82.
2. **Federal:** CLC s. 230(1.1) bands do not capture s. 235 severance; 2018, c. 27 group-termination amendments (enacted, not in force) would displace the individual band table when proclaimed.

## Sign-off state (interim)

| Jurisdiction | Populate bands? | Reason |
| --- | --- | --- |
| Québec | **No** (deferred) | CCQ art. 2091 floor problem + s. 82 boundary ambiguity; qualified reviewer not yet signed |
| Federal | **No** (deferred) | Severance cumulative with notice; pending 2018 c. 27 proclamation; qualified reviewer not yet signed |
| Ontario severance (L7) | **Option C** (unchanged) | Severance stays a flag — does not fit `NOTICE_SCHEDULES` shape |

When a qualified reviewer completes §4 of the pack with **Yes**, engineering may populate `statutoryNotice.ts`, extend `noticeSchedule.ts`, and add regression tests in the same PR as the sign-off record.

## Code pointers

- `src/features/app/advisor/safety/statutoryNotice.ts` — `NOTICE_SCHEDULES`
- `src/features/app/documents/statutoryFloor.ts` — Document Studio floor
- `src/features/app/advisor/safety/statutoryCrossCheck.ts` — Advisor verification
- `supabase/functions/advisor-chat/noticeSchedule.ts` — Ontario-only prompt injection

## Related

- TODO.md **L6** — tracks this decision
- `docs/AI_USAGE_STRATEGY.md` §5.2 — null → hedge policy
- `docs/LEGAL_REVIEW_INVENTORY.md` §4 — lawyer engagement inventory
