import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useInitiatives } from '../data/useInitiatives'
import { useContentItems } from '../data/useContentItems'
import { useInteractions } from '../data/useInteractions'
import { useIssues } from '../data/useIssues'
import { useSubmissions } from '../data/useSubmissions'
import { useBrandClaims } from '../data/useBrandClaims'
import { useCoverage } from '../data/useCoverage'
import { useSegments } from '../data/useSegments'
import { useStakeholders } from '../data/useStakeholders'
import { CONTACT_TYPE_LABEL } from '../commsLabels'
import type { CommsContactType } from '../data/types'

const CONTACT_TYPES: CommsContactType[] = [
  'media',
  'institutional',
  'partner',
  'creator',
  'audience',
]

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-[10px] border border-border-soft bg-surface-2 px-[12px] py-[10px]">
      <div className="font-display text-[22px] font-bold text-text">{value}</div>
      <div className="mt-[2px] text-[11.5px] text-text-muted">{label}</div>
    </div>
  )
}

export function CommsAnalytics() {
  const { x } = useI18n()
  const { mode } = useWorkspaceMode()

  const initiatives = useInitiatives()
  const { contentItems, loading: contentLoading } = useContentItems()
  const { interactions, loading: interactionLoading } = useInteractions()
  const { issues, loading: issueLoading } = useIssues()
  const { submissions, loading: submissionLoading } = useSubmissions()
  const { brandClaims, loading: brandClaimLoading } = useBrandClaims()
  const { coverageItems, loading: coverageLoading } = useCoverage()
  const { segments, segmentMemberships, loading: segmentsLoading } = useSegments()
  const { contacts } = useStakeholders()

  const isLoading =
    initiatives.loading ||
    contentLoading ||
    interactionLoading ||
    issueLoading ||
    submissionLoading ||
    brandClaimLoading ||
    coverageLoading ||
    segmentsLoading

  if (isLoading) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <div className="text-[13px] text-text-muted">{x(M.comms_loading)}</div>
      </div>
    )
  }

  const total =
    initiatives.initiatives.length +
    contentItems.length +
    interactions.length +
    issues.length +
    submissions.length +
    brandClaims.length +
    coverageItems.length +
    segments.length +
    contacts.length

  if (total === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <div className="text-[15px] font-semibold text-text">{x(M.comms_analytics_title)}</div>
        <p className="m-0 mt-[6px] text-[13px] text-text-muted">{x(M.comms_analytics_empty)}</p>
      </div>
    )
  }

  const openContentItems = contentItems.filter(
    (c) => c.deliveryStatus === 'scheduled' || c.deliveryStatus === 'sending' || c.deliveryStatus === 'ready',
  )
  const openInteractions = interactions.filter(
    (i) => i.status === 'open' || i.status === 'pending' || i.status === 'escalated',
  )
  const openIssues = issues.filter(
    (i) => i.status === 'open' || i.status === 'monitoring',
  )
  const activeSubmissions = submissions.filter(
    (s) => s.status === 'planned' || s.status === 'submitted',
  )
  const totalReach = coverageItems.reduce((sum, c) => sum + (c.reach ?? 0), 0)

  const memberCountBySegment = new Map<string, number>()
  const segmentedContactIds = new Set<string>()
  for (const m of segmentMemberships) {
    memberCountBySegment.set(m.segmentId, (memberCountBySegment.get(m.segmentId) ?? 0) + 1)
    segmentedContactIds.add(m.contactId)
  }
  const topSegment = segments.reduce<{ name: (typeof segments)[number]['name']; count: number } | null>(
    (best, s) => {
      const count = memberCountBySegment.get(s.id) ?? 0
      return !best || count > best.count ? { name: s.name, count } : best
    },
    null,
  )
  const contactCountByType = new Map<CommsContactType, number>()
  for (const c of contacts) {
    contactCountByType.set(c.type, (contactCountByType.get(c.type) ?? 0) + 1)
  }

  return (
    <div className="space-y-[18px]">
      <div>
        <h2 className="text-[17px] font-semibold text-text">{x(M.comms_analytics_title)}</h2>
        <p className="m-0 mt-[4px] text-[13px] text-text-muted">{x(M.comms_analytics_subtitle)}</p>
      </div>

      {mode === 'demo' && (
        <p className="text-[12px] text-text-muted">{x(M.comms_demo_read_only)}</p>
      )}

      <div className="flex flex-wrap gap-[10px]">
        <Stat value={String(initiatives.initiatives.length)} label={x(M.comms_analytics_initiatives)} />
        <Stat value={String(openContentItems.length)} label={x(M.comms_analytics_content_items)} />
        <Stat value={String(openInteractions.length)} label={x(M.comms_analytics_open_interactions)} />
        <Stat value={String(openIssues.length)} label={x(M.comms_analytics_open_issues)} />
        <Stat value={String(activeSubmissions.length)} label={x(M.comms_analytics_submissions)} />
        <Stat value={String(brandClaims.filter((c) => c.status === 'active').length)} label={x(M.comms_analytics_brand_claims)} />
        <Stat value={String(totalReach)} label={x(M.comms_analytics_coverage)} />
        <Stat value={String(segments.length)} label={x(M.comms_analytics_segments)} />
        <Stat value={String(segmentedContactIds.size)} label={x(M.comms_analytics_contacts_in_segments)} />
        {topSegment && topSegment.count > 0 && (
          <Stat
            value={x(topSegment.name)}
            label={`${x(M.comms_analytics_top_segment)} · ${topSegment.count} ${x(M.comms_segments_members_count)}`}
          />
        )}
      </div>

      {contacts.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h3 className="m-0 text-[14px] font-semibold text-text">
            {x(M.comms_analytics_contacts_by_type)}
          </h3>
          <div className="mt-[8px] flex flex-wrap gap-[8px]">
            {CONTACT_TYPES.filter((t) => (contactCountByType.get(t) ?? 0) > 0).map((t) => (
              <span
                key={t}
                className="rounded-[100px] bg-inset px-[10px] py-[3px] text-[11.5px] font-semibold text-text-2"
              >
                {x(CONTACT_TYPE_LABEL[t])}: {contactCountByType.get(t) ?? 0}
              </span>
            ))}
          </div>
          {segments.length > 0 && (
            <>
              <h3 className="m-0 mt-[14px] text-[14px] font-semibold text-text">
                {x(M.comms_analytics_segment_breakdown)}
              </h3>
              <ul className="m-0 mt-[8px] flex flex-col gap-[6px] p-0">
                {segments.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-[12px] text-[12.5px] text-text-2"
                  >
                    <span className="min-w-0 truncate">{x(s.name)}</span>
                    <span className="shrink-0 text-text-muted">
                      {memberCountBySegment.get(s.id) ?? 0} {x(M.comms_segments_members_count)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  )
}
