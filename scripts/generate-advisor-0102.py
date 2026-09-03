#!/usr/bin/env python3
"""Generate 0102_advisor_phase3_fk_initplan_permissive.sql from live advisor snapshot."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIG = ROOT / "supabase" / "migrations"
FK_JSON = Path(__file__).with_name("_advisor_fk_rows_phase2.json")

# ALL policies to split into IUD (admin-only manage; SELECT stays separate).
SPLIT_ALL_POLICIES: list[tuple[str, str, str]] = [
    # table, policy name, qual expression (without outer parens)
    ("agent_runs", "Admins can manage agent runs", "is_admin((select auth.uid()))"),
    ("ai_agents", "Admins can manage AI agents", "is_admin((select auth.uid()))"),
    ("ai_model_routes", "Admins can manage model routes", "is_admin((select auth.uid()))"),
    ("ai_telemetry_events", "Admins can manage AI telemetry", "is_admin((select auth.uid()))"),
    ("benchmark_snapshots", "Admins can manage benchmarks", "is_admin((select auth.uid()))"),
    ("billing_events", "Admins can manage billing events", "is_admin((select auth.uid()))"),
    ("execution_traces", "Admins can manage execution traces", "is_admin((select auth.uid()))"),
    ("job_attempts", "Admins can manage job attempts", "is_admin((select auth.uid()))"),
    ("job_queue", "Admins can manage jobs", "is_admin((select auth.uid()))"),
    ("multi_agent_plans", "Admins can manage multi-agent plans", "is_admin((select auth.uid()))"),
    ("notification_deliveries", "Admins can manage notification deliveries", "is_admin((select auth.uid()))"),
    ("organization_maturity_scores", "Admins can manage maturity scores", "is_admin((select auth.uid()))"),
    ("organization_risk_snapshots", "Admins can manage org risk snapshots", "is_admin((select auth.uid()))"),
    ("predictive_risk_forecasts", "Admins can manage forecasts", "is_admin((select auth.uid()))"),
    ("scheduled_operations", "Admins can manage scheduled operations", "is_admin((select auth.uid()))"),
    ("webhook_events", "Admins can manage webhook events", "is_admin((select auth.uid()))"),
    ("workflow_metrics_daily", "Admins can manage workflow metrics", "is_admin((select auth.uid()))"),
    ("usage_events", "Admins can manage usage events", "is_admin((select auth.uid()))"),
    ("user_roles", "Admins can manage roles", "is_admin((select auth.uid()))"),
    ("frontend_feature_flags", "Admins can manage feature flags", "is_admin((select auth.uid()))"),
    ("guidance_chunks", "Admins can manage guidance chunks", "is_admin((select auth.uid()))"),
    ("guidance_sources", "Admins can manage guidance sources", "is_admin((select auth.uid()))"),
    ("jurisdiction_comparisons", "Admins can manage jurisdiction comparisons", "is_admin((select auth.uid()))"),
    ("legal_ingestion_sources", "Admins can manage legal ingestion sources", "is_admin((select auth.uid()))"),
    ("workflow_playbooks", "Admins can manage playbooks", "is_admin((select auth.uid()))"),
    ("template_content_variants", "Admins can manage content variants", "is_admin_user()"),
    ("template_fields", "Admins can manage template fields", "is_admin_user()"),
    ("template_versions", "Admins can manage template versions", "is_admin_user()"),
    ("templates", "Admins can manage templates", "is_admin_user()"),
]

RECIPIENTS_USING = """
(
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_recipients.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_recipients.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status in ('pending', 'sent', 'viewed')
  )
)
""".strip()

RECIPIENTS_CHECK = """
(
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_recipients.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_recipients.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status in ('viewed', 'signed', 'declined')
  )
)
""".strip()

SIGNATURES_USING = """
(
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_signatures.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_signatures.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and status in ('sent', 'viewed', 'pending', 'partially_signed')
    and exists (
      select 1
      from public.hr_document_recipients r
      where r.signature_id = hr_document_signatures.id
        and lower(r.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        and r.status in ('pending', 'sent', 'viewed')
    )
  )
)
""".strip()

SIGNATURES_CHECK = """
(
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_signatures.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_signatures.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and status in ('viewed', 'partially_signed', 'signed', 'declined')
  )
)
""".strip()


def split_all_policy(table: str, name: str, qual: str) -> list[str]:
    base = name.replace(" manage ", " ").replace("Admins can ", "")
    lines = [f'drop policy if exists "{name}" on public.{table};']
    for action, cmd in (("insert", "insert"), ("update", "update"), ("delete", "delete")):
        pol = f"Admins can {action} {base}"
        stmt = [f'create policy "{pol}"', f"  on public.{table}", f"  for {cmd}", "  to authenticated"]
        if cmd == "insert":
            stmt.append(f"  with check ({qual});")
        elif cmd == "update":
            stmt.append(f"  using ({qual})")
            stmt.append(f"  with check ({qual});")
        else:
            stmt.append(f"  using ({qual});")
        lines.append("\n".join(stmt))
    return lines


def fk_section() -> list[str]:
    rows = json.loads(FK_JSON.read_text(encoding="utf-8"))
    lines = [
        "-- Remaining unindexed foreign keys (organization_id and second-column FK pass).",
    ]
    seen: set[str] = set()
    for row in rows:
        tbl = row["tbl"].replace("public.", "")
        col = row["col"]
        idx = f"{tbl}_{col}_fkey_idx"
        if idx in seen:
            idx = f"{tbl}_{row['fkey']}_idx"
        seen.add(idx)
        lines.append(f"create index if not exists {idx} on public.{tbl} ({col});")
    return lines


def main() -> None:
    parts: list[str] = [
        "-- Advisor phase 3: remaining FK indexes, signing initplan, permissive-policy cleanup.",
        "",
    ]

    parts.extend(fk_section())
    parts.append("")
    parts.append("-- Initplan: inline org membership in signing UPDATE policies (avoid is_org_* in RLS).")
    parts.append('alter policy "Org can update document recipients" on public.hr_document_recipients')
    parts.append(f"  using ({RECIPIENTS_USING})")
    parts.append(f"  with check ({RECIPIENTS_CHECK});")
    parts.append('alter policy "Org can update document signatures" on public.hr_document_signatures')
    parts.append(f"  using ({SIGNATURES_USING})")
    parts.append(f"  with check ({SIGNATURES_CHECK});")
    parts.append("")
    parts.append("-- Permissive policies: drop redundant SELECT where ALL already matches.")
    parts.append(
        'drop policy if exists "Org admins can view integrations" on public.external_integrations;'
    )
    parts.append("")
    parts.append("-- Merge duplicate waitlist SELECT policies.")
    parts.append('drop policy if exists "Admins can read waitlist" on public.organization_admission_waitlist;')
    parts.append('drop policy if exists "Users can read own waitlist row" on public.organization_admission_waitlist;')
    parts.append("""
create policy "Users and admins can read waitlist"
  on public.organization_admission_waitlist
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin_user()
  );
""".strip())
    parts.append("")
    parts.append("-- Split admin ALL manage policies into IUD so SELECT is not doubled.")
    for table, name, qual in SPLIT_ALL_POLICIES:
        parts.extend(split_all_policy(table, name, qual))
        parts.append("")

    body = "\n".join(parts).strip() + "\n"
    out = MIG / "0102_advisor_phase3_fk_initplan_permissive.sql"
    out.write_text(body, encoding="utf-8")
    print(f"wrote {out.name} ({len(body)} bytes, {body.count(chr(10))} lines)")


if __name__ == "__main__":
    main()
