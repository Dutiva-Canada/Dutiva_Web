import { AdvisorHome } from './AdvisorHome'
import { ChatPane } from './ChatPane'
import { ComplianceWorkspace } from './ComplianceWorkspace'
import { ThreadList, ThreadListMobileAccess, activeThreadTitle } from './ThreadList'
import { useAdvisorViewController } from './useAdvisorViewController'

/**
 * Advisor view — the full-page AI chat (prototype `isAdvisorView`):
 *
 * - left column: thread list grouped Pinned / Today / Previous 7 days / Older
 *   (on demand on desktop, sheet on mobile);
 * - no active thread → Advisor home empty state;
 * - active thread → transcript + compliance workspace (on demand).
 *
 * Behaviour lives in useAdvisorViewController; this file is layout only.
 */
export function AdvisorView() {
  const {
    groups,
    activeChatId,
    selectChat,
    newConversation,
    deleteConversation,
    canDeleteThread,
    isPublicDemo,
    hasActiveChat,
    engine,
    sendingReal,
    jurisdictionLine,
    jurisdictionTone,
    getExtras,
    sendInThread,
    handleFollowup,
    openDocStudio,
    onSuggestChip,
    changeQuickField,
    submitQuickForm,
    handleCopyMessage,
    handleExportMessage,
    pickProvince,
    workspaceOpen,
    setWorkspaceOpen,
    threadsOpen,
    setThreadsOpen,
    handleBuyAdvisorPack,
    buyingAdvisorPack,
    workspaceState,
    activeScenario,
    toggleWeb,
    idleSend,
    homeSend,
    navigate,
    startScenario,
    runPriorityAction,
  } = useAdvisorViewController()

  const currentThreadTitle = activeThreadTitle(groups, activeChatId)

  const threadListProps = {
    groups,
    activeChatId,
    onSelect: (chatId: string) => {
      selectChat(chatId)
      setThreadsOpen(false)
    },
    onNewConversation: newConversation,
    onDelete: deleteConversation,
    canDelete: canDeleteThread,
    hideNewConversation: isPublicDemo,
    open: threadsOpen,
    onClose: () => setThreadsOpen(false),
  } as const

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <ThreadListMobileAccess {...threadListProps} />
      <ThreadList {...threadListProps} />
      {hasActiveChat ? (
        <>
          <ChatPane
            messages={engine.messages}
            busy={engine.busy || sendingReal}
            jurisdiction={jurisdictionLine}
            jurisdictionTone={jurisdictionTone}
            getExtras={getExtras}
            onSend={sendInThread}
            onRetry={engine.retryTurn}
            onFollowup={handleFollowup}
            onGenerateDoc={openDocStudio}
            onSuggestChip={onSuggestChip}
            onQuickFormChange={changeQuickField}
            onQuickFormSubmit={submitQuickForm}
            onCopyMessage={handleCopyMessage}
            onExportMessage={handleExportMessage}
            onPickProvince={pickProvince}
            onOpenWorkspace={() => setWorkspaceOpen(true)}
            workspaceOpen={workspaceOpen}
            onOpenThreads={() => setThreadsOpen(true)}
            threadsOpen={threadsOpen}
            activeThreadTitle={currentThreadTitle}
            onBuyAdvisorPack={handleBuyAdvisorPack}
            buyingAdvisorPack={buyingAdvisorPack}
          />
          <ComplianceWorkspace
            state={workspaceState}
            onPickProvince={pickProvince}
            onToggleWeb={activeScenario?.webOff ? toggleWeb : undefined}
            onIdleSend={idleSend}
            onIdleNavigate={(to) => navigate(to)}
            showIdleStarters={engine.messages.length === 0}
            open={workspaceOpen}
            onClose={() => setWorkspaceOpen(false)}
          />
        </>
      ) : (
        <AdvisorHome
          onSend={homeSend}
          onScenario={(scenarioId) => startScenario(scenarioId)}
          onPriorityAction={runPriorityAction}
          onMetricClick={(view) => navigate(`/app/${view}`)}
          onOpenThreads={() => setThreadsOpen(true)}
          threadsOpen={threadsOpen}
        />
      )}
    </div>
  )
}
