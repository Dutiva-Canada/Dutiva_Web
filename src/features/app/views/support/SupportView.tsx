import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { legalDocPath, legalRowBySlug, seoRoute } from '@/seo/routes'
import { supportMessages as M } from '@/i18n/messages/support'
import { RESPONSE_TARGETS, SUPPORT_CHANNELS } from '@/config/support'
import { SupportRequestForm } from '@/features/support/SupportRequestForm'
import { SupportSectionNav } from './SupportSectionNav'

const PRIORITY_ORDER = ['critical', 'high', 'standard', 'low'] as const

/**
 * /app/support — the authenticated support hub: the digital-first statement,
 * the request form (SupportRequestForm), the specialized channels, and the
 * published response targets. Real feature, so it's ungated.
 */
export function SupportView() {
  const { x, L, lang } = useI18n()
  const supportPolicy = legalRowBySlug('support-policy')
  const supportPolicyPath = supportPolicy
    ? legalDocPath(supportPolicy, lang)
    : seoRoute('legal').path[lang]

  return (
    <div className="mx-auto max-w-[1100px] px-[28px] pt-[8px] pb-[64px] max-[640px]:px-[16px]">
      <header className="mb-[20px]">
        <h1 className="m-0 mb-[8px] font-display text-[24px] font-semibold tracking-[-0.015em] text-text">
          {x(M.support_form_title)}
        </h1>
        <p className="m-0 max-w-[640px] text-[14.5px] leading-[1.55] text-text-3">
          {x(M.support_digital_first)}
        </p>
      </header>

      <SupportSectionNav active="new" />

      <div className="flex items-start gap-[28px] max-[1023px]:flex-col">
        <div className="min-w-0 flex-1 rounded-[16px] border border-border bg-surface p-[24px] max-[1023px]:w-full">
          <SupportRequestForm />
        </div>

        <aside className="w-[300px] shrink-0 flex-col gap-[16px] max-[1023px]:w-full">
          <section className="mb-[16px] rounded-[14px] border border-border bg-surface p-[18px]">
            <h2 className="m-0 mb-[10px] font-display text-[13px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.support_field_response_method)}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
              {PRIORITY_ORDER.map((p) => (
                <li key={p} className="flex justify-between gap-[8px] text-[13px]">
                  <span className="text-text-2">{x(RESPONSE_TARGETS[p].label)}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-[10px] text-[11.5px] leading-[1.5] text-text-faint">
              {x(M.support_targets_note)}
            </p>
          </section>

          <section className="rounded-[14px] border border-border bg-surface p-[18px]">
            <h2 className="m-0 mb-[10px] font-display text-[13px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.support_form_title)}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
              {SUPPORT_CHANNELS.map((c) => (
                <li key={c.id} className="text-[12.5px] leading-[1.45]">
                  <a href={`mailto:${c.email}`} className="font-semibold text-navy underline">
                    {c.email}
                  </a>
                  <div className="text-text-3">{x(c.purpose)}</div>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-[12px] text-[12px] text-text-faint">
              <Link to={supportPolicyPath} className="underline">
                {L('Support policy', 'Politique de soutien')}
              </Link>
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
