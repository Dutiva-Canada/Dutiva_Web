-- Snapshot the requester's billing plan on each support ticket so the admin
-- queue can put paid accounts first without joining profiles at list time
-- (a public ticket may have no user id; a paid visitor may use the public
-- form). Null means unknown / waitlisted / no account.
--
-- Writes go through the service-role edge functions (create-support-ticket,
-- create-public-support-ticket). Existing RLS is column-agnostic.

alter table public.support_tickets
  add column if not exists requester_plan text
  check (requester_plan is null or requester_plan in ('free', 'starter', 'growth', 'pro'));

comment on column public.support_tickets.requester_plan is
  'Billing plan at ticket creation (free/starter/growth/pro). Null when unknown. Snapshot, not a live join.';

create index if not exists support_tickets_requester_plan_idx
  on public.support_tickets (requester_plan)
  where requester_plan is not null;
