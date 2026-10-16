-- 0234_pr_keyword_check.sql
--
-- updateKeywordPosition's read-then-write ("select position, then write it
-- back as previous_position") lets two concurrent checks each snapshot the
-- same baseline and overwrite the other's delta. One UPDATE statement is
-- atomic — the row's own `position` is the baseline at the instant the
-- write lands, however many sessions race it.
--
-- security invoker + the user_id predicate: RLS owns the row either way;
-- the predicate just makes "someone else's keyword id" a no-op instead of
-- needing the policy to be the only guard.
--
-- ROLLBACK:
--   drop function if exists public.pr_keyword_check(uuid, integer);

create or replace function public.pr_keyword_check(
  p_keyword_id uuid,
  p_position integer
)
returns void
language sql
set search_path = public
as $$
  update public.pr_keywords
     set previous_position = position,
         position = p_position,
         checked_at = now()
   where id = p_keyword_id
     and user_id = auth.uid();
$$;

revoke execute on function public.pr_keyword_check(uuid, integer) from public, anon;
grant execute on function public.pr_keyword_check(uuid, integer) to authenticated;
