-- Persist the last Compliance Workspace payload for each Advisor conversation
-- so reopening a thread can restore jurisdiction / risk / sources. Chat text
-- already lives in messages; this column is the structured companion for the
-- right panel only. Fresh turns still rebuild the payload server-side — this
-- is UI restore, not a decision replay into the next turn.

alter table public.conversations
  add column if not exists last_advisor_response jsonb;

comment on column public.conversations.last_advisor_response is
  'Last validated AdvisorResponse for Compliance Workspace restore on reopen.';
