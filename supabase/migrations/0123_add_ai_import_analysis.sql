-- ============================================================================
-- Migration 0123: AI import analysis fields
--
-- Extends the Finance module to support browser-local AI analysis of imports:
--   finance_bank_items.ai_suggestion  — per-transaction AI categorization
--   finance_bank_items.note           — editable user-visible note
--   finance_categorization_feedback   — user corrections for learning
--   finance_workspace_settings        — AI import settings per organization
-- ============================================================================

-- ============================================================================
-- Extend bank items with AI suggestion and note
-- ============================================================================

ALTER TABLE public.finance_bank_items
  ADD COLUMN IF NOT EXISTS ai_suggestion JSONB,
  ADD COLUMN IF NOT EXISTS note JSONB;

-- ============================================================================
-- Categorization feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.finance_categorization_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.finance_entities(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  original_ledger_account_id TEXT,
  corrected_ledger_account_id TEXT NOT NULL,
  corrected_direction TEXT NOT NULL CHECK (corrected_direction IN ('debit', 'credit')),
  corrected_note JSONB,
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_categorization_feedback_organization_id_idx
  ON public.finance_categorization_feedback(organization_id);
CREATE INDEX IF NOT EXISTS finance_categorization_feedback_entity_id_idx
  ON public.finance_categorization_feedback(entity_id);

-- ============================================================================
-- Workspace AI settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.finance_workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ai_import_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_import_mode TEXT NOT NULL DEFAULT 'auto_high' CHECK (ai_import_mode IN ('suggest', 'auto_high', 'auto_all')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS finance_workspace_settings_organization_id_idx
  ON public.finance_workspace_settings(organization_id);

-- ============================================================================
-- RLS: Enable on new finance tables
-- ============================================================================

ALTER TABLE public.finance_categorization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_workspace_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: Standard org-member read / org-admin write policies
-- ============================================================================

CREATE POLICY "Org members can read finance_categorization_feedback"
  ON public.finance_categorization_feedback FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can insert finance_categorization_feedback"
  ON public.finance_categorization_feedback FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can update finance_categorization_feedback"
  ON public.finance_categorization_feedback FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can delete finance_categorization_feedback"
  ON public.finance_categorization_feedback FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org members can read finance_workspace_settings"
  ON public.finance_workspace_settings FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can insert finance_workspace_settings"
  ON public.finance_workspace_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can update finance_workspace_settings"
  ON public.finance_workspace_settings FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can delete finance_workspace_settings"
  ON public.finance_workspace_settings FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())));

-- ============================================================================
-- updated_at triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.finance_categorization_feedback_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS finance_categorization_feedback_set_updated_at
  ON public.finance_categorization_feedback;
CREATE TRIGGER finance_categorization_feedback_set_updated_at
  BEFORE UPDATE ON public.finance_categorization_feedback
  FOR EACH ROW EXECUTE FUNCTION public.finance_categorization_feedback_set_updated_at();

CREATE OR REPLACE FUNCTION public.finance_workspace_settings_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS finance_workspace_settings_set_updated_at
  ON public.finance_workspace_settings;
CREATE TRIGGER finance_workspace_settings_set_updated_at
  BEFORE UPDATE ON public.finance_workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.finance_workspace_settings_set_updated_at();
