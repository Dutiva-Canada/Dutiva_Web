-- 0185 — draft order proposals expire
--
-- A draft proposal's evidence is the snapshot that fired it; that price goes
-- stale within days, so a proposal left unanswered for a week is no longer a
-- decision worth asking. invest-bot sweeps drafts older than 7 days to the
-- new 'expired' status on every run (manual scans included).
--
-- 'expired' joins the status vocabulary: the Orders tab renders it as a muted
-- chip, and — unlike 'cancelled' — it records that the system, not the user,
-- closed the proposal.
--
-- Rollback (manual): flip 'expired' rows to 'cancelled' first — the 0180
-- check rejects 'expired' — then restore the old constraint:
--   update public.invest_orders set status = 'cancelled' where status = 'expired';
--   alter table public.invest_orders drop constraint invest_orders_status_check;
--   alter table public.invest_orders add constraint invest_orders_status_check
--     check (status in ('draft', 'queued', 'executed', 'cancelled', 'failed'));

alter table public.invest_orders
  drop constraint if exists invest_orders_status_check;

alter table public.invest_orders
  add constraint invest_orders_status_check
    check (status in ('draft', 'queued', 'executed', 'cancelled', 'failed', 'expired'));
