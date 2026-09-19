-- Operator signup alerts currently only carry plan + source, so "who signed
-- up" is unanswerable from the email. Add the account email and user id to
-- the account_signup payload.

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
        'source', 'auth',
        'email', new.email,
        'user_id', new.id
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
