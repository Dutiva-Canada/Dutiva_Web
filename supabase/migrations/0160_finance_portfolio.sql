/* 0160_finance_portfolio.sql
   Finance → Portfolio screen: a watchlist and a decision journal on top of the
   existing finance_holdings table (migration 0119). The screen tracks
   *company* investments — treasury surplus placed in instruments — not
   personal portfolios, so rows stay org-scoped and hang off finance_entities
   like every other finance record.

   - finance_watchlist_items: instruments the org is monitoring before any
     position exists. `status` is a lifecycle (watching → under_review →
     decided | dropped), not a trade state — Dutiva does not execute anything.
   - finance_decision_entries: the journal. Each entry records what was
     decided, why, and when to revisit it, and may point at a holding or a
     watchlist item it concerns.

   RLS mirrors 0119 exactly: org members read, org admins write. */

CREATE TABLE IF NOT EXISTS public.finance_watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.finance_entities(id) ON DELETE CASCADE,
  symbol TEXT,
  label JSONB NOT NULL,
  asset_class TEXT NOT NULL DEFAULT 'other'
    CHECK (asset_class IN ('equity', 'crypto', 'fund', 'fixed_income', 'other')),
  thesis JSONB,
  target_low NUMERIC(18,2),
  target_high NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  status TEXT NOT NULL DEFAULT 'watching'
    CHECK (status IN ('watching', 'under_review', 'decided', 'dropped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_decision_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.finance_entities(id) ON DELETE CASCADE,
  holding_id UUID REFERENCES public.finance_holdings(id) ON DELETE SET NULL,
  watchlist_item_id UUID REFERENCES public.finance_watchlist_items(id) ON DELETE SET NULL,
  decision TEXT NOT NULL
    CHECK (decision IN ('buy', 'sell', 'hold', 'add', 'exit', 'review')),
  decided_at DATE NOT NULL,
  summary JSONB NOT NULL,
  rationale JSONB,
  review_date DATE,
  outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_watchlist_items_organization_id_idx
  ON public.finance_watchlist_items(organization_id);
CREATE INDEX IF NOT EXISTS finance_watchlist_items_status_idx
  ON public.finance_watchlist_items(status);
CREATE INDEX IF NOT EXISTS finance_decision_entries_organization_id_idx
  ON public.finance_decision_entries(organization_id);
CREATE INDEX IF NOT EXISTS finance_decision_entries_review_date_idx
  ON public.finance_decision_entries(review_date) WHERE review_date IS NOT NULL;

ALTER TABLE public.finance_watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_decision_entries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_watchlist_items', 'finance_decision_entries']
  LOOP
    EXECUTE format(
      'CREATE POLICY "Org members can read %I" ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id, (select auth.uid())))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Org admins can insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Org admins can update %I" ON public.%I FOR UPDATE TO authenticated USING (public.is_org_admin(organization_id, (select auth.uid()))) WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Org admins can delete %I" ON public.%I FOR DELETE TO authenticated USING (public.is_org_admin(organization_id, (select auth.uid())))',
      t, t
    );
  END LOOP;
END
$$;
