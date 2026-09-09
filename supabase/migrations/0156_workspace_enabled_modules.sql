-- Workspace-wide module enable/disable.
--
-- Adds an organization-level `enabled_modules` JSONB map that controls which
-- top-level modules appear in the sidebar. This is separate from
-- `finance_features`, which continues to control which tabs are visible inside
-- the Finance workspace.
--
-- Missing module keys default to enabled for backward compatibility.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enabled_modules JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.enabled_modules IS
  'JSONB map of enabled top-level workspace modules. Missing keys default to enabled. Mirrors navConfig.ts nav item keys.';
