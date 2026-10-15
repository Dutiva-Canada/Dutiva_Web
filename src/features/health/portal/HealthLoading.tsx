import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'

/* Shared loading block — a skeleton echoing the page's shape (title, sub,
   stat strip, card) so first paint already has structure instead of a lone
   spinner. The bars are decorative; role="status" + the sr-only label carry
   the state to screen readers. */
export function HealthLoading() {
  const { x } = useI18n()
  return (
    <div className="mx-auto w-full max-w-[980px] px-[16px] pb-[40px]" role="status">
      <span className="sr-only">{x(HM.health_loading)}</span>
      <div aria-hidden="true">
        <div className="hb-skel mt-[20px] h-[30px] w-[200px]" />
        <div className="hb-skel mt-[12px] h-[14px] w-[58%]" />
        <div className="mt-[24px] grid grid-cols-2 gap-[12px] min-[720px]:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="hb-skel h-[92px]" />
          ))}
        </div>
        <div className="hb-skel mt-[16px] h-[180px]" />
      </div>
    </div>
  )
}
