-- Advisor phase 6: close remaining actionable lints without changing runtime posture.
--
-- 1. Internal signing helpers are only invoked by other SECURITY DEFINER RPCs
--    (postgres owner); revoke direct anon/authenticated EXECUTE.
-- 2. Service-role-only tables get explicit deny policies so RLS-on/no-policy INFO
--    lints reflect the intended deny-by-default posture.
-- 3. Five FK columns are not leading columns in existing composite uniques; add
--    dedicated indexes for FK maintenance (clears unindexed_foreign_keys).
-- 4. Left untouched (documented): 198 unused_index (fresh *_fkey_idx scans),
--    public SECURITY DEFINER product RPCs, pg_net in public, leaked-password
--    protection (Pro plan required).

-- ── Internal signing helpers: not public RPC surface ────────────────────────
revoke execute on function public._hr_signing_assert_turn(uuid, integer)
  from public, anon, authenticated;
grant execute on function public._hr_signing_assert_turn(uuid, integer)
  to service_role;

revoke execute on function public._hr_signing_recipient_for_envelope(text)
  from public, anon, authenticated;
grant execute on function public._hr_signing_recipient_for_envelope(text)
  to service_role;

revoke execute on function public._hr_signing_recipient_for_token(uuid)
  from public, anon, authenticated;
grant execute on function public._hr_signing_recipient_for_token(uuid)
  to service_role;

-- ── Service-role-only tables: explicit client deny ──────────────────────────
create policy "Deny client API access"
  on public.advisor_guidance_chunks
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.ai_advisor_credits
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.ai_advisor_overage_months
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.cron_locks
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.export_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.hr_documents
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.hr_signing_rpc_rate_limit
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.platform_capacity_config
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.stripe_webhook_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.support_analytics_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny client API access"
  on public.template_audit_log
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- ── FK covering indexes (FK column not leading in composite uniques) ────────
create index if not exists hr_advisor_case_narratives_case_id_fkey_idx
  on public.hr_advisor_case_narratives (case_id);

create index if not exists template_content_variants_jurisdiction_id_fkey_idx
  on public.template_content_variants (jurisdiction_id);

create index if not exists tier_categories_category_id_fkey_idx
  on public.tier_categories (category_id);

create index if not exists workflow_questions_field_id_fkey_idx
  on public.workflow_questions (field_id);

create index if not exists workflow_responses_question_id_fkey_idx
  on public.workflow_responses (question_id);
