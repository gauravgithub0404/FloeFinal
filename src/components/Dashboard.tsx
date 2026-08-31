import React, { useState } from 'react';
import { FloeApp, GenerationRun, AgentExecution } from '../types/floe';
import { Plus, Play, ArrowRight, ShieldCheck, Database, Layers, CheckCircle2, Clock, Sparkles, HelpCircle, Palmtree, Receipt, Laptop, Headset, Check } from 'lucide-react';
import { NewAppPromptModal } from './NewAppPromptModal';

interface DashboardProps {
  apps: FloeApp[];
  generationRuns: GenerationRun[];
  agentExecutions: AgentExecution[];
  onSelectApp: (app: FloeApp) => void;
  onNewApp: (domainId?: string, appName?: string, appLogo?: string) => void;
  onOpenLiveDemo: (app: FloeApp) => void;
  onOpenHowItWorks: () => void;
  isDevMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  apps,
  generationRuns,
  agentExecutions,
  onSelectApp,
  onNewApp,
  onOpenLiveDemo,
  onOpenHowItWorks,
  isDevMode
}) => {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedPromptDomainId, setSelectedPromptDomainId] = useState<string>('dom-leave');

  const handleOpenPrompt = (domainId: string = 'dom-leave') => {
    setSelectedPromptDomainId(domainId);
    setIsPromptModalOpen(true);
  };

  const handlePromptSubmit = (appName: string, appLogo: string, domainId: string) => {
    setIsPromptModalOpen(false);
    onNewApp(domainId, appName, appLogo);
  };

  const totalCost = agentExecutions.reduce((acc, curr) => acc + curr.estimated_cost, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero / Friendly Value Statement Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-indigo-950 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Workplace App Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Build custom team apps in plain English.
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Create automated approval workflows, forms, and databases for your business. No coding or developer background required.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="dashboard-hero-new-app-btn"
              onClick={() => handleOpenPrompt('dom-leave')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create an Application</span>
            </button>

            <button
              id="dashboard-hero-how-it-works-btn"
              onClick={onOpenHowItWorks}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>See How it Works (3 Steps)</span>
            </button>

            {apps.length > 0 && (
              <button
                id="dashboard-hero-try-sample-btn"
                onClick={() => onOpenLiveDemo(apps[0])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-sm font-medium border border-emerald-700/60 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Launch {apps[0].name}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1-Click Popular Starters for Non-Technical Users */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Choose a Workplace Starter Template</h2>
          <span className="text-xs text-slate-500">Click any template to customize with AI in seconds</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Starter 1: Leave & PTO */}
          <div
            onClick={() => handleOpenPrompt('dom-leave')}
            className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Palmtree className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Time-Off & Leave Portal
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Vacation & sick leave requests, auto-deducted days, smart reason tagging, and manager sign-off.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Use this template</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Starter 2: Expense & Travel */}
          <div
            onClick={() => handleOpenPrompt('dom-expense')}
            className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Expense & Travel Approvals
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Receipt submissions, anti-duplicate policy checks, auto-approval thresholds, and finance payouts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Use this template</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Starter 3: IT Hardware Requisitions */}
          <div
            onClick={() => handleOpenPrompt('dom-equipment')}
            className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                IT Hardware & Gear Request
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Laptop and monitor requisitions, role compatibility check, budget limits, and IT fulfillment.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Use this template</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Starter 4: IT Service Desk & SLA */}
          <div
            onClick={() => handleOpenPrompt('dom-itsm')}
            className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Headset className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                IT Service Desk & SLA (ITSM)
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ticket creation, automatic category & priority dispatch, agent resolution, and manager SLA tracking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Use this template</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{isDevMode ? 'Configured Apps' : 'My Applications'}</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{apps.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">
            {apps.length === 0 ? '0 active applications' : `${apps.length} ready to use`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{isDevMode ? 'Deterministic Compiles' : 'Verified Workflows'}</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{generationRuns.length}</p>
          <span className="text-[11px] text-slate-500">
            {generationRuns.length === 0 ? 'Ready to create' : '100% rule validation'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{isDevMode ? 'Total LLM Telemetry' : 'AI Assistant Usage'}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">${totalCost.toFixed(4)}</p>
          <span className="text-[11px] text-slate-500">
            {agentExecutions.length === 0 ? 'Free tier active' : `${agentExecutions.length} AI runs`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{isDevMode ? 'Mean Synthesis Time' : 'App Build Speed'}</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {generationRuns.length === 0 ? '< 2.0s' : `${(generationRuns.reduce((a, b) => a + b.duration_ms, 0) / generationRuns.length / 1000).toFixed(1)}s`}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Instant app generation
          </span>
        </div>
      </div>

      {/* Applications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Applications</h2>
            <p className="text-xs text-slate-500">Test live, share with team members, or export code.</p>
          </div>
          <button
            id="dashboard-add-app-btn"
            onClick={() => handleOpenPrompt('dom-leave')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create App</span>
          </button>
        </div>

        {apps.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No applications built yet</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
              Pick a starter template above or click below to chat with our friendly AI assistant and build your custom tool in 2 minutes.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleOpenPrompt('dom-leave')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                <Palmtree className="w-4 h-4" />
                <span>Build Time-Off App</span>
              </button>
              <button
                onClick={() => handleOpenPrompt('dom-leave')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                <span>Start from Scratch</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {app.domain_key}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Live & Ready
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">{app.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {app.ir?.description || 'Custom workplace workflow application.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                    <div>
                      <span className="text-slate-400">Data Fields:</span>{' '}
                      <b className="text-slate-700">{app.ir?.entities.reduce((acc, e) => acc + e.fields.length, 0) || 8}</b>
                    </div>
                    <div>
                      <span className="text-slate-400">Workflow Steps:</span>{' '}
                      <b className="text-slate-700">{app.ir?.workflows[0]?.nodes.length || 4}</b>
                    </div>
                    <div>
                      <span className="text-slate-400">Roles:</span>{' '}
                      <b className="text-slate-700">{app.ir?.roles.length || 2}</b>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    id={`app-card-sandbox-btn-${app.id}`}
                    onClick={() => onOpenLiveDemo(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <Play className="w-3 h-3 text-emerald-600" />
                    <span>Open Live App</span>
                  </button>

                  <button
                    id={`app-card-details-btn-${app.id}`}
                    onClick={() => onSelectApp(app)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <span>{isDevMode ? 'Architecture & Code' : 'Settings & Blueprint'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive App Name & Logo Prompt Modal */}
      <NewAppPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        initialDomainId={selectedPromptDomainId}
        onSubmit={handlePromptSubmit}
      />

    </div>
  );
};
