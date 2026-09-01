import React, { useState, useEffect } from 'react';
import { FloeApp, IntermediateRepresentation, GenerationRun, AgentExecution, AuditLogEntry } from './types/floe';
import { FloeStudioUser, FLOE_STUDIO_PERSONAS } from './types/auth';
import { 
  LEAVE_MANAGEMENT_IR, 
  EXPENSE_MANAGEMENT_IR, 
  IT_SERVICE_DESK_IR, 
  IT_EQUIPMENT_IR, 
  CRM_SALES_PIPELINE_IR,
  FINANCE_INVOICE_APPROVAL_IR,
  PAYROLL_PROCESSING_IR,
  DOMAINS 
} from './data/domains';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RequirementsChat } from './components/RequirementsChat';
import { ReviewScreen } from './components/ReviewScreen';
import { GenerationProgress } from './components/GenerationProgress';
import { AppDetailView } from './components/AppDetailView';
import { StandaloneTestbed } from './components/StandaloneTestbed';
import { LiveAppSandbox } from './components/LiveAppSandbox';
import { FloePlatformLogin } from './components/auth/FloePlatformLogin';
import { AuditLogModal } from './components/AuditLogModal';
import { UiSuggestionsModal } from './components/UiSuggestionsModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { InfrastructureModal } from './components/InfrastructureModal';
import { GovernanceCenter } from './components/GovernanceCenter';
import { AiProviderSettingsModal } from './components/AiProviderSettingsModal';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { mintStudioSession, clearStudioSession, getStudioSessionToken } from './utils/studioSession';
import { AiProviderType, AiSystemConfig, DEFAULT_AI_CONFIG } from './types/aiProvider';

/**
 * Intelligent IR and Domain Resolver
 * Accurately matches any URL parameter, hostname, subdomain, or slug to the correct domain IR
 */
export function resolveIrForTarget(targetDomain?: string | null): IntermediateRepresentation {
  if (!targetDomain) return LEAVE_MANAGEMENT_IR;
  const raw = targetDomain.toLowerCase();
  const clean = raw.replace(/^floe-/, '').replace(/^app-/, '').replace(/^dom-/, '');
  const norm = clean.replace(/[^a-z0-9]/g, '');

  // 1. Direct Keyword match priority (guards against false partial substring matches)
  if (raw.includes('invoice') || raw.includes('finance') || raw.includes('payable') || raw.includes('vendor') || raw.includes('bill')) {
    return FINANCE_INVOICE_APPROVAL_IR;
  }
  if (raw.includes('crm') || raw.includes('sales') || raw.includes('pipeline') || raw.includes('opportunity') || raw.includes('lead') || raw.includes('deal')) {
    return CRM_SALES_PIPELINE_IR;
  }
  if (raw.includes('payroll') || raw.includes('salary') || raw.includes('wage') || raw.includes('disburse') || raw.includes('payrun')) {
    return PAYROLL_PROCESSING_IR;
  }
  if (raw.includes('equipment') || raw.includes('hardware') || raw.includes('laptop') || raw.includes('asset') || raw.includes('device')) {
    return IT_EQUIPMENT_IR;
  }
  if (raw.includes('expense') || raw.includes('reimburse') || raw.includes('receipt') || raw.includes('claim') || raw.includes('travel')) {
    return EXPENSE_MANAGEMENT_IR;
  }
  if (raw.includes('ticket') || raw.includes('itsm') || raw.includes('service') || raw.includes('helpdesk') || raw.includes('incident') || raw.includes('desk')) {
    return IT_SERVICE_DESK_IR;
  }
  if (raw.includes('leave') || raw.includes('pto') || raw.includes('vacation') || raw.includes('timeoff') || raw.includes('time-off') || raw.includes('absence') || raw.includes('holiday')) {
    return LEAVE_MANAGEMENT_IR;
  }

  // 2. Exact or partial match in DOMAINS catalog
  const matched = DOMAINS.find(d => {
    const normKey = d.key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normId = d.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normName = d.display_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normKey === norm || normId === norm || (norm.length >= 4 && (normKey.includes(norm) || norm.includes(normKey) || normName.includes(norm)));
  });
  if (matched?.default_ir) {
    return matched.default_ir;
  }

  return LEAVE_MANAGEMENT_IR;
}

export default function App() {
  // Helper to determine initial view and active IR based on URL params / subdomain / hostname
  const getInitialViewAndIr = (): { 
    view: 'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail' | 'standalone_testbed' | 'standalone_app' | 'login', 
    ir: IntermediateRepresentation 
  } => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const testbedParam = params.get('testbed') || params.get('app') || params.get('domain') || params.get('slug');
      const viewParam = params.get('view') || params.get('mode');
      const hostname = window.location.hostname.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const isRenderDeployment = hostname.includes('.onrender.com') || hostname.includes('render.app');

      if (viewParam === 'login' || pathname === '/login' || pathname.startsWith('/auth')) {
        return { view: 'login', ir: LEAVE_MANAGEMENT_IR };
      }

      let targetDomain = testbedParam;
      
      // Auto-detect domain if hostname or path is domain-specific (e.g. floe-finance-invoice-approval.onrender.com)
      if (!targetDomain) {
        const renderMatch = hostname.match(/^floe-([a-z0-9-]+)\.onrender\.com/i) || hostname.match(/^([a-z0-9-]+)\.onrender\.com/i);
        if (renderMatch && renderMatch[1] && !renderMatch[1].startsWith('dashboard') && !renderMatch[1].startsWith('floe-studio')) {
          targetDomain = renderMatch[1];
        } else if (hostname.includes('invoice') || hostname.includes('finance') || pathname.startsWith('/invoice') || pathname.startsWith('/finance') || pathname.includes('invoice')) {
          targetDomain = 'finance-invoice-approval';
        } else if (hostname.includes('crm') || hostname.includes('sales') || pathname.startsWith('/crm') || pathname.startsWith('/sales')) {
          targetDomain = 'crm-sales-pipeline';
        } else if (hostname.includes('payroll') || pathname.startsWith('/payroll') || pathname.startsWith('/salary')) {
          targetDomain = 'payroll-processing';
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

      // Check if user specifically requested testbed controls wrapper or standalone app
      const isExplicitTestbed = viewParam === 'testbed' || params.get('mode') === 'testbed' || window.location.hash.includes('testbed');
      const isStandaloneParam = viewParam === 'standalone' || viewParam === 'app' || params.get('standalone') === 'true';

      if (targetDomain || isRenderDeployment || isExplicitTestbed || window.location.hash.includes('testbed')) {
        const chosenIr = resolveIrForTarget(targetDomain);
        
        // If deployed on Render or requested standalone mode, render as clean standalone application
        if ((isRenderDeployment && !isExplicitTestbed) || isStandaloneParam) {
          return { view: 'standalone_app', ir: chosenIr };
        }
        
        return { view: 'standalone_testbed', ir: chosenIr };
      }
    }
    return { view: 'login', ir: LEAVE_MANAGEMENT_IR };
  };

  const initialSetup = getInitialViewAndIr();
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail' | 'standalone_testbed' | 'standalone_app' | 'login'>(initialSetup.view);
  
  // Usability mode: Friendly Mode (default) vs Developer Mode
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Floe Studio Active User Session State (starts unauthenticated / null until user logs in)
  const [currentUser, setCurrentUser] = useState<FloeStudioUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('floe_current_user') || sessionStorage.getItem('floe_current_user');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore parse error
      }
    }
    return null;
  });

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

      const hostname = window.location.hostname.toLowerCase();
      const isRenderHost = hostname.includes('.onrender.com') || hostname.includes('render.app');
      const params = new URLSearchParams(window.location.search);
      const isExplicitTestbed = params.get('view') === 'testbed' || params.get('mode') === 'testbed';

      // 1. Check server-side config if deployed on Render or backend environment
      try {
        const infoRes = await fetch('/api/app-info');
        if (infoRes.ok) {
          const info = await infoRes.json();
          const targetDomain = info.domain || '';
          if (targetDomain) {
            const resolved = resolveIrForTarget(targetDomain);
            if (resolved) {
              setCandidateIr(resolved);
              setTargetAppName(info.appName || resolved.name);
              if ((isRenderHost || info.isStandalone) && !isExplicitTestbed) {
                setCurrentView('standalone_app');
              } else {
                setCurrentView('standalone_testbed');
              }
              return;
            }

            // Check if there is a custom app in DB
            const appRes = await fetch(`/api/apps/${targetDomain}`);
            if (appRes.ok) {
              const appData = await appRes.json();
              if (appData.ir) {
                setCandidateIr(appData.ir);
                setTargetAppName(appData.name || info.appName);
                if ((isRenderHost || info.isStandalone) && !isExplicitTestbed) {
                  setCurrentView('standalone_app');
                } else {
                  setCurrentView('standalone_testbed');
                }
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
      setCandidateIr(setup.ir);
      setTargetAppName(setup.ir.name);
      setCurrentView(setup.view);
    };

    initApp();
  }, []);

  // If a user session was restored from localStorage (e.g. a fresh tab, or
  // browser restart) but no server-signed session token survived (tokens
  // live in sessionStorage, tied to the tab), silently mint a fresh one so
  // sensitive/administrative actions keep working without forcing a re-login.
  useEffect(() => {
    if (!currentUser) return;
    if (getStudioSessionToken()) return;
    mintStudioSession({
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      organization: currentUser.organization
    }).then(token => {
      if (!token) return;
      setCurrentUser(prev => (prev && prev.id === currentUser.id ? { ...prev, token } : prev));
    });
    // Only re-run if the logged-in user identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Generation runs & audit state - starts empty
  const [generationRuns, setGenerationRuns] = useState<GenerationRun[]>([]);
  const [agentExecutions, setAgentExecutions] = useState<AgentExecution[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Modal states
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isUiSuggestionsModalOpen, setIsUiSuggestionsModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isInfraModalOpen, setIsInfraModalOpen] = useState(false);
  const [isGovernanceCenterOpen, setIsGovernanceCenterOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isGitHubSyncOpen, setIsGitHubSyncOpen] = useState(false);

  // AI Provider & Model State (Ollama gpt-oss:120b-cloud, Gemini, OpenAI, Claude)
  const [activeAiProvider, setActiveAiProvider] = useState<AiProviderType>('ollama');
  const [activeAiModel, setActiveAiModel] = useState<string>('gpt-oss:120b-cloud');
  const [aiConfig, setAiConfig] = useState<AiSystemConfig>(DEFAULT_AI_CONFIG);

  // Fetch active AI Config from server on startup
  useEffect(() => {
    fetch('/api/admin/ai-config')
      .then(res => res.ok ? res.json() : null)
      .then((cfg: AiSystemConfig | null) => {
        if (cfg) {
          setAiConfig(cfg);
          if (cfg.activeProvider) setActiveAiProvider(cfg.activeProvider);
          if (cfg.activeModel) setActiveAiModel(cfg.activeModel);
        }
      })
      .catch(() => {});
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (user: FloeStudioUser) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('floe_current_user', JSON.stringify(user));
        sessionStorage.setItem('floe_current_user', JSON.stringify(user));
      } catch {
        // ignore storage error
      }
    }

    // Mint a server-signed session token for this persona. Sensitive/
    // administrative requests (governance decisions, real infrastructure
    // provisioning, production promotion) require this token; the studio
    // login screen itself does not verify a password against a stored hash
    // (a separate, tracked limitation), but everything downstream of login
    // now checks a token the server itself issued and can verify, rather
    // than trusting a self-attested actor in a JSON body.
    mintStudioSession({
      id: user.id,
      name: user.name,
      role: user.role,
      organization: user.organization
    }).then(token => {
      if (!token) return;
      setCurrentUser(prev => {
        if (!prev || prev.id !== user.id) return prev;
        const updated = { ...prev, token };
        try {
          localStorage.setItem('floe_current_user', JSON.stringify(updated));
          sessionStorage.setItem('floe_current_user', JSON.stringify(updated));
        } catch {
          // ignore storage error
        }
        return updated;
      });
    });

    // Record login audit event
    const loginAudit: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      account_id: user.organization || 'acc-floe-studio',
      app_id: 'studio-auth',
      actor_type: 'user',
      actor_id: user.id,
      resource_type: 'auth_session',
      resource_id: user.token || 'jwt_session',
      action: 'floe.user.logged_in',
      correlation_id: `corr-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toLocaleTimeString()
    };
    setAuditLogs(prev => [loginAudit, ...prev]);

    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearStudioSession();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('floe_current_user');
        sessionStorage.removeItem('floe_current_user');
      } catch {
        // ignore
      }
    }
    setCurrentView('login');
  };

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
      account_id: currentUser?.organization || 'acc-default-user',
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
      account_id: currentUser?.organization || 'acc-default-user',
      app_id: newApp.id,
      actor_type: 'user',
      actor_id: currentUser?.id || 'user-01',
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
      model: activeAiModel || 'gpt-oss:120b-cloud',
      input_tokens: 3100,
      output_tokens: 2200,
      estimated_cost: activeAiModel.includes('120b') ? 0.00088 : 0.00112,
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

  // If in standalone standalone_app mode (e.g. Render production deployment), render directly as clean standalone app
  if (currentView === 'standalone_app') {
    const activeIr = selectedApp?.ir || candidateIr || LEAVE_MANAGEMENT_IR;
    return (
      <LiveAppSandbox
        ir={activeIr}
        appName={targetAppName || selectedApp?.name || activeIr.name}
        standalone={true}
      />
    );
  }

  // If in standalone testbed mode, render the testbed wrapper view
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
          setCurrentView(currentUser ? 'dashboard' : 'login');
        }}
      />
    );
  }

  // If in login mode or unauthenticated, render the Floe Platform Login Page
  if (currentView === 'login' || !currentUser) {
    return (
      <FloePlatformLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStudio={currentUser ? () => setCurrentView('dashboard') : undefined}
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
        onOpenGovernanceCenter={() => setIsGovernanceCenterOpen(true)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        onOpenGitHubSync={() => setIsGitHubSyncOpen(true)}
        activeAiModel={activeAiModel}
        activeAiProvider={activeAiProvider}
        isDevMode={isDevMode}
        onToggleDevMode={() => setIsDevMode(!isDevMode)}
        appName={selectedApp?.name}
        currentUser={currentUser}
        onOpenLogin={() => setCurrentView('login')}
        onLogout={handleLogout}
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
              activeAiModel={activeAiModel}
              onOpenAiSettings={() => setIsAiSettingsOpen(true)}
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
              currentUser={currentUser}
              app={
                selectedApp ||
                apps[0] || {
                  id: `app-${candidateIr.domain || 'custom'}`,
                  account_id: currentUser?.organization || 'acc-default-user',
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

      <GovernanceCenter
        isOpen={isGovernanceCenterOpen}
        onClose={() => setIsGovernanceCenterOpen(false)}
        currentUser={currentUser}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
      />

      <AiProviderSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        currentUser={currentUser}
        onConfigUpdated={(cfg) => {
          setAiConfig(cfg);
          if (cfg.activeProvider) setActiveAiProvider(cfg.activeProvider);
          if (cfg.activeModel) setActiveAiModel(cfg.activeModel);
        }}
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

      <GitHubSyncModal
        isOpen={isGitHubSyncOpen}
        onClose={() => setIsGitHubSyncOpen(false)}
      />
    </div>
  );
}

