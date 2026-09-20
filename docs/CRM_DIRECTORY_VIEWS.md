# Customer directory — filters and saved views

The CRM directory (Contacts and Companies tabs, `/app/crm`) gained
filter-based views. Logic and tests live in
`src/features/app/views/crm/directoryFilters.ts` / `.test.ts`; the UI is
wired into `CrmContacts.tsx` and `CrmCompanies.tsx`.

## Filters

**Contacts** — free-text query (name, email, phone, role, company name),
status multi-select (lead / prospect / customer / partner / churned), and
company picker including an "unassigned" choice (`NO_COMPANY` sentinel —
a real company id can never collide with it).

**Companies** — free-text query (name, domain, industry) and industry
exact-match picker built from the industries actually present in the data.

Filters apply client-side to the loaded list — the CRM is storage-light
(production: one localStorage blob per org via `useCrmData`; demo: shared
fixtures), so filtering needs no new queries and no migration.

## Saved views

A saved view captures a contact filter state under a name. Storage follows
the CRM's own shape: a second localStorage key per scope
(`dutiva.crm.directoryViews.<scope>`), not a server table the rest of the
CRM doesn't have. Views persist across sessions on the same browser/profile
and are not shared between users or devices — a deliberate match for how
CRM data itself persists today. If CRM records move to Supabase later,
saved views should move with them.

## Honest limits

- Filters operate on loaded rows — no server-side query, no pagination
  awareness. At CRM scale (hundreds of contacts) this is fine.
- Company tab views are not saved (contacts only, for now).
