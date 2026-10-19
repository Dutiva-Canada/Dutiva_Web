-- 0245 — thesis reaffirmed_at
--
-- A crossed break line is a technical fact; whether the story still
-- holds is the holder's call. reaffirmed_at stamps that call — the
-- Theses card shows 'line crossed' alongside 'reaffirmed <when>'
-- instead of letting a tripped guardrail pose as a dead thesis.
--
-- The sweep clears it on every status transition — a reaffirm answers
-- the state it was made in; a new state is a new question.
--
-- Rollback (manual):
--   alter table public.invest_theses drop column if exists reaffirmed_at;

alter table public.invest_theses
  add column if not exists reaffirmed_at timestamptz;

comment on column public.invest_theses.reaffirmed_at is
  'Holder reaffirmed the thesis while its break/drift line was crossed. Cleared by the sweep on any status transition.';
