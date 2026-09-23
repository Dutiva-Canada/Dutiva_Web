-- Open workspace_preferences to org members (not just platform admins).
--
-- The table now carries two per-user preferences: the demo⇄production mode
-- and the onboarding marks column from 0169. Both were gated to
-- is_admin_user() because production mode itself was admin-only when the
-- table shipped (0005). That stopped being true in 0168 — invited teammates
-- are real org members now — which made the admin-only policy actively
-- wrong in two ways:
--
--   - A member's mode switch could never persist: saveStoredMode upserts
--     here, RLS refused, and setMode surfaced it as an admission error.
--   - A member's onboarding marks stayed device-local forever.
--
-- The predicate is deliberately narrower than current_user_is_workspace_member()
-- (which also admits beta signups and pending invitees — shell admission, not
-- membership): a preference row only means something for someone who can hold
-- a production workspace, i.e. a platform admin or an active member. Storing
-- mode='production' for anyone else is inert but misleading.
--
-- Still scoped to the caller's own row; org-scoped tables stay gated on
-- organization_membership as before.

alter policy "Admins manage their own workspace preference"
  on public.workspace_preferences
  rename to "Members manage their own workspace preference";

alter policy "Members manage their own workspace preference"
  on public.workspace_preferences
  using (
    user_id = (select auth.uid())
    and (
      public.is_admin_user()
      or exists (
        select 1 from public.organization_members om
        where om.user_id = (select auth.uid()) and om.status = 'active'
      )
    )
  )
  with check (
    user_id = (select auth.uid())
    and (
      public.is_admin_user()
      or exists (
        select 1 from public.organization_members om
        where om.user_id = (select auth.uid()) and om.status = 'active'
      )
    )
  );
