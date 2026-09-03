#!/usr/bin/env python3
"""Generate 0103: drop unused indexes (phase 2), keeping FK and operational indexes."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIG = ROOT / "supabase" / "migrations"
PERF = Path(
    r"C:\Users\Marti\.cursor\projects\c-Users-Marti-Dutiva-Web-1\agent-tools\37da044d-2df2-4579-ac6c-f8ae4874eab4.txt"
)

KEEP = {
    "employees_manager_id_idx",
    "hr_document_recipients_document_id_idx",
    "hr_document_recipients_invite_undelivered_idx",
    "hr_document_recipients_signature_id_idx",
    "hr_document_signatures_document_id_idx",
    "hr_signing_rpc_rate_limit_bucket_idx",
    "hr_signing_rpc_rate_limit_created_idx",
    "hr_workspace_notifications_org_idx",
}


def main() -> None:
    lints = json.loads(PERF.read_text(encoding="utf-8"))["result"]["lints"]
    drops: list[str] = []
    for x in lints:
        if x["name"] != "unused_index":
            continue
        m = re.search(r"Index \\`([^\\`]+)\\`", x["detail"])
        if not m:
            continue
        idx = m.group(1)
        if idx in KEEP:
            continue
        if idx.endswith("_fkey_idx"):
            continue
        drops.append(f"drop index if exists public.{idx};")

    body = "\n".join(
        [
            "-- Drop unused non-FK indexes flagged after 0099/0102 FK index pass.",
            "-- Retains *_fkey_idx covering indexes and signing operational indexes.",
            *drops,
            "",
        ]
    )
    out = MIG / "0103_advisor_drop_unused_non_fk_indexes.sql"
    out.write_text(body, encoding="utf-8")
    print(f"wrote {out.name} ({len(body)} bytes, {len(drops)} drops)")


if __name__ == "__main__":
    main()
