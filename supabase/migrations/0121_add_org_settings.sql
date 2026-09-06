-- Add per-organization customization fields for company profile and feature flags.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS jurisdictions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS finance_features JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.industry IS 'Free-form industry or sector label for template defaults and recommendations.';
COMMENT ON COLUMN public.organizations.jurisdictions IS 'Array of operating jurisdictions; drives jurisdiction pack and compliance scoping.';
COMMENT ON COLUMN public.organizations.finance_features IS 'JSONB map of enabled Finance module tabs. Missing keys default to enabled for backward compatibility.';
