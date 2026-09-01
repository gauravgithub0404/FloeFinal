import React, { useState } from 'react';
import { IntermediateRepresentation, Workflow, WorkflowNode, ExecutionMode } from '../types/floe';
import { WorkflowGraph } from './WorkflowGraph';
import { 
  X, GitBranch, Shield, Sparkles, UserCheck, Play, ArrowRight, 
  CheckCircle2, Clock, Zap, AlertTriangle, Code, Layers, Eye
} from 'lucide-react';

interface WorkflowStateDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  ir: IntermediateRepresentation;
  onProceedToTestbed?: () => void;
}

export const WorkflowStateDiagramModal: React.FC<WorkflowStateDiagramModalProps> = ({
  isOpen,
  onClose,
  ir,
  onProceedToTestbed
}) => {
  const [activeTab, setActiveTab] = useState<'visual_graph' | 'state_matrix' | 'escalations'>('visual_graph');
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [simulatedStep, setSimulatedStep] = useState<number>(0);

  if (!isOpen) return null;

  const workflow: Workflow = ir.workflows[0] || {
    name: `${ir.name} Lifecycle Workflow`,
    trigger: 'On Request Submission',
    nodes: [],
    edges: []
  };

  const activeNode = selectedNode || workflow.nodes[Math.min(simulatedStep, workflow.nodes.length - 1)] || workflow.nodes[0];

  const handleNextSimulation = () => {
    if (workflow.nodes.length === 0) return;
    setSimulatedStep((prev) => (prev + 1) % workflow.nodes.length);
    setSelectedNode(workflow.nodes[(simulatedStep + 1) % workflow.nodes.length]);
  };

  const handleResetSimulation = () => {
    setSimulatedStep(0);
    setSelectedNode(workflow.nodes[0] || null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shadow-inner">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                  State Machine Specification
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {workflow.nodes.length} Nodes • {workflow.edges?.length || workflow.nodes.length - 1} Transitions
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {workflow.name || `${ir.name} Workflow State Diagram`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('visual_graph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'visual_graph'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Topology Graph</span>
            </button>

            <button
              onClick={() => setActiveTab('state_matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'state_matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Execution Trust Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('escalations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'escalations'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeout & SLA Escalations</span>
            </button>
          </div>

          {/* Flow Simulator Controls */}
          {activeTab === 'visual_graph' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Flow Simulator:</span>
              <button
                onClick={handleResetSimulation}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleNextSimulation}
                className="px-3 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Step Forward</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: VISUAL GRAPH */}
          {activeTab === 'visual_graph' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Workflow Graph */}
              <div className="lg:col-span-7 space-y-4">
                <WorkflowGraph
                  workflow={workflow}
                  activeNodeId={activeNode?.id}
                  onSelectNode={(node) => setSelectedNode(node)}
                />
              </div>

              {/* Right Column: Node Inspector & State Details */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Node Inspector</span>
                    </span>
                    {activeNode && (
                      <span className="font-mono text-xs text-slate-400">
                        ID: <strong className="text-white">{activeNode.id}</strong>
                      </span>
                    )}
                  </div>

                  {activeNode ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">State Label</span>
                        <p className="font-bold text-white text-sm">{activeNode.label || activeNode.action || activeNode.id}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Execution Mode:</span>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono capitalize font-bold ${
                            activeNode.execution_mode === 'deterministic'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : activeNode.execution_mode === 'ai'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : activeNode.execution_mode === 'human'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {activeNode.execution_mode}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Assigned Persona:</span>
                          <span className="font-bold text-indigo-300 capitalize text-[11px] block mt-0.5">
                            {activeNode.role || (activeNode.execution_mode === 'human' ? 'Manager / Admin' : 'System Engine')}
                          </span>
                        </div>
                      </div>

                      {activeNode.goal && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block">AI Intent / Goal</span>
                          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{activeNode.goal}</p>
                        </div>
                      )}

                      {activeNode.logic && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Deterministic Logic Expression</span>
                          <code className="text-emerald-300 font-mono text-[11px] block mt-0.5">{activeNode.logic}</code>
                        </div>
                      )}

                      {activeNode.timeout && (
                        <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>SLA Timeout Policy</span>
                          </div>
                          <p className="text-slate-300 text-[11px] mt-1">
                            Expires after <strong className="text-white font-mono">{activeNode.timeout}</strong> → Escalates to <strong className="text-indigo-300">{activeNode.on_timeout || 'Department Head'}</strong>
                          </p>
                        </div>
                      )}

                      {activeNode.mutations && activeNode.mutations.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-sky-400 block">State Mutations</span>
                          {activeNode.mutations.map((m, mIdx) => (
                            <div key={mIdx} className="font-mono text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800">
                              {m.target} {m.op || '='} {m.value || m.set}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Select any node on the left to inspect state rules.</p>
                  )}
                </div>

                {/* Workflow Summary info */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Shield className="w-4 h-4" />
                    <span>Audit & Compliance Guarantee</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    All state mutations generate immutable PostgreSQL audit logs with actor identity, timestamp, and state transition diffs.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EXECUTION TRUST MATRIX */}
          {activeTab === 'state_matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">4-Mode Workflow Execution Trust Matrix</h4>
                  <p className="text-xs text-slate-400">Strict runtime boundaries classify deterministic operations, AI single-inference, and human approvals.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Node ID</th>
                      <th className="py-3 px-4 font-semibold">State / Action</th>
                      <th className="py-3 px-4 font-semibold">Execution Mode</th>
                      <th className="py-3 px-4 font-semibold">Role / Actor</th>
                      <th className="py-3 px-4 font-semibold">Safety Boundary & Execution Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300 bg-slate-900/60">
                    {workflow.nodes.map((node) => (
                      <tr key={node.id} className="hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{node.id}</td>
                        <td className="py-3 px-4 font-semibold text-white">{node.label || node.action}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono capitalize font-bold ${
                            node.execution_mode === 'deterministic'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : node.execution_mode === 'ai'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : node.execution_mode === 'human'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {node.execution_mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 capitalize">{node.role || (node.execution_mode === 'human' ? 'Manager' : 'System Engine')}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {node.execution_mode === 'deterministic' && 'Deterministic AST/DDL execution. ₹0 token cost, instant execution.'}
                          {node.execution_mode === 'ai' && (node.goal || 'Read-only inference analysis with bounded token context.')}
                          {node.execution_mode === 'human' && `Human review gate. SLA: ${node.timeout || '48h'} (Escalates to ${node.on_timeout || 'Department Head'}).`}
                          {node.execution_mode === 'agentic' && 'Bounded autonomous agent iteration with maximum cycle guard.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ESCALATIONS */}
          {activeTab === 'escalations' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">SLA Timers & Automated Escalation Policies</h4>
                <p className="text-xs text-slate-400">Guarantees pending requests do not get stuck when reviewers are unavailable or exceed deadlines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflow.nodes.filter(n => n.execution_mode === 'human' || n.timeout).map((node, nIdx) => (
                  <div key={nIdx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{node.label || node.action}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        {node.timeout || '48h'} SLA
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Initial Reviewer:</span>
                        <span className="font-bold text-indigo-300 capitalize">{node.role || 'Direct Manager'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Escalation Target:</span>
                        <span className="font-bold text-amber-300 capitalize">{node.on_timeout || 'Department Head / HR'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Notification Channel:</span>
                        <span className="font-medium text-emerald-400">Email & In-App Notification</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close Inspector
          </button>

          {onProceedToTestbed && (
            <button
              onClick={() => {
                onClose();
                onProceedToTestbed();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            >
              <span>Review Blueprint & Launch Free Testbed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
