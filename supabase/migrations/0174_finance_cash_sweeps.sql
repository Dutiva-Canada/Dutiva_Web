/* 0174_finance_cash_sweeps.sql
   Treasury cash sweeps — a record of moving money between finance
   bank accounts (operating → reserve, reserve → operating, etc.),
   with a scheduled → executed | cancelled lifecycle.

   Dutiva records the sweep; it does not execute the transfer. The
   account balances themselves live on the source systems (bank feeds,
   books); this row is the treasury workflow record that says what was
   supposed to move, when, and whether it landed. RLS mirrors
   0171–0173 exactly: members read, admins write. */

CREATE TABLE IF NOT EXISTS public.finance_cash_sweeps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.finance_entities(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.finance_bank_accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES public.finance_bank_accounts(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'executed', 'cancelled')),
  scheduled_date DATE NOT NULL,
  executed_date DATE,
  reference TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT finance_cash_sweeps_distinct_accounts CHECK (from_account_id <> to_account_id)
);

CREATE INDEX IF NOT EXISTS finance_cash_sweeps_organization_id_idx
  ON public.finance_cash_sweeps(organization_id);
CREATE INDEX IF NOT EXISTS finance_cash_sweeps_from_account_id_idx
  ON public.finance_cash_sweeps(from_account_id);
CREATE INDEX IF NOT EXISTS finance_cash_sweeps_to_account_id_idx
  ON public.finance_cash_sweeps(to_account_id);

ALTER TABLE public.finance_cash_sweeps ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_cash_sweeps']
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
