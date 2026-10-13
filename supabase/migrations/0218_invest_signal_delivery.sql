-- 0218_invest_signal_delivery.sql
--
-- Delivery + identity columns for the bot's output rows.
--
--   invest_signals.in_feed  — false when the owning strategy opts out of the
--                             in-app channel (notify.in_app=false). The row
--                             still exists: it IS the dedupe record and audit
--                             trail — before this column, suppressed signals
--                             were never inserted, so the dedupe key never
--                             landed and email-only strategies re-emailed the
--                             identical hit every sweep. The feed filters on
--                             it client-side; RLS already scopes to owner.
--   invest_signals.rule_id  — stable rule identity for dedupe/firing
--                             history. Rules were keyed by title, so renaming
--                             a label reset history and re-armed dedupe, and
--                             two same-title rules shared one dedupe slot.
--                             Null on pre-0218 rows — those keep title keys.
--   invest_orders.rule_id   — same identity for draft-order dedupe (the note
--                             prefix carried the title before).
--
-- ROLLBACK:
--   alter table public.invest_orders drop column if exists rule_id;
--   alter table public.invest_signals drop column if exists rule_id;
--   alter table public.invest_signals drop column if exists in_feed;

alter table public.invest_signals
  add column if not exists in_feed boolean not null default true;

alter table public.invest_signals
  add column if not exists rule_id text;

alter table public.invest_orders
  add column if not exists rule_id text;

create index if not exists invest_signals_rule_idx
  on public.invest_signals (user_id, rule_id)
  where rule_id is not null;
