import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Info, MessageCircle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import type { MemoryFact } from '@/data'
import { MemoryFactRow } from './MemoryFactRow'
import { getOwnConversation } from './conversationsApi'
import type { ConversationTurn } from './conversationsApi'
import { confirmFact, correctFact, forgetFact, listFactsByEntity } from './productionApi'

/**
 * Conversation / thread memory in production — governed facts plus the
 * caller's own Advisor transcript from `conversations` when the thread id
 * matches. Demo gold-highlight RECALL_TURNS stay demo-only.
 */

export function ChatRecallProductionView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { threadId } = useParams()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [facts, setFacts] = useState<MemoryFact[] | null>(null)
  const [turns, setTurns] = useState<ConversationTurn[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId || !threadId) return
    setLoadFailed(false)
    try {
      const [factRows, conversation] = await Promise.all([
        listFactsByEntity(organizationId, 'thread', threadId),
        getOwnConversation(threadId).catch(() => null),
      ])
      setFacts(factRows)
      setTurns(conversation?.messages ?? [])
    } catch {
      setFacts([])
      setTurns([])
      setLoadFailed(true)
    }
  }, [organizationId, threadId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.memory_prod_empty_title)} />
  }
  if (!threadId) return <Navigate to="/app/settings/memory" replace />
  if (facts === null || turns === null) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-[28px] pt-[28px] text-[13px] text-text-faint">
        …
      </div>
    )
  }

  const onConfirm = async (id: string) => {
    try {
      const updated = await confirmFact(organizationId, id)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }
  const onCorrect = async (id: string, statement: string) => {
    try {
      const updated = await correctFact(organizationId, id, statement)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }
  const onForget = async (id: string) => {
    try {
      await forgetFact(organizationId, id)
      setFacts((prev) => (prev ?? []).filter((f) => f.id !== id))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }

  const visibleTurns = turns.filter((t) => t.role === 'user' || t.role === 'assistant')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1080px] px-[16px] pt-[24px] pb-[40px] md:px-[28px]">
        {loadFailed && (
          <div className="mb-[14px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[10px] text-[13px] text-risk-dot">
            {x(M.memory_prod_load_failed)}
          </div>
        )}

        <div className="mb-[16px] flex flex-wrap items-start gap-[12px]">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-gold-bg text-gold-fg">
            <MessageCircle size={16} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 font-display text-[20px] font-semibold text-text">
              {x(M.memory_nav_conversations)}
            </h1>
            <p className="mt-[4px] mb-0 text-[12.5px] text-text-faint">{threadId}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/advisor')}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[12.5px] font-semibold text-text-2"
          >
            {x(M.memory_prod_open_advisor)}
          </button>
        </div>

        <div className="mb-[16px] flex items-start gap-[10px] rounded-[12px] border border-border-soft bg-inset px-[14px] py-[12px]">
          <Info
            size={15}
            strokeWidth={1.7}
            className="mt-[2px] shrink-0 text-text-muted"
            aria-hidden="true"
          />
          <p className="m-0 text-[12.5px] leading-normal text-text-muted">
            {x(M.memory_prod_transcript_note)}
          </p>
        </div>

        {visibleTurns.length > 0 && (
          <div className="mb-[18px] overflow-hidden rounded-[14px] border border-border-soft bg-surface">
            <div className="border-b border-border-soft px-[14px] py-[10px] text-[12px] font-bold text-text">
              {x(M.memory_prod_transcript_title)}
            </div>
            <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
              {visibleTurns.map((turn, i) => (
                <div
                  key={`${turn.role}-${i}`}
                  className={`max-w-[92%] rounded-[12px] px-[12px] py-[9px] text-[13px] leading-normal ${
                    turn.role === 'user'
                      ? 'self-end bg-navy text-white'
                      : 'self-start bg-inset text-text'
                  }`}
                >
                  {turn.content}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-[8px] text-[12px] font-bold text-text">{x(M.memory_prod_thread_facts)}</div>
        <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
          {facts.map((fact) => (
            <MemoryFactRow
              key={fact.id}
              fact={fact}
              onConfirm={(id) => void onConfirm(id)}
              onCorrect={(id, s) => void onCorrect(id, s)}
              onForget={(id) => void onForget(id)}
            />
          ))}
          {facts.length === 0 && (
            <div className="px-[20px] py-[30px] text-center text-[13px] text-text-faint">
              {x(M.memory_prod_thread_empty)}
            </div>
          )}
        </div>
        <Disclaimer className="mt-[18px]" />
      </div>
    </div>
  )
}
