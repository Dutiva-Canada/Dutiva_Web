-- Plain-language AI read of a detected law change, written by
-- monitor-law-changes when a shared model route is available. The factual
-- record stays in change_summary / raw_diff; these columns are interpretation
-- and are labelled as such wherever they are shown. Two columns, matching the
-- title/title_fr convention in advisor_guidance_chunks.
alter table law_updates add column ai_analysis_en text;
alter table law_updates add column ai_analysis_fr text;
