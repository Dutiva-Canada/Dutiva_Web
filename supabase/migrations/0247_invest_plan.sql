-- 0247 — the plan document: holder-authored text + a review stamp on the
-- existing profile row. plan_objective is the one-line mission the rest of
-- the document answers to; plan_notes is the running margin (decisions,
-- context Tally's prompts don't read); plan_reviewed_at is the reaffirm
-- stamp the "Mark as reviewed" action writes.

alter table public.invest_user_profile
  add column if not exists plan_objective text,
  add column if not exists plan_notes text,
  add column if not exists plan_reviewed_at timestamptz;
