# Database structure — live project `khtwpxnvziiyplaflwru`

Generated 2026-09-22 by `scripts/document-db-structure.mjs` from the live
database — **do not hand-edit**. For the full DDL snapshot see
`supabase/schema.sql`; for how the schema is tracked and why repo
migrations alone cannot reproduce it, see `docs/DATABASE_SCHEMA.md`.

## Schemas

- `public`

## Extensions

| Extension | Version |
| --------- | ------- |
| `hypopg` | 1.4.1 |
| `index_advisor` | 0.2.0 |
| `pg_cron` | 1.6.4 |
| `pg_net` | 0.20.4 |
| `pg_stat_statements` | 1.11 |
| `pgcrypto` | 1.3 |
| `plpgsql` | 1.0 |
| `supabase_vault` | 0.3.1 |
| `uuid-ossp` | 1.1 |
| `vector` | 0.8.2 |
| `wrappers` | 0.6.2 |

## Tables — 244 total

Grouped by name prefix. RLS = `relrowsecurity`; a table without RLS is
either intentional (public read) or a finding — check `check:rls`.

### schema `public` (244)

**`activity_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `activity_events` | 10 | on | 2 |

**`admin_*`** — 9 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `admin_activity_log` | 7 | on | 2 |
| `admin_analytics_snapshots` | 7 | on | 1 |
| `admin_app_error_events` | 9 | on | 2 |
| `admin_audit_log` | 7 | on | 2 |
| `admin_beta_access` | 10 | on | 1 |
| `admin_beta_feedback_events` | 8 | on | 2 |
| `admin_feature_flags` | 11 | on | 1 |
| `admin_plan_overrides` | 12 | on | 1 |
| `admin_users` | 12 | on | 4 |

**`advisor_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `advisor_guidance_chunks` | 19 | on | 1 |
| `advisor_memories` | 11 | on | 1 |

**`agent_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `agent_audit` | 14 | on | 2 |
| `agent_runs` | 12 | on | 4 |

**`ai_*`** — 13 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `ai_action_runs` | 12 | on | 2 |
| `ai_advisor_credits` | 6 | on | 1 |
| `ai_advisor_month_state` | 4 | on | 1 |
| `ai_advisor_org_credits` | 7 | on | 1 |
| `ai_advisor_org_overage_months` | 3 | on | 1 |
| `ai_advisor_overage_months` | 3 | on | 1 |
| `ai_advisor_rollover_credits` | 7 | on | 1 |
| `ai_agents` | 11 | on | 4 |
| `ai_drafting_sessions` | 13 | on | 1 |
| `ai_model_providers` | 10 | on | 1 |
| `ai_model_routes` | 10 | on | 4 |
| `ai_recommendations` | 17 | on | 1 |
| `ai_telemetry_events` | 16 | on | 4 |

**`backup_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `backup_verification_runs` | 7 | on | 1 |

**`benchmark_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `benchmark_snapshots` | 9 | on | 4 |

**`beta_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `beta_signup_intake` | 4 | on | 1 |
| `beta_signups` | 16 | on | 3 |

**`billing_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `billing_events` | 15 | on | 4 |

**`candidate_*`** — 3 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `candidate_ai_usage` | 3 | on | 0 |
| `candidate_applications` | 10 | on | 6 |
| `candidate_profiles` | 17 | on | 5 |

**`categories_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `categories` | 6 | on | 1 |

**`client_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `client_error_rate_limit` | 3 | on | 1 |
| `client_error_reports` | 10 | on | 1 |

**`clients_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `clients` | 10 | on | 1 |

**`comment_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `comment_mentions` | 5 | on | 2 |

**`comments_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `comments` | 11 | on | 1 |

**`comms_*`** — 20 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `comms_approvals` | 10 | on | 2 |
| `comms_brand_claims` | 9 | on | 2 |
| `comms_contact_segment_memberships` | 5 | on | 2 |
| `comms_contact_segments` | 6 | on | 2 |
| `comms_contacts` | 12 | on | 2 |
| `comms_content_items` | 19 | on | 2 |
| `comms_coverage_items` | 16 | on | 2 |
| `comms_execution_events` | 10 | on | 2 |
| `comms_feeds` | 15 | on | 2 |
| `comms_initiatives` | 18 | on | 2 |
| `comms_integrations` | 9 | on | 2 |
| `comms_interactions` | 15 | on | 2 |
| `comms_issues` | 14 | on | 2 |
| `comms_metrics` | 12 | on | 2 |
| `comms_objectives` | 11 | on | 2 |
| `comms_organizations` | 8 | on | 2 |
| `comms_policy_files` | 12 | on | 2 |
| `comms_sources` | 15 | on | 2 |
| `comms_submissions` | 13 | on | 2 |
| `comms_usage_controls` | 8 | on | 2 |

**`compliance_*`** — 4 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `compliance_assessments` | 11 | on | 2 |
| `compliance_findings` | 14 | on | 1 |
| `compliance_score_snapshots` | 9 | on | 4 |
| `compliance_tasks` | 16 | on | 1 |

**`conversations_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `conversations` | 8 | on | 1 |

**`cron_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `cron_locks` | 4 | on | 1 |

**`devops_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `devops_runbooks` | 9 | on | 1 |

**`document_*`** — 4 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `document_annotations` | 10 | on | 1 |
| `document_generation_runs` | 12 | on | 3 |
| `document_reviews` | 12 | on | 1 |
| `document_versions` | 9 | on | 2 |

**`documents_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `documents` | 23 | on | 4 |

**`employees_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `employees` | 17 | on | 4 |

**`employer_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `employer_profiles` | 20 | on | 4 |
| `employer_tiers` | 10 | on | 1 |

**`entity_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `entity_links` | 10 | on | 2 |
| `entity_relationships` | 12 | on | 1 |

**`execution_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `execution_traces` | 14 | on | 4 |

**`export_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `export_events` | 9 | on | 1 |

**`external_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `external_integrations` | 13 | on | 1 |

**`finance_*`** — 38 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `finance_approvals` | 13 | on | 4 |
| `finance_audit_events` | 10 | on | 4 |
| `finance_bank_accounts` | 11 | on | 4 |
| `finance_bank_items` | 16 | on | 4 |
| `finance_bills` | 18 | on | 4 |
| `finance_books` | 9 | on | 4 |
| `finance_budgets` | 12 | on | 4 |
| `finance_categorization_feedback` | 11 | on | 4 |
| `finance_category_rules` | 11 | on | 4 |
| `finance_close_periods` | 10 | on | 4 |
| `finance_credits` | 14 | on | 4 |
| `finance_debts` | 16 | on | 4 |
| `finance_decision_entries` | 13 | on | 4 |
| `finance_entities` | 12 | on | 4 |
| `finance_expenses` | 15 | on | 4 |
| `finance_external_actions` | 13 | on | 4 |
| `finance_fiscal_periods` | 7 | on | 4 |
| `finance_forecasts` | 12 | on | 4 |
| `finance_holdings` | 19 | on | 4 |
| `finance_import_sessions` | 14 | on | 4 |
| `finance_invoices` | 18 | on | 4 |
| `finance_journals` | 15 | on | 4 |
| `finance_ledger_accounts` | 10 | on | 4 |
| `finance_parties` | 10 | on | 4 |
| `finance_pay_periods` | 10 | on | 4 |
| `finance_pay_runs` | 21 | on | 4 |
| `finance_payroll_liabilities` | 12 | on | 4 |
| `finance_purchase_orders` | 13 | on | 4 |
| `finance_receipts` | 16 | on | 4 |
| `finance_reconciliations` | 14 | on | 4 |
| `finance_reserve_goals` | 13 | on | 4 |
| `finance_scenarios` | 17 | on | 4 |
| `finance_spend_requests` | 17 | on | 4 |
| `finance_subscriptions` | 15 | on | 4 |
| `finance_tax_obligations` | 19 | on | 4 |
| `finance_tax_scenarios` | 21 | on | 4 |
| `finance_watchlist_items` | 13 | on | 4 |
| `finance_workspace_settings` | 6 | on | 4 |

**`frontend_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `frontend_feature_flags` | 8 | on | 4 |

**`generator_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `generator_document_templates` | 13 | on | 1 |

**`governance_*`** — 4 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `governance_decisions` | 12 | on | 2 |
| `governance_officers` | 11 | on | 2 |
| `governance_records` | 13 | on | 2 |
| `governance_shareholders` | 10 | on | 2 |

**`guidance_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `guidance_chunks` | 12 | on | 4 |
| `guidance_sources` | 11 | on | 4 |

**`hr_*`** — 31 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `hr_advisor_case_narratives` | 13 | on | 4 |
| `hr_advisor_case_timeline_events` | 11 | on | 3 |
| `hr_advisor_memory_audit` | 8 | on | 2 |
| `hr_advisor_memory_facts` | 44 | on | 4 |
| `hr_authenticity_scores` | 12 | on | 2 |
| `hr_candidates` | 19 | on | 4 |
| `hr_case_notes` | 6 | on | 3 |
| `hr_cases` | 11 | on | 4 |
| `hr_communications` | 13 | on | 4 |
| `hr_compensation_records` | 11 | on | 4 |
| `hr_defense_interviews` | 11 | on | 2 |
| `hr_document_audit_events` | 7 | on | 2 |
| `hr_document_exports` | 12 | on | 2 |
| `hr_document_recipients` | 27 | on | 3 |
| `hr_document_signatures` | 13 | on | 3 |
| `hr_document_versions` | 10 | on | 2 |
| `hr_documents` | 19 | on | 1 |
| `hr_employee_notes` | 6 | on | 3 |
| `hr_evidence_screening` | 13 | on | 2 |
| `hr_expiry_records` | 9 | on | 4 |
| `hr_generated_documents` | 23 | on | 4 |
| `hr_job_postings` | 15 | on | 3 |
| `hr_leaves` | 11 | on | 4 |
| `hr_obligations` | 13 | on | 4 |
| `hr_onboarding_tasks` | 12 | on | 2 |
| `hr_performance_reviews` | 12 | on | 4 |
| `hr_policies` | 9 | on | 4 |
| `hr_signing_rpc_rate_limit` | 3 | on | 1 |
| `hr_wellbeing_initiatives` | 11 | on | 4 |
| `hr_work_samples` | 15 | on | 2 |
| `hr_workspace_notifications` | 12 | on | 2 |

**`inbound_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `inbound_emails` | 13 | on | 2 |

**`integration_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `integration_events` | 8 | on | 2 |

**`job_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `job_attempts` | 9 | on | 4 |
| `job_queue` | 17 | on | 4 |

**`jurisdiction_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `jurisdiction_comparisons` | 12 | on | 4 |

**`jurisdictions_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `jurisdictions` | 9 | on | 1 |

**`law_*`** — 4 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `law_change_impacts` | 13 | on | 1 |
| `law_page_hashes` | 9 | on | 2 |
| `law_update_notifications` | 8 | on | 1 |
| `law_updates` | 12 | on | 2 |

**`legal_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `legal_ingestion_runs` | 12 | on | 1 |
| `legal_ingestion_sources` | 11 | on | 4 |

**`multi_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `multi_agent_plans` | 11 | on | 4 |

**`notification_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `notification_deliveries` | 11 | on | 4 |

**`notifications_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `notifications` | 11 | on | 3 |

**`offer_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `offer_workflow_states` | 9 | on | 4 |

**`operational_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `operational_bottlenecks` | 12 | on | 1 |

**`operations_*`** — 5 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `operations_logistics` | 12 | on | 2 |
| `operations_projects` | 10 | on | 2 |
| `operations_quality_checks` | 13 | on | 2 |
| `operations_technology` | 10 | on | 2 |
| `operations_vendors` | 10 | on | 2 |

**`organization_*`** — 8 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `organization_admission_log` | 5 | on | 1 |
| `organization_admission_waitlist` | 8 | on | 2 |
| `organization_billing_events` | 5 | on | 1 |
| `organization_invitations` | 10 | on | 1 |
| `organization_maturity_scores` | 10 | on | 4 |
| `organization_members` | 9 | on | 4 |
| `organization_risk_snapshots` | 11 | on | 4 |
| `organization_usage_events` | 6 | on | 1 |

**`organizations_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `organizations` | 24 | on | 3 |

**`platform_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `platform_capacity_config` | 6 | on | 1 |

**`playbook_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `playbook_runs` | 11 | on | 2 |

**`policy_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `policy_gap_analyses` | 13 | on | 1 |

**`predictive_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `predictive_risk_forecasts` | 12 | on | 4 |

**`profiles_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `profiles` | 21 | on | 3 |

**`queue_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `queue_health_snapshots` | 8 | on | 1 |

**`revenue_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `revenue_invoices` | 13 | on | 2 |
| `revenue_streams` | 13 | on | 2 |

**`scheduled_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `scheduled_operations` | 11 | on | 4 |

**`security_*`** — 5 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `security_access_reviews` | 12 | on | 2 |
| `security_assets` | 11 | on | 2 |
| `security_incidents` | 15 | on | 3 |
| `security_risks` | 10 | on | 2 |
| `security_vendor_reviews` | 10 | on | 2 |

**`service_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `service_status` | 4 | on | 1 |

**`signature_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `signature_audit_events` | 6 | on | 1 |

**`signatures_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `signatures` | 13 | on | 1 |

**`specialist_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `specialist_engagements` | 10 | on | 2 |

**`specialists_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `specialists` | 17 | on | 2 |

**`stripe_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `stripe_webhook_events` | 3 | on | 1 |

**`subfolders_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `subfolders` | 9 | on | 1 |

**`support_*`** — 12 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `support_analytics_daily` | 11 | on | 1 |
| `support_analytics_events` | 18 | on | 1 |
| `support_analytics_rate_limit` | 4 | on | 1 |
| `support_attachments` | 14 | on | 1 |
| `support_messages` | 7 | on | 2 |
| `support_notifications` | 16 | on | 1 |
| `support_public_intake` | 4 | on | 1 |
| `support_scheduled_calls` | 16 | on | 1 |
| `support_ticket_assignments` | 6 | on | 1 |
| `support_ticket_events` | 6 | on | 1 |
| `support_ticket_feedback` | 6 | on | 2 |
| `support_tickets` | 26 | on | 1 |

**`system_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `system_events` | 9 | on | 2 |

**`template_*`** — 5 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `template_audit_log` | 9 | on | 1 |
| `template_content_variants` | 13 | on | 4 |
| `template_documents` | 18 | on | 1 |
| `template_fields` | 13 | on | 4 |
| `template_versions` | 7 | on | 4 |

**`templates_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `templates` | 11 | on | 4 |

**`tier_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `tier_categories` | 6 | on | 1 |

**`usage_*`** — 2 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `usage_counters` | 11 | on | 1 |
| `usage_events` | 7 | on | 4 |

**`user_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `user_roles` | 4 | on | 4 |

**`webhook_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `webhook_events` | 10 | on | 4 |

**`workflow_*`** — 5 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `workflow_automation_runs` | 11 | on | 2 |
| `workflow_metrics_daily` | 13 | on | 4 |
| `workflow_playbooks` | 11 | on | 4 |
| `workflow_questions` | 9 | on | 1 |
| `workflow_responses` | 7 | on | 1 |

**`workflows_*`** — 1 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `workflows` | 12 | on | 1 |

**`workspace_*`** — 4 table(s)

| Table | Cols | RLS | Policies |
| ----- | ---- | --- | -------- |
| `workspace_integrations` | 11 | on | 4 |
| `workspace_intelligence_items` | 13 | on | 1 |
| `workspace_notes` | 11 | on | 1 |
| `workspace_preferences` | 3 | on | 1 |

## Views — 5

- `public.generator_templates`
- `public.public_job_postings`
- `public.v_navigation_tree`
- `public.v_template_catalog`
- `public.v_tier_stats`

## Functions / RPCs — 187

| Function | Args | Security definer |
| -------- | ---- | ---------------- |
| `public._hr_org_admin_emails` | p_org_id uuid | yes |
| `public._hr_signing_actor_email` | — |  |
| `public._hr_signing_assert_turn` | p_signature_id uuid, p_signing_order integer | yes |
| `public._hr_signing_check_rate_limit` | p_bucket text, p_window_seconds integer, p_limit integer | yes |
| `public._hr_signing_insert_admin_notifications` | p_document_id uuid, p_event text | yes |
| `public._hr_signing_notify_admins` | p_document_id uuid, p_event text | yes |
| `public._hr_signing_notify_next_signer` | p_document_id uuid | yes |
| `public._hr_signing_recipient_for_envelope` | p_envelope_id text | yes |
| `public._hr_signing_recipient_for_token` | p_token uuid | yes |
| `public._hr_signing_request_ip_hash` | — | yes |
| `public._inbound_email_notify_admins` | p_email_id uuid | yes |
| `public._integration_event_notify_admins` | p_event_id uuid | yes |
| `public._org_capacity_lock` | p_organization_id uuid |  |
| `public.accept_ai_recommendation` | target_recommendation_id uuid | yes |
| `public.acquire_cron_lock` | p_job_name text, p_instance_id text, p_ttl_seconds integer | yes |
| `public.active_org_member_role` | target_organization_id uuid | yes |
| `public.add_comment` | target_organization_id uuid, target_entity_table text, target_entity_id text, comment_body text, parent_id uuid | yes |
| `public.add_document_annotation` | target_document_id uuid, annotation_kind text, annotation_body text, annotation_anchor jsonb | yes |
| `public.admin_create_backup_verification_run` | target text | yes |
| `public.admin_create_multi_agent_plan` | target_organization_id uuid, plan_title text, plan_objective text, lead_agent_key text | yes |
| `public.admin_list_agent_runs` | run_status text | yes |
| `public.admin_list_ai_action_runs` | run_status text | yes |
| `public.admin_list_ai_recommendations` | rec_status text | yes |
| `public.admin_list_audit_log` | limit_count integer | yes |
| `public.admin_list_beta_signups` | — | yes |
| `public.admin_list_compliance_findings` | finding_status text | yes |
| `public.admin_list_compliance_tasks` | task_status text | yes |
| `public.admin_list_integrations` | — | yes |
| `public.admin_list_jobs` | job_status text | yes |
| `public.admin_list_law_change_impacts` | impact_status text | yes |
| `public.admin_list_law_updates` | — | yes |
| `public.admin_list_legal_ingestion_runs` | run_status text | yes |
| `public.admin_list_organizations` | — | yes |
| `public.admin_list_policy_gap_analyses` | analysis_status text | yes |
| `public.admin_list_risk_forecasts` | forecast_kind text | yes |
| `public.admin_list_users` | — | yes |
| `public.admin_list_workspace_intelligence` | item_status text | yes |
| `public.admin_reporting_overview` | — | yes |
| `public.admin_runtime_overview` | — | yes |
| `public.admin_update_beta_signup_status` | signup_id uuid, new_status text, notes text | yes |
| `public.admin_update_user_plan` | target_user_id uuid, new_plan text, new_subscription_status text, new_billing_period text | yes |
| `public.admin_usage_summary` | days_back integer | yes |
| `public.advisor_monthly_included` | p_plan text |  |
| `public.advisor_usage_summary` | p_organization_id uuid | yes |
| `public.apply_hr_document_signature` | p_envelope_id text, p_signed_name text, p_signature_image text, p_signature_text text, p_consent_version text | yes |
| `public.apply_hr_document_signature_by_token` | p_token uuid, p_signed_name text, p_signature_image text, p_signature_text text, p_consent_version text | yes |
| `public.apply_organization_billing` | p_organization_id uuid, p_plan text, p_subscription_status text, p_billing_period text, p_stripe_customer_id text, p_stripe_subscription_id text, p_billing_owner_user_id uuid | yes |
| `public.archive_old_document_versions` | — | yes |
| `public.assert_active_case_capacity` | — | yes |
| `public.assert_active_employee_capacity` | — | yes |
| `public.assert_open_task_capacity` | — | yes |
| `public.assert_org_member_capacity` | — | yes |
| `public.attachment_scan_status` | — | yes |
| `public.auto_increment_version` | — |  |
| `public.backfill_organization_billing_from_profiles` | — | yes |
| `public.calculate_basic_maturity_score` | target_organization_id uuid, maturity_category text | yes |
| `public.cancel_signature_for_owner` | p_signature_id uuid | yes |
| `public.cap_advisor_rollover_to_plan` | p_organization_id uuid | yes |
| `public.check_and_increment_usage_counter` | p_user_id uuid, p_period_start date, p_action text, p_limit integer | yes |
| `public.claim_ai_usage` | p_user_id uuid, p_operation text, p_organization_id uuid, p_provider text, p_model text, p_burst_window_seconds integer, p_burst_limit integer, p_daily_request_limit integer, p_daily_token_limit bigint, p_platform_daily_limit integer, p_metered_operations text[], p_monthly_chat_limit integer, p_commercial_operations text[], p_overage_monthly_cap integer | yes |
| `public.claim_candidate_ai_call` | p_user_id uuid |  |
| `public.claim_document_save` | p_organization_id uuid, p_document_id uuid | yes |
| `public.claim_export_slot` | p_user_id uuid, p_surface text, p_kind text, p_title text, p_sha256 text, p_content_chars integer, p_lang text, p_burst_window_seconds integer, p_burst_limit integer, p_daily_limit integer | yes |
| `public.claim_next_job` | worker_id text, allowed_job_types text[] | yes |
| `public.claim_signature_send` | p_organization_id uuid, p_envelope_id uuid | yes |
| `public.cleanup_old_activity_logs` | — | yes |
| `public.comms_contact_segment_memberships_set_updated_at` | — |  |
| `public.comms_contact_segments_set_updated_at` | — |  |
| `public.complete_job` | target_job_id uuid, job_output jsonb | yes |
| `public.create_ai_recommendation` | target_organization_id uuid, target_user_id uuid, rec_type text, rec_title text, rec_rationale text, rec_action jsonb, rec_priority text | yes |
| `public.create_document_version_snapshot` | target_document_id uuid, summary text | yes |
| `public.create_law_change_impact_task` | target_impact_id uuid | yes |
| `public.create_notification` | target_organization_id uuid, target_user_id uuid, kind text, notification_title text, notification_body text, notification_severity text, notification_action_url text, notification_metadata jsonb | yes |
| `public.create_organization` | org_name text, org_legal_name text | yes |
| `public.create_organization_risk_snapshot` | target_organization_id uuid | yes |
| `public.create_queue_health_snapshot` | — | yes |
| `public.create_workspace_intelligence_item` | target_organization_id uuid, intelligence_type text, item_title text, item_body text, item_severity text, related_table text, related_id text, generator text | yes |
| `public.current_user_is_workspace_member` | — | yes |
| `public.decline_hr_document_signature` | p_envelope_id text, p_reason text | yes |
| `public.decline_hr_document_signature_by_token` | p_token uuid, p_reason text | yes |
| `public.detect_basic_bottlenecks` | target_organization_id uuid | yes |
| `public.dismiss_ai_recommendation` | target_recommendation_id uuid, reason text | yes |
| `public.enqueue_job` | target_organization_id uuid, target_job_type text, job_payload jsonb, job_priority integer, job_run_after timestamp with time zone, job_max_attempts integer | yes |
| `public.ensure_advisor_month_transition` | p_organization_id uuid | yes |
| `public.expire_advisor_rollover_on_cancel` | p_organization_id uuid | yes |
| `public.fail_job` | target_job_id uuid, error_text text, retry_delay_seconds integer | yes |
| `public.finance_categorization_feedback_set_updated_at` | — |  |
| `public.finance_category_rules_set_updated_at` | — |  |
| `public.finance_import_sessions_set_updated_at` | — |  |
| `public.finance_workspace_settings_set_updated_at` | — |  |
| `public.flag_guidance_chunks_on_law_change` | — | yes |
| `public.generate_basic_risk_forecast` | target_organization_id uuid, window_days integer | yes |
| `public.get_admin_dashboard_counts` | — | yes |
| `public.get_advisor_context` | target_organization_id uuid, limit_count integer | yes |
| `public.get_entity_activity` | target_entity_table text, target_entity_id text, limit_count integer |  |
| `public.get_entity_relationships` | target_entity_table text, target_entity_id text, limit_count integer |  |
| `public.get_frontend_bootstrap` | — |  |
| `public.get_hr_signing_package_by_token` | p_token uuid | yes |
| `public.get_organization_capacity_status` | — | yes |
| `public.get_organization_dashboard` | target_organization_id uuid | yes |
| `public.get_signature_by_token` | p_token uuid | yes |
| `public.grant_ai_advisor_org_pack` | p_organization_id uuid, p_pack_size integer, p_stripe_checkout_id text, p_purchaser_user_id uuid | yes |
| `public.grant_ai_advisor_pack` | p_user_id uuid, p_pack_size integer, p_stripe_checkout_id text | yes |
| `public.guard_candidate_application_update` | — |  |
| `public.handle_new_user` | — | yes |
| `public.hr_policies_flag_overdue_for_review` | — | yes |
| `public.hr_policies_orgs_needing_reminder` | — | yes |
| `public.hr_signing_recipients_needing_reminder` | — | yes |
| `public.increment_usage_counter` | p_user_id uuid, p_period_start date, p_action text | yes |
| `public.ingest_client_error_report` | p_ip_hash text, p_env text, p_release text, p_route text, p_locale text, p_kind text, p_message text, p_stack text, p_user_agent text, p_window_seconds integer, p_limit integer | yes |
| `public.ingest_support_analytics_events` | p_ip_hash text, p_events jsonb, p_window_seconds integer, p_limit integer | yes |
| `public.is_admin` | check_user_id uuid | yes |
| `public.is_admin_user` | — | yes |
| `public.is_internal_admin_user` | — |  |
| `public.is_org_admin` | check_org_id uuid, check_user_id uuid | yes |
| `public.is_org_member` | check_org_id uuid, check_user_id uuid | yes |
| `public.is_super_admin` | — | yes |
| `public.join_organization_waitlist` | requested_org_name text | yes |
| `public.law_monitor_status` | — | yes |
| `public.law_update_digest_status` | — | yes |
| `public.link_entities` | target_organization_id uuid, source_table_name text, source_entity_id text, target_table_name text, target_entity_id text, relation_kind text, relation_confidence numeric, ai_generated boolean | yes |
| `public.mark_all_hr_workspace_notifications_read` | — | yes |
| `public.mark_hr_workspace_notification_read` | p_id uuid | yes |
| `public.mark_notification_read` | target_notification_id uuid |  |
| `public.match_advisor_guidance` | q text, k integer |  |
| `public.match_guidance_chunks` | query_embedding vector, match_threshold double precision, match_count integer, filter_jurisdiction text, filter_organization_id uuid | yes |
| `public.normalize_document_jurisdiction_label` | p_code text, p_fallback text |  |
| `public.organization_effective_plan` | p_organization_id uuid | yes |
| `public.organization_usage_limit` | p_plan text, p_kind text |  |
| `public.pin_organization_billing_columns` | — |  |
| `public.pin_profile_billing_columns` | — |  |
| `public.plan_limit` | p_plan text, p_limit_key text |  |
| `public.policy_review_scheduler_status` | — | yes |
| `public.process_expired_data_deletions` | — | yes |
| `public.profile_applied_to_member_org` | p_candidate_id uuid | yes |
| `public.purge_ai_telemetry_data` | — | yes |
| `public.purge_client_error_data` | — | yes |
| `public.purge_support_analytics_rate_limit` | — | yes |
| `public.queue_notification_delivery` | target_notification_id uuid, delivery_provider text, delivery_recipient text | yes |
| `public.read_integration_secret` | p_name text | yes |
| `public.record_advisor_memory` | target_organization_id uuid, target_user_id uuid, memory_kind text, memory_title text, memory_content text, memory_importance integer | yes |
| `public.record_ai_telemetry` | target_organization_id uuid, target_user_id uuid, provider_name text, model_name text, operation_name text, total_token_count integer, latency_value_ms integer, telemetry_status text, telemetry_metadata jsonb | yes |
| `public.record_billing_event` | target_organization_id uuid, target_user_id uuid, billing_provider text, billing_event_type text, billing_plan text, billing_subscription_status text, billing_period_value text, billing_payload jsonb | yes |
| `public.record_execution_trace` | target_organization_id uuid, trace_kind text, trace_status text, trace_key_value text, entity_table_value text, entity_id_value text, trace_metadata jsonb, trace_error text | yes |
| `public.record_hr_document_signature_view` | p_envelope_id text | yes |
| `public.record_hr_document_signature_view_by_token` | p_token uuid | yes |
| `public.record_signature_link_created` | — | yes |
| `public.record_system_event` | target_organization_id uuid, event_kind text, source_table text, source_id text, event_payload jsonb | yes |
| `public.reissue_hr_document_signing_token` | p_recipient_id uuid | yes |
| `public.release_cron_lock` | p_job_name text, p_instance_id text | yes |
| `public.resolve_user_billing_organization` | p_user_id uuid | yes |
| `public.revoke_integration_secret` | p_name text | yes |
| `public.rls_auto_enable` | — | yes |
| `public.rls_grant_gaps` | — | yes |
| `public.score_snapshot_status` | — | yes |
| `public.set_advisor_overage_opt_in` | p_opt_in boolean | yes |
| `public.set_support_ticket_reference` | — |  |
| `public.set_updated_at` | — |  |
| `public.signing_reminder_scheduler_status` | — | yes |
| `public.start_playbook_run` | target_organization_id uuid, target_playbook_key text, run_input jsonb | yes |
| `public.store_integration_secret` | p_name text, p_secret text | yes |
| `public.submit_signature_by_token` | p_token uuid, p_signature_data text, p_signature_type text | yes |
| `public.support_analytics_rollup` | — | yes |
| `public.support_analytics_status` | — | yes |
| `public.support_call_scheduler_status` | — | yes |
| `public.suspend_excess_members_for_plan` | p_organization_id uuid | yes |
| `public.sync_document_jurisdiction_fields` | — |  |
| `public.touch_advisor_guidance_updated_at` | — |  |
| `public.touch_employer_profiles_updated_at` | — |  |
| `public.touch_offer_workflow_states_updated_at` | — |  |
| `public.touch_support_updated_at` | — |  |
| `public.transition_document_status` | target_document_id uuid, new_status text, note text | yes |
| `public.trg_claim_document_save` | — | yes |
| `public.trg_claim_signature_send` | — | yes |
| `public.trigger_attachment_scan` | — | yes |
| `public.trigger_law_monitor` | — | yes |
| `public.trigger_law_update_digest` | — | yes |
| `public.trigger_policy_review_scheduler` | — | yes |
| `public.trigger_score_snapshots` | — | yes |
| `public.trigger_signing_reminder_scheduler` | — | yes |
| `public.trigger_support_call_scheduler` | — | yes |
| `public.update_candidate_updated_at` | — |  |
| `public.update_capacity_config` | p_capacity_limit integer, p_capacity_enforcement_enabled boolean, p_capacity_mode text | yes |
| `public.update_updated_at` | — |  |
| `public.update_updated_at_column` | — |  |
| `public.user_is_dutiva_staff` | p_user_id uuid | yes |
| `public.void_hr_document_signature` | p_document_id uuid | yes |

## Triggers — 56

| Table | Trigger |
| ----- | ------- |
| `public.admin_beta_access` | `admin_beta_access_set_updated_at` |
| `public.admin_feature_flags` | `admin_feature_flags_set_updated_at` |
| `public.admin_plan_overrides` | `admin_plan_overrides_set_updated_at` |
| `public.admin_users` | `admin_users_set_updated_at` |
| `public.advisor_guidance_chunks` | `advisor_guidance_chunks_touch_updated_at` |
| `public.candidate_applications` | `guard_candidate_application_update` |
| `public.candidate_applications` | `update_candidate_applications_updated_at` |
| `public.candidate_profiles` | `update_candidate_profiles_updated_at` |
| `public.categories` | `trg_categories_updated_at` |
| `public.clients` | `trg_clients_updated_at` |
| `public.comms_contact_segment_memberships` | `comms_contact_segment_memberships_set_updated_at` |
| `public.comms_contact_segments` | `comms_contact_segments_set_updated_at` |
| `public.compliance_tasks` | `compliance_tasks_assert_capacity` |
| `public.conversations` | `set_conversations_updated_at` |
| `public.documents` | `set_documents_updated_at` |
| `public.documents` | `trg_sync_document_jurisdiction_fields` |
| `public.documents` | `trg_sync_document_jurisdiction_fields` |
| `public.employees` | `employees_assert_capacity` |
| `public.employees` | `employees_assert_capacity` |
| `public.employer_profiles` | `trg_employer_profiles_touch` |
| `public.employer_tiers` | `trg_employer_tiers_updated_at` |
| `public.entity_links` | `update_entity_links_updated_at` |
| `public.finance_categorization_feedback` | `finance_categorization_feedback_set_updated_at` |
| `public.finance_category_rules` | `finance_category_rules_updated_at` |
| `public.finance_import_sessions` | `finance_import_sessions_updated_at` |
| `public.finance_workspace_settings` | `finance_workspace_settings_set_updated_at` |
| `public.generator_document_templates` | `set_generator_document_templates_updated_at` |
| `public.hr_authenticity_scores` | `update_hr_authenticity_scores_updated_at` |
| `public.hr_candidates` | `update_hr_candidates_updated_at` |
| `public.hr_cases` | `hr_cases_assert_capacity` |
| `public.hr_defense_interviews` | `update_hr_defense_interviews_updated_at` |
| `public.hr_document_signatures` | `hr_document_signatures_claim_send` |
| `public.hr_evidence_screening` | `update_hr_evidence_screening_updated_at` |
| `public.hr_generated_documents` | `hr_generated_documents_claim_save` |
| `public.hr_job_postings` | `update_hr_job_postings_updated_at` |
| `public.hr_work_samples` | `update_hr_work_samples_updated_at` |
| `public.law_updates` | `law_updates_flag_guidance` |
| `public.offer_workflow_states` | `trg_offer_workflow_states_touch` |
| `public.organization_members` | `organization_members_assert_capacity` |
| `public.organization_members` | `organization_members_assert_capacity` |
| `public.organizations` | `organizations_pin_billing_columns` |
| `public.profiles` | `profiles_pin_billing_columns` |
| `public.profiles` | `set_profiles_updated_at` |
| `public.revenue_invoices` | `update_revenue_invoices_updated_at` |
| `public.revenue_streams` | `update_revenue_streams_updated_at` |
| `public.signatures` | `signatures_on_insert_audit` |
| `public.subfolders` | `trg_subfolders_updated_at` |
| `public.support_scheduled_calls` | `support_scheduled_calls_touch_updated_at` |
| `public.support_tickets` | `support_tickets_set_reference` |
| `public.support_tickets` | `support_tickets_touch_updated_at` |
| `public.template_content_variants` | `trg_template_content_variants_updated_at` |
| `public.template_documents` | `trg_template_documents_updated_at` |
| `public.template_versions` | `trg_auto_version` |
| `public.templates` | `trg_templates_updated_at` |
| `public.usage_counters` | `set_usage_counters_updated_at` |
| `public.workspace_integrations` | `workspace_integrations_set_updated_at` |

## RLS policies — 608

Names and scope only; full `USING`/`WITH CHECK` expressions are in
`supabase/schema.sql` and the migrations that created them.

| Table | Policy | Command | Roles |
| ----- | ------ | ------- | ----- |
| `public.activity_events` | Members can create activity events | INSERT | authenticated |
| `public.activity_events` | Members can view activity events | SELECT | authenticated |
| `public.admin_activity_log` | Admins can insert activity log | INSERT | authenticated |
| `public.admin_activity_log` | Admins can read activity log | SELECT | authenticated |
| `public.admin_analytics_snapshots` | Admins can manage analytics snapshots | ALL | authenticated |
| `public.admin_app_error_events` | Authenticated users can submit app error events | INSERT | authenticated |
| `public.admin_app_error_events` | Internal admins can read app error events | SELECT | authenticated |
| `public.admin_audit_log` | Admins can insert audit log | INSERT | authenticated |
| `public.admin_audit_log` | Admins can read audit log | SELECT | authenticated |
| `public.admin_beta_access` | Admins can manage beta access | ALL | authenticated |
| `public.admin_beta_feedback_events` | Authenticated users can submit feedback events | INSERT | authenticated |
| `public.admin_beta_feedback_events` | Internal admins can read feedback events | SELECT | authenticated |
| `public.admin_feature_flags` | Admins can manage feature flags | ALL | authenticated |
| `public.admin_plan_overrides` | Admins can manage plan overrides | ALL | authenticated |
| `public.admin_users` | Admins can delete admin_users | DELETE | authenticated |
| `public.admin_users` | Admins can insert admin_users | INSERT | authenticated |
| `public.admin_users` | Admins can update admin_users | UPDATE | authenticated |
| `public.admin_users` | Users can view own admin record | SELECT | authenticated |
| `public.advisor_guidance_chunks` | Deny client API access | ALL | anon,authenticated |
| `public.advisor_memories` | Members can manage advisor memories | ALL | authenticated |
| `public.agent_audit` | agent_audit_insert | INSERT | authenticated |
| `public.agent_audit` | agent_audit_select | SELECT | authenticated |
| `public.agent_runs` | Admins can delete agent runs | DELETE | authenticated |
| `public.agent_runs` | Admins can insert agent runs | INSERT | authenticated |
| `public.agent_runs` | Admins can update agent runs | UPDATE | authenticated |
| `public.agent_runs` | Members can view agent runs | SELECT | authenticated |
| `public.ai_action_runs` | Members can create AI action runs | INSERT | authenticated |
| `public.ai_action_runs` | Members can view AI action runs | SELECT | authenticated |
| `public.ai_advisor_credits` | Deny client API access | ALL | anon,authenticated |
| `public.ai_advisor_month_state` | Deny client API access | ALL | anon,authenticated |
| `public.ai_advisor_org_credits` | Deny client API access | ALL | anon,authenticated |
| `public.ai_advisor_org_overage_months` | Deny client API access | ALL | anon,authenticated |
| `public.ai_advisor_overage_months` | Deny client API access | ALL | anon,authenticated |
| `public.ai_advisor_rollover_credits` | Deny client API access | ALL | anon,authenticated |
| `public.ai_agents` | Admins can delete AI agents | DELETE | authenticated |
| `public.ai_agents` | Admins can insert AI agents | INSERT | authenticated |
| `public.ai_agents` | Admins can update AI agents | UPDATE | authenticated |
| `public.ai_agents` | Authenticated can read active AI agents | SELECT | authenticated |
| `public.ai_drafting_sessions` | Members can manage drafting sessions | ALL | authenticated |
| `public.ai_model_providers` | Admins can manage model providers | ALL | authenticated |
| `public.ai_model_routes` | Admins can delete model routes | DELETE | authenticated |
| `public.ai_model_routes` | Admins can insert model routes | INSERT | authenticated |
| `public.ai_model_routes` | Admins can update model routes | UPDATE | authenticated |
| `public.ai_model_routes` | Authenticated can read active model routes | SELECT | authenticated |
| `public.ai_recommendations` | Members can manage AI recommendations | ALL | authenticated |
| `public.ai_telemetry_events` | Admins can delete AI telemetry | DELETE | authenticated |
| `public.ai_telemetry_events` | Admins can insert AI telemetry | INSERT | authenticated |
| `public.ai_telemetry_events` | Admins can update AI telemetry | UPDATE | authenticated |
| `public.ai_telemetry_events` | Members can view AI telemetry | SELECT | authenticated |
| `public.backup_verification_runs` | Admins can manage backup verification | ALL | authenticated |
| `public.benchmark_snapshots` | Admins can delete benchmarks | DELETE | authenticated |
| `public.benchmark_snapshots` | Admins can insert benchmarks | INSERT | authenticated |
| `public.benchmark_snapshots` | Admins can update benchmarks | UPDATE | authenticated |
| `public.benchmark_snapshots` | Members can view benchmarks | SELECT | authenticated |
| `public.beta_signup_intake` | Admins read beta intake log | SELECT | public |
| `public.beta_signups` | Admins read beta signups | SELECT | public |
| `public.beta_signups` | Admins update beta signups | UPDATE | public |
| `public.beta_signups` | Public can submit beta signups with valid email | INSERT | anon,authenticated |
| `public.billing_events` | Admins can delete billing events | DELETE | authenticated |
| `public.billing_events` | Admins can insert billing events | INSERT | authenticated |
| `public.billing_events` | Admins can update billing events | UPDATE | authenticated |
| `public.billing_events` | Org admins can view billing events | SELECT | authenticated |
| `public.candidate_applications` | Org members can read applications to their postings | SELECT | public |
| `public.candidate_applications` | Org members can update application status | UPDATE | public |
| `public.candidate_applications` | Users can delete own candidate applications | DELETE | public |
| `public.candidate_applications` | Users can insert own candidate applications | INSERT | public |
| `public.candidate_applications` | Users can read own candidate applications | SELECT | public |
| `public.candidate_applications` | Users can update own candidate applications | UPDATE | public |
| `public.candidate_profiles` | Org members can read applicant profiles | SELECT | public |
| `public.candidate_profiles` | Users can delete own candidate profile | DELETE | public |
| `public.candidate_profiles` | Users can insert own candidate profile | INSERT | public |
| `public.candidate_profiles` | Users can read own candidate profile | SELECT | public |
| `public.candidate_profiles` | Users can update own candidate profile | UPDATE | public |
| `public.categories` | Authenticated read: categories | SELECT | authenticated |
| `public.client_error_rate_limit` | Admins read client error rate limit | SELECT | public |
| `public.client_error_reports` | Admins read client error reports | SELECT | public |
| `public.clients` | Own clients | ALL | authenticated |
| `public.comment_mentions` | Members can create mentions | INSERT | authenticated |
| `public.comment_mentions` | Users can view mentions | SELECT | authenticated |
| `public.comments` | Members can manage comments | ALL | authenticated |
| `public.comms_approvals` | Org admins can manage approvals | ALL | public |
| `public.comms_approvals` | Org members can view approvals | SELECT | public |
| `public.comms_brand_claims` | Org admins can manage brand claims | ALL | public |
| `public.comms_brand_claims` | Org members can view brand claims | SELECT | public |
| `public.comms_contact_segment_memberships` | Org admins can manage contact segment memberships | ALL | authenticated |
| `public.comms_contact_segment_memberships` | Org members can view contact segment memberships | SELECT | authenticated |
| `public.comms_contact_segments` | Org admins can manage contact segments | ALL | authenticated |
| `public.comms_contact_segments` | Org members can view contact segments | SELECT | authenticated |
| `public.comms_contacts` | Org admins can manage comms contacts | ALL | public |
| `public.comms_contacts` | Org members can view comms contacts | SELECT | public |
| `public.comms_content_items` | Org admins can manage content items | ALL | public |
| `public.comms_content_items` | Org members can view content items | SELECT | public |
| `public.comms_coverage_items` | Org admins can manage coverage items | ALL | public |
| `public.comms_coverage_items` | Org members can view coverage items | SELECT | public |
| `public.comms_execution_events` | Org admins can manage execution events | ALL | public |
| `public.comms_execution_events` | Org members can view execution events | SELECT | public |
| `public.comms_feeds` | Org admins can manage feeds | ALL | public |
| `public.comms_feeds` | Org members can view feeds | SELECT | public |
| `public.comms_initiatives` | Org admins can manage initiatives | ALL | public |
| `public.comms_initiatives` | Org members can view initiatives | SELECT | public |
| `public.comms_integrations` | Org admins can manage integrations | ALL | public |
| `public.comms_integrations` | Org members can view integrations | SELECT | public |
| `public.comms_interactions` | Org admins can manage interactions | ALL | public |
| `public.comms_interactions` | Org members can view interactions | SELECT | public |
| `public.comms_issues` | Org admins can manage issues | ALL | public |
| `public.comms_issues` | Org members can view issues | SELECT | public |
| `public.comms_metrics` | Org admins can manage metrics | ALL | public |
| `public.comms_metrics` | Org members can view metrics | SELECT | public |
| `public.comms_objectives` | Org admins can manage objectives | ALL | public |
| `public.comms_objectives` | Org members can view objectives | SELECT | public |
| `public.comms_organizations` | Org admins can manage comms organizations | ALL | public |
| `public.comms_organizations` | Org members can view comms organizations | SELECT | public |
| `public.comms_policy_files` | Org admins can manage policy files | ALL | public |
| `public.comms_policy_files` | Org members can view policy files | SELECT | public |
| `public.comms_sources` | Org admins can manage sources | ALL | public |
| `public.comms_sources` | Org members can view sources | SELECT | public |
| `public.comms_submissions` | Org admins can manage submissions | ALL | public |
| `public.comms_submissions` | Org members can view submissions | SELECT | public |
| `public.comms_usage_controls` | Org admins can manage usage controls | ALL | public |
| `public.comms_usage_controls` | Org members can view usage controls | SELECT | public |
| `public.compliance_assessments` | Members can create compliance assessments | INSERT | authenticated |
| `public.compliance_assessments` | Members can view compliance assessments | SELECT | authenticated |
| `public.compliance_findings` | Members can manage compliance findings | ALL | authenticated |
| `public.compliance_score_snapshots` | Org admins can delete score snapshots | DELETE | public |
| `public.compliance_score_snapshots` | Org admins can insert score snapshots | INSERT | public |
| `public.compliance_score_snapshots` | Org admins can update score snapshots | UPDATE | public |
| `public.compliance_score_snapshots` | Org members can view score snapshots | SELECT | public |
| `public.compliance_tasks` | Org members can manage compliance tasks | ALL | authenticated |
| `public.conversations` | Users can manage their own conversations | ALL | authenticated |
| `public.cron_locks` | Deny client API access | ALL | anon,authenticated |
| `public.devops_runbooks` | Admins can manage runbooks | ALL | authenticated |
| `public.document_annotations` | Members can manage annotations | ALL | authenticated |
| `public.document_generation_runs` | Users can create own generation runs | INSERT | public |
| `public.document_generation_runs` | Users can read own generation runs | SELECT | public |
| `public.document_generation_runs` | Users can update own generation runs | UPDATE | public |
| `public.document_reviews` | Members can manage document reviews | ALL | authenticated |
| `public.document_versions` | Members can create document versions | INSERT | authenticated |
| `public.document_versions` | Members can view document versions | SELECT | authenticated |
| `public.documents` | Users can delete their own documents | DELETE | authenticated |
| `public.documents` | Users can insert their own documents | INSERT | authenticated |
| `public.documents` | Users can update their own documents | UPDATE | authenticated |
| `public.documents` | Users can view their own documents | SELECT | authenticated |
| `public.employees` | Org admins can delete employees | DELETE | public |
| `public.employees` | Org admins can insert employees | INSERT | public |
| `public.employees` | Org admins can update employees | UPDATE | public |
| `public.employees` | Org members can view employees | SELECT | public |
| `public.employer_profiles` | Users can delete their own employer profiles | DELETE | authenticated |
| `public.employer_profiles` | Users can insert their own employer profiles | INSERT | authenticated |
| `public.employer_profiles` | Users can update their own employer profiles | UPDATE | authenticated |
| `public.employer_profiles` | Users can view their own employer profiles | SELECT | authenticated |
| `public.employer_tiers` | Authenticated read: employer_tiers | SELECT | authenticated |
| `public.entity_links` | entity_links_select | SELECT | authenticated |
| `public.entity_links` | entity_links_write | ALL | authenticated |
| `public.entity_relationships` | Members can manage entity relationships | ALL | authenticated |
| `public.execution_traces` | Admins can delete execution traces | DELETE | authenticated |
| `public.execution_traces` | Admins can insert execution traces | INSERT | authenticated |
| `public.execution_traces` | Admins can update execution traces | UPDATE | authenticated |
| `public.execution_traces` | Members can view execution traces | SELECT | authenticated |
| `public.export_events` | Deny client API access | ALL | anon,authenticated |
| `public.external_integrations` | Org admins can manage integrations | ALL | authenticated |
| `public.finance_approvals` | Org admins can delete finance_approvals | DELETE | authenticated |
| `public.finance_approvals` | Org admins can insert finance_approvals | INSERT | authenticated |
| `public.finance_approvals` | Org admins can update finance_approvals | UPDATE | authenticated |
| `public.finance_approvals` | Org members can read finance_approvals | SELECT | authenticated |
| `public.finance_audit_events` | Org admins can delete finance_audit_events | DELETE | authenticated |
| `public.finance_audit_events` | Org admins can insert finance_audit_events | INSERT | authenticated |
| `public.finance_audit_events` | Org admins can update finance_audit_events | UPDATE | authenticated |
| `public.finance_audit_events` | Org members can read finance_audit_events | SELECT | authenticated |
| `public.finance_bank_accounts` | Org admins can delete finance_bank_accounts | DELETE | authenticated |
| `public.finance_bank_accounts` | Org admins can insert finance_bank_accounts | INSERT | authenticated |
| `public.finance_bank_accounts` | Org admins can update finance_bank_accounts | UPDATE | authenticated |
| `public.finance_bank_accounts` | Org members can read finance_bank_accounts | SELECT | authenticated |
| `public.finance_bank_items` | Org admins can delete finance_bank_items | DELETE | authenticated |
| `public.finance_bank_items` | Org admins can insert finance_bank_items | INSERT | authenticated |
| `public.finance_bank_items` | Org admins can update finance_bank_items | UPDATE | authenticated |
| `public.finance_bank_items` | Org members can read finance_bank_items | SELECT | authenticated |
| `public.finance_bills` | Org admins can delete finance_bills | DELETE | authenticated |
| `public.finance_bills` | Org admins can insert finance_bills | INSERT | authenticated |
| `public.finance_bills` | Org admins can update finance_bills | UPDATE | authenticated |
| `public.finance_bills` | Org members can read finance_bills | SELECT | authenticated |
| `public.finance_books` | Org admins can delete finance_books | DELETE | authenticated |
| `public.finance_books` | Org admins can insert finance_books | INSERT | authenticated |
| `public.finance_books` | Org admins can update finance_books | UPDATE | authenticated |
| `public.finance_books` | Org members can read finance_books | SELECT | authenticated |
| `public.finance_budgets` | Org admins can delete finance_budgets | DELETE | authenticated |
| `public.finance_budgets` | Org admins can insert finance_budgets | INSERT | authenticated |
| `public.finance_budgets` | Org admins can update finance_budgets | UPDATE | authenticated |
| `public.finance_budgets` | Org members can read finance_budgets | SELECT | authenticated |
| `public.finance_categorization_feedback` | Org admins can delete finance_categorization_feedback | DELETE | authenticated |
| `public.finance_categorization_feedback` | Org admins can insert finance_categorization_feedback | INSERT | authenticated |
| `public.finance_categorization_feedback` | Org admins can update finance_categorization_feedback | UPDATE | authenticated |
| `public.finance_categorization_feedback` | Org members can read finance_categorization_feedback | SELECT | authenticated |
| `public.finance_category_rules` | Org admins can delete finance_category_rules | DELETE | authenticated |
| `public.finance_category_rules` | Org admins can insert finance_category_rules | INSERT | authenticated |
| `public.finance_category_rules` | Org admins can update finance_category_rules | UPDATE | authenticated |
| `public.finance_category_rules` | Org members can read finance_category_rules | SELECT | authenticated |
| `public.finance_close_periods` | Org admins can delete finance_close_periods | DELETE | authenticated |
| `public.finance_close_periods` | Org admins can insert finance_close_periods | INSERT | authenticated |
| `public.finance_close_periods` | Org admins can update finance_close_periods | UPDATE | authenticated |
| `public.finance_close_periods` | Org members can read finance_close_periods | SELECT | authenticated |
| `public.finance_credits` | Org admins can delete finance_credits | DELETE | authenticated |
| `public.finance_credits` | Org admins can insert finance_credits | INSERT | authenticated |
| `public.finance_credits` | Org admins can update finance_credits | UPDATE | authenticated |
| `public.finance_credits` | Org members can read finance_credits | SELECT | authenticated |
| `public.finance_debts` | Org admins can delete finance_debts | DELETE | authenticated |
| `public.finance_debts` | Org admins can insert finance_debts | INSERT | authenticated |
| `public.finance_debts` | Org admins can update finance_debts | UPDATE | authenticated |
| `public.finance_debts` | Org members can read finance_debts | SELECT | authenticated |
| `public.finance_decision_entries` | Org admins can delete finance_decision_entries | DELETE | authenticated |
| `public.finance_decision_entries` | Org admins can insert finance_decision_entries | INSERT | authenticated |
| `public.finance_decision_entries` | Org admins can update finance_decision_entries | UPDATE | authenticated |
| `public.finance_decision_entries` | Org members can read finance_decision_entries | SELECT | authenticated |
| `public.finance_entities` | Org admins can delete finance_entities | DELETE | authenticated |
| `public.finance_entities` | Org admins can insert finance_entities | INSERT | authenticated |
| `public.finance_entities` | Org admins can update finance_entities | UPDATE | authenticated |
| `public.finance_entities` | Org members can read finance_entities | SELECT | authenticated |
| `public.finance_expenses` | Org admins can delete finance_expenses | DELETE | authenticated |
| `public.finance_expenses` | Org admins can insert finance_expenses | INSERT | authenticated |
| `public.finance_expenses` | Org admins can update finance_expenses | UPDATE | authenticated |
| `public.finance_expenses` | Org members can read finance_expenses | SELECT | authenticated |
| `public.finance_external_actions` | Org admins can delete finance_external_actions | DELETE | authenticated |
| `public.finance_external_actions` | Org admins can insert finance_external_actions | INSERT | authenticated |
| `public.finance_external_actions` | Org admins can update finance_external_actions | UPDATE | authenticated |
| `public.finance_external_actions` | Org members can read finance_external_actions | SELECT | authenticated |
| `public.finance_fiscal_periods` | Org admins can delete finance_fiscal_periods | DELETE | authenticated |
| `public.finance_fiscal_periods` | Org admins can insert finance_fiscal_periods | INSERT | authenticated |
| `public.finance_fiscal_periods` | Org admins can update finance_fiscal_periods | UPDATE | authenticated |
| `public.finance_fiscal_periods` | Org members can read finance_fiscal_periods | SELECT | authenticated |
| `public.finance_forecasts` | Org admins can delete finance_forecasts | DELETE | authenticated |
| `public.finance_forecasts` | Org admins can insert finance_forecasts | INSERT | authenticated |
| `public.finance_forecasts` | Org admins can update finance_forecasts | UPDATE | authenticated |
| `public.finance_forecasts` | Org members can read finance_forecasts | SELECT | authenticated |
| `public.finance_holdings` | Org admins can delete finance_holdings | DELETE | authenticated |
| `public.finance_holdings` | Org admins can insert finance_holdings | INSERT | authenticated |
| `public.finance_holdings` | Org admins can update finance_holdings | UPDATE | authenticated |
| `public.finance_holdings` | Org members can read finance_holdings | SELECT | authenticated |
| `public.finance_import_sessions` | Org admins can delete finance_import_sessions | DELETE | authenticated |
| `public.finance_import_sessions` | Org admins can insert finance_import_sessions | INSERT | authenticated |
| `public.finance_import_sessions` | Org admins can update finance_import_sessions | UPDATE | authenticated |
| `public.finance_import_sessions` | Org members can read finance_import_sessions | SELECT | authenticated |
| `public.finance_invoices` | Org admins can delete finance_invoices | DELETE | authenticated |
| `public.finance_invoices` | Org admins can insert finance_invoices | INSERT | authenticated |
| `public.finance_invoices` | Org admins can update finance_invoices | UPDATE | authenticated |
| `public.finance_invoices` | Org members can read finance_invoices | SELECT | authenticated |
| `public.finance_journals` | Org admins can delete finance_journals | DELETE | authenticated |
| `public.finance_journals` | Org admins can insert finance_journals | INSERT | authenticated |
| `public.finance_journals` | Org admins can update finance_journals | UPDATE | authenticated |
| `public.finance_journals` | Org members can read finance_journals | SELECT | authenticated |
| `public.finance_ledger_accounts` | Org admins can delete finance_ledger_accounts | DELETE | authenticated |
| `public.finance_ledger_accounts` | Org admins can insert finance_ledger_accounts | INSERT | authenticated |
| `public.finance_ledger_accounts` | Org admins can update finance_ledger_accounts | UPDATE | authenticated |
| `public.finance_ledger_accounts` | Org members can read finance_ledger_accounts | SELECT | authenticated |
| `public.finance_parties` | Org admins can delete finance_parties | DELETE | authenticated |
| `public.finance_parties` | Org admins can insert finance_parties | INSERT | authenticated |
| `public.finance_parties` | Org admins can update finance_parties | UPDATE | authenticated |
| `public.finance_parties` | Org members can read finance_parties | SELECT | authenticated |
| `public.finance_pay_periods` | Org admins can delete finance_pay_periods | DELETE | authenticated |
| `public.finance_pay_periods` | Org admins can insert finance_pay_periods | INSERT | authenticated |
| `public.finance_pay_periods` | Org admins can update finance_pay_periods | UPDATE | authenticated |
| `public.finance_pay_periods` | Org members can read finance_pay_periods | SELECT | authenticated |
| `public.finance_pay_runs` | Org admins can delete finance_pay_runs | DELETE | authenticated |
| `public.finance_pay_runs` | Org admins can insert finance_pay_runs | INSERT | authenticated |
| `public.finance_pay_runs` | Org admins can update finance_pay_runs | UPDATE | authenticated |
| `public.finance_pay_runs` | Org members can read finance_pay_runs | SELECT | authenticated |
| `public.finance_payroll_liabilities` | Org admins can delete finance_payroll_liabilities | DELETE | authenticated |
| `public.finance_payroll_liabilities` | Org admins can insert finance_payroll_liabilities | INSERT | authenticated |
| `public.finance_payroll_liabilities` | Org admins can update finance_payroll_liabilities | UPDATE | authenticated |
| `public.finance_payroll_liabilities` | Org members can read finance_payroll_liabilities | SELECT | authenticated |
| `public.finance_purchase_orders` | Org admins can delete finance_purchase_orders | DELETE | authenticated |
| `public.finance_purchase_orders` | Org admins can insert finance_purchase_orders | INSERT | authenticated |
| `public.finance_purchase_orders` | Org admins can update finance_purchase_orders | UPDATE | authenticated |
| `public.finance_purchase_orders` | Org members can read finance_purchase_orders | SELECT | authenticated |
| `public.finance_receipts` | Org admins can delete finance_receipts | DELETE | authenticated |
| `public.finance_receipts` | Org admins can insert finance_receipts | INSERT | authenticated |
| `public.finance_receipts` | Org admins can update finance_receipts | UPDATE | authenticated |
| `public.finance_receipts` | Org members can read finance_receipts | SELECT | authenticated |
| `public.finance_reconciliations` | Org admins can delete finance_reconciliations | DELETE | authenticated |
| `public.finance_reconciliations` | Org admins can insert finance_reconciliations | INSERT | authenticated |
| `public.finance_reconciliations` | Org admins can update finance_reconciliations | UPDATE | authenticated |
| `public.finance_reconciliations` | Org members can read finance_reconciliations | SELECT | authenticated |
| `public.finance_reserve_goals` | Org admins can delete finance_reserve_goals | DELETE | authenticated |
| `public.finance_reserve_goals` | Org admins can insert finance_reserve_goals | INSERT | authenticated |
| `public.finance_reserve_goals` | Org admins can update finance_reserve_goals | UPDATE | authenticated |
| `public.finance_reserve_goals` | Org members can read finance_reserve_goals | SELECT | authenticated |
| `public.finance_scenarios` | Org admins can delete finance_scenarios | DELETE | authenticated |
| `public.finance_scenarios` | Org admins can insert finance_scenarios | INSERT | authenticated |
| `public.finance_scenarios` | Org admins can update finance_scenarios | UPDATE | authenticated |
| `public.finance_scenarios` | Org members can read finance_scenarios | SELECT | authenticated |
| `public.finance_spend_requests` | Org admins can delete finance_spend_requests | DELETE | authenticated |
| `public.finance_spend_requests` | Org admins can insert finance_spend_requests | INSERT | authenticated |
| `public.finance_spend_requests` | Org admins can update finance_spend_requests | UPDATE | authenticated |
| `public.finance_spend_requests` | Org members can read finance_spend_requests | SELECT | authenticated |
| `public.finance_subscriptions` | Org admins can delete finance_subscriptions | DELETE | authenticated |
| `public.finance_subscriptions` | Org admins can insert finance_subscriptions | INSERT | authenticated |
| `public.finance_subscriptions` | Org admins can update finance_subscriptions | UPDATE | authenticated |
| `public.finance_subscriptions` | Org members can read finance_subscriptions | SELECT | authenticated |
| `public.finance_tax_obligations` | Org admins can delete finance_tax_obligations | DELETE | authenticated |
| `public.finance_tax_obligations` | Org admins can insert finance_tax_obligations | INSERT | authenticated |
| `public.finance_tax_obligations` | Org admins can update finance_tax_obligations | UPDATE | authenticated |
| `public.finance_tax_obligations` | Org members can read finance_tax_obligations | SELECT | authenticated |
| `public.finance_tax_scenarios` | Org admins can delete finance_tax_scenarios | DELETE | authenticated |
| `public.finance_tax_scenarios` | Org admins can insert finance_tax_scenarios | INSERT | authenticated |
| `public.finance_tax_scenarios` | Org admins can update finance_tax_scenarios | UPDATE | authenticated |
| `public.finance_tax_scenarios` | Org members can read finance_tax_scenarios | SELECT | authenticated |
| `public.finance_watchlist_items` | Org admins can delete finance_watchlist_items | DELETE | authenticated |
| `public.finance_watchlist_items` | Org admins can insert finance_watchlist_items | INSERT | authenticated |
| `public.finance_watchlist_items` | Org admins can update finance_watchlist_items | UPDATE | authenticated |
| `public.finance_watchlist_items` | Org members can read finance_watchlist_items | SELECT | authenticated |
| `public.finance_workspace_settings` | Org admins can delete finance_workspace_settings | DELETE | authenticated |
| `public.finance_workspace_settings` | Org admins can insert finance_workspace_settings | INSERT | authenticated |
| `public.finance_workspace_settings` | Org admins can update finance_workspace_settings | UPDATE | authenticated |
| `public.finance_workspace_settings` | Org members can read finance_workspace_settings | SELECT | authenticated |
| `public.frontend_feature_flags` | Admins can delete feature flags | DELETE | authenticated |
| `public.frontend_feature_flags` | Admins can insert feature flags | INSERT | authenticated |
| `public.frontend_feature_flags` | Admins can update feature flags | UPDATE | authenticated |
| `public.frontend_feature_flags` | Authenticated can read feature flags | SELECT | authenticated |
| `public.generator_document_templates` | Authenticated users can view enabled generator templates | SELECT | authenticated |
| `public.governance_decisions` | governance_decisions_select | SELECT | authenticated |
| `public.governance_decisions` | governance_decisions_write | ALL | authenticated |
| `public.governance_officers` | governance_officers_select | SELECT | authenticated |
| `public.governance_officers` | governance_officers_write | ALL | authenticated |
| `public.governance_records` | governance_records_select | SELECT | authenticated |
| `public.governance_records` | governance_records_write | ALL | authenticated |
| `public.governance_shareholders` | governance_shareholders_select | SELECT | authenticated |
| `public.governance_shareholders` | governance_shareholders_write | ALL | authenticated |
| `public.guidance_chunks` | Admins can delete guidance chunks | DELETE | authenticated |
| `public.guidance_chunks` | Admins can insert guidance chunks | INSERT | authenticated |
| `public.guidance_chunks` | Admins can update guidance chunks | UPDATE | authenticated |
| `public.guidance_chunks` | Members can read guidance chunks | SELECT | authenticated |
| `public.guidance_sources` | Admins can delete guidance sources | DELETE | authenticated |
| `public.guidance_sources` | Admins can insert guidance sources | INSERT | authenticated |
| `public.guidance_sources` | Admins can update guidance sources | UPDATE | authenticated |
| `public.guidance_sources` | Authenticated can read active public guidance sources | SELECT | authenticated |
| `public.hr_advisor_case_narratives` | Org admins can delete case narratives | DELETE | public |
| `public.hr_advisor_case_narratives` | Org admins can insert case narratives | INSERT | public |
| `public.hr_advisor_case_narratives` | Org admins can update case narratives | UPDATE | public |
| `public.hr_advisor_case_narratives` | Org members can view case narratives | SELECT | public |
| `public.hr_advisor_case_timeline_events` | Org admins can delete case timeline | DELETE | public |
| `public.hr_advisor_case_timeline_events` | Org admins can insert case timeline | INSERT | public |
| `public.hr_advisor_case_timeline_events` | Org members can view case timeline | SELECT | public |
| `public.hr_advisor_memory_audit` | Org admins can insert memory audit | INSERT | public |
| `public.hr_advisor_memory_audit` | Org members can view memory audit | SELECT | public |
| `public.hr_advisor_memory_facts` | Org admins can delete memory facts | DELETE | public |
| `public.hr_advisor_memory_facts` | Org admins can insert memory facts | INSERT | public |
| `public.hr_advisor_memory_facts` | Org admins can update memory facts | UPDATE | public |
| `public.hr_advisor_memory_facts` | Org members can view memory facts | SELECT | public |
| `public.hr_authenticity_scores` | Org admins can manage authenticity scores | ALL | public |
| `public.hr_authenticity_scores` | Org members can read authenticity scores | SELECT | public |
| `public.hr_candidates` | Org admins can delete candidates | DELETE | public |
| `public.hr_candidates` | Org admins can insert candidates | INSERT | public |
| `public.hr_candidates` | Org admins can update candidates | UPDATE | public |
| `public.hr_candidates` | Org members can read candidates | SELECT | public |
| `public.hr_case_notes` | Org admins can delete case notes | DELETE | public |
| `public.hr_case_notes` | Org admins can insert case notes | INSERT | public |
| `public.hr_case_notes` | Org members can view case notes | SELECT | public |
| `public.hr_cases` | Org admins can delete cases | DELETE | public |
| `public.hr_cases` | Org admins can insert cases | INSERT | public |
| `public.hr_cases` | Org admins can update cases | UPDATE | public |
| `public.hr_cases` | Org members can view cases | SELECT | public |
| `public.hr_communications` | Org admins can delete communications | DELETE | public |
| `public.hr_communications` | Org admins can insert communications | INSERT | public |
| `public.hr_communications` | Org admins can update communications | UPDATE | public |
| `public.hr_communications` | Org members can view communications | SELECT | public |
| `public.hr_compensation_records` | Org admins can delete compensation records | DELETE | public |
| `public.hr_compensation_records` | Org admins can insert compensation records | INSERT | public |
| `public.hr_compensation_records` | Org admins can update compensation records | UPDATE | public |
| `public.hr_compensation_records` | Org admins can view compensation records | SELECT | public |
| `public.hr_defense_interviews` | Org admins can manage interviews | ALL | public |
| `public.hr_defense_interviews` | Org members can read interviews | SELECT | public |
| `public.hr_document_audit_events` | Org admins can insert document audit events | INSERT | public |
| `public.hr_document_audit_events` | Org members can view document audit events | SELECT | public |
| `public.hr_document_exports` | Org admins can insert document exports | INSERT | public |
| `public.hr_document_exports` | Org members can view document exports | SELECT | public |
| `public.hr_document_recipients` | Org admins can insert document recipients | INSERT | public |
| `public.hr_document_recipients` | Org can update document recipients | UPDATE | public |
| `public.hr_document_recipients` | Org members can view document recipients | SELECT | public |
| `public.hr_document_signatures` | Org admins can insert document signatures | INSERT | public |
| `public.hr_document_signatures` | Org can update document signatures | UPDATE | public |
| `public.hr_document_signatures` | Org members can view document signatures | SELECT | public |
| `public.hr_document_versions` | Org admins can insert document versions | INSERT | public |
| `public.hr_document_versions` | Org members can view document versions | SELECT | public |
| `public.hr_documents` | Deny client API access | ALL | anon,authenticated |
| `public.hr_employee_notes` | Org admins can delete employee notes | DELETE | public |
| `public.hr_employee_notes` | Org admins can insert employee notes | INSERT | public |
| `public.hr_employee_notes` | Org members can view employee notes | SELECT | public |
| `public.hr_evidence_screening` | Org admins can manage evidence screening | ALL | public |
| `public.hr_evidence_screening` | Org members can read evidence screening | SELECT | public |
| `public.hr_expiry_records` | Org admins can delete expiry records | DELETE | public |
| `public.hr_expiry_records` | Org admins can insert expiry records | INSERT | public |
| `public.hr_expiry_records` | Org admins can update expiry records | UPDATE | public |
| `public.hr_expiry_records` | Org members can view expiry records | SELECT | public |
| `public.hr_generated_documents` | Org admins can delete generated documents | DELETE | public |
| `public.hr_generated_documents` | Org admins can insert generated documents | INSERT | public |
| `public.hr_generated_documents` | Org admins can update generated documents | UPDATE | public |
| `public.hr_generated_documents` | Org members can view generated documents | SELECT | public |
| `public.hr_job_postings` | Anon can read active job posting columns | SELECT | anon |
| `public.hr_job_postings` | Org admins can manage job postings | ALL | public |
| `public.hr_job_postings` | Org members can read job postings | SELECT | public |
| `public.hr_leaves` | Org admins can delete leaves | DELETE | public |
| `public.hr_leaves` | Org admins can insert leaves | INSERT | public |
| `public.hr_leaves` | Org admins can update leaves | UPDATE | public |
| `public.hr_leaves` | Org members can view leaves | SELECT | public |
| `public.hr_obligations` | Org admins can delete obligations | DELETE | public |
| `public.hr_obligations` | Org admins can insert obligations | INSERT | public |
| `public.hr_obligations` | Org admins can update obligations | UPDATE | public |
| `public.hr_obligations` | Org members can view obligations | SELECT | public |
| `public.hr_onboarding_tasks` | Org admins can manage onboarding tasks | ALL | public |
| `public.hr_onboarding_tasks` | Org members can view onboarding tasks | SELECT | public |
| `public.hr_performance_reviews` | Org admins can delete performance reviews | DELETE | public |
| `public.hr_performance_reviews` | Org admins can insert performance reviews | INSERT | public |
| `public.hr_performance_reviews` | Org admins can update performance reviews | UPDATE | public |
| `public.hr_performance_reviews` | Org members can view performance reviews | SELECT | public |
| `public.hr_policies` | Org admins can delete policies | DELETE | public |
| `public.hr_policies` | Org admins can insert policies | INSERT | public |
| `public.hr_policies` | Org admins can update policies | UPDATE | public |
| `public.hr_policies` | Org members can view policies | SELECT | public |
| `public.hr_signing_rpc_rate_limit` | Deny client API access | ALL | anon,authenticated |
| `public.hr_wellbeing_initiatives` | Org admins can delete wellbeing initiatives | DELETE | public |
| `public.hr_wellbeing_initiatives` | Org admins can insert wellbeing initiatives | INSERT | public |
| `public.hr_wellbeing_initiatives` | Org admins can update wellbeing initiatives | UPDATE | public |
| `public.hr_wellbeing_initiatives` | Org members can view wellbeing initiatives | SELECT | public |
| `public.hr_work_samples` | Org admins can manage work samples | ALL | public |
| `public.hr_work_samples` | Org members can read work samples | SELECT | public |
| `public.hr_workspace_notifications` | Users read own workspace notifications | SELECT | public |
| `public.hr_workspace_notifications` | Users update own workspace notifications | UPDATE | public |
| `public.inbound_emails` | Org admins can delete inbound_emails | DELETE | authenticated |
| `public.inbound_emails` | Org members can read inbound_emails | SELECT | authenticated |
| `public.integration_events` | Org admins can delete integration_events | DELETE | authenticated |
| `public.integration_events` | Org members can read integration_events | SELECT | authenticated |
| `public.job_attempts` | Admins can delete job attempts | DELETE | authenticated |
| `public.job_attempts` | Admins can insert job attempts | INSERT | authenticated |
| `public.job_attempts` | Admins can update job attempts | UPDATE | authenticated |
| `public.job_attempts` | Members can view job attempts | SELECT | authenticated |
| `public.job_queue` | Admins can delete jobs | DELETE | authenticated |
| `public.job_queue` | Admins can update jobs | UPDATE | authenticated |
| `public.job_queue` | Members can create jobs | INSERT | authenticated |
| `public.job_queue` | Members can view jobs | SELECT | authenticated |
| `public.jurisdiction_comparisons` | Admins can delete jurisdiction comparisons | DELETE | authenticated |
| `public.jurisdiction_comparisons` | Admins can insert jurisdiction comparisons | INSERT | authenticated |
| `public.jurisdiction_comparisons` | Admins can update jurisdiction comparisons | UPDATE | authenticated |
| `public.jurisdiction_comparisons` | Authenticated can read active jurisdiction comparisons | SELECT | authenticated |
| `public.jurisdictions` | Authenticated read: jurisdictions | SELECT | authenticated |
| `public.law_change_impacts` | Members can manage law impacts | ALL | authenticated |
| `public.law_page_hashes` | Service role can manage hashes | ALL | service_role |
| `public.law_page_hashes` | Service role manages hashes | ALL | service_role |
| `public.law_update_notifications` | Admins read law update notifications | SELECT | public |
| `public.law_updates` | Authenticated users can read law updates | SELECT | authenticated |
| `public.law_updates` | Service role can insert law updates | INSERT | service_role |
| `public.legal_ingestion_runs` | Admins can manage legal ingestion runs | ALL | authenticated |
| `public.legal_ingestion_sources` | Admins can delete legal ingestion sources | DELETE | authenticated |
| `public.legal_ingestion_sources` | Admins can insert legal ingestion sources | INSERT | authenticated |
| `public.legal_ingestion_sources` | Admins can update legal ingestion sources | UPDATE | authenticated |
| `public.legal_ingestion_sources` | Authenticated can read active legal ingestion sources | SELECT | authenticated |
| `public.multi_agent_plans` | Admins can delete multi-agent plans | DELETE | authenticated |
| `public.multi_agent_plans` | Admins can insert multi-agent plans | INSERT | authenticated |
| `public.multi_agent_plans` | Admins can update multi-agent plans | UPDATE | authenticated |
| `public.multi_agent_plans` | Members can view multi-agent plans | SELECT | authenticated |
| `public.notification_deliveries` | Admins can delete notification deliveries | DELETE | authenticated |
| `public.notification_deliveries` | Admins can insert notification deliveries | INSERT | authenticated |
| `public.notification_deliveries` | Admins can update notification deliveries | UPDATE | authenticated |
| `public.notification_deliveries` | Users can view notification deliveries | SELECT | authenticated |
| `public.notifications` | Members can create notifications | INSERT | authenticated |
| `public.notifications` | Users can update own notifications | UPDATE | authenticated |
| `public.notifications` | Users can view notifications | SELECT | authenticated |
| `public.offer_workflow_states` | Users can delete their own workflow states | DELETE | authenticated |
| `public.offer_workflow_states` | Users can insert their own workflow states | INSERT | authenticated |
| `public.offer_workflow_states` | Users can update their own workflow states | UPDATE | authenticated |
| `public.offer_workflow_states` | Users can view their own workflow states | SELECT | authenticated |
| `public.operational_bottlenecks` | Members can manage bottlenecks | ALL | authenticated |
| `public.operations_logistics` | operations_logistics_select | SELECT | authenticated |
| `public.operations_logistics` | operations_logistics_write | ALL | authenticated |
| `public.operations_projects` | operations_projects_select | SELECT | authenticated |
| `public.operations_projects` | operations_projects_write | ALL | authenticated |
| `public.operations_quality_checks` | operations_quality_checks_select | SELECT | authenticated |
| `public.operations_quality_checks` | operations_quality_checks_write | ALL | authenticated |
| `public.operations_technology` | operations_technology_select | SELECT | authenticated |
| `public.operations_technology` | operations_technology_write | ALL | authenticated |
| `public.operations_vendors` | operations_vendors_select | SELECT | authenticated |
| `public.operations_vendors` | operations_vendors_write | ALL | authenticated |
| `public.organization_admission_log` | Admins can read admission log | SELECT | authenticated |
| `public.organization_admission_waitlist` | Admins can update waitlist status | UPDATE | authenticated |
| `public.organization_admission_waitlist` | Users and admins can read waitlist | SELECT | authenticated |
| `public.organization_billing_events` | Deny client API access | ALL | anon,authenticated |
| `public.organization_invitations` | Org admins can manage invitations | ALL | authenticated |
| `public.organization_maturity_scores` | Admins can delete maturity scores | DELETE | authenticated |
| `public.organization_maturity_scores` | Admins can insert maturity scores | INSERT | authenticated |
| `public.organization_maturity_scores` | Admins can update maturity scores | UPDATE | authenticated |
| `public.organization_maturity_scores` | Members can view maturity scores | SELECT | authenticated |
| `public.organization_members` | Members can view organization members | SELECT | authenticated |
| `public.organization_members` | Org admins can delete organization members | DELETE | authenticated |
| `public.organization_members` | Org admins can insert organization members | INSERT | authenticated |
| `public.organization_members` | Org admins can update organization members | UPDATE | authenticated |
| `public.organization_risk_snapshots` | Admins can delete org risk snapshots | DELETE | authenticated |
| `public.organization_risk_snapshots` | Admins can insert org risk snapshots | INSERT | authenticated |
| `public.organization_risk_snapshots` | Admins can update org risk snapshots | UPDATE | authenticated |
| `public.organization_risk_snapshots` | Members can view org risk snapshots | SELECT | authenticated |
| `public.organization_usage_events` | Deny client API access | ALL | anon,authenticated |
| `public.organizations` | Authenticated users can create organizations | INSERT | authenticated |
| `public.organizations` | Members can view organizations | SELECT | authenticated |
| `public.organizations` | Org admins can update organizations | UPDATE | authenticated |
| `public.platform_capacity_config` | Deny client API access | ALL | anon,authenticated |
| `public.playbook_runs` | Members can create playbook runs | INSERT | authenticated |
| `public.playbook_runs` | Members can view playbook runs | SELECT | authenticated |
| `public.policy_gap_analyses` | Members can manage policy gap analyses | ALL | authenticated |
| `public.predictive_risk_forecasts` | Admins can delete forecasts | DELETE | authenticated |
| `public.predictive_risk_forecasts` | Admins can insert forecasts | INSERT | authenticated |
| `public.predictive_risk_forecasts` | Admins can update forecasts | UPDATE | authenticated |
| `public.predictive_risk_forecasts` | Members can view forecasts | SELECT | authenticated |
| `public.profiles` | Users can insert their own profile | INSERT | authenticated |
| `public.profiles` | Users can update their own profile | UPDATE | authenticated |
| `public.profiles` | Users can view their own profile | SELECT | authenticated |
| `public.queue_health_snapshots` | Admins can manage queue health | ALL | authenticated |
| `public.revenue_invoices` | revenue_invoices_select | SELECT | authenticated |
| `public.revenue_invoices` | revenue_invoices_write | ALL | authenticated |
| `public.revenue_streams` | revenue_streams_select | SELECT | authenticated |
| `public.revenue_streams` | revenue_streams_write | ALL | authenticated |
| `public.scheduled_operations` | Admins can delete scheduled operations | DELETE | authenticated |
| `public.scheduled_operations` | Admins can insert scheduled operations | INSERT | authenticated |
| `public.scheduled_operations` | Admins can update scheduled operations | UPDATE | authenticated |
| `public.scheduled_operations` | Org admins can view scheduled operations | SELECT | authenticated |
| `public.security_access_reviews` | security_access_reviews_select | SELECT | authenticated |
| `public.security_access_reviews` | security_access_reviews_write | ALL | authenticated |
| `public.security_assets` | security_assets_select | SELECT | authenticated |
| `public.security_assets` | security_assets_write | ALL | authenticated |
| `public.security_incidents` | security_incidents_report | INSERT | authenticated |
| `public.security_incidents` | security_incidents_select | SELECT | authenticated |
| `public.security_incidents` | security_incidents_write | ALL | authenticated |
| `public.security_risks` | security_risks_select | SELECT | authenticated |
| `public.security_risks` | security_risks_write | ALL | authenticated |
| `public.security_vendor_reviews` | security_vendor_reviews_select | SELECT | authenticated |
| `public.security_vendor_reviews` | security_vendor_reviews_write | ALL | authenticated |
| `public.service_status` | Anyone can read service status | SELECT | public |
| `public.signature_audit_events` | Owners can read their signature audit events | SELECT | authenticated |
| `public.signatures` | Owners can manage their signatures | ALL | authenticated |
| `public.specialist_engagements` | specialist_engagements_select | SELECT | authenticated |
| `public.specialist_engagements` | specialist_engagements_write | ALL | authenticated |
| `public.specialists` | specialists_select | SELECT | authenticated |
| `public.specialists` | specialists_write | ALL | authenticated |
| `public.stripe_webhook_events` | Deny client API access | ALL | anon,authenticated |
| `public.subfolders` | Authenticated read: subfolders | SELECT | authenticated |
| `public.support_analytics_daily` | Admins read support analytics daily | SELECT | public |
| `public.support_analytics_events` | Deny client API access | ALL | anon,authenticated |
| `public.support_analytics_rate_limit` | Admins read support analytics rate limit | SELECT | public |
| `public.support_attachments` | Read attachments on a visible ticket | SELECT | public |
| `public.support_messages` | Read messages on a visible, non-internal ticket | SELECT | public |
| `public.support_messages` | Requester can reply to own ticket | INSERT | public |
| `public.support_notifications` | Admins read support notifications | SELECT | public |
| `public.support_public_intake` | Admins read public intake log | SELECT | public |
| `public.support_scheduled_calls` | Requester or workspace member can read own scheduled call | SELECT | public |
| `public.support_ticket_assignments` | Admins read ticket assignments | SELECT | public |
| `public.support_ticket_events` | Admins read ticket events | SELECT | public |
| `public.support_ticket_feedback` | Requester leaves feedback on own ticket | INSERT | public |
| `public.support_ticket_feedback` | Requester or admin reads feedback | SELECT | public |
| `public.support_tickets` | Requester or workspace member can read own tickets | SELECT | public |
| `public.system_events` | Members can create system events | INSERT | authenticated |
| `public.system_events` | Members can view system events | SELECT | authenticated |
| `public.template_audit_log` | Deny client API access | ALL | anon,authenticated |
| `public.template_content_variants` | Admins can delete content variants | DELETE | authenticated |
| `public.template_content_variants` | Admins can insert content variants | INSERT | authenticated |
| `public.template_content_variants` | Admins can update content variants | UPDATE | authenticated |
| `public.template_content_variants` | Authenticated read content for active templates | SELECT | authenticated |
| `public.template_documents` | Own template documents | ALL | authenticated |
| `public.template_fields` | Admins can delete template fields | DELETE | authenticated |
| `public.template_fields` | Admins can insert template fields | INSERT | authenticated |
| `public.template_fields` | Admins can update template fields | UPDATE | authenticated |
| `public.template_fields` | Authenticated read fields for active templates | SELECT | authenticated |
| `public.template_versions` | Admins can delete template versions | DELETE | authenticated |
| `public.template_versions` | Admins can insert template versions | INSERT | authenticated |
| `public.template_versions` | Admins can update template versions | UPDATE | authenticated |
| `public.template_versions` | Authenticated read published versions | SELECT | authenticated |
| `public.templates` | Admins can delete templates | DELETE | authenticated |
| `public.templates` | Admins can insert templates | INSERT | authenticated |
| `public.templates` | Admins can update templates | UPDATE | authenticated |
| `public.templates` | Authenticated read active templates | SELECT | authenticated |
| `public.tier_categories` | Authenticated read: tier_categories | SELECT | authenticated |
| `public.usage_counters` | Users can view their own usage counters | SELECT | authenticated |
| `public.usage_events` | Admins can delete usage events | DELETE | authenticated |
| `public.usage_events` | Admins can update usage events | UPDATE | authenticated |
| `public.usage_events` | Users can insert their own usage events | INSERT | authenticated |
| `public.usage_events` | Users can view their own usage events | SELECT | authenticated |
| `public.user_roles` | Admins can delete roles | DELETE | authenticated |
| `public.user_roles` | Admins can insert roles | INSERT | authenticated |
| `public.user_roles` | Admins can update roles | UPDATE | authenticated |
| `public.user_roles` | Users can view their own roles | SELECT | authenticated |
| `public.webhook_events` | Admins can delete webhook events | DELETE | authenticated |
| `public.webhook_events` | Admins can insert webhook events | INSERT | authenticated |
| `public.webhook_events` | Admins can update webhook events | UPDATE | authenticated |
| `public.webhook_events` | Admins can view webhook events | SELECT | authenticated |
| `public.workflow_automation_runs` | Members can create automation runs | INSERT | authenticated |
| `public.workflow_automation_runs` | Members can view automation runs | SELECT | authenticated |
| `public.workflow_metrics_daily` | Admins can delete workflow metrics | DELETE | authenticated |
| `public.workflow_metrics_daily` | Admins can insert workflow metrics | INSERT | authenticated |
| `public.workflow_metrics_daily` | Admins can update workflow metrics | UPDATE | authenticated |
| `public.workflow_metrics_daily` | Members can view workflow metrics | SELECT | authenticated |
| `public.workflow_playbooks` | Admins can delete playbooks | DELETE | authenticated |
| `public.workflow_playbooks` | Admins can insert playbooks | INSERT | authenticated |
| `public.workflow_playbooks` | Admins can update playbooks | UPDATE | authenticated |
| `public.workflow_playbooks` | Authenticated can read active playbooks | SELECT | authenticated |
| `public.workflow_questions` | Authenticated read workflow questions for active templates | SELECT | authenticated |
| `public.workflow_responses` | Own workflow responses | ALL | authenticated |
| `public.workflows` | Own workflows | ALL | authenticated |
| `public.workspace_integrations` | Org admins can delete workspace_integrations | DELETE | authenticated |
| `public.workspace_integrations` | Org admins can insert workspace_integrations | INSERT | authenticated |
| `public.workspace_integrations` | Org admins can update workspace_integrations | UPDATE | authenticated |
| `public.workspace_integrations` | Org members can read workspace_integrations | SELECT | authenticated |
| `public.workspace_intelligence_items` | Members can manage workspace intelligence | ALL | authenticated |
| `public.workspace_notes` | Members can manage workspace notes | ALL | authenticated |
| `public.workspace_preferences` | Admins manage their own workspace preference | ALL | public |

## Cron jobs — 13

| Job | Schedule |
| --- | -------- |
| `law-update-digest-weekly` | `0 8 * * 1` |
| `monitor-law-changes-daily` | `0 7 * * *` |
| `policy-review-sweep` | `15 13 * * *` |
| `purge-ai-telemetry-data` | `17 4 * * *` |
| `purge-client-error-data` | `23 * * * *` |
| `purge-support-analytics-rate-limit` | `17 * * * *` |
| `record-score-snapshots-daily` | `30 5 * * *` |
| `record-score-snapshots-month-close` | `5,25,45 0 1 * *` |
| `signing-reminder-sweep` | `0 */6 * * *` |
| `support-analytics-rollup` | `0 1 * * *` |
| `support-attachment-scan` | `*/10 * * * *` |
| `support-call-scheduler-sweep` | `*/15 * * * *` |
| `support-notify-drain` | `* * * * *` |

## Replication recipe

To rebuild this database on a new Supabase project:

1. `supabase link` the new project, then `supabase db push` — applies all
   159 repo migrations in order.
2. Replay the pre-repo baseline: the platform tables/RPCs that predate
   this repo exist only in `supabase/schema.sql` (see DATABASE_SCHEMA.md).
   Apply the missing objects from that file, or dump-restore them.
3. Re-apply the MCP slices in `ACCEPTED_UNTRACKED` (check-migrations.mjs):
   `grant_admin_directory_rpcs`, `signup_alert_identifies_account`, plus
   the advisor-phase aliases — their SQL lives in the MCP apply history,
   not this repo.
4. Set function secrets + Vault entries per `.env.example` and the
   migration comments that need them (law-monitor, attachment-scan keys).
5. Verify: `npm run check:migrations` against the new project, then this
   script — the generated map should match modulo the project ref.
