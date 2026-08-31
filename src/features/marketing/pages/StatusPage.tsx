import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { seoRoute } from '@/seo/routes'
import { supportMessages as M } from '@/i18n/messages/support'
import {
  SERVICE_COMPONENTS,
  STATUS_DOT_CLASS,
  STATUS_ICON_CLASS,
  STATUS_LEVEL_LABELS,
  getServiceStatus,
  overallStatus,
} from '@/features/support/statusApi'
import type { ServiceStatusRow } from '@/features/support/statusApi'
import { MarketingPageShell, PageHero } from './MarketingPage'

/** /status (EN) · /fr/etat (FR) — public, self-reported service status board. */
export function StatusPage() {
  const { x, lang } = useI18n()
  const [rows, setRows] = useState<ServiceStatusRow[]>(() =>
    SERVICE_COMPONENTS.map((c) => ({
      component: c.id,
      status: 'operational',
      message: null,
      updatedAt: '',
    })),
  )

  useEffect(() => {
    let cancelled = false
    getServiceStatus()
      .then((r) => {
        if (!cancelled) setRows(r)
      })
      .catch((e: unknown) => console.error('status: failed to load', e))
    return () => {
      cancelled = true
    }
  }, [])

  const overall = overallStatus(rows)
  const allOk = overall === 'operational'
  const componentLabel = (id: ServiceStatusRow['component']) =>
    x(SERVICE_COMPONENTS.find((c) => c.id === id)!.label)

  return (
    <MarketingPageShell>
      <Seo route="status" />
      <PageHero eyebrow={x(M.status_eyebrow)} title={x(M.status_h1)} intro={x(M.status_intro)} />

      <section className="mx-auto max-w-[720px] px-6 pb-20">
        <div
          className="mb-6 flex items-center gap-3 rounded-[14px] border border-border px-[20px] py-[16px]"
          role="status"
        >
          {allOk ? (
            <CheckCircle2 size={22} aria-hidden="true" className={STATUS_ICON_CLASS.operational} />
          ) : (
            <TriangleAlert size={22} aria-hidden="true" className={STATUS_ICON_CLASS[overall]} />
          )}
          <span className="text-[1.0625rem] font-semibold text-text">
            {x(allOk ? M.status_all_operational : M.status_some_issues)}
          </span>
        </div>

        <ul className="grid list-none gap-2.5 p-0">
          {rows.map((row) => (
            <li
              key={row.component}
              className="flex flex-col gap-1 rounded-[12px] border border-border bg-bg px-[18px] py-[14px]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.9375rem] font-semibold text-text">
                  {componentLabel(row.component)}
                </span>
                <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-text-2">
                  <span
                    aria-hidden="true"
                    className={`status-dot ${STATUS_DOT_CLASS[row.status]}`}
                  />
                  {x(STATUS_LEVEL_LABELS[row.status])}
                </span>
              </div>
              {row.message && (
                <p className="m-0 text-[0.8125rem] leading-[1.5] text-text-2">{row.message}</p>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-text-3">
          <Link
            to={seoRoute('contact').path[lang]}
            className="font-semibold text-gold-strong hover:opacity-80"
          >
            {x(M.support_contact_h1)}
          </Link>
        </p>
      </section>
    </MarketingPageShell>
  )
}
