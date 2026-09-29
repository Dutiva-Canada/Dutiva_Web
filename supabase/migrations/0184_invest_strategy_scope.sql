-- 0184 — strategy scope, rule types, run diagnostics
--
-- Redesign of the strategy model (see docs/INVEST_PLATFORM.md):
--
--   invest_strategies.scope   — what the strategy scans:
--                               {"watchlist": bool, "symbols": text[]}.
--                               Every strategy must have a non-empty scope.
--   invest_strategies.notify  — where hits go:
--                               {"in_app": bool, "email": bool}.
--   rules jsonb               — each rule gains "type": "signal" |
--                               "order_proposal". Signal rules carry
--                               "severity" ('insight'|'alert'); order-proposal
--                               rules carry side + qty + qty_unit
--                               ('shares'|'percent_of_position'|'currency').
--                               Legacy keys (kind/side/qty) are kept on
--                               backfilled rows so the previously deployed
--                               edge function keeps reading them.
--   invest_bot_runs           — diagnostics per run: which symbols were
--                               scanned, per-rule hit counts, duration, and
--                               the strategy a test scan targeted.
--
-- autonomy is deprecated: order proposals now create DRAFT orders that wait
-- for explicit approval in the Orders tab — the bot never executes on its
-- own. All rows are reset to 'suggest' here so even the pre-0184 deployed
-- engine stops auto-filling paper orders.
--
-- Rollback (manual):
--   alter table public.invest_strategies
--     drop column if exists scope, drop column if exists notify;
--   alter table public.invest_bot_runs
--     drop column if exists strategy_id, drop column if exists symbols_scanned,
--     drop column if exists rule_hits, drop column if exists duration_ms;
--   alter table public.invest_orders drop column if exists strategy_id;
--   (the rules jsonb backfill is additive — legacy keys remain intact)

alter table public.invest_strategies
  add column if not exists scope jsonb not null
    default '{"watchlist": true, "symbols": []}'::jsonb,
  add column if not exists notify jsonb not null
    default '{"in_app": true, "email": false}'::jsonb;

alter table public.invest_bot_runs
  add column if not exists strategy_id uuid
    references public.invest_strategies(id) on delete set null,
  add column if not exists symbols_scanned text[] not null default '{}',
  add column if not exists rule_hits jsonb not null default '{}'::jsonb,
  add column if not exists duration_ms integer;

/* Draft order proposals link back to the strategy that proposed them — the
   engine dedupes on this so re-scans don't stack identical drafts. */
alter table public.invest_orders
  add column if not exists strategy_id uuid
    references public.invest_strategies(id) on delete set null;

/* Scope must never be empty: watchlist ref or at least one explicit symbol. */
alter table public.invest_strategies
  drop constraint if exists invest_strategies_scope_nonempty;
alter table public.invest_strategies
  add constraint invest_strategies_scope_nonempty check (
    (scope->>'watchlist')::boolean is true
    or jsonb_array_length(coalesce(scope->'symbols', '[]'::jsonb)) > 0
  );

/* Backfill scope: preserve today's effective universe — the whole watchlist
   plus every held symbol, since pre-0184 strategies scanned all snapshots. */
update public.invest_strategies s
set scope = jsonb_build_object(
  'watchlist', true,
  'symbols', coalesce((
    select array_agg(distinct upper(p.symbol))
    from public.invest_positions p
    where p.user_id = s.user_id
  ), '{}'::text[])
)
where s.scope is null
   or s.scope = '{"watchlist": true, "symbols": []}'::jsonb;

/* Backfill rules: add the new keys without removing the legacy ones. */
update public.invest_strategies s
set rules = coalesce((
  select jsonb_agg(
    case
      when elem ? 'type' then elem
      when (elem ? 'side') and (elem ? 'qty') then
        elem || '{"type": "order_proposal", "qty_unit": "shares"}'::jsonb
      else
        elem || jsonb_build_object(
          'type', 'signal',
          'severity', case when elem->>'kind' = 'alert' then 'alert' else 'insight' end
        )
    end
  )
  from jsonb_array_elements(s.rules) as e(elem)
), '[]'::jsonb)
where jsonb_typeof(s.rules) = 'array';

/* No autonomous execution, effective immediately for the deployed engine. */
update public.invest_strategies set autonomy = 'suggest' where autonomy <> 'suggest';

comment on column public.invest_strategies.autonomy is
  'Deprecated by 0184 — per-rule type replaced strategy-level autonomy; the bot never executes on its own.';
