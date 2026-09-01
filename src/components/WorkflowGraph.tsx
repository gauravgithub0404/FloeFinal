import React from 'react';
import { Workflow, WorkflowNode, ExecutionMode } from '../types/floe';
import { Play, Sparkles, UserCheck, CheckCircle2, GitBranch, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface WorkflowGraphProps {
  workflow: Workflow;
  activeNodeId?: string;
  onSelectNode?: (node: WorkflowNode) => void;
}

export const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  workflow,
  activeNodeId,
  onSelectNode
}) => {
  const getModeBadge = (mode: ExecutionMode) => {
    switch (mode) {
      case 'deterministic':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Deterministic (AST / DDL)'
        };
      case 'ai':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'AI Single-Inference'
        };
      case 'agentic':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          label: 'Agentic Loop'
        };
      case 'human':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
          label: 'Human Review (Timeout)'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          label: 'Standard'
        };
    }
  };

  const getNodeIcon = (node: WorkflowNode) => {
    if (node.type === 'condition') return <GitBranch className="w-4 h-4 text-emerald-600" />;
    if (node.execution_mode === 'ai') return <Sparkles className="w-4 h-4 text-amber-600" />;
    if (node.execution_mode === 'human') return <UserCheck className="w-4 h-4 text-sky-600" />;
    if (node.type === 'terminal') return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
    return <Play className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="w-full bg-slate-900/90 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Workflow Graph:</span>
            <code className="text-xs text-indigo-300 font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
              {workflow.name}
            </code>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Trigger: <span className="text-slate-300 font-medium">{workflow.trigger}</span>
          </p>
        </div>

        {/* Legend for 4 Execution Modes */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Deterministic
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> AI (Inference)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> Human (48h)
          </span>
        </div>
      </div>

      {/* Interactive Step-by-Step Flow Nodes */}
      <div className="space-y-3.5">
        {workflow.nodes.map((node, idx) => {
          const isActive = activeNodeId === node.id;
          const badge = getModeBadge(node.execution_mode);

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode && onSelectNode(node)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-900/20'
                  : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 mt-0.5">
                    {getNodeIcon(node)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        [{node.id}]
                      </span>
                      <span className="font-semibold text-slate-100 text-sm">
                        {node.label || node.action || node.id}
                      </span>
                    </div>

                    {node.goal && (
                      <p className="text-xs text-slate-300 mt-1">
                        <span className="text-amber-400 font-medium">AI Goal:</span> {node.goal}
                      </p>
                    )}

                    {node.expression && (
                      <div className="mt-1.5 text-xs font-mono text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40 inline-block">
                        AST: {node.expression.left.ref || node.expression.left.value} {node.expression.operator.toUpperCase()} {node.expression.right.ref || node.expression.right.value}
                      </div>
                    )}

                    {node.timeout && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-sky-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Timeout: <b>{node.timeout}</b></span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-sky-200">Escalate: <b>{node.on_timeout}</b></span>
                      </div>
                    )}

                    {node.mutations && node.mutations.length > 0 && (
                      <div className="mt-1.5 text-[11px] font-mono text-slate-400">
                        Mutations: {node.mutations.map(m => `${m.target} (${m.op || 'set'})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border ${badge.bg}`}>
                  {node.execution_mode}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edges Summary */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2 text-xs text-slate-400 font-mono">
        <span className="text-slate-500 font-sans">Transitions:</span>
        {workflow.edges.map((e, idx) => (
          <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {e.from} → {e.to} {e.label ? `(${e.label})` : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
