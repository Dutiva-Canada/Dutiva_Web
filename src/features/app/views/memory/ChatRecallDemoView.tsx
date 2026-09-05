import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useWorkspaceNavigate, useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { Brain, History, Info, Sparkle, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bi, pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { shellMessages as SM } from '@/i18n/messages/shell'
import { Disclaimer } from '@/components/Disclaimer'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { advisorViewMessages } from '@/i18n/messages/advisorView'
import { employees, memoryThreads } from '@/data'
import type { MemoryFact } from '@/data'
import { CONFIDENCE_META, SOURCE_META } from './memoryModel'
import { KnowFact } from './KnowFact'
import { useMemoryStore } from './memoryStore'
import { useLgUp } from '@/lib/useMediaQuery'

/**
 * Chat recall (`Advisor Memory.dc.html` CHAT surface): the "Resumed from…"
 * system pill, inline memory highlights (gold underline; the title carries
 * the provenance), the "Memory used in this answer" accordion with per-fact
 * Correct actions, and the "What I know" rail — recall is always sourced and
 * correctable. Sending here continues the conversation in the Advisor view.
 *
 * Production mode lists thread-scoped facts only (no RECALL_TURNS transcript).
 */

interface RecallSegment {
  text: Bi
  /** Memory fact backing this segment — rendered as a gold recall highlight. */
  memId?: string
}

interface RecallTurn {
  kind: 'system' | 'user' | 'advisor'
  text?: Bi
  fromEarlier?: boolean
  segments?: RecallSegment[]
  recallIds?: string[]
}

const seg = (en: string, fr: string, memId?: string): RecallSegment => ({
  text: bi(en, fr),
  memId,
})

/* The Jordan-termination recall transcript (prototype `buildChat()` raw). */
const RECALL_TURNS: RecallTurn[] = [
  {
    kind: 'system',
    text: bi(
      'Resumed from Jul 5 · Advisor reloaded 8 memories for Jordan and this case.',
      'Repris depuis le 5 juill. · Le Conseiller a rechargé 8 mémoires pour Jordan et ce dossier.',
    ),
  },
  {
    kind: 'user',
    text: bi(
      'Any update on where we landed with Jordan’s notice?',
      'Du nouveau sur où nous en sommes avec le préavis de Jordan?',
    ),
  },
  {
    kind: 'advisor',
    recallIds: ['p7', 'p4', 'c2'],
    segments: [
      seg('Picking up from Jul 5 — I estimated ', 'Je reprends depuis le 5 juill. — j’ai estimé '),
      seg(
        '9–12 months’ common-law reasonable notice',
        '9 à 12 mois de préavis raisonnable de common law',
        'p7',
      ),
      seg(
        ', because the contract you uploaded has ',
        ', parce que le contrat que vous avez téléversé ne comporte ',
      ),
      seg('no termination clause', 'aucune clause de licenciement', 'p4'),
      seg('. Counsel review is ', '. La révision juridique est '),
      seg('still outstanding', 'toujours en attente', 'c2'),
      seg(
        ' — I flagged it 6 days ago, and nothing has been sent to Jordan yet.',
        ' — je l’ai signalée il y a 6 jours, et rien n’a encore été envoyé à Jordan.',
      ),
    ],
  },
  {
    kind: 'user',
    text: bi(
      'Remind me why common-law and not just the ESA minimum?',
      'Rappelez-moi pourquoi la common law et pas seulement le minimum de la LNE?',
    ),
  },
  {
    kind: 'advisor',
    fromEarlier: true,
    recallIds: ['p4', 'c4'],
    segments: [
      seg(
        'Earlier in this case you confirmed there’s ',
        'Plus tôt dans ce dossier, vous avez confirmé qu’il n’y a ',
      ),
      seg('no termination clause', 'aucune clause de licenciement', 'p4'),
      seg(
        '. That’s what takes this past the ',
        '. C’est ce qui fait passer ce dossier au-delà du ',
      ),
      seg(
        'ESA minimum (8 weeks’ termination notice/pay)',
        'minimum LNE (8 semaines de préavis ou d’indemnité de licenciement)',
        'c4',
      ),
      seg(
        ' into common-law reasonable notice — the statutory minimum is the floor, not the ceiling, when no valid clause caps it.',
        ' vers le préavis raisonnable de common law — le minimum légal est le plancher, pas le plafond, lorsqu’aucune clause valide ne le limite.',
      ),
    ],
  },
]

/** Northgate fixtures — demo workspace and public `/demo` only. */
export function ChatRecallDemoView() {
  const { x, lang } = useI18n()
  const navigate = useWorkspaceNavigate()
  const { root } = useWorkspaceRoot()
  const { threadId } = useParams()
  const { facts } = useMemoryStore()
  const [knowRailOpen, setKnowRailOpen] = useState(false)
  const lgUp = useLgUp()

  const thread = memoryThreads.find((t) => t.id === threadId)
  if (!thread) return <Navigate to={workspacePath(root, 'settings/memory')} replace />

  const employee = employees.find((e) => e.id === thread.personId)
  const byId = (id: string) => facts.find((f) => f.id === id)
  const knowPerson = ['p2', 'p4', 'p7'].map(byId).filter((f): f is MemoryFact => f !== undefined)
  const knowThread = ['t1', 't2'].map(byId).filter((f): f is MemoryFact => f !== undefined)

  const recallTitle = (fact: MemoryFact) =>
    `${x(M.memory_chat_remembered)} · ${pick(SOURCE_META[fact.source.type].kind, lang)} · ${pick(fact.source.detail, lang)}`

  /* Continue the conversation in the real chat surface. */
  const continueInAdvisor = () => navigate('/app/advisor', { state: { chatId: thread.id } })

  const knowRail = (
    <>
      <div className="mb-[14px] overflow-hidden rounded-[14px] border border-border-soft bg-surface">
        <div className="flex items-center gap-[9px] border-b border-inset px-[15px] py-[13px]">
          <Brain size={16} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
          <div>
            <div className="text-[12.5px] font-bold text-text">{x(M.memory_know_title)}</div>
            <div className="text-[11px] text-text-faint">{x(M.memory_know_sub_chat)}</div>
          </div>
        </div>
        <div className="px-[15px] py-[13px]">
          <div className="mb-[9px] text-[10.5px] font-bold tracking-wider text-gold-fg uppercase">
            {employee?.name ?? thread.personId}
          </div>
          {knowPerson.map((fact) => (
            <KnowFact key={fact.id} fact={fact} />
          ))}
        </div>
        <div className="border-t border-inset px-[15px] py-[13px]">
          <div className="mb-[9px] text-[10.5px] font-bold tracking-wider text-gold-fg uppercase">
            {x(M.memory_know_this_conversation)}
          </div>
          {knowThread.map((fact) => (
            <KnowFact key={fact.id} fact={fact} />
          ))}
        </div>
      </div>
      <div className="rounded-[13px] border border-support-border bg-support-bg px-[14px] py-[12px]">
        <div className="mb-[6px] flex items-center gap-[7px]">
          <Info size={13} strokeWidth={1.7} className="text-support-fg" aria-hidden="true" />
          <div className="text-[12px] font-bold text-support-fg">
            {x(M.memory_chat_recall_sourced_title)}
          </div>
        </div>
        <div className="text-[11.5px] leading-[1.55] text-support-text">
          {x(M.memory_chat_recall_sourced_note)}
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Jurisdiction context line */}
        <div className="flex shrink-0 items-center justify-center gap-[8px] border-b border-border-soft px-[14px] py-[8px]">
          <span className="rounded-[100px] border border-gold-border bg-gold-bg px-[11px] py-[3px] text-[11.5px] font-semibold text-gold-fg">
            {lang === 'fr' ? 'Ontario — LNE, 2000' : 'Ontario — ESA, 2000'}
          </span>
          {!lgUp ? (
            <button
              type="button"
              onClick={() => setKnowRailOpen(true)}
              className="flex min-h-[32px] cursor-pointer items-center gap-[6px] rounded-[100px] border border-border bg-surface px-[11px] py-[4px] text-[11.5px] font-semibold text-text-2"
            >
              <Brain size={13} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
              {x(M.memory_know_title)}
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-[760px] flex-col gap-[20px] px-[16px] pt-[20px] pb-[16px] sm:px-[24px] sm:pt-[24px]">
            {RECALL_TURNS.map((turn) => {
              if (turn.kind === 'system') {
                return (
                  <div
                    key={turn.text?.en ?? turn.recallIds?.join('-')}
                    className="flex items-center gap-[10px] self-center rounded-[100px] border border-support-border bg-support-bg px-[14px] py-[6px]"
                  >
                    <History
                      size={14}
                      strokeWidth={1.7}
                      className="shrink-0 text-support-fg"
                      aria-hidden="true"
                    />
                    <span className="text-[12px] text-support-text">
                      {turn.text !== undefined && pick(turn.text, lang)}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/settings/memory/cases/${thread.caseId}`)}
                      className="cursor-pointer border-none bg-transparent p-0 font-sans text-[12px] font-bold text-support-fg"
                    >
                      {x(M.memory_chat_view)}
                    </button>
                  </div>
                )
              }
              if (turn.kind === 'user') {
                return (
                  <div
                    key={turn.text?.en ?? turn.recallIds?.join('-')}
                    className="max-w-[74%] self-end rounded-[14px] rounded-br-[3px] bg-navy px-[16px] py-[11px] text-[14.5px] leading-[1.55] text-white"
                  >
                    {turn.text !== undefined && pick(turn.text, lang)}
                  </div>
                )
              }
              const recall = (turn.recallIds ?? [])
                .map(byId)
                .filter((f): f is MemoryFact => f !== undefined)
              return (
                <div
                  key={turn.text?.en ?? turn.recallIds?.join('-')}
                  className="flex items-start gap-[12px]"
                >
                  <div className="mt-[2px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-navy">
                    <Sparkle
                      size={14}
                      className="fill-gold-on-navy"
                      strokeWidth={0}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
                    {turn.fromEarlier === true && (
                      <div className="inline-flex items-center gap-[6px] self-start rounded-[100px] border border-gold-border bg-gold-bg px-[10px] py-[3px] text-[11px] font-semibold text-gold-fg">
                        <History size={13} strokeWidth={1.7} aria-hidden="true" />
                        {x(M.memory_chat_from_earlier)}
                      </div>
                    )}
                    <div className="max-w-[640px] rounded-[14px] rounded-tl-[3px] border border-border-soft bg-surface px-[16px] py-[13px] text-[14.5px] leading-[1.75] text-text">
                      {(turn.segments ?? []).map((segment) => {
                        const fact = segment.memId !== undefined ? byId(segment.memId) : undefined
                        if (!fact)
                          return (
                            <span key={segment.memId ?? segment.text.en}>
                              {pick(segment.text, lang)}
                            </span>
                          )
                        return (
                          <span
                            key={segment.memId ?? segment.text.en}
                            title={recallTitle(fact)}
                            className="cursor-help rounded-[3px] border-b-[1.5px] border-gold-dot bg-gold-bg px-[3px] py-px font-semibold text-gold-fg"
                          >
                            {pick(segment.text, lang)}
                          </span>
                        )
                      })}
                    </div>

                    {recall.length > 0 && (
                      <div className="max-w-[640px] overflow-hidden rounded-[11px] border border-border-soft bg-surface-2">
                        <div className="flex items-center gap-[7px] border-b border-inset px-[13px] py-[9px]">
                          <Brain
                            size={14}
                            strokeWidth={1.7}
                            className="text-gold-fg"
                            aria-hidden="true"
                          />
                          <span className="text-[11.5px] font-bold text-text">
                            {x(M.memory_chat_used_title)}
                          </span>
                          <span className="text-[11px] text-text-faint">· {recall.length}</span>
                        </div>
                        {recall.map((fact) => {
                          const conf = CONFIDENCE_META[fact.confidence]
                          const source = SOURCE_META[fact.source.type]
                          const SourceIcon = source.icon
                          return (
                            <div
                              key={fact.id}
                              className="flex items-start gap-[9px] border-t border-inset px-[13px] py-[10px] first:border-t-0"
                            >
                              <span
                                className={`mt-[4px] h-[8px] w-[8px] shrink-0 rounded-full ${conf.dot}`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[12.5px] leading-snug text-text">
                                  {pickL(fact.statement, lang)}
                                </div>
                                <div className="mt-[3px] flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
                                  <span className="inline-flex items-center gap-[5px] text-[11px] text-text-faint">
                                    <SourceIcon
                                      size={13}
                                      strokeWidth={1.7}
                                      className="opacity-80"
                                      aria-hidden="true"
                                    />
                                    {pick(source.kind, lang)} · {pick(fact.source.detail, lang)}
                                  </span>
                                  <span
                                    className={`rounded-[100px] border px-[8px] py-px text-[10px] font-bold ${conf.badge}`}
                                  >
                                    {pick(conf.label, lang)}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/app/settings/memory/people/${thread.personId}`)
                                }
                                className="shrink-0 cursor-pointer rounded-[7px] border border-border bg-surface px-[9px] py-[4px] font-sans text-[11.5px] font-semibold text-text-muted"
                              >
                                {x(M.memory_action_correct)}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="h-[4px]" />
          </div>
        </div>

        {/* Composer — continues the thread in the Advisor view */}
        <div className="shrink-0 border-t border-border bg-bg px-[16px] pt-[14px] pb-[16px] sm:px-[24px]">
          <div className="mx-auto max-w-[760px]">
            <ChatComposer
              variant="chat"
              placeholder={x(advisorViewMessages.advisorview_composer_msg)}
              onSend={continueInAdvisor}
            />
          </div>
          <Disclaimer className="mt-[8px] text-center" />
        </div>
      </div>

      {/* What-I-know rail */}
      {lgUp ? (
        <aside
          aria-label={x(M.memory_know_title)}
          className="w-[320px] shrink-0 overflow-y-auto border-l border-border bg-surface-2 p-[16px]"
        >
          {knowRail}
        </aside>
      ) : null}

      {!lgUp && knowRailOpen ? (
        <aside
          aria-label={x(M.memory_know_title)}
          className="fixed inset-0 z-80 overflow-y-auto bg-surface-2 p-[16px]"
        >
          <div className="mb-[12px] flex items-center justify-between">
            <h2 className="m-0 font-display text-[16px] font-semibold text-text">
              {x(M.memory_know_title)}
            </h2>
            <button
              type="button"
              onClick={() => setKnowRailOpen(false)}
              aria-label={x(SM.shell_close_menu)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-inset text-text-2"
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          {knowRail}
        </aside>
      ) : null}
    </div>
  )
}
