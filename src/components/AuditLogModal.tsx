import React, { useState } from 'react';
import { AuditLogEntry, AgentExecution } from '../types/floe';
import { X, ShieldCheck, Sparkles, Database, Layers, CheckCircle2, Clock } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  agentExecutions: AgentExecution[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  agentExecutions
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'telemetry'>('audit');

  if (!isOpen) return null;

  const totalCost = agentExecutions.reduce((acc, curr) => acc + curr.estimated_cost, 0);
  const totalTokens = agentExecutions.reduce((acc, curr) => acc + curr.input_tokens + curr.output_tokens, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Governance, Audit Logs & Telemetry</h2>
              <p className="text-xs text-slate-500">Immutable platform audit trail and LLM token cost telemetry.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Platform Audit Log ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            LLM Token & Cost Telemetry ({agentExecutions.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'audit' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-sans">
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Actor</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Resource</th>
                    <th className="py-2.5 px-3 font-semibold">Correlation ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        No audit events recorded yet. Platform actions and state transitions will appear here.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{log.created_at}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            log.actor_type === 'user' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.actor_type}:{log.actor_id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.action}</td>
                        <td className="py-2.5 px-3 text-slate-600">{log.resource_type}:{log.resource_id}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[10px]">{log.correlation_id}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Total Token Spend</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Total Compute Cost</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">${totalCost.toFixed(5)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Avg Latency</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {agentExecutions.length === 0 ? '0ms' : `${Math.round(agentExecutions.reduce((a, b) => a + b.latency_ms, 0) / agentExecutions.length)}ms`}
                  </p>
                </div>
              </div>

              {/* Executions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-sans">
                      <th className="py-2.5 px-3 font-semibold">Context</th>
                      <th className="py-2.5 px-3 font-semibold">Model</th>
                      <th className="py-2.5 px-3 font-semibold">Input / Output Tokens</th>
                      <th className="py-2.5 px-3 font-semibold">Latency</th>
                      <th className="py-2.5 px-3 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {agentExecutions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                          No agent telemetry recorded yet. Code generation and compile traces will appear here.
                        </td>
                      </tr>
                    ) : (
                      agentExecutions.map((exec) => (
                        <tr key={exec.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-indigo-700">{exec.context}</td>
                          <td className="py-2.5 px-3 text-slate-600">{exec.model}</td>
                          <td className="py-2.5 px-3 text-slate-500">{exec.input_tokens} / {exec.output_tokens}</td>
                          <td className="py-2.5 px-3">{exec.latency_ms}ms</td>
                          <td className="py-2.5 px-3 text-emerald-600 font-bold">${exec.estimated_cost.toFixed(5)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
