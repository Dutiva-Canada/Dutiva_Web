-- ============================================================================
-- Migration 0120: Finance import, categorization, and export tables
--
-- Adds two tables to support the Finance Import & Export workspace:
--   finance_category_rules — rule-based auto-categorization patterns
--   finance_import_sessions — audit trail of bank statement imports
--
-- These tables extend the finance module from migration 0119. They follow
-- the same org-scoped RLS pattern: org members can read, org admins can
-- write. The finance_bank_items table (from 0119) already stores imported
-- transactions; this migration adds the rules and session metadata only.
-- ============================================================================

-- ============================================================================
-- Category rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'exact', 'starts_with', 'ends_with')),
  ledger_account_id UUID NOT NULL REFERENCES finance_ledger_accounts(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'debit' CHECK (direction IN ('debit', 'credit')),
  priority INTEGER NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_category_rules_organization_id_idx
  ON finance_category_rules(organization_id);
CREATE INDEX IF NOT EXISTS finance_category_rules_entity_id_idx
  ON finance_category_rules(entity_id);
CREATE INDEX IF NOT EXISTS finance_category_rules_active_priority_idx
  ON finance_category_rules(active, priority DESC);

-- ============================================================================
-- Import sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES finance_bank_accounts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_rows INTEGER NOT NULL DEFAULT 0,
  new_items INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'imported' CHECK (status IN ('pending', 'imported', 'reviewed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_import_sessions_organization_id_idx
  ON finance_import_sessions(organization_id);
CREATE INDEX IF NOT EXISTS finance_import_sessions_bank_account_id_idx
  ON finance_import_sessions(bank_account_id);
CREATE INDEX IF NOT EXISTS finance_import_sessions_imported_at_idx
  ON finance_import_sessions(imported_at DESC);

-- ============================================================================
-- RLS: Enable on new finance tables
-- ============================================================================

ALTER TABLE public.finance_category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_import_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: Standard org-member read / org-admin write policies
-- ============================================================================

CREATE POLICY "Org members can read finance_category_rules"
  ON public.finance_category_rules FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can insert finance_category_rules"
  ON public.finance_category_rules FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can update finance_category_rules"
  ON public.finance_category_rules FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can delete finance_category_rules"
  ON public.finance_category_rules FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org members can read finance_import_sessions"
  ON public.finance_import_sessions FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can insert finance_import_sessions"
  ON public.finance_import_sessions FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can update finance_import_sessions"
  ON public.finance_import_sessions FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can delete finance_import_sessions"
  ON public.finance_import_sessions FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())));

-- ============================================================================
-- updated_at triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.finance_category_rules_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_category_rules_updated_at
  BEFORE UPDATE ON public.finance_category_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.finance_category_rules_set_updated_at();

CREATE OR REPLACE FUNCTION public.finance_import_sessions_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_import_sessions_updated_at
  BEFORE UPDATE ON public.finance_import_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.finance_import_sessions_set_updated_at();
