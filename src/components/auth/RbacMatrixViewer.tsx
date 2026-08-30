import React, { useState } from 'react';
import { AuthUser, PRESET_USERS, UserRole, RBAC_PERMISSIONS_REGISTRY, checkPermission } from '../../types/auth';
import { 
  Shield, Check, X, Users, Lock, Key, Sparkles, CheckCircle2, 
  AlertTriangle, RefreshCw, Eye, ShieldCheck, Terminal, UserCheck
} from 'lucide-react';

interface RbacMatrixViewerProps {
  currentUser: AuthUser;
  onSwitchRole?: (role: UserRole) => void;
}

export const RbacMatrixViewer: React.FC<RbacMatrixViewerProps> = ({
  currentUser,
  onSwitchRole
}) => {
  const [testRole, setTestRole] = useState<UserRole>(currentUser.role);
  const [testPermissionId, setTestPermissionId] = useState<string>('wf:approve_reject');
  const [simulationResult, setSimulationResult] = useState<{
    allowed: boolean;
    reason: string;
  }>({
    allowed: checkPermission(currentUser.role, 'wf:approve_reject'),
    reason: checkPermission(currentUser.role, 'wf:approve_reject')
      ? `Role '${currentUser.role}' is granted 'wf:approve_reject' in the active security policy.`
      : `Access Denied (403): Role '${currentUser.role}' lacks 'wf:approve_reject' authority.`
  });

  const rolesList: UserRole[] = ['employee', 'agent', 'manager', 'admin'];

  const handleRunSimulator = (role: UserRole, permId: string) => {
    setTestRole(role);
    setTestPermissionId(permId);
    const isAllowed = checkPermission(role, permId);
    const perm = RBAC_PERMISSIONS_REGISTRY.find(p => p.id === permId);
    setSimulationResult({
      allowed: isAllowed,
      reason: isAllowed
        ? `Role '${role}' is explicitly granted '${perm?.name}' (${permId}) under the application RBAC policy.`
        : `HTTP 403 Forbidden: Role '${role}' is restricted from performing '${perm?.name}' (${permId}). Minimum required role: ${perm?.allowedRoles.join(' or ')}.`
    });
  };

  return (
    <div className="space-y-6 text-slate-100 text-xs">
      
      {/* Top Banner */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Role-Based Access Control (RBAC) Governance</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Enforced by PostgreSQL & AST Engine
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Current authenticated session: <b className="text-white">{currentUser.name}</b> (<span className="text-indigo-400 font-mono font-bold uppercase">{currentUser.role}</span>) • {currentUser.email}
            </p>
          </div>
        </div>

        {onSwitchRole && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Quick Impersonate:</span>
            <select
              value={currentUser.role}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="employee">👨‍💻 Employee (Alex Rivera)</option>
              <option value="agent">🎧 Agent (Sarah Chen)</option>
              <option value="manager">👔 Manager (Marcus Vance)</option>
              <option value="admin">🛡️ Admin (Elena Rostova)</option>
            </select>
          </div>
        )}
      </div>

      {/* RBAC Matrix Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Active Permissions Matrix</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            {RBAC_PERMISSIONS_REGISTRY.length} Permission Scopes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 text-[11px]">
                <th className="p-3 font-semibold w-1/4">Permission Scope</th>
                <th className="p-3 font-semibold w-1/3">Description</th>
                <th className="p-3 font-semibold text-center">Employee</th>
                <th className="p-3 font-semibold text-center">Support Agent</th>
                <th className="p-3 font-semibold text-center">Manager</th>
                <th className="p-3 font-semibold text-center">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {RBAC_PERMISSIONS_REGISTRY.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-white block">{perm.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{perm.id}</span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {perm.description}
                  </td>
                  {rolesList.map((role) => {
                    const hasAccess = perm.allowedRoles.includes(role);
                    const isCurrentActive = currentUser.role === role;
                    return (
                      <td key={role} className={`p-3 text-center ${isCurrentActive ? 'bg-indigo-950/20' : ''}`}>
                        {hasAccess ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mx-auto">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-slate-600 border border-slate-800 mx-auto">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live RBAC Permission Evaluator / Policy Simulator */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Interactive Policy Guard Simulator</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">AST Gate Evaluator</span>
        </div>

        <p className="text-xs text-slate-400">
          Simulate how the runtime security middleware responds when a user role attempts to invoke a protected mutation or data query:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Select Role to Test</label>
            <select
              value={testRole}
              onChange={(e) => handleRunSimulator(e.target.value as UserRole, testPermissionId)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="employee">Employee (Alex Rivera)</option>
              <option value="agent">Support Agent (Sarah Chen)</option>
              <option value="manager">Manager / Approver (Marcus Vance)</option>
              <option value="admin">Super Admin (Elena Rostova)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-400 mb-1 font-medium">Select Protected Action / Permission</label>
            <select
              value={testPermissionId}
              onChange={(e) => handleRunSimulator(testRole, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {RBAC_PERMISSIONS_REGISTRY.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.id}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Evaluation Output */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          simulationResult.allowed 
            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/50 border-rose-800 text-rose-200'
        }`}>
          {simulationResult.allowed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">
                {simulationResult.allowed ? 'Status: 200 OK (AUTHORIZED)' : 'Status: 403 Forbidden (ACCESS DENIED)'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed font-mono">
              {simulationResult.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Active User Directory */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Provisioned User Directory & Active Tokens</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(PRESET_USERS).map((user) => {
            const isSelf = currentUser.id === user.id;
            return (
              <div 
                key={user.id} 
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  isSelf 
                    ? 'bg-indigo-950/40 border-indigo-600 ring-1 ring-indigo-500' 
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{user.name}</span>
                  {isSelf && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">{user.roleTitle}</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">{user.email}</span>
                <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-indigo-400 font-bold uppercase">{user.role}</span>
                  <span className="text-emerald-400">● Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
