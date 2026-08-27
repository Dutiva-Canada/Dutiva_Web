-- The structured engine contract (advisor-chat responsePayload.ts) needs two
-- more fields per retrieved chunk:
--   • topic         → the retrieval chip label ("Termination notice · ON")
--   • review_status → whether a citation may claim "valid"; machine-curated
--                     rows surface as needs-review instead of implying vetted
--                     authority.
-- Postgres cannot change a function's OUT columns in place, so drop first.
--
-- Ledger: shares sequence 0024 with 0024_reconcile_billing_schema.sql
-- (both applied on live — do not renumber). See docs/MIGRATION_LEDGER.md.

drop function if exists public.match_advisor_guidance(text, int);

create function public.match_advisor_guidance(q text, k int default 4)
returns table (
  title text,
  content text,
  source_url text,
  source_name text,
  jurisdiction text,
  effective_note text,
  topic text,
  review_status text
)
language sql
stable
as $fn$
  with lex as (
    select to_tsquery(
      'english',
      string_agg(distinct '''' || replace(lexeme, '''', '''''') || '''', ' | ')
    ) as tq
    from unnest(tsvector_to_array(to_tsvector('english', q))) as lexeme
  )
  select c.title, c.content, c.source_url, c.source_name, c.jurisdiction,
         c.effective_note, c.topic, c.review_status
  from public.advisor_guidance_chunks c, lex
  where c.status = 'active' and lex.tq is not null and c.fts @@ lex.tq
  order by ts_rank(c.fts, lex.tq) desc
  limit greatest(1, least(k, 8))
$fn$;

revoke execute on function public.match_advisor_guidance(text, int)
  from public, anon, authenticated;
