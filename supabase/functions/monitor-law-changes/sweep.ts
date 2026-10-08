/**
 * sweep.ts — one page's pass through the law monitor: fetch with fallbacks,
 * then the case that matches the outcome (redirect / unreachable / a
 * machine-readable source / the HTML hash fallback). Returns the run-log
 * line; event rows are written inside each case.
 */
import { assessLegislationText } from './contentSanity.ts'
import type { PageConfig } from './pages.ts'
import {
  extractText,
  fetchWithFallbacks,
  fetchWithTimeout,
  sha256,
} from './lawFetch.ts'
import { findNewUrl, isAllowedLawHost, summarizeChange } from './lawRecovery.ts'
import { justiceXmlCase, ontarioApiCase, quebecCkanCase } from './sweepSources.ts'
import { BROKEN_ALERT_THRESHOLD, type HashRecord, type SweepCtx } from './sweepShared.ts'

export async function sweepPage(
  page: PageConfig,
  record: HashRecord | undefined,
  ctx: SweepCtx,
): Promise<string> {
  try {
      const fetchResult = await fetchWithFallbacks(page)
      const isNew = !record

      // ── Case 1: permanent redirect ──────────────────────────────────────
      /* HTML sources only: a redirect on an XML source is not a "the page
         moved" event to record and follow — the file path is the identity of
         the Act, and the XML branch below verifies that identity directly. */
      if (
        (page.source?.kind ?? 'html') === 'html' &&
        fetchResult.ok &&
        fetchResult.wasRedirected &&
        fetchResult.finalUrl !== page.url
      ) {
        const newUrl = fetchResult.finalUrl

        await ctx.db.from('law_page_hashes').upsert({
          // Keep the original URL as the key so existing records still match.
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: await sha256(extractText(fetchResult.text ?? '')),
          redirect_url: newUrl,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        await ctx.db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: newUrl,
          reference_url: page.referenceUrl ?? null,
          content_hash: null,
          change_summary:
            `The legislation page for "${page.law_name}" (${page.jurisdiction}) has permanently moved. ` +
            `Old URL: ${page.url} → New URL: ${newUrl}. ` +
            'Dutiva has automatically updated its monitoring to the new location.',
          raw_diff: `Redirect: ${page.url} → ${newUrl}`,
          detected_at: new Date().toISOString(),
          is_new: false,
          event_type: 'redirect',
        })

        return (`REDIRECT  ${page.jurisdiction}/${page.law_name}: → ${newUrl}`)

      }
      // ── Case 2: unreachable ─────────────────────────────────────────────
      if (!fetchResult.ok) {
        const failures = (record?.failures ?? 0) + 1

        await ctx.db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: record?.hash ?? '',
          is_broken: true,
          consecutive_failures: failures,
          last_broken_at: new Date().toISOString(),
          last_checked: new Date().toISOString(),
        })

        let newUrlSuggestion: string | null = null
        if (failures >= BROKEN_ALERT_THRESHOLD && ctx.hfToken) {
          newUrlSuggestion = await findNewUrl(page, fetchResult.statusCode, ctx.hfToken)

          if (newUrlSuggestion && !isAllowedLawHost(newUrlSuggestion)) {
            console.warn(
              '[monitor-law-changes] discarding out-of-allowlist suggested URL:',
              newUrlSuggestion,
            )
            newUrlSuggestion = null
          }

          // Only trust a suggestion that actually resolves.
          if (newUrlSuggestion) {
            const verify = await fetchWithTimeout(newUrlSuggestion)
            if (!verify.ok) newUrlSuggestion = null
          }

          if (newUrlSuggestion) {
            const newFetch = await fetchWithTimeout(newUrlSuggestion)
            if (newFetch.ok && newFetch.text) {
              const newHash = await sha256(extractText(newFetch.text))

              await ctx.db.from('law_page_hashes').upsert({
                url: page.url,
                jurisdiction: page.jurisdiction,
                law_name: page.law_name,
                content_hash: newHash,
                redirect_url: newUrlSuggestion,
                is_broken: false,
                consecutive_failures: 0,
                last_checked: new Date().toISOString(),
              })

              await ctx.db.from('law_updates').insert({
                jurisdiction: page.jurisdiction,
                law_name: page.law_name,
                url: newUrlSuggestion,
                reference_url: page.referenceUrl ?? null,
                change_summary:
                  `The original URL for "${page.law_name}" was broken (HTTP ${fetchResult.statusCode}). ` +
                  `Dutiva automatically located the new URL: ${newUrlSuggestion}. ` +
                  'Monitoring has been updated to the new location.',
                raw_diff: `Auto-discovered: ${page.url} → ${newUrlSuggestion}`,
                detected_at: new Date().toISOString(),
                is_new: false,
                event_type: 'redirect',
              })

              return (
                `AUTO-FIX  ${page.jurisdiction}/${page.law_name}: broken → found ${newUrlSuggestion}`
              )

            }
          }
        }

        // Alert once, on the run that crosses the threshold.
        if (failures === BROKEN_ALERT_THRESHOLD) {
          await ctx.db.from('law_updates').insert({
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            url: page.url,
            reference_url: page.referenceUrl ?? null,
            change_summary:
              `The "${page.law_name}" (${page.jurisdiction}) legislation page has been unreachable ` +
              `for ${failures} consecutive checks (HTTP ${fetchResult.statusCode}). ` +
              `${newUrlSuggestion ? `Suggested new URL: ${newUrlSuggestion} (could not be verified). ` : ''}` +
              'Manual review of the URL may be needed.',
            raw_diff: `Status: ${fetchResult.statusCode} · Failures: ${failures}`,
            detected_at: new Date().toISOString(),
            is_new: false,
            event_type: 'broken',
          })
        }

        return (
          `BROKEN    ${page.jurisdiction}/${page.law_name}: HTTP ${fetchResult.statusCode} (failure #${failures})`
        )

      }
      if (page.source?.kind === 'justice-xml') {
        return justiceXmlCase(page, page.source, record, fetchResult, isNew, ctx)
      }
      if (page.source?.kind === 'ontario-api') {
        return ontarioApiCase(page, page.source, record, fetchResult, isNew, ctx)
      }
      if (page.source?.kind === 'quebec-ckan') {
        return quebecCkanCase(page, page.source, record, fetchResult, isNew, ctx)
      }
      // ── Case 3d: HTML-sourced law — but is it actually legislation? ─────
      const text = extractText(fetchResult.text ?? '')

      /* A 200 is not proof of a real check. WAF pages served as 200, bot
         interstitials and JavaScript app shells all sail through the status
         check and then hash to something stable, so the page reports "no
         change" forever while detecting nothing. Treat those as failures so
         they surface instead of masquerading as health. See contentSanity.ts.

         No LLM URL recovery on this path, unlike a hard failure: the URL
         resolved fine, so "find a different URL" is not the remedy — a human
         needs to pick a different source format (or a route that isn't
         IP-blocked). Guessing here would burn model calls on a working URL. */
      const verdict = assessLegislationText(text)
      if (!verdict.ok) {
        const failures = (record?.failures ?? 0) + 1

        await ctx.db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: record?.hash ?? '',
          is_broken: true,
          consecutive_failures: failures,
          last_broken_at: new Date().toISOString(),
          last_checked: new Date().toISOString(),
        })

        if (failures === BROKEN_ALERT_THRESHOLD) {
          await ctx.db.from('law_updates').insert({
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            url: page.url,
            reference_url: page.referenceUrl ?? null,
            change_summary:
              `The "${page.law_name}" (${page.jurisdiction}) page returned HTTP 200 but did not contain legislation ` +
              `for ${failures} consecutive checks. ${verdict.detail} ` +
              'Monitoring for this law is not effective until the source is changed — this page cannot detect an amendment.',
            raw_diff: `Sanity check: ${verdict.reason} · Failures: ${failures} · Extracted ${text.trim().length} chars`,
            detected_at: new Date().toISOString(),
            is_new: false,
            event_type: 'broken',
          })
        }

        return (
          `NOT-LAW   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`
        )

      }

      const hash = await sha256(text)
      const changed = isNew || record?.hash !== hash

      await ctx.db.from('law_page_hashes').upsert({
        url: page.url,
        jurisdiction: page.jurisdiction,
        law_name: page.law_name,
        content_hash: hash,
        is_broken: false,
        consecutive_failures: 0,
        last_checked: new Date().toISOString(),
      })

      if (!changed) {
        return (`OK        ${page.jurisdiction}/${page.law_name}: no change`)

      }

      const snippet = text.slice(0, 2000)
      const summary = isNew
        ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring. Baseline captured.`
        : await summarizeChange(page.law_name, page.jurisdiction, snippet, ctx.hfToken)
      const analysis = isNew
        ? null
        : await ctx.analyzeChange(
            page.law_name,
            page.jurisdiction,
            'The page text changed. Excerpt of the current text:\n' + snippet.slice(0, 1500),
          )

      await ctx.db.from('law_updates').insert({
        jurisdiction: page.jurisdiction,
        law_name: page.law_name,
        url: fetchResult.finalUrl || page.url,
        reference_url: page.referenceUrl ?? null,
        content_hash: hash,
        ai_analysis_en: analysis?.en ?? null,
        ai_analysis_fr: analysis?.fr ?? null,
        change_summary: summary,
        raw_diff: isNew ? null : snippet,
        detected_at: new Date().toISOString(),
        is_new: isNew,
        event_type: isNew ? 'first_seen' : 'change',
      })

      return (`${isNew ? 'FIRST_SEEN' : 'CHANGE   '} ${page.jurisdiction}/${page.law_name}`)
  } catch (err) {
    return `ERROR     ${page.jurisdiction}/${page.law_name}: ${String(err)}`
  }
}
