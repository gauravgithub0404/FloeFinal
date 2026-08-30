import React from 'react';
import { Layers, Sparkles, ShieldCheck, PlusCircle, HelpCircle, User, Code2 } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail';
  onNavigate: (view: 'dashboard' | 'chat' | 'review' | 'generating' | 'app_detail') => void;
  onOpenAuditLogs: () => void;
  onOpenUiSuggestions: () => void;
  onOpenHowItWorks: () => void;
  isDevMode: boolean;
  onToggleDevMode: () => void;
  appName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuditLogs,
  onOpenUiSuggestions,
  onOpenHowItWorks,
  isDevMode,
  onToggleDevMode,
  appName
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            id="nav-logo-btn"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Floe
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  No-Code AI
                </span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">Workplace App Builder</p>
            </div>
          </button>

          {appName && currentView !== 'dashboard' && (
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 pl-3 border-l border-slate-200">
              <span className="text-slate-700 font-medium truncate max-w-[220px] bg-slate-100 px-2 py-0.5 rounded text-xs">
                {appName}
              </span>
            </div>
          )}
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* User Mode Toggle: Simple / Friendly (Default) vs Developer Mode */}
          <button
            id="nav-devmode-toggle-btn"
            onClick={onToggleDevMode}
            title={isDevMode ? "Switch to Simple Friendly Mode" : "Switch to Technical Developer Mode"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isDevMode
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {isDevMode ? (
              <>
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Developer Mode</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Friendly Mode</span>
                <span className="sm:hidden">Simple</span>
              </>
            )}
          </button>

          {/* How It Works Guide Button */}
          <button
            id="nav-how-it-works-btn"
            onClick={onOpenHowItWorks}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">How it Works</span>
          </button>

          {/* UI Suggestions Advisor Button */}
          <button
            id="nav-ui-suggestions-btn"
            onClick={onOpenUiSuggestions}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Design Tips</span>
          </button>

          {/* Audit Logs Button (if dev mode or clicked) */}
          <button
            id="nav-audit-logs-btn"
            onClick={onOpenAuditLogs}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">Activity Logs</span>
          </button>

          {currentView !== 'chat' && (
            <button
              id="nav-new-app-btn"
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
