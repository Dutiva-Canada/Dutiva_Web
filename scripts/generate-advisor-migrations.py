#!/usr/bin/env python3
"""Generate Supabase advisor remediation migrations (0097–0101)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIG = ROOT / "supabase" / "migrations"
PERF = Path(
    r"C:\Users\Marti\.cursor\projects\c-Users-Marti-Dutiva-Web-1\agent-tools\bb442af6-cc53-4827-8ee0-c454cbc0baec.txt"
)

POLICIES_JSON = Path(__file__).with_name("_advisor_initplan_policies.json")
FK_JSON = Path(__file__).with_name("_advisor_fk_rows.json")

# SELECT policies whose USING exactly matches an ALL policy on the same table.
DROP_SELECT_REDUNDANT = [
    ("advisor_memories", "Members can view advisor memories"),
    ("ai_drafting_sessions", "Members can view drafting sessions"),
    ("ai_recommendations", "Members can view AI recommendations"),
    ("comments", "Members can view comments"),
    ("compliance_findings", "Members can view compliance findings"),
    ("compliance_tasks", "Org members can view compliance tasks"),
    ("document_annotations", "Members can view annotations"),
    ("document_reviews", "Members can view document reviews"),
    ("entity_relationships", "Members can view entity relationships"),
    ("law_change_impacts", "Members can view law impacts"),
    ("legal_ingestion_runs", "Admins can view legal ingestion runs"),
    ("operational_bottlenecks", "Members can view bottlenecks"),
    ("policy_gap_analyses", "Members can view policy gap analyses"),
    ("queue_health_snapshots", "Admins can view queue health"),
    ("workspace_intelligence_items", "Members can view workspace intelligence"),
    ("workspace_notes", "Members can view workspace notes"),
]


def fix_initplan(expr: str | None) -> str | None:
    if not expr:
        return None
    out = expr.replace("(select auth.uid())", "\0UID\0")
    out = out.replace("(select auth.jwt())", "\0JWT\0")
    out = out.replace("( SELECT auth.uid() AS uid)", "\0UID\0")
    out = out.replace("auth.uid()", "(select auth.uid())")
    out = out.replace("auth.jwt()", "(select auth.jwt())")
    out = out.replace("\0UID\0", "(select auth.uid())")
    out = out.replace("\0JWT\0", "(select auth.jwt())")
    return out


def needs_fix(expr: str | None) -> bool:
    if not expr:
        return False
    probe = expr
    for token in (
        "(select auth.uid())",
        "( SELECT auth.uid() AS uid)",
        "(select auth.jwt())",
    ):
        probe = probe.replace(token, "")
    return "auth.uid()" in probe or "auth.jwt()" in probe


def write(path: str, body: str) -> None:
    (MIG / path).write_text(body.strip() + "\n", encoding="utf-8")
    print(f"wrote {path} ({len(body)} bytes)")


def main() -> None:
    write(
        "0097_advisor_phase2_anon_revokes.sql",
        """
-- Close remaining unintended anon EXECUTE grants flagged by the advisor.
revoke execute on function public.join_organization_waitlist(text)
  from public, anon;
grant execute on function public.join_organization_waitlist(text)
  to authenticated, service_role;

revoke execute on function public.void_hr_document_signature(uuid)
  from public, anon;
grant execute on function public.void_hr_document_signature(uuid)
  to authenticated, service_role;
""",
    )

    init_lines = [
        "-- Wrap auth.uid()/auth.jwt() in RLS policies so Postgres evaluates them once per query (initplan)."
    ]
    for p in json.loads(POLICIES_JSON.read_text(encoding="utf-8")):
        qual = p.get("qual")
        chk = p.get("with_check")
        if not needs_fix(qual) and not needs_fix(chk):
            continue
        qual = fix_initplan(qual)
        chk = fix_initplan(chk)
        tbl = p["tablename"]
        name = p["policyname"].replace('"', '""')
        stmt = [f'alter policy "{name}" on public.{tbl}']
        if qual is not None:
            stmt.append(f"  using ({qual})")
        if chk is not None:
            stmt.append(f"  with check ({chk})")
        init_lines.append("\n".join(stmt) + ";")
    write("0098_advisor_rls_initplan.sql", "\n".join(init_lines))

    fk_lines = ["-- Covering indexes for unindexed foreign keys (performance advisor)."]
    seen: set[str] = set()
    for row in json.loads(FK_JSON.read_text(encoding="utf-8")):
        tbl = row["tbl"].replace("public.", "")
        col = row["col"]
        idx = f"{tbl}_{col}_fkey_idx"
        if idx in seen:
            idx = f"{tbl}_{row['fkey']}_idx"
        seen.add(idx)
        fk_lines.append(f"create index if not exists {idx} on public.{tbl} ({col});")
    write("0099_advisor_fk_indexes.sql", "\n".join(fk_lines))

    write(
        "0100_advisor_multiple_permissive_policies.sql",
        "\n".join(
            [
                "-- Reduce multiple permissive policies flagged by the performance advisor.",
                "",
                "-- Legacy doclib ALL policy on public duplicates per-action authenticated policies.",
                'drop policy if exists "Users can access their own documents" on public.documents;',
                "",
                "-- Redundant SELECT-only policies where ALL already grants the same access.",
                *[f'drop policy if exists "{pol}" on public.{tbl};' for tbl, pol in DROP_SELECT_REDUNDANT],
                "",
                "-- Merge paired UPDATE policies on signing tables.",
                'drop policy if exists "Org admins can update document recipients" on public.hr_document_recipients;',
                'drop policy if exists "Org members can update their recipient signature row" on public.hr_document_recipients;',
                """
create policy "Org can update document recipients"
  on public.hr_document_recipients
  for update
  using (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and status in ('pending', 'sent', 'viewed')
    )
  )
  with check (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and status in ('viewed', 'signed', 'declined')
    )
  );
""".strip(),
                "",
                'drop policy if exists "Org admins can update document signatures" on public.hr_document_signatures;',
                'drop policy if exists "Org members can update active document signatures" on public.hr_document_signatures;',
                """
create policy "Org can update document signatures"
  on public.hr_document_signatures
  for update
  using (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
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
  with check (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and status in ('viewed', 'partially_signed', 'signed', 'declined')
    )
  );
""".strip(),
                "",
                "-- admin_users: split ALL manage into IUD so SELECT is not doubled.",
                'drop policy if exists "Admins can manage admin_users" on public.admin_users;',
                """
create policy "Admins can insert admin_users"
  on public.admin_users
  for insert
  to authenticated
  with check (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "Admins can update admin_users"
  on public.admin_users
  for update
  to authenticated
  using (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  )
  with check (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "Admins can delete admin_users"
  on public.admin_users
  for delete
  to authenticated
  using (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );
""".strip(),
            ]
        ),
    )

    perf = json.loads(PERF.read_text(encoding="utf-8"))["result"]["lints"]
    unused = [x for x in perf if x["name"] == "unused_index"]
    # Indexes created for explicit query paths — keep even when stats show zero scans.
    keep_indexes = {
        "employees_manager_id_idx",
        "hr_document_recipients_document_id_idx",
        "hr_document_recipients_invite_undelivered_idx",
        "hr_document_recipients_signature_id_idx",
        "hr_document_signatures_document_id_idx",
        "hr_signing_rpc_rate_limit_bucket_idx",
        "hr_signing_rpc_rate_limit_created_idx",
        "hr_workspace_notifications_org_idx",
    }
    drop_lines = [
        "-- Drop indexes the performance advisor reports as unused (zero scans).",
        "-- Skips indexes retained for signing, rate limits, and recent schema work.",
    ]
    for x in unused:
        m = re.search(r"Index \\`([^\\`]+)\\`", x["detail"])
        if m and m.group(1) not in keep_indexes:
            drop_lines.append(f"drop index if exists public.{m.group(1)};")
    write("0101_advisor_drop_unused_indexes.sql", "\n".join(drop_lines))


if __name__ == "__main__":
    main()
