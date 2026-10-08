/**
 * The machine-readable source cases for the law-monitor sweep — Justice XML,
 * the Ontario e-Laws API, and the Québec CKAN dataset. Each answers "did the
 * Act change?" from structured data rather than a text hash, which is why a
 * reformat or a JavaScript shell can't fool them.
 */
import { amendmentFingerprint, assessJusticeStatute } from './justiceXml.ts'
import { assessOntarioActVersions, ontarioFingerprintPayload } from './ontarioApi.ts'
import {
  assessQuebecPackage,
  diffStatuteSections,
  parseStatuteStatus,
  parseStatuteXml,
  quebecFingerprint,
  sectionFingerprint,
  type StatuteSection,
} from './quebecCkan.ts'
import { openRemoteZip, readZipEntry, type ZipDirectory } from './zipRange.ts'
import type { PageConfig, PageSource } from './pages.ts'
import {
  headContentLength,
  sha256,
  zipRangeFetcher,
  type FetchResult,
} from './lawFetch.ts'
import {
  BROKEN_ALERT_THRESHOLD,
  DAY_MS,
  QUEBEC_DATASET_STALE_MS,
  type HashRecord,
  type SweepCtx,
} from './sweepShared.ts'

type Fetched = FetchResult & { usedUrl: string }
type Source<K extends PageSource['kind']> = Extract<PageSource, { kind: K }>

export async function justiceXmlCase(
  page: PageConfig,
  source: Source<'justice-xml'>,
  record: HashRecord | undefined,
  fetchResult: Fetched,
  isNew: boolean,
  ctx: SweepCtx,
): Promise<string> {
        const verdict = assessJusticeStatute(fetchResult.text ?? '', source.consolidatedNumber)

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
                `The XML source for "${page.law_name}" (${page.jurisdiction}) could not be read as ` +
                `the expected Act for ${failures} consecutive checks. ${verdict.detail} ` +
                'Federal change detection is not effective until this is resolved.',
              raw_diff: `Justice XML check: ${verdict.reason} · Failures: ${failures}`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }

          return (
            `XML-BAD   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`
          )

        }

        const fingerprint = amendmentFingerprint(verdict.facts.lastAmendedDate)
        const changed = isNew || record?.hash !== fingerprint

        await ctx.db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: fingerprint,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        if (!changed) {
          return (
            `OK        ${page.jurisdiction}/${page.law_name}: unchanged since ${verdict.facts.lastAmendedDate}`
          )

        }

        const analysis = isNew
          ? null
          : await ctx.analyzeChange(
              page.law_name,
              page.jurisdiction,
              `Justice Canada's consolidated XML now reports a last-amended date of ` +
                `${verdict.facts.lastAmendedDate}` +
                `${record?.hash ? `, previously ${record.hash.replace('amended:', '')}` : ''}.` +
                `${verdict.facts.currentDate ? ` The consolidation is current to ${verdict.facts.currentDate}.` : ''}` +
                ` The detector does not diff federal XML section-by-section, so which ` +
                `provisions moved is not in this record.`,
            )

        await ctx.db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: page.url,
          reference_url: page.referenceUrl ?? null,
          content_hash: fingerprint,
          ai_analysis_en: analysis?.en ?? null,
          ai_analysis_fr: analysis?.fr ?? null,
          change_summary: isNew
            ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring, ` +
              `sourced from Justice Canada's consolidated XML. It was last amended on ` +
              `${verdict.facts.lastAmendedDate}.`
            : `"${page.law_name}" (${page.jurisdiction}) has been amended. Justice Canada now reports ` +
              `a last-amended date of ${verdict.facts.lastAmendedDate}` +
              `${record?.hash ? ` (previously ${record.hash.replace('amended:', '')})` : ''}. ` +
              'Review the consolidated Act for what changed and what it means for employers.',
          raw_diff:
            `lastAmendedDate: ${verdict.facts.lastAmendedDate}` +
            `${verdict.facts.currentDate ? ` · consolidation current to ${verdict.facts.currentDate}` : ''}`,
          detected_at: new Date().toISOString(),
          is_new: isNew,
          event_type: isNew ? 'first_seen' : 'change',
        })

        return (
          `${isNew ? 'FIRST_SEEN' : 'AMENDED  '} ${page.jurisdiction}/${page.law_name}: ${verdict.facts.lastAmendedDate}`
        )

}

export async function ontarioApiCase(
  page: PageConfig,
  source: Source<'ontario-api'>,
  record: HashRecord | undefined,
  fetchResult: Fetched,
  isNew: boolean,
  ctx: SweepCtx,
): Promise<string> {
        const verdict = assessOntarioActVersions(fetchResult.text ?? '', source.expectedActEn)

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
                `The e-Laws API for "${page.law_name}" (${page.jurisdiction}) could not be read as ` +
                `the expected Act for ${failures} consecutive checks. ${verdict.detail} ` +
                'Ontario change detection is not effective until this is resolved.',
              raw_diff: `Ontario API check: ${verdict.reason} · Failures: ${failures}`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }

          return (
            `API-BAD   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`
          )

        }

        const fingerprint = `ontario-api:${await sha256(ontarioFingerprintPayload(verdict.facts))}`
        const changed = isNew || record?.hash !== fingerprint

        await ctx.db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: fingerprint,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        if (!changed) {
          return (`OK        ${page.jurisdiction}/${page.law_name}: no change`)

        }

        const analysis = isNew
          ? null
          : await ctx.analyzeChange(
              page.law_name,
              page.jurisdiction,
              `Ontario e-Laws has a new or changed version on record. The current ` +
                `version is now in force from ${verdict.facts.current?.dateFrom ?? 'an unspecified date'}; ` +
                `${verdict.facts.versionCount} versions on record.` +
                ` The version list does not include the amended text, so which ` +
                `provisions moved is not in this record.`,
            )

        await ctx.db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: page.url,
          reference_url: page.referenceUrl ?? null,
          content_hash: fingerprint,
          ai_analysis_en: analysis?.en ?? null,
          ai_analysis_fr: analysis?.fr ?? null,
          change_summary: isNew
            ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring, ` +
              `sourced from Ontario e-Laws' act-versions API. Current version in force from ` +
              `${verdict.facts.current?.dateFrom ?? 'an unspecified date'}.`
            : `"${page.law_name}" (${page.jurisdiction}) has a new or changed version on record. ` +
              `The current version is now in force from ${verdict.facts.current?.dateFrom ?? 'an unspecified date'}. ` +
              'Review the Act for what changed and what it means for employers.',
          raw_diff: `current dateFrom: ${verdict.facts.current?.dateFrom ?? 'unknown'} · versions on record: ${verdict.facts.versionCount}`,
          detected_at: new Date().toISOString(),
          is_new: isNew,
          event_type: isNew ? 'first_seen' : 'change',
        })

        return (
          `${isNew ? 'FIRST_SEEN' : 'AMENDED  '} ${page.jurisdiction}/${page.law_name}: ${verdict.facts.current?.dateFrom ?? 'unknown'}`
        )

}

export async function quebecCkanCase(
  page: PageConfig,
  source: Source<'quebec-ckan'>,
  record: HashRecord | undefined,
  fetchResult: Fetched,
  isNew: boolean,
  ctx: SweepCtx,
): Promise<string> {
        const verdict = assessQuebecPackage(fetchResult.text ?? '', source.resourceName)

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
                `The Données Québec dataset for "${page.law_name}" (${page.jurisdiction}) could not be read ` +
                `as expected for ${failures} consecutive checks. ${verdict.detail} ` +
                'Québec change detection is not effective until this is resolved.',
              raw_diff: `Québec CKAN check: ${verdict.reason} · Failures: ${failures}`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }

          return (
            `API-BAD   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`
          )

        }

        const datasetFp = quebecFingerprint(verdict.facts)

        /* Dataset liveness — independent of the fingerprint comparison. A
           corpus that stops republishing keeps answering 200s and every
           fingerprint matches: "no changes" would be a frozen feed, not a
           quiet legislature. The alert files once per freeze
           (`meta.datasetStaleAlertedAt` dedupes) and re-arms when the stamp
           advances again. */
        const datasetAgeMs = Date.now() - Date.parse(verdict.facts.lastModified)
        const prevMetaObj = (record?.meta ?? null) as Record<string, unknown> | null
        let datasetStaleAlertedAt =
          typeof prevMetaObj?.datasetStaleAlertedAt === 'string'
            ? prevMetaObj.datasetStaleAlertedAt
            : null
        if (Number.isFinite(datasetAgeMs) && datasetAgeMs > QUEBEC_DATASET_STALE_MS) {
          const ageDays = Math.floor(datasetAgeMs / DAY_MS)
          const firstStaleSweep = datasetStaleAlertedAt === null
          if (firstStaleSweep) datasetStaleAlertedAt = new Date().toISOString()
          await ctx.db.from('law_page_hashes').upsert({
            url: page.url,
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            content_hash: record?.hash ?? '',
            is_broken: true,
            consecutive_failures: record?.failures ?? 0,
            last_checked: new Date().toISOString(),
            meta: { ...(prevMetaObj ?? {}), datasetStaleAlertedAt },
          })
          if (firstStaleSweep) {
            await ctx.db.from('law_updates').insert({
              jurisdiction: page.jurisdiction,
              law_name: page.law_name,
              url: page.url,
              reference_url: page.referenceUrl ?? null,
              change_summary:
                `Données Québec's codified-legislation dataset — the source for ` +
                `"${page.law_name}" monitoring — was last republished ` +
                `${verdict.facts.lastModified.slice(0, 10)}, ${ageDays} days ago and well past ` +
                'its usual fortnightly cadence. The feed may have stopped updating even ' +
                'though it still answers; treat Québec coverage as unconfirmed until a ' +
                'fresh package lands.',
              raw_diff:
                `resource: ${verdict.facts.resourceName} · last_modified: ${verdict.facts.lastModified} ` +
                `· age: ${ageDays}d · threshold: ${QUEBEC_DATASET_STALE_MS / DAY_MS}d`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }
          return (
            `STALE-SRC ${page.jurisdiction}/${page.law_name}: dataset ${ageDays}d old`
          )

        }
        datasetStaleAlertedAt = null

        /* content_hash layout for Québec rows: `qck2:<datasetFp>::<sectionFp>`.
           The dataset half is the cheap gate — when it matches, the Act's file
           in the zip cannot have changed and the run costs one API call. The
           section half — a hash of the Act's own section→in-force-date map —
           is the real signal: a corpus refresh that leaves this Act untouched
           files nothing.

           Rows written before per-statute detection hold the bare
           `quebec-ckan:…` value: matching it means the dataset did not move,
           but the statute baseline still has to be established, so the
           drill-down runs once and the row is silently rekeyed. */
        const stored = record?.hash ?? ''
        const storedDataset = stored.startsWith('qck2:')
          ? stored.slice(5, stored.indexOf('::'))
          : stored.startsWith('quebec-ckan:')
            ? stored
            : null
        const storedSections =
          stored.startsWith('qck2:') && stored.includes('::')
            ? stored.slice(stored.indexOf('::') + 2)
            : null
        const rekeyOnly = !isNew && stored === datasetFp // legacy bare-hash match

        if (!isNew && !rekeyOnly && storedDataset === datasetFp) {
          await ctx.db.from('law_page_hashes').upsert({
            url: page.url,
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            content_hash: stored,
            is_broken: false,
            consecutive_failures: 0,
            last_checked: new Date().toISOString(),
            meta: { ...(prevMetaObj ?? {}), datasetStaleAlertedAt },
          })
          return (`OK        ${page.jurisdiction}/${page.law_name}: dataset unchanged`)

        }

        /* Open the zip by Range — the manifest row for this Act plus the
           Act's own XML are a few KB apiece against a 45 MB archive. */
        const code = source.statuteCode
        let updatedTo: string | null = null
        let statuteFacts: ReturnType<typeof parseStatuteXml> | null = null
        let drillError: string | null = null
        try {
          const zipUrl = verdict.facts.url
          const size = await headContentLength(zipUrl)
          if (size === null) throw new Error('zip HEAD returned no content-length')
          const fetchRange = zipRangeFetcher(zipUrl)
          const zip: ZipDirectory = await openRemoteZip(fetchRange, size)
          const decoder = new TextDecoder()
          updatedTo =
            parseStatuteStatus(
              decoder.decode(await readZipEntry(fetchRange, zip, 'Statutes_EN_Status.txt')),
            ).get(code)?.ymd ?? null
          const entryName = `Statutes\\${code}\\EN\\${code}_EN.xml`
          statuteFacts = parseStatuteXml(
            decoder.decode(await readZipEntry(fetchRange, zip, entryName)),
          )
          if (statuteFacts.sections.length === 0) {
            throw new Error(`${entryName} parsed to zero sections`)
          }
        } catch (err) {
          drillError = err instanceof Error ? err.message : String(err)
          console.warn(
            `[monitor-law-changes] Québec drill-down failed for ${page.law_name}:`,
            drillError,
          )
        }

        const sectionFp = statuteFacts
          ? await sha256(sectionFingerprint(statuteFacts.sections))
          : null
        const meta = statuteFacts
          ? {
              statuteCode: code,
              updatedTo,
              docEev: statuteFacts.docEev,
              sections: statuteFacts.sections,
              datasetStaleAlertedAt,
            }
          : { ...(prevMetaObj ?? {}), datasetStaleAlertedAt }
        const newHash = sectionFp
          ? `qck2:${datasetFp}::${sectionFp}`
          : `qck2:${datasetFp}::unread`

        await ctx.db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: newHash,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
          meta,
        })

        /* Baseline rekey or a corpus refresh that left this Act's section map
           identical — either way there is no change to report. */
        const statuteChanged = isNew || storedSections === null || storedSections !== sectionFp
        if (rekeyOnly || (!isNew && sectionFp !== null && !statuteChanged)) {
          return (
            `${rekeyOnly ? 'BASELINE ' : 'OK       '} ${page.jurisdiction}/${page.law_name}: ` +
              `${statuteFacts?.sections.length ?? 0} sections, Act untouched`
          )

        }

        const prevSections: StatuteSection[] | null = (() => {
          const m = record?.meta as { sections?: unknown } | null
          return m && Array.isArray(m.sections) ? (m.sections as StatuteSection[]) : null
        })()
        const fmtYmd = (ymd: string) =>
          /^\d{8}$/.test(ymd) ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : ymd

        let changeSummary: string
        let rawDiff: string
        /* Facts block for the AI read — section numbers, in-force dates,
           amending instruments and provision excerpts. Null when there is
           no section-level signal to interpret (dataset-refresh fallback),
           because an analysis written over nothing would just invent. */
        let analysisFacts: string | null = null
        if (isNew) {
          changeSummary =
            `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring, ` +
            'read per-Act from Québec’s codified-legislation package. ' +
            `The province's manifest marks the Act updated to ${updatedTo ? fmtYmd(updatedTo) : 'an unspecified date'}` +
            `${statuteFacts?.docEev ? `; the newest provision in the current text is in force since ${fmtYmd(statuteFacts.docEev)}` : ''}.`
          rawDiff =
            `Statute ${code} · updated to ${updatedTo ? fmtYmd(updatedTo) : 'unknown'}\n` +
            `${statuteFacts?.sections.length ?? 0} provisions in the current text`
        } else if (sectionFp === null) {
          /* Drill-down failed — fall back to the dataset-level wording, which
             was always honest about its own limit. */
          changeSummary =
            `"${page.law_name}" (${page.jurisdiction}): Données Québec's codified-legislation dataset ` +
            `was refreshed (resource last modified ${verdict.facts.lastModified}). This dataset covers ` +
            'every codified Quebec Act, not just this one — review LégisQuébec for what changed and ' +
            'what it means for employers.'
          rawDiff =
            `Dataset resource: ${verdict.facts.resourceName} · last modified ${verdict.facts.lastModified}\n` +
            `Per-Act drill-down unavailable this run: ${drillError ?? 'unknown'}`
        } else if (prevSections === null) {
          /* No section baseline on record (the previous read pre-dates the
             drill-down or failed) — a diff would claim every section moved.
             Say what is known: the Act's file changed, and which provisions
             carry the newest in-force dates in the current text. */
          const maxEev = statuteFacts!.sections.reduce((a, s) => (s.eev > a ? s.eev : a), '')
          const recent = statuteFacts!.sections.filter((s) => s.eev === maxEev)
          changeSummary =
            `LégisQuébec published a new codified text of "${page.law_name}"` +
            (updatedTo ? `, marked updated to ${fmtYmd(updatedTo)}` : '') +
            '. Which provisions moved cannot be established from the first per-Act read' +
            (recent.length > 0
              ? ` — the most recently in-force provisions in the current text: ` +
                `${recent.slice(0, 5).map((s) => `s. ${s.number}`).join(', ')}` +
                ` (in force ${fmtYmd(maxEev)})${recent.length > 5 ? `, +${recent.length - 5} more` : ''}.`
              : '.') +
            ' Read the current text on LégisQuébec.'
          analysisFacts =
            `LégisQuébec republished the Act${updatedTo ? `, marked updated to ${fmtYmd(updatedTo)}` : ''}. ` +
            `This is the detector's first attributed read, so which provisions moved between ` +
            `publications is not in the record. Most recently in-force provisions in the ` +
            `current text:\n` +
            recent
              .map(
                (s) =>
                  `s. ${s.number} — in force ${fmtYmd(s.eev)}` +
                  `${s.latestRef ? `, last amended by ${s.latestRef}` : ''}` +
                  `${s.excerpt ? `. Text: "${s.excerpt}"` : ''}`,
              )
              .join('\n')
          rawDiff =
            `Statute ${code} · updated to ${updatedTo ? fmtYmd(updatedTo) : 'unknown'} · first attributed read\n` +
            (recent.length > 0
              ? `Most recently in-force provisions (${recent.length}):\n` +
                recent
                  .map(
                    (s) =>
                      `  s. ${s.number} — in force ${fmtYmd(s.eev)}` +
                      `${s.latestRef ? ` · last amended by ${s.latestRef}` : ''}`,
                  )
                  .join('\n')
              : '')
        } else {
          const diff = diffStatuteSections(prevSections, statuteFacts!.sections)
          const moved = [...diff.amended, ...diff.added]
          const parts: string[] = [
            `LégisQuébec published a new codified text of "${page.law_name}"` +
              (updatedTo ? `, marked updated to ${fmtYmd(updatedTo)}` : '') +
              '.',
          ]
          if (moved.length > 0) {
            const shown = moved.slice(0, 5).map(
              (s) =>
                `s. ${s.number} (in force ${fmtYmd(s.eev)}` +
                `${s.latestRef ? `, last amended by ${s.latestRef}` : ''})`,
            )
            parts.push(
              `Provisions whose in-force date moved: ${shown.join('; ')}` +
                `${moved.length > 5 ? `, +${moved.length - 5} more` : ''}.`,
            )
          }
          if (diff.removedNumbers.length > 0) {
            parts.push(
              `No longer in the text: ${diff.removedNumbers.slice(0, 4).join(', ')}` +
                `${diff.removedNumbers.length > 4 ? `, +${diff.removedNumbers.length - 4} more` : ''}.`,
            )
          }
          if (moved.length === 0 && diff.removedNumbers.length === 0) {
            parts.push(
              'The Act file changed but no provision-level marker moved — likely a ' +
                'reissue rather than an amendment; check the consolidated text if this Act applies to you.',
            )
          }
          parts.push('Read the current text on LégisQuébec.')
          changeSummary = parts.join(' ')
          /* raw_diff carries the complete list — the summary caps at five
             provisions, the card's "more" affordance reveals all of them. */
          const fmtSection = (s: StatuteSection) =>
            `  s. ${s.number} — in force ${fmtYmd(s.eev)}` +
            `${s.latestRef ? ` · last amended by ${s.latestRef}` : ''}`
          rawDiff =
            `Statute ${code} · updated to ${updatedTo ? fmtYmd(updatedTo) : 'unknown'}\n` +
            (diff.amended.length > 0
              ? `Amended (${diff.amended.length}):\n` + diff.amended.map(fmtSection).join('\n') + '\n'
              : '') +
            (diff.added.length > 0
              ? `Added (${diff.added.length}):\n` + diff.added.map(fmtSection).join('\n') + '\n'
              : '') +
            (diff.removedNumbers.length > 0
              ? `No longer in the text: ${diff.removedNumbers.join(', ')}\n`
              : '') +
            (diff.amended.length + diff.added.length + diff.removedNumbers.length === 0
              ? 'No provision-level marker moved.\n'
              : '')
          const prevByNum = new Map(prevSections!.map((s) => [s.number, s]))
          const fmtFact = (s: StatuteSection) =>
            `s. ${s.number} — in force ${fmtYmd(s.eev)}` +
            `${s.latestRef ? `, last amended by ${s.latestRef}` : ''}` +
            `${s.excerpt ? `. Current text: "${s.excerpt}"` : ''}`
          analysisFacts =
            `LégisQuébec published a new codified text of the Act` +
            `${updatedTo ? `, marked updated to ${fmtYmd(updatedTo)}` : ''}. ` +
            `Detector diff against the previous read:\n` +
            (diff.amended.length > 0
              ? `Amended provisions (in-force date moved later):\n` +
                diff.amended.slice(0, 15).map(fmtFact).join('\n') +
                `${diff.amended.length > 15 ? `\n+${diff.amended.length - 15} more amended` : ''}\n`
              : '') +
            (diff.added.length > 0
              ? `Added provisions (new in the text):\n` +
                diff.added.slice(0, 10).map(fmtFact).join('\n') +
                `${diff.added.length > 10 ? `\n+${diff.added.length - 10} more added` : ''}\n`
              : '') +
            (diff.removedNumbers.length > 0
              ? `No longer in the text: ${diff.removedNumbers.join(', ')}\n` +
                diff.removedNumbers
                  .slice(0, 6)
                  .map((n) => {
                    const prev = prevByNum.get(n)
                    return prev?.excerpt ? `former s. ${n} read: "${prev.excerpt}"` : null
                  })
                  .filter(Boolean)
                  .join('\n') +
                '\n'
              : '') +
            (diff.amended.length + diff.added.length + diff.removedNumbers.length === 0
              ? 'No provision-level marker moved — the file changed but every ' +
                "section's in-force date is identical, consistent with an " +
                'administrative reissue rather than an amendment.\n'
              : '')
        }

        const analysis =
          isNew || analysisFacts === null
            ? null
            : await ctx.analyzeChange(page.law_name, page.jurisdiction, analysisFacts)

        await ctx.db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: page.url,
          reference_url: page.referenceUrl ?? null,
          content_hash: newHash,
          ai_analysis_en: analysis?.en ?? null,
          ai_analysis_fr: analysis?.fr ?? null,
          change_summary: changeSummary,
          raw_diff: rawDiff,
          detected_at: new Date().toISOString(),
          is_new: isNew,
          event_type: isNew ? 'first_seen' : 'change',
        })

        return (
          `${isNew ? 'FIRST_SEEN' : 'CHANGE   '} ${page.jurisdiction}/${page.law_name}` +
            `${drillError ? ` (drill failed: ${drillError})` : ''}`
        )

}
