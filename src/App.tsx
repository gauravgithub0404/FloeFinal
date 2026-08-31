import React, { useState, useEffect } from 'react';
import { FloeApp, IntermediateRepresentation, GenerationRun, AgentExecution, AuditLogEntry } from './types/floe';
import { LEAVE_MANAGEMENT_IR, EXPENSE_MANAGEMENT_IR, IT_SERVICE_DESK_IR, IT_EQUIPMENT_IR, DOMAINS } from './data/domains';
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
  // Helper to determine initial view and active IR based on URL params / subdomain / hostname
  const getInitialViewAndIr = (): { view: 'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail' | 'standalone_testbed', ir: IntermediateRepresentation } => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const testbedParam = params.get('testbed') || params.get('app') || params.get('domain');
      const hostname = window.location.hostname.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      let targetDomain = testbedParam;
      
      // Auto-detect domain if hostname or path is domain-specific (e.g. floe-it-equipment-request.onrender.com)
      if (!targetDomain) {
        const renderMatch = hostname.match(/^floe-([a-z0-9-]+)\.onrender\.com/i) || hostname.match(/^([a-z0-9-]+)\.onrender\.com/i);
        if (renderMatch && renderMatch[1] && !renderMatch[1].startsWith('dashboard') && !renderMatch[1].startsWith('floe-studio')) {
          targetDomain = renderMatch[1];
        } else if (hostname.includes('equipment') || hostname.includes('hardware') || pathname.startsWith('/it-equipment') || pathname.startsWith('/equipment')) {
          targetDomain = 'it-equipment-request';
        } else if (hostname.includes('expense') || pathname.startsWith('/expense')) {
          targetDomain = 'expense-reimbursement';
        } else if (hostname.includes('ticket') || hostname.includes('service') || pathname.startsWith('/it-service') || pathname.startsWith('/service')) {
          targetDomain = 'it-service-desk';
        } else if (hostname.includes('leave') || pathname.startsWith('/leave')) {
          targetDomain = 'leave-management';
        }
      }

      if (targetDomain || params.get('mode') === 'testbed' || window.location.hash.includes('testbed')) {
        let chosenIr = LEAVE_MANAGEMENT_IR;
        if (targetDomain) {
          const normTarget = targetDomain.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matched = DOMAINS.find(d => {
            const normKey = d.key.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normId = d.id.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normKey === normTarget || normId === normTarget || normKey.includes(normTarget) || normTarget.includes(normKey);
          });

          if (matched?.default_ir) {
            chosenIr = matched.default_ir;
          } else if (targetDomain.toLowerCase().includes('equipment') || targetDomain.toLowerCase().includes('hardware')) {
            chosenIr = IT_EQUIPMENT_IR;
          } else if (targetDomain.toLowerCase().includes('expense') || targetDomain.toLowerCase().includes('reimburse')) {
            chosenIr = EXPENSE_MANAGEMENT_IR;
          } else if (targetDomain.toLowerCase().includes('ticket') || targetDomain.toLowerCase().includes('service') || targetDomain.toLowerCase().includes('helpdesk')) {
            chosenIr = IT_SERVICE_DESK_IR;
          } else if (targetDomain.toLowerCase().includes('leave') || targetDomain.toLowerCase().includes('pto')) {
            chosenIr = LEAVE_MANAGEMENT_IR;
          }
        }
        return { view: 'standalone_testbed', ir: chosenIr };
      }
    }
    return { view: 'dashboard', ir: LEAVE_MANAGEMENT_IR };
  };

  const initialSetup = getInitialViewAndIr();
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail' | 'standalone_testbed'>(initialSetup.view);
  
  // Usability mode: Friendly Mode (default) vs Developer Mode
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Applications state - starts empty with no pre-seeded default data
  const [apps, setApps] = useState<FloeApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<FloeApp | null>(null);
  const [candidateIr, setCandidateIr] = useState<IntermediateRepresentation>(initialSetup.ir);
  const [targetDomainId, setTargetDomainId] = useState<string | undefined>(undefined);
  const [targetAppName, setTargetAppName] = useState<string | undefined>(undefined);
  const [targetAppLogo, setTargetAppLogo] = useState<string | undefined>(undefined);

  // Check URL parameters & Hostname changes dynamically & fetch server app config
  useEffect(() => {
    const initApp = async () => {
      if (typeof window === 'undefined') return;

      // 1. Check server-side config if deployed on Render or backend environment
      try {
        const infoRes = await fetch('/api/app-info');
        if (infoRes.ok) {
          const info = await infoRes.json();
          if (info.domain) {
            const domain = info.domain.toLowerCase();
            const normDomain = domain.replace(/[^a-z0-9]/g, '');
            const matched = DOMAINS.find(d => {
              const normKey = d.key.toLowerCase().replace(/[^a-z0-9]/g, '');
              const normId = d.id.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normKey === normDomain || normId === normDomain || normKey.includes(normDomain) || normDomain.includes(normKey);
            });

            if (matched?.default_ir) {
              setCandidateIr(matched.default_ir);
              setTargetAppName(info.appName || matched.display_name);
              setCurrentView('standalone_testbed');
              return;
            }

            // Check if there is a custom app in DB
            const appRes = await fetch(`/api/apps/${domain}`);
            if (appRes.ok) {
              const appData = await appRes.json();
              if (appData.ir) {
                setCandidateIr(appData.ir);
                setTargetAppName(appData.name || info.appName);
                setCurrentView('standalone_testbed');
                return;
              }
            }
          }
        }
      } catch {
        // Fall back to client detection
      }

      // 2. Client-side URL detection
      const setup = getInitialViewAndIr();
      if (setup.view === 'standalone_testbed') {
        setCandidateIr(setup.ir);
        setCurrentView('standalone_testbed');
      }
    };

    initApp();
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
  const handleStartNewApp = (domainId?: string, appName?: string, appLogo?: string) => {
    setTargetDomainId(domainId);
    setTargetAppName(appName);
    setTargetAppLogo(appLogo);
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
              initialAppName={targetAppName}
              initialLogo={targetAppLogo}
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
