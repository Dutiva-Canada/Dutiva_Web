import { useId, useState, type ReactNode } from 'react'
import { Building2, CircleHelp, Pencil } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { SegButton } from '../../components'
import { sectors, sizeTiers } from '../../data'
import type { OrgProfile } from '../../data'
import {
  effectiveJurisdiction,
  isOrgProfileComplete,
  orgProfileSummaryParts,
} from '../../presentation'
import { jurisdictionInfo } from '../../data'

function tierFor(headcount: number) {
  return sizeTiers.find((t) => headcount >= t.min && (t.max === null || headcount <= t.max))
}

function ControlLabel({
  htmlFor,
  children,
}: {
  readonly htmlFor: string
  readonly children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[9.5px] font-bold tracking-widest text-text-faint uppercase"
    >
      {children}
    </label>
  )
}

/**
 * Compact applicability summary — one line of profile facts, Edit / Why,
 * and an optional inline editor. Does not duplicate badges + fields at once.
 */
export function ApplicabilitySummary({
  org,
  setOrg,
}: {
  readonly org: OrgProfile
  readonly setOrg: (org: OrgProfile) => void
}) {
  const { t, x } = useI18n()
  const [editing, setEditing] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const whyId = useId()
  const complete = isOrgProfileComplete(org)
  const summary = orgProfileSummaryParts(org)
  const sector = sectors.find((s) => s.key === org.sector)
  const federallyRegulated = sector?.federallyRegulated ?? false
  const juris = jurisdictionInfo.find((j) => j.code === effectiveJurisdiction(org))
  const tier = tierFor(org.headcount)

  const summaryLine = complete
    ? [
        juris ? x(juris.name) : null,
        `${org.headcount} ${t('doclib_profile_employees')}`,
        summary.sectorName ? x(summary.sectorName) : null,
        x(summary.unionLabel),
      ]
        .filter(Boolean)
        .join(' · ')
    : t('doclib_profile_incomplete')

  return (
    <section
      aria-label={t('doclib_profile_title')}
      className="mb-4 rounded-[12px] border border-border bg-surface px-[14px] py-[12px] max-[640px]:px-[10px]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-navy text-gold-on-navy">
          <Building2 size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[12.5px] font-bold text-text">{t('doclib_profile_title')}</div>
          <p className="mt-0.5 text-[12.5px] text-text-muted">{summaryLine}</p>
          {complete && tier && (
            <span className="sr-only">
              {x(tier.label)}
              {federallyRegulated ? ` · ${t('doclib_profile_regulated')}` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={whyOpen}
            aria-controls={whyId}
            onClick={() => setWhyOpen((v) => !v)}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-inset"
          >
            <CircleHelp size={14} strokeWidth={1.9} aria-hidden="true" />
            {t('doclib_profile_why')}
          </button>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((v) => !v)}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-border-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-inset"
          >
            <Pencil size={13} strokeWidth={1.9} aria-hidden="true" />
            {complete ? t('doclib_profile_edit') : t('doclib_profile_complete')}
          </button>
        </div>
      </div>

      {whyOpen && (
        <p
          id={whyId}
          className="mt-3 border-t border-border-soft pt-3 text-[12.5px] leading-relaxed text-text-2"
        >
          {t('doclib_profile_whyBody')}
        </p>
      )}

      {editing && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border-soft pt-3">
          <div className="flex flex-col gap-1">
            <ControlLabel htmlFor="doclib-org-headcount">
              {t('doclib_profile_headcount')}
            </ControlLabel>
            <input
              id="doclib-org-headcount"
              type="number"
              min={1}
              value={org.headcount}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10)
                if (!Number.isNaN(next)) setOrg({ ...org, headcount: Math.max(1, next) })
              }}
              className="h-[36px] w-[88px] rounded-[8px] border border-border-strong bg-surface px-[10px] text-[12px] font-semibold text-text"
            />
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <ControlLabel htmlFor="doclib-org-sector">{t('doclib_profile_sector')}</ControlLabel>
            <select
              id="doclib-org-sector"
              value={org.sector}
              onChange={(event) => setOrg({ ...org, sector: event.target.value })}
              className="h-[36px] w-full cursor-pointer truncate rounded-[8px] border border-border-strong bg-surface px-[10px] text-[12px] font-semibold text-text"
            >
              {sectors.map((s) => (
                <option key={s.key} value={s.key}>
                  {x(s.name)}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="flex items-center gap-[2px] rounded-[10px] bg-inset p-[3px]">
            <legend className="sr-only">{t('doclib_profile_unionToggle')}</legend>
            <SegButton active={!org.unionized} onClick={() => setOrg({ ...org, unionized: false })}>
              {t('doclib_profile_nonunion')}
            </SegButton>
            <SegButton active={org.unionized} onClick={() => setOrg({ ...org, unionized: true })}>
              {t('doclib_profile_union')}
            </SegButton>
          </fieldset>
        </div>
      )}
    </section>
  )
}
