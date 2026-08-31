# Ontario corpus review pack — the first human-review pass

Prepared 2026-08-08 so the human-review gate the corpus has carried since
0022 can finally be exercised (TODO L5: all 42 chunks are
`machine_curated`; zero are `reviewed`; every Advisor citation renders
"Needs review"). This pack covers the **14 Ontario chunks** — the
jurisdiction with the most complete tooling behind it (the encoded ESA
s.57 notice schedule, working Ontario law-page monitoring via the
`act-versions` API).

**What this pack is not.** It is preparation, not review. Flipping
`review_status` to `reviewed` is an assertion of vetted authority over
statutory content, and per the corpus's own rule only a human makes it —
an AI agent preparing this pack does not qualify, which is why nothing
here has been flipped. The reviewer works through the checklist, then
runs the sign-off SQL per chunk.

**Review procedure, per chunk:**

1. Open the source URL and confirm the page still says what the chunk
   says — every figure, threshold, and date below.
2. Check the chunk's framing doesn't overclaim (floors described as
   floors, exceptions acknowledged).
3. Run the sign-off SQL for that topic. It also clears
   `source_changed_at` (0071) — a re-review supersedes any monitor flag.

```sql
-- Per-chunk sign-off (replace <topic>):
update public.advisor_guidance_chunks
   set review_status = 'reviewed', source_changed_at = null,
       source_change_note = null
 where jurisdiction = 'ON' and topic = '<topic>' and status = 'active';
```

Verify afterwards:
`select topic, review_status from public.advisor_guidance_chunks where jurisdiction = 'ON' order by topic;`

## The 14 chunks

| #   | topic                     | Load-bearing figures to verify                                                                                                                    | Source                                                                                                                   |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `termination_notice`      | Notice ladder 1–8 weeks by tenure (3 mo threshold; 8 wk max at 8+ yrs); mass-termination tiers 8/12/16 wks at 50/200/500 employees; 10% carve-out | [ontario.ca — termination](https://www.ontario.ca/document/your-guide-employment-standards-act-0/termination-employment) |
| 2   | `severance`               | 5-yr tenure + ($2.5M payroll OR 50+ severed in 6 mo); formula (wk wages × years + months/12); 26-wk max                                           | [ontario.ca — severance pay](https://www.ontario.ca/document/your-guide-employment-standards-act-0/severance-pay)        |
| 3   | `vacation`                | 2 wks / 4% under 5 yrs; 3 wks / 6% at 5+ yrs; 10-month take-by window; stub periods                                                               | [ontario.ca — vacation](https://www.ontario.ca/document/your-guide-employment-standards-act-0/vacation)                  |
| 4   | `overtime`                | 44 hr/wk threshold; 1.5× rate; no daily OT; averaging 2–4 wks, 2-yr cap non-union                                                                 | [ontario.ca — overtime pay](https://www.ontario.ca/document/your-guide-employment-standards-act-0/overtime-pay)          |
| 5   | `minimum_wage`            | **Time-sensitive**: $17.60 general (Oct 1 2025–Sep 30 2026) → $17.95 (Oct 1 2026); student $16.60; homeworker $19.35; guides $88.05/$176.15       | [ontario.ca — minimum wage](https://www.ontario.ca/document/your-guide-employment-standards-act-0/minimum-wage)          |
| 6   | `leaves`                  | Job-protected leave list and durations as stated on the page                                                                                      | ontario.ca — leaves of absence (per chunk `source_url`)                                                                  |
| 7   | `public_holidays`         | 9 public holidays; holiday-pay formula; premium/substitute-day rules                                                                              | ontario.ca — public holidays (per chunk `source_url`)                                                                    |
| 8   | `hours_of_work`           | Daily/weekly maxima; 11-hr daily rest; eating periods                                                                                             | ontario.ca — hours of work (per chunk `source_url`)                                                                      |
| 9   | `accommodation_basics`    | Duty to accommodate to undue hardship; procedural framing                                                                                         | OHRC (per chunk `source_url`)                                                                                            |
| 10  | `pay_deductions`          | Permitted/prohibited deductions; pay-statement contents (ESA ss. 11–13)                                                                           | [ontario.ca — payment of wages](https://www.ontario.ca/document/your-guide-employment-standards-act-0/payment-wages)     |
| 11  | `records_retention`       | Retention periods by record type (ESA Part VI, ss. 15–16)                                                                                         | [ontario.ca — record keeping](https://www.ontario.ca/document/your-guide-employment-standards-act-0/record-keeping)      |
| 12  | `layoffs_recall`          | Temporary-layoff windows (13/20 wks; extended layoff in effect since Nov 27 2025 — **confirm still current**)                                     | [ontario.ca — termination](https://www.ontario.ca/document/your-guide-employment-standards-act-0/termination-employment) |
| 13  | `constructive_dismissal`  | ESA framing; resignation-window condition                                                                                                         | ontario.ca — termination (per chunk `source_url`)                                                                        |
| 14  | `workplace_injury_basics` | WSIB reporting deadlines; loss-of-earnings basics                                                                                                 | [WSIB — loss of earnings](https://www.wsib.ca/en/loss-earnings-benefit)                                                  |

Full chunk texts: the dated tranches
([2026-07-26](advisor-guidance-corpus-2026-07-26.md),
[2026-07-27](advisor-guidance-corpus-2026-07-27.md),
[2026-07-29](advisor-guidance-corpus-2026-07-29.md)) and the amendment
tranche ([2026-08-04](advisor-guidance-corpus-2026-08-04.md)). Where a
row above says "per chunk `source_url`", read it off the live row — the
tranche doc carries it too.

## Priority order

Start with **#5 minimum_wage** (expires by design on Oct 1, 2026 — also
verify the FR body carries the same figures), then **#1 / #12** (the
termination page backs three chunks, and the encoded notice schedule in
`statutoryNotice.ts` now grounds the chat prompt — reviewing #1 also
vouches for that schedule's ladder), then the rest in any order.

## What review unlocks

A `reviewed` chunk's citation renders **Valid** (green) instead of
"Needs review" in the Compliance Workspace, and the "machine-curated and
pending human review" warning stops appearing on turns grounded solely
in reviewed chunks. The 0071 monitor coupling then protects the status:
a detected Ontario law change re-demotes every ON citation to
needs-review until someone re-verifies and clears the flag.
