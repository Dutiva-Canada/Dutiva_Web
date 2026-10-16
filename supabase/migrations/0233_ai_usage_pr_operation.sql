-- 0233_ai_usage_pr_operation.sql
--
-- Lets ai_telemetry_events carry operation 'pr_ai' — the PR portal's model
-- calls (pr-ai chat/drafts, pr-geo-check answer checks, pr-mentions-feed
-- tone tagging). Until now those calls were unmetered; the shared
-- claim_ai_usage guardrail now claims them on the abuse rails (burst /
-- daily request / daily tokens / platform daily). 'pr_ai' is NOT in the
-- commercial operation set — the portal is invite-only and sells nothing,
-- so its calls can never spend or draw a pack CTA.
--
-- ROLLBACK:
--   alter table public.ai_telemetry_events
--     drop constraint if exists ai_telemetry_events_operation_check;
--   alter table public.ai_telemetry_events
--     add constraint ai_telemetry_events_operation_check
--     check (operation in (
--       'chat','draft','embed','classify','summarize','recommend','score',
--       'tool_call','support_firstline','safety_backstop'));

alter table public.ai_telemetry_events
  drop constraint if exists ai_telemetry_events_operation_check;

alter table public.ai_telemetry_events
  add constraint ai_telemetry_events_operation_check
  check (operation in (
    'chat',
    'draft',
    'embed',
    'classify',
    'summarize',
    'recommend',
    'score',
    'tool_call',
    'support_firstline',
    'safety_backstop',
    'pr_ai'
  ));
