-- 0214_chat_reasoning.sql
--
-- Portal companions — keep what the model thought, not just what it said.
-- Reasoning-capable routes (ai_model_routes.config.params.reasoning_effort)
-- return reasoning_content alongside the reply; the chat surfaces stream it
-- live into a "Reasoning" disclosure on the assistant turn. Without a
-- column it would vanish on reload while the reply it produced stayed.
--
--   *_chat_messages — + reasoning (nullable text, assistant rows only)
--
-- The Advisor has no column here: its transcript lives in
-- conversations.messages (jsonb) where the reasoning rides the message
-- envelope, no DDL needed.
--
-- ROLLBACK:
--   alter table public.invest_chat_messages    drop column if exists reasoning;
--   alter table public.health_chat_messages    drop column if exists reasoning;
--   alter table public.pr_chat_messages        drop column if exists reasoning;
--   alter table public.candidate_chat_messages drop column if exists reasoning;

alter table public.invest_chat_messages    add column if not exists reasoning text;
alter table public.health_chat_messages    add column if not exists reasoning text;
alter table public.pr_chat_messages        add column if not exists reasoning text;
alter table public.candidate_chat_messages add column if not exists reasoning text;
