import { useI18n } from '@/i18n/context'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import { AppPage, AppPageLead } from '@/features/app/shell/AppPage'
import { ChatWidget, ChatWidgetBlock } from '@/components/chatWidgets/ChatWidget'
import { WidgetContent } from '@/components/chatWidgets/WidgetContent'
import { interactiveChatWidgetsEnabled } from '@/components/chatWidgets/flags'
import type { ChatWidgetSurface } from '@/components/chatWidgets/flags'
import {
  demoBrokenReply,
  demoCalculators,
  demoChartBar,
  demoChartPie,
  demoChecklist,
  demoComparison,
  demoMixedReply,
  demoTable,
  demoTimeline,
} from './demoSpecs'

const SURFACES: readonly ChatWidgetSurface[] = ['advisor', 'invest', 'health', 'pr']

/**
 * Chat widgets showcase — every widget type rendered from its spec, in the
 * viewer's current language. Unlinked route (`/app/chat-widgets`, also
 * `/demo/chat-widgets` and `/fr/demo/chat-widgets`): it exists so a PR
 * reviewer can see the whole catalog without flipping a flag, and so the
 * flag status of each chat surface is visible in one place.
 *
 * The flag line reports which surfaces currently parse ```dutiva-widget
 * fences; the widgets below render unconditionally — this page *is* the
 * component catalog.
 */
export function ChatWidgetsView() {
  const { x } = useI18n()
  const enabled = SURFACES.filter((s) => interactiveChatWidgetsEnabled(s))

  return (
    <AppPage width="wide">
      <h1 className="mb-[6px] text-[20px] font-bold text-text">{x(CW.chatw_demo_title)}</h1>
      <AppPageLead>{x(CW.chatw_demo_sub)}</AppPageLead>

      <p className="mb-[18px] rounded-[10px] border border-border bg-surface px-[14px] py-[10px] text-[12.5px] text-text-muted">
        {enabled.length > 0
          ? x(CW.chatw_demo_flag_on).replace('{surfaces}', enabled.join(', '))
          : x(CW.chatw_demo_flag_off)}
      </p>

      <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-2">
        {demoCalculators.map((spec, i) => (
          <ChatWidget spec={spec} key={`calc-${i}`} />
        ))}
        <ChatWidget spec={demoChartPie} />
        <ChatWidget spec={demoChartBar} />
        <ChatWidget spec={demoTable} />
        <ChatWidget spec={demoChecklist} />
        <ChatWidget spec={demoTimeline} />
        <ChatWidget spec={demoComparison} />
      </div>

      <h2 className="mb-[10px] mt-[28px] text-[15px] font-bold text-text">
        {x(CW.chatw_demo_mixed_title)}
      </h2>
      <div className="max-w-[620px] rounded-[3px_14px_14px_14px] border border-border-soft bg-surface px-[16px] py-[13px] text-[14.5px] leading-[1.6] text-text">
        <WidgetContent text={demoMixedReply} />
      </div>

      <h2 className="mb-[10px] mt-[28px] text-[15px] font-bold text-text">
        {x(CW.chatw_demo_fallback_title)}
      </h2>
      <div className="max-w-[620px] rounded-[3px_14px_14px_14px] border border-border-soft bg-surface px-[16px] py-[13px] text-[14.5px] leading-[1.6] text-text">
        <WidgetContent text={demoBrokenReply} />
        <ChatWidgetBlock source={'{"type":"unknown-widget","data":{}}'} />
      </div>
    </AppPage>
  )
}
