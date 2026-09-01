import { AdvisorHome } from './AdvisorHome'
import { ChatPane } from './ChatPane'
import { ComplianceWorkspace } from './ComplianceWorkspace'
import { ThreadList, ThreadListMobileAccess } from './ThreadList'
import { useAdvisorViewController } from './useAdvisorViewController'

/**
 * Advisor view — the full-page AI chat (prototype `isAdvisorView`):
 *
 * - left column: thread list grouped Pinned / Today / Previous 7 days / Older;
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

  const threadListProps = {
    groups,
    activeChatId,
    onSelect: selectChat,
    onNewConversation: newConversation,
    onDelete: deleteConversation,
    canDelete: canDeleteThread,
    hideNewConversation: isPublicDemo,
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
        />
      )}
    </div>
  )
}
