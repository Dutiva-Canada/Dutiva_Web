-- 0215_chat_sources — grounding-source links behind chat replies.
-- Each assistant turn can carry the rows it grounded on (market data,
-- headlines, coverage mentions, discovered jobs) so the client can show
-- "Sources" under the reply. Health has no external sources — nothing to
-- cite — so it deliberately gets no column. The Advisor persists sources
-- inside its conversations.messages JSONB envelope, also no DDL.

alter table public.invest_chat_messages
  add column if not exists sources jsonb;

alter table public.pr_chat_messages
  add column if not exists sources jsonb;

alter table public.candidate_chat_messages
  add column if not exists sources jsonb;

comment on column public.invest_chat_messages.sources is
  'Grounding sources attached to this turn: [{label, url?}] — market rows and headline links for the symbols the reply cites.';
comment on column public.pr_chat_messages.sources is
  'Grounding sources attached to this turn: [{label, url?}] — coverage mentions the reply names, with links when logged.';
comment on column public.candidate_chat_messages.sources is
  'Grounding sources attached to this turn: [{label, url?}] — agent-discovered jobs the reply names, with their links.';
