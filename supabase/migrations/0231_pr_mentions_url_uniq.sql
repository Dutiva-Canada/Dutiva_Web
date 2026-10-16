-- 0231_pr_mentions_url_uniq.sql
--
-- Dedupe backstops for the PR portal's log-style tables. The app already
-- reads-then-inserts, but a manual "Sync now" racing the cron sweep (or a
-- retry inside the same click) can land the same row twice between the
-- read and the insert. Unique indexes make the database enforce what the
-- clients intend; writers treat 23505 as "already logged" and keep going.
--
--   pr_mentions    — (user_id, url), partial on url<>'': hand-logged
--                    mentions with no link carry no dedupe key.
--   pr_geo_prompts — (user_id, lower(btrim(prompt))): the tracked set is
--                    matched case-insensitively everywhere, so the index
--                    is too.
--   pr_keywords    — (user_id, lower(btrim(keyword))): same rule — a
--                    re-imported export must not double the list.
--
-- ROLLBACK:
--   drop index if exists public.pr_mentions_user_url_uniq;
--   drop index if exists public.pr_geo_prompts_user_prompt_uniq;
--   drop index if exists public.pr_keywords_user_keyword_uniq;

-- Collapse any duplicates that slipped in before the indexes exist —
-- keep the earliest row of each group.
delete from public.pr_mentions a
  using public.pr_mentions b
  where a.user_id = b.user_id
    and a.url = b.url
    and a.url <> ''
    and (a.created_at, a.id) > (b.created_at, b.id);

delete from public.pr_geo_prompts a
  using public.pr_geo_prompts b
  where a.user_id = b.user_id
    and lower(btrim(a.prompt)) = lower(btrim(b.prompt))
    and (a.created_at, a.id) > (b.created_at, b.id);

delete from public.pr_keywords a
  using public.pr_keywords b
  where a.user_id = b.user_id
    and lower(btrim(a.keyword)) = lower(btrim(b.keyword))
    and (a.created_at, a.id) > (b.created_at, b.id);

create unique index if not exists pr_mentions_user_url_uniq
  on public.pr_mentions (user_id, url)
  where url <> '';

create unique index if not exists pr_geo_prompts_user_prompt_uniq
  on public.pr_geo_prompts (user_id, lower(btrim(prompt)));

create unique index if not exists pr_keywords_user_keyword_uniq
  on public.pr_keywords (user_id, lower(btrim(keyword)));
