import React, { useState, useEffect } from 'react';
import { FloeApp, IntermediateRepresentation, GenerationRun, AgentExecution, AuditLogEntry } from './types/floe';
import { LEAVE_MANAGEMENT_IR, EXPENSE_MANAGEMENT_IR } from './data/domains';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RequirementsChat } from './components/RequirementsChat';
import { ReviewScreen } from './components/ReviewScreen';
import { GenerationProgress } from './components/GenerationProgress';
import { AppDetailView } from './components/AppDetailView';
import { StandaloneTestbed } from './components/StandaloneTestbed';
import { AuditLogModal } from './components/AuditLogModal';
import { UiSuggestionsModal } from './components/UiSuggestionsModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { InfrastructureModal } from './components/InfrastructureModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail' | 'standalone_testbed'>('dashboard');
  
  // Usability mode: Friendly Mode (default) vs Developer Mode
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Applications state - starts empty with no pre-seeded default data
  const [apps, setApps] = useState<FloeApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<FloeApp | null>(null);
  const [candidateIr, setCandidateIr] = useState<IntermediateRepresentation>(LEAVE_MANAGEMENT_IR);
  const [targetDomainId, setTargetDomainId] = useState<string | undefined>(undefined);

  // Check URL parameters for direct testbed link (?testbed=... or ?mode=testbed)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isTestbedParam = params.get('testbed') || params.get('mode') === 'testbed' || window.location.hash.includes('testbed');
      if (isTestbedParam) {
        setCurrentView('standalone_testbed');
      }
    }
  }, []);

  // Generation runs & audit state - starts empty
  const [generationRuns, setGenerationRuns] = useState<GenerationRun[]>([]);
  const [agentExecutions, setAgentExecutions] = useState<AgentExecution[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Modal states
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isUiSuggestionsModalOpen, setIsUiSuggestionsModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isInfraModalOpen, setIsInfraModalOpen] = useState(false);

  // Workflow Handlers
  const handleStartNewApp = (domainId?: string) => {
    setTargetDomainId(domainId);
    setCurrentView('chat');
  };

  const handleChatCompleteIR = (ir: IntermediateRepresentation) => {
    setCandidateIr(ir);
    setCurrentView('review');
  };

  const handleConfirmBuild = (ir: IntermediateRepresentation) => {
    setCandidateIr(ir);
    setCurrentView('generating');
  };

  const handleGenerationComplete = () => {
    const newApp: FloeApp = {
      id: `app-${Date.now().toString().slice(-4)}`,
      account_id: 'acc-default-user',
      domain_id: `dom-${candidateIr.domain}`,
      domain_key: candidateIr.domain,
      name: candidateIr.name,
      status: 'ready',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ir: candidateIr
    };

    setApps(prev => [newApp, ...prev]);
    setSelectedApp(newApp);

    // Record audit log
    const newAudit: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      account_id: 'acc-default-user',
      app_id: newApp.id,
      actor_type: 'user',
      actor_id: 'user-01',
      resource_type: 'app',
      resource_id: newApp.id,
      action: 'app.generation_succeeded',
      correlation_id: `corr-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toLocaleTimeString()
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Record telemetry
    const newExec: AgentExecution = {
      id: `exec-${Date.now().toString().slice(-4)}`,
      app_id: newApp.id,
      context: 'codegen',
      model: 'claude-3-5-sonnet',
      input_tokens: 3100,
      output_tokens: 2200,
      estimated_cost: 0.00112,
      latency_ms: 1850,
      success: true,
      created_at: new Date().toLocaleTimeString()
    };
    setAgentExecutions(prev => [newExec, ...prev]);

    setCurrentView('app_detail');
  };

  const handleSelectApp = (app: FloeApp) => {
    setSelectedApp(app);
    setCurrentView('app_detail');
  };

  const handleOpenLiveDemo = (app: FloeApp) => {
    setSelectedApp(app);
    setCurrentView('app_detail');
  };

  // If in standalone testbed mode, render the full standalone application view
  if (currentView === 'standalone_testbed') {
    const activeIr = selectedApp?.ir || candidateIr || LEAVE_MANAGEMENT_IR;
    return (
      <StandaloneTestbed
        ir={activeIr}
        appName={selectedApp?.name || activeIr.name}
        onBackToStudio={() => {
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', window.location.pathname);
          }
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        onOpenUiSuggestions={() => setIsUiSuggestionsModalOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenInfrastructure={() => setIsInfraModalOpen(true)}
        isDevMode={isDevMode}
        onToggleDevMode={() => setIsDevMode(!isDevMode)}
        appName={selectedApp?.name}
      />

      {/* Main Routed Content */}
      <main className="flex-1">
        <ErrorBoundary onReset={() => setCurrentView('dashboard')}>
          {currentView === 'dashboard' && (
            <Dashboard
              apps={apps}
              generationRuns={generationRuns}
              agentExecutions={agentExecutions}
              onSelectApp={handleSelectApp}
              onNewApp={handleStartNewApp}
              onOpenLiveDemo={handleOpenLiveDemo}
              onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
              isDevMode={isDevMode}
            />
          )}

          {currentView === 'chat' && (
            <RequirementsChat
              initialDomainId={targetDomainId}
              isDevMode={isDevMode}
              onCompleteIR={handleChatCompleteIR}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'review' && (
            <ReviewScreen
              ir={candidateIr}
              onConfirmBuild={handleConfirmBuild}
              onBackToChat={() => setCurrentView('chat')}
            />
          )}

          {currentView === 'generating' && (
            <GenerationProgress
              ir={candidateIr}
              onComplete={handleGenerationComplete}
            />
          )}

          {currentView === 'app_detail' && (
            <AppDetailView
              app={
                selectedApp ||
                apps[0] || {
                  id: `app-${candidateIr.domain || 'custom'}`,
                  account_id: 'acc-default-user',
                  domain_id: `dom-${candidateIr.domain || 'custom'}`,
                  domain_key: candidateIr.domain || 'custom',
                  name: candidateIr.name || 'Enterprise Application',
                  status: 'ready',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  ir: candidateIr
                }
              }
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Modals */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        agentExecutions={agentExecutions}
      />

      <UiSuggestionsModal
        isOpen={isUiSuggestionsModalOpen}
        onClose={() => setIsUiSuggestionsModalOpen(false)}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onStartNewApp={() => {
          setIsHowItWorksOpen(false);
          handleStartNewApp();
        }}
      />

      <InfrastructureModal
        isOpen={isInfraModalOpen}
        onClose={() => setIsInfraModalOpen(false)}
      />
    </div>
  );
}
