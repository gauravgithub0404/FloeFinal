import React, { useState } from 'react';
import { AuthUser, PRESET_USERS, UserRole, RBAC_PERMISSIONS_REGISTRY } from '../../types/auth';
import { IntermediateRepresentation } from '../../types/floe';
import { 
  Shield, Lock, Key, Mail, User, Check, ArrowRight, Sparkles, 
  Database, ShieldCheck, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2,
  Building2, Laptop, Users
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
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [email, setEmail] = useState(PRESET_USERS.employee.email);
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick_roles' | 'credentials'>('quick_roles');

  const isItsm = ir.domain === 'it-service-desk' || 
    ir.name.toLowerCase().includes('service') || 
    ir.name.toLowerCase().includes('ticket') || 
    ir.name.toLowerCase().includes('itsm');

  const handleSelectRolePreset = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(PRESET_USERS[role].email);
    setPassword('••••••••••••');
    setLoginError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    setTimeout(() => {
      // Find matching preset or default to selected role
      let authenticatedUser = PRESET_USERS[selectedRole];
      if (email !== PRESET_USERS[selectedRole].email) {
        authenticatedUser = {
          ...PRESET_USERS[selectedRole],
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email
        };
      }
      setIsLoading(false);
      onLoginSuccess(authenticatedUser);
    }, 450);
  };

  const handleInstantRoleLogin = (role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(PRESET_USERS[role]);
    }, 250);
  };

  return (
    <div className="min-h-[620px] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Top Security & Domain Header */}
      <div className="w-full max-w-4xl mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>RBAC Identity & Access Management • PostgreSQL 15 Session Store</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {appName}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Sign in with your enterprise credentials or choose a pre-configured role persona to test permission scopes and workflow access.
        </p>
      </div>

      {/* Main Login Card with Dual Layout */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: 1-Click Role-Based Quick Personas (Recommended for Testing) */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1-Click Role Login Presets
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono font-bold">
              Instant Sandbox Access
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Click any persona below to authenticate with its exact RBAC permissions, departmental authority, and database constraints:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. Employee / Requester */}
            <div 
              onClick={() => handleSelectRolePreset('employee')}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 relative ${
                selectedRole === 'employee' 
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                    AR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Alex Rivera</h4>
                    <span className="text-[10px] text-slate-400 block">Software Engineer</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Employee
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Standard requester. Can create tickets/leave requests & view personal history.
              </p>
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Scope: read:own, create</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleInstantRoleLogin('employee'); }}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors"
                >
                  Log In →
                </button>
              </div>
            </div>

            {/* 2. Service Desk Agent / Operator */}
            <div 
              onClick={() => handleSelectRolePreset('agent')}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 relative ${
                selectedRole === 'agent' 
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                    SC
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sarah Chen</h4>
                    <span className="text-[10px] text-slate-400 block">Tier 2 Tech Specialist</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Support operator. Can triage assigned queue, update statuses, & add internal notes.
              </p>
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Scope: triage, status</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleInstantRoleLogin('agent'); }}
                  className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] transition-colors"
                >
                  Log In →
                </button>
              </div>
            </div>

            {/* 3. Department Manager / Approver */}
            <div 
              onClick={() => handleSelectRolePreset('manager')}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 relative ${
                selectedRole === 'manager' 
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                    MV
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Marcus Vance</h4>
                    <span className="text-[10px] text-slate-400 block">Engineering Director</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  Manager
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Department Approver. Authorize/Reject Human Decision Gates & manage team quotas.
              </p>
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Scope: approve, mutate</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleInstantRoleLogin('manager'); }}
                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition-colors"
                >
                  Log In →
                </button>
              </div>
            </div>

            {/* 4. Super Admin / CISO */}
            <div 
              onClick={() => handleSelectRolePreset('admin')}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 relative ${
                selectedRole === 'admin' 
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/30">
                    ER
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Elena Rostova</h4>
                    <span className="text-[10px] text-slate-400 block">Chief Security Officer</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                System Administrator. Full database DDL, audit trails, and RBAC matrix governance.
              </p>
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Scope: audit, rbac_all</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleInstantRoleLogin('admin'); }}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-colors"
                >
                  Log In →
                </button>
              </div>
            </div>

          </div>

          {/* RBAC Security Policy Information Footnote */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200 block">RBAC Enforcement Active:</span>
              <p className="text-slate-400 text-[11px]">
                Each role enforces explicit PostgreSQL row-level security and AST policy guards. Unauthorized routes return HTTP 403 Forbidden.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Email & Password Form / SSO */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-950 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Enterprise Authentication</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your corporate credentials or proceed with selected persona.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="user@acme.corp"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-medium">Password</label>
                  <span className="text-[10px] text-slate-500">bcrypt (cost 12)</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Remember Session (8h)</span>
                </label>
                <span className="text-indigo-400 hover:underline cursor-pointer">
                  Single Sign-On SSO
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials & RBAC Scope...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {PRESET_USERS[selectedRole].roleTitle}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500">Or continue with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* SSO / SAML 2.0 Simulation Button */}
            <button
              type="button"
              onClick={() => handleInstantRoleLogin('employee')}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Log in with Enterprise Okta / SAML 2.0</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              Secure Gateway • TLS 1.3 • Zero Trust Isolation
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
