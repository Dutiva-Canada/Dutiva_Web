#!/usr/bin/env python3
"""Refresh supabase/schema.sql from the live Supabase project (no Docker)."""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "supabase" / "schema.sql"
PROJECT_REF = "khtwpxnvziiyplaflwru"

EXCLUDE_SCHEMA = (
    "information_schema|pg_*|_analytics|_realtime|_supavisor|auth|etl|extensions|"
    "pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|"
    "graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|"
    "tiger_data|timescaledb_*|_timescaledb_*|topology|vault"
)

INTERNAL_SCHEMA = (
    "information_schema|pg_.*|_analytics|_realtime|_supavisor|auth|etl|extensions|"
    "pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|"
    "graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|"
    "tiger_data|timescaledb_.*|_timescaledb_.*|topology|vault"
)


def parse_login_env(output: str) -> dict[str, str]:
    env: dict[str, str] = {}
    for key in ("PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"):
        match = re.search(rf'export {key}="([^"]*)"', output)
        if not match:
            raise RuntimeError(f"Could not parse {key} from supabase db dump --dry-run")
        env[key] = match.group(1)
    return env


def transform_line(line: str) -> str | None:
    rules: list[tuple[str, str]] = [
        (r"^\\(un)?restrict .*$", "-- \\g<0>"),
        (r'^CREATE SCHEMA "', 'CREATE SCHEMA IF NOT EXISTS "'),
        (r'^CREATE TABLE "', 'CREATE TABLE IF NOT EXISTS "'),
        (r'^CREATE SEQUENCE "', 'CREATE SEQUENCE IF NOT EXISTS "'),
        (r'^CREATE VIEW "', 'CREATE OR REPLACE VIEW "'),
        (r'^CREATE FUNCTION "', 'CREATE OR REPLACE FUNCTION "'),
        (r'^CREATE TRIGGER "', 'CREATE OR REPLACE TRIGGER "'),
        (r'^CREATE PUBLICATION "supabase_realtime', '-- \\g<0>'),
        (r"^CREATE EVENT TRIGGER ", "-- \\g<0>"),
        (r"^         WHEN TAG IN ", "-- \\g<0>"),
        (r"^   EXECUTE FUNCTION ", "-- \\g<0>"),
        (r"^ALTER EVENT TRIGGER ", "-- \\g<0>"),
        (r'^ALTER PUBLICATION "supabase_realtime_', "-- \\g<0>"),
        (r"^ALTER FOREIGN DATA WRAPPER (.+) OWNER TO ", "-- \\g<0>"),
        (r'^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"', "-- \\g<0>"),
        (
            r'^GRANT ALL ON FOREIGN DATA WRAPPER (.+) TO "postgres" WITH GRANT OPTION',
            "-- \\g<0>",
        ),
        (rf'^GRANT (.+) ON (.+) "({INTERNAL_SCHEMA})"', "-- \\g<0>"),
        (rf'^REVOKE (.+) ON (.+) "({INTERNAL_SCHEMA})"', "-- \\g<0>"),
        (r'^(CREATE EXTENSION IF NOT EXISTS "pg_tle").+', r"\1;"),
        (r'^(CREATE EXTENSION IF NOT EXISTS "pgsodium").+', r"\1;"),
        (r'^(CREATE EXTENSION IF NOT EXISTS "pgmq").+', r"\1;"),
        (r"^COMMENT ON EXTENSION (.+)", "-- \\g<0>"),
        (r'^CREATE POLICY "cron_job_', "-- \\g<0>"),
        (r'^ALTER TABLE "cron"', "-- \\g<0>"),
        (r"^SET transaction_timeout = 0;", "-- \\g<0>"),
    ]
    out = line
    for pattern, repl in rules:
        out = re.sub(pattern, repl, out)
    if out.startswith("--"):
        return None
    return out


def main() -> None:
    pg_dump = shutil.which("pg_dump")
    if not pg_dump:
        raise SystemExit("pg_dump not found on PATH")

    dry = subprocess.run(
        f"npx supabase db dump --project-ref {PROJECT_REF} --dry-run",
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        shell=True,
    )
    combined = dry.stdout + dry.stderr
    if "PGHOST" not in combined:
        raise SystemExit(combined)

    env = os.environ.copy()
    env.update(parse_login_env(combined))

    dump = subprocess.run(
        [
            pg_dump,
            "--schema-only",
            "--quote-all-identifiers",
            "--role",
            "postgres",
            "--exclude-schema",
            EXCLUDE_SCHEMA,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
        env=env,
    )

    lines = [t for line in dump.stdout.splitlines() if (t := transform_line(line)) is not None]
    OUT.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes, {len(lines)} lines)")


if __name__ == "__main__":
    main()
