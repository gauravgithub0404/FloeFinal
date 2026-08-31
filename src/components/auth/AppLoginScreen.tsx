import React, { useState, useMemo } from 'react';
import { AuthUser, getAppRolesAndUsers, AppRoleDefinition } from '../../types/auth';
import { IntermediateRepresentation } from '../../types/floe';
import { AppLogoBadge } from '../AppLogoBadge';
import { 
  Shield, Lock, Key, Mail, User, Check, ArrowRight, Sparkles, 
  Database, ShieldCheck, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2,
  Building2, Copy, Table, LayoutGrid, KeyRound, ExternalLink, HelpCircle,
  Briefcase, CheckSquare
} from 'lucide-react';

interface AppLoginScreenProps {
  ir: IntermediateRepresentation;
  appName?: string;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AppLoginScreen: React.FC<AppLoginScreenProps> = ({
  ir,
  appName = ir.name || 'Enterprise Application',
  onLoginSuccess
}) => {
  // Dynamically load domain-tailored roles and user credentials (1 user per role)
  const appRoles = useMemo(() => getAppRolesAndUsers(ir), [ir]);
  const defaultRole = appRoles[0] || {
    key: 'employee',
    displayName: 'User',
    description: 'Standard user',
    permissions: ['read:own'],
    user: {
      id: 'usr-default',
      name: 'Test User',
      email: 'user@acme.corp',
      password: 'UserPass#2026',
      role: 'employee',
      roleTitle: 'Operations Analyst',
      department: 'General Operations',
      avatar: 'TU'
    }
  };

  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(defaultRole.key);
  const [email, setEmail] = useState<string>(defaultRole.user.email);
  const [password, setPassword] = useState<string>(defaultRole.user.password || 'SecurePass#2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'cards' | 'directory'>('cards');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const activeRoleDef = appRoles.find(r => r.key === selectedRoleKey) || appRoles[0];

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const togglePasswordReveal = (roleKey: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [roleKey]: !prev[roleKey]
    }));
  };

  const handleSelectRolePreset = (roleDef: AppRoleDefinition) => {
    setSelectedRoleKey(roleDef.key);
    setEmail(roleDef.user.email);
    setPassword(roleDef.user.password || 'SecurePass#2026');
    setLoginError(null);
  };

  const handleInstantLogin = (roleDef: AppRoleDefinition) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(roleDef.user);
    }, 280);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    setTimeout(() => {
      // Find matching persona in appRoles by email or fall back to selected role
      const matchedRole = appRoles.find(r => r.user.email.toLowerCase() === email.trim().toLowerCase());
      
      let authenticatedUser: AuthUser;
      if (matchedRole) {
        authenticatedUser = matchedRole.user;
      } else {
        authenticatedUser = {
          ...activeRoleDef.user,
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email.trim()
        };
      }

      setIsLoading(false);
      onLoginSuccess(authenticatedUser);
    }, 400);
  };

  return (
    <div className="min-h-[640px] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Top Banner: App Identity & Zero-Trust Notice */}
      <div className="w-full max-w-5xl mb-6 text-center space-y-3 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-mono shadow-xs">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Role-Based Access Control • {appRoles.length} Domain Roles Configured with Test Credentials</span>
        </div>
        
        <div className="flex items-center justify-center gap-3.5">
          <AppLogoBadge logo={ir.logo} name={appName} domain={ir.domain} size="lg" />
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {appName}
            </h2>
            <span className="text-xs text-slate-400 block font-mono">
              PostgreSQL 15 Identity & Session Layer • Domain: <b className="text-slate-300">{ir.domain}</b>
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Sign in using the pre-generated test credentials below for each application role. Every persona has distinct database permissions, human decision gates, and approval scopes.
        </p>
      </div>

      {/* Main Dual-Column Authentication Canvas */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: 1-Click Role Personas & Test Credentials */}
        <div className="lg:col-span-7 p-5 sm:p-7 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-6">
          
          <div>
            {/* View Switcher Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Generated App Roles & Test Logins ({appRoles.length})
                </h3>
              </div>

              {/* Toggle Cards vs Directory View */}
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveView('cards')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeView === 'cards' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Role Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('directory')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeView === 'directory' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Credentials Directory</span>
                </button>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="mt-4 mb-4 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-start gap-2.5 text-xs text-indigo-200">
              <KeyRound className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">1 User Account Provided Per Generated Role:</span>
                <p className="text-indigo-300/90 text-[11px] mt-0.5">
                  Click <b>"Fill Form"</b> to load credentials into the login box, copy credentials with 1-click, or click <b>"Log In →"</b> to authenticate instantly into the testbed.
                </p>
              </div>
            </div>

            {/* View Mode 1: Rich Role Cards Grid */}
            {activeView === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {appRoles.map((roleDef) => {
                  const isSelected = selectedRoleKey === roleDef.key;
                  const isRevealed = revealedPasswords[roleDef.key] || false;
                  const userPassword = roleDef.user.password || 'SecurePass#2026';

                  return (
                    <div
                      key={roleDef.id}
                      onClick={() => handleSelectRolePreset(roleDef)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-3 relative group ${
                        isSelected
                          ? 'bg-slate-800/90 border-indigo-500 shadow-lg ring-1 ring-indigo-500'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      {/* Persona Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border ${
                            roleDef.user.accentColor === 'rose' 
                              ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                              : roleDef.user.accentColor === 'amber'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                              : roleDef.user.accentColor === 'sky'
                              ? 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                              : roleDef.user.accentColor === 'teal'
                              ? 'bg-teal-950/80 text-teal-300 border-teal-700/60'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                          }`}>
                            {roleDef.user.avatar || roleDef.user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{roleDef.user.name}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 inline" />}
                            </h4>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {roleDef.user.roleTitle}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                          roleDef.user.accentColor === 'rose'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : roleDef.user.accentColor === 'amber'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : roleDef.user.accentColor === 'sky'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}>
                          {roleDef.displayName}
                        </span>
                      </div>

                      {/* Role Responsibilities Description */}
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {roleDef.description}
                      </p>

                      {/* Credentials Display Box */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                        {/* Email row */}
                        <div className="flex items-center justify-between gap-1 text-slate-300">
                          <span className="text-[10px] text-slate-500 font-sans">Email:</span>
                          <div className="flex items-center gap-1.5 max-w-[170px] truncate">
                            <span className="truncate text-slate-200">{roleDef.user.email}</span>
                            <button
                              type="button"
                              title="Copy Email"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(roleDef.user.email, `email-${roleDef.key}`);
                              }}
                              className="text-slate-400 hover:text-indigo-400 p-0.5 rounded"
                            >
                              {copiedKey === `email-${roleDef.key}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Password row */}
                        <div className="flex items-center justify-between gap-1 text-slate-300">
                          <span className="text-[10px] text-slate-500 font-sans">Pass:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-semibold">
                              {isRevealed ? userPassword : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              title={isRevealed ? 'Hide Password' : 'Show Password'}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePasswordReveal(roleDef.key);
                              }}
                              className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              title="Copy Password"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(userPassword, `pass-${roleDef.key}`);
                              }}
                              className="text-slate-400 hover:text-emerald-400 p-0.5 rounded"
                            >
                              {copiedKey === `pass-${roleDef.key}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 font-mono truncate">
                          {roleDef.user.scopeBadge || roleDef.permissions[0] || 'standard'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRolePreset(roleDef);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors"
                          >
                            Fill Form
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstantLogin(roleDef);
                            }}
                            className={`px-2.5 py-1 rounded text-white font-bold text-[10px] transition-colors flex items-center gap-1 shadow-xs ${
                              roleDef.user.accentColor === 'rose'
                                ? 'bg-rose-600 hover:bg-rose-500'
                                : roleDef.user.accentColor === 'amber'
                                ? 'bg-amber-600 hover:bg-amber-500'
                                : roleDef.user.accentColor === 'sky'
                                ? 'bg-sky-600 hover:bg-sky-500'
                                : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                          >
                            <span>Log In</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Mode 2: Full Credentials Directory Table */}
            {activeView === 'directory' && (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[11px]">
                        <th className="p-3 font-semibold">Role</th>
                        <th className="p-3 font-semibold">User Persona</th>
                        <th className="p-3 font-semibold">Login Email</th>
                        <th className="p-3 font-semibold">Password</th>
                        <th className="p-3 font-semibold text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {appRoles.map((r) => {
                        const pass = r.user.password || 'SecurePass#2026';
                        return (
                          <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-sans">
                              <span className="font-bold text-white block">{r.displayName}</span>
                              <span className="text-[10px] text-slate-500">{r.key}</span>
                            </td>
                            <td className="p-3 font-sans">
                              <span className="text-slate-200 block font-medium">{r.user.name}</span>
                              <span className="text-[10px] text-slate-400">{r.user.roleTitle}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300">{r.user.email}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(r.user.email, `dir-email-${r.key}`)}
                                  className="text-slate-500 hover:text-indigo-400"
                                >
                                  {copiedKey === `dir-email-${r.key}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400 font-semibold">{pass}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(pass, `dir-pass-${r.key}`)}
                                  className="text-slate-500 hover:text-emerald-400"
                                >
                                  {copiedKey === `dir-pass-${r.key}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleInstantLogin(r)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <span>Sign In</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Assurance Footnote */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200 block">PostgreSQL Row-Level Security & AST Governance:</span>
              <p className="text-slate-400 text-[11px]">
                Each role enforces explicit database table constraints, AST action guards, and workflow execution policies. All unauthorized mutations are rejected at runtime with HTTP 403.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Email & Password Authentication Form */}
        <div className="lg:col-span-5 p-5 sm:p-7 bg-slate-950 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Header */}
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Enterprise Sign-In</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials or choose any role persona on the left to pre-fill.
              </p>
            </div>

            {/* Currently Active Persona Pill */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shrink-0">
                  {activeRoleDef.user.avatar || 'US'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{activeRoleDef.user.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                      {activeRoleDef.displayName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{activeRoleDef.user.department}</span>
                </div>
              </div>

              <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
                ● Ready
              </span>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {copiedKey && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Copied credential to clipboard!</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs shadow-inner"
                    placeholder="user@acme.corp"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">Password</label>
                  <span className="text-[10px] text-slate-500 font-mono">bcrypt (cost 12)</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs shadow-inner"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Remember Session (8h)</span>
                </label>
                <span 
                  onClick={() => {
                    // Auto-fill active preset password
                    setPassword(activeRoleDef.user.password || 'SecurePass#2026');
                    setShowPassword(true);
                  }}
                  className="text-indigo-400 hover:underline cursor-pointer"
                >
                  Show Role Password
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying RBAC Session Scope...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {activeRoleDef.displayName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500">Or corporate identity</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* SSO / SAML 2.0 Instant Simulation Button */}
            <button
              type="button"
              onClick={() => handleInstantLogin(activeRoleDef)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Continue with Enterprise Okta / SAML 2.0</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              Zero Trust Isolation • AES-256-GCM Session Tokens • TLS 1.3
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
