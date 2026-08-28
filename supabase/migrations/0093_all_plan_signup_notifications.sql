-- Operator alerts for every signup path.
--
-- Beta signups already enqueue beta_signup / beta_confirmation from
-- create-beta-signup. This widens the shared outbox vocabulary for account
-- creation and paid checkout alerts, then extends the existing auth.users
-- profile trigger so free/auth signups are recorded server-side too.

alter table public.support_notifications
  drop constraint if exists support_notifications_kind_check;

alter table public.support_notifications
  add constraint support_notifications_kind_check check (kind in (
    'ticket_received', 'agent_reply', 'info_requested', 'resolved', 'closed',
    'call_proposed', 'call_confirmed', 'call_reminder', 'call_followup_needed',
    'privacy_ack', 'accessibility_ack', 'security_ack', 'complaint_ack',
    'operator_alert', 'beta_signup', 'beta_confirmation',
    'account_signup', 'plan_signup'
  ));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, account_email)
  values (new.id, new.email)
  on conflict (id) do update
    set account_email = excluded.account_email;

  begin
    insert into public.support_notifications (
      ticket_id,
      kind,
      audience,
      recipient,
      language,
      payload
    )
    values (
      null,
      'account_signup',
      'operator',
      'support@dutiva.ca',
      'en',
      jsonb_build_object(
        'plan', 'free',
        'source', 'auth'
      )
    );
  exception when others then
    raise warning 'handle_new_user: could not enqueue account signup alert: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
