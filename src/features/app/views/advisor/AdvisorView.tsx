import { AdvisorHome } from './AdvisorHome'
import { ChatPane } from './ChatPane'
import { ComplianceWorkspace } from './ComplianceWorkspace'
import { ThreadList } from './ThreadList'
import { useAdvisorViewController } from './useAdvisorViewController'

/**
 * Advisor view — the full-page AI chat (prototype `isAdvisorView`):
 *
 * - left column: thread list grouped Pinned / Today / Previous 7 days / Older;
 * - no active thread → Advisor home empty state;
 * - active thread → transcript + compliance workspace.
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
    authStatus,
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

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ThreadList
        groups={groups}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onNewConversation={newConversation}
        onDelete={deleteConversation}
        canDelete={canDeleteThread}
        hideNewConversation={isPublicDemo}
      />
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
            mobileOpen={workspaceOpen}
            onCloseMobile={() => setWorkspaceOpen(false)}
          />
        </>
      ) : (
        <>
          <AdvisorHome
            onSend={homeSend}
            onScenario={(scenarioId) => startScenario(scenarioId)}
            onPriorityAction={runPriorityAction}
            onMetricClick={(view) => navigate(`/app/${view}`)}
          />
          <ComplianceWorkspace
            state={
              authStatus === 'signed-in' && !isPublicDemo ? { kind: 'idle' } : { kind: 'locked' }
            }
            onIdleSend={idleSend}
            onIdleNavigate={(to) => navigate(to)}
            showIdleStarters
            mobileOpen={false}
            onCloseMobile={() => {}}
          />
        </>
      )}
    </div>
  )
}
