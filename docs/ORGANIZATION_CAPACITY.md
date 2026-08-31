# Organization capacity and controlled admission

This system limits how many **organizations** (tenants) can be created on Dutiva,
measured by organization/tenant — not by user. Capacity, admission mode, and
enforcement are controlled from a single configuration row so they can be
changed without a code deployment.

## What is implemented

| Area                                            | Location                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Capacity schema + admission/waitlist/log tables | [`supabase/migrations/0075_organization_capacity_and_waitlist.sql`](../supabase/migrations/0075_organization_capacity_and_waitlist.sql) |
| Server-authoritative admission RPC              | `public.create_organization(...)` in migration `0075`                                                                                   |
| Waitlist join RPC                               | `public.join_organization_waitlist(...)`                                                                                                |
| Admin capacity dashboard RPCs                   | `public.get_organization_capacity_status()` and `public.update_capacity_config(...)`                                                    |
| Frontend admission types + bootstrap            | [`src/features/app/workspaceMode/api.ts`](../src/features/app/workspaceMode/api.ts)                                                     |
| Capacity/waitlist UI                            | [`src/features/app/views/settings/CapacityAlert.tsx`](../src/features/app/views/settings/CapacityAlert.tsx)                             |
| Admin capacity management UI                    | [`src/features/app/views/support/CapacityAdminControl.tsx`](../src/features/app/views/support/CapacityAdminControl.tsx)                 |
| Bilingual UI strings                            | [`src/i18n/messages/capacity.ts`](../src/i18n/messages/capacity.ts)                                                                     |

## Configuration model

`public.platform_capacity_config` is a single-row table:

- `capacity_limit` — maximum number of organizations while enforcement is on.
- `capacity_enforcement_enabled` — whether the limit is actively blocking.
- `capacity_mode` — `unlimited` | `capped` | `waitlist`.

| Mode        | Behaviour when at/above `capacity_limit`                                                    |
| ----------- | ------------------------------------------------------------------------------------------- |
| `unlimited` | No limit; `capacity_limit` is ignored.                                                      |
| `capped`    | New organization creation returns `CAPACITY_REACHED`.                                       |
| `waitlist`  | New creation returns `WAITLIST` and the user is added to `organization_admission_waitlist`. |

The seed configuration is `(limit 100, enforcement false, mode unlimited)`, so
capacity is **measured but not blocking** during the beta period.

## Admission flow

1. The admin flips workspace mode to `production` in Settings, or already has a
   stored `production` preference.
2. `WorkspaceModeProvider` calls `bootstrapOrganization` → `create_organization`.
3. `create_organization` locks the singleton config row with `SELECT ... FOR UPDATE`,
   counts existing organizations, and either:
   - creates the organization and inserts the caller as active owner,
   - returns `{ error: 'WAITLIST' }` (and records the waitlist row),
   - returns `{ error: 'CAPACITY_REACHED' }`.
4. The frontend shows a dedicated capacity or waitlist state; it cannot be
   bypassed by manipulating client state because the enforcement is server-side
   inside the RPC.

The `FOR UPDATE` lock on `platform_capacity_config` serializes concurrent calls,
so two admissions arriving at the boundary cannot both slip through.

## Admin capacity management

Internal admins see **Organization capacity** in `/app/support`:

- Current utilization, remaining slots, and waitlist size.
- Threshold status (`normal | approaching | near | full | unlimited | monitoring_disabled`).
- Editable limit, enforcement toggle, and mode selector.
- Saved via `update_capacity_config(...)`, which logs the change to
  `organization_admission_log`.

Only `public.is_admin_user()` can read or mutate capacity config through the
admin RPCs.

## Activation and expansion runbook

### During beta

Default: `capacity_enforcement_enabled = false`, `capacity_mode = 'unlimited'`.
Organization creation keeps working. Capacity is still counted and logged so you
can observe growth before flipping enforcement on.

### Enable the cap at 100

```sql
SELECT public.update_capacity_config(100, true, 'capped');
```

### Enable the waitlist at 100

```sql
SELECT public.update_capacity_config(100, true, 'waitlist');
```

### Expand to 1,000

```sql
SELECT public.update_capacity_config(1000, true, 'capped');
```

No code change or redeploy is required. The limit is read at admission time.

## Observability

`public.organization_admission_log` records:

- `capacity_check` — every `create_organization` admission attempt.
- `organization_created` — successful creation.
- `capacity_reached` — blocked creation in `capped` mode.
- `waitlist_joined` — user queued in `waitlist` mode or via `join_organization_waitlist`.
- `config_changed` — every `update_capacity_config` call, with previous and new values.

The admin dashboard reads `get_organization_capacity_status()`, which derives
live counts from `public.organizations` and the waitlist.

## Security and RLS

- `platform_capacity_config` has no direct `SELECT`/`UPDATE` policies for
  authenticated users; all reads/writes go through the admin-gated RPCs.
- `organization_admission_waitlist` is readable by the owning user and by admins.
- `organization_admission_log` is readable by admins only.
- `create_organization` is `SECURITY DEFINER` and bypasses RLS so the capacity
  check and organization insert are atomic.
- Waitlist uniqueness: one `waiting` row per user (`organization_admission_waitlist_one_waiting_per_user`).

## Testing

- Unit tests for the frontend admission result handling:
  [`src/features/app/workspaceMode/api.test.ts`](../src/features/app/workspaceMode/api.test.ts)
- The RPC-level boundary/concurrency behaviour is covered by the migration
  design (`FOR UPDATE` serialization) and should be validated against the live
  project with concurrent `create_organization` calls at the limit.

## Troubleshooting

- A user sees the capacity screen but should be able to create an org: check
  `public.platform_capacity_config`; set `capacity_enforcement_enabled = false`
  or raise `capacity_limit`.
- Waitlist admits: update the waitlist row status to `invited` or `admitted`,
  then have the user retry `create_organization` once capacity allows.
- Admission logs are the first place to check for unexpected spikes or blocked
  sign-ups.
