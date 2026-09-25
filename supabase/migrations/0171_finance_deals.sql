/* 0171_finance_deals.sql
   Finance → Deals screen: a transaction pipeline on top of the existing
   finance stack — the records an operating company keeps when it starts
   acting like a holding / investment firm (acquisitions, minority stakes,
   financing rounds). Same org-scoped model as 0160: rows hang off
   finance_entities, members read, admins write.

   - finance_deals: one row per transaction in the pipeline. `stage` is a
     lifecycle (sourcing → diligence → negotiation → agreement → closed |
     passed), not a settlement state — Dutiva records the deal's progress;
     it does not broker or advise on transactions.
   - finance_entities gains an ownership edge (parent_entity_id +
     ownership_pct) so the registry reads as a holdings structure — e.g.
     "Holdings Ltd. owns 100% of Logistics Inc.".
   - finance_parties gains 'investor' and 'lender' types so capital
     partners share the existing party table instead of a parallel one.
   - finance_entities.legal_form gains 'trust' for holding structures.

   RLS mirrors 0160 exactly. */

CREATE TABLE IF NOT EXISTS public.finance_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.finance_entities(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  kind TEXT NOT NULL DEFAULT 'investment'
    CHECK (kind IN ('acquisition', 'investment', 'divestiture', 'financing', 'other')),
  stage TEXT NOT NULL DEFAULT 'sourcing'
    CHECK (stage IN ('sourcing', 'diligence', 'negotiation', 'agreement', 'closed', 'passed')),
  counterparty TEXT,
  value NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  target_date DATE,
  owner TEXT,
  notes JSONB,
  /* Optional links — a deal can graduate from the watchlist, and a closed
     deal can point at the holding it produced. */
  watchlist_item_id UUID REFERENCES public.finance_watchlist_items(id) ON DELETE SET NULL,
  holding_id UUID REFERENCES public.finance_holdings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_deals_organization_id_idx
  ON public.finance_deals(organization_id);
CREATE INDEX IF NOT EXISTS finance_deals_stage_idx
  ON public.finance_deals(stage);

ALTER TABLE public.finance_entities
  ADD COLUMN IF NOT EXISTS parent_entity_id UUID
    REFERENCES public.finance_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ownership_pct NUMERIC(5,2)
    CHECK (ownership_pct IS NULL OR (ownership_pct >= 0 AND ownership_pct <= 100));

ALTER TABLE public.finance_parties
  DROP CONSTRAINT IF EXISTS finance_parties_type_check;
ALTER TABLE public.finance_parties
  ADD CONSTRAINT finance_parties_type_check
  CHECK (type IN ('customer', 'supplier', 'employee', 'bank', 'advisor', 'investor', 'lender'));

ALTER TABLE public.finance_entities
  DROP CONSTRAINT IF EXISTS finance_entities_legal_form_check;
ALTER TABLE public.finance_entities
  ADD CONSTRAINT finance_entities_legal_form_check
  CHECK (legal_form IN ('corporation', 'partnership', 'sole_proprietor', 'nonprofit', 'trust'));

ALTER TABLE public.finance_deals ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_deals']
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
