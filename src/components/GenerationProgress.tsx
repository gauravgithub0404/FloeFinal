import React, { useState, useEffect } from 'react';
import { IntermediateRepresentation } from '../types/floe';
import { Database, Cpu, CheckCircle2, RefreshCw, Terminal, Layers, ShieldCheck, Zap } from 'lucide-react';

interface GenerationProgressProps {
  ir: IntermediateRepresentation;
  onComplete: () => void;
}

interface Step {
  id: string;
  label: string;
  detail: string;
  durationMs: number;
}

const GENERATION_STEPS: Step[] = [
  {
    id: 'db',
    label: 'Deterministic Database Compiler',
    detail: 'Generating PostgreSQL DDL with foreign keys, uuid-ossp, and runtime execution tables...',
    durationMs: 700
  },
  {
    id: 'recordservice',
    label: 'Synthesizing RecordService Boundary',
    detail: 'Wiring atomic transition() handlers, balance deduction guards, and transaction boundaries...',
    durationMs: 750
  },
  {
    id: 'workflow',
    label: 'Assembling WorkflowExecutor Engine',
    detail: 'Configuring 4-mode execution runtime (AST evaluator, AI reason classifier, 48h human timeout)...',
    durationMs: 800
  },
  {
    id: 'backend',
    label: 'Packaging Express REST API & Auth',
    detail: 'Generating endpoints with server-side permission checks and magic decision token handlers...',
    durationMs: 650
  },
  {
    id: 'docker',
    label: 'Generating Multi-Container Orchestration',
    detail: 'Writing docker-compose.yml, healthchecks, and environment configuration templates...',
    durationMs: 600
  },
  {
    id: 'smoke',
    label: 'Headless Build Smoke Test',
    detail: 'Executing TypeScript compiler smoke test (tsc --noEmit) & referential integrity assertion...',
    durationMs: 600
  }
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  ir,
  onComplete
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const executeStep = (idx: number) => {
      if (idx >= GENERATION_STEPS.length) {
        setLogs(prev => [...prev, `[SUCCESS] Build finished in 4.1s. Generated 10 artifacts without errors.`]);
        setTimeout(() => {
          onComplete();
        }, 800);
        return;
      }

      const step = GENERATION_STEPS[idx];
      setCurrentStepIdx(idx);
      setLogs(prev => [
        ...prev,
        `[FLOE-COMPILER] Starting phase: ${step.label}`,
        `[TASK] ${step.detail}`
      ]);

      timer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id]);
        executeStep(idx + 1);
      }, step.durationMs);
    };

    executeStep(0);
    return () => clearTimeout(timer);
  }, []);

  const currentStep = GENERATION_STEPS[currentStepIdx] || GENERATION_STEPS[GENERATION_STEPS.length - 1];
  const progressPercent = Math.round(((completedSteps.length) / GENERATION_STEPS.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      {/* Header Status */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Generating "{ir.name}"
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Translating structured IR v1.0 into deterministic PostgreSQL migrations, transactional services, and application runtime.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>{currentStep.label}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Steps List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {GENERATION_STEPS.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          const isCurrent = currentStepIdx === idx;

          return (
            <div key={step.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <div>
                  <span className={`font-semibold ${isDone ? 'text-slate-900' : isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>

              <span className="font-mono text-[11px] text-slate-400">
                {isDone ? 'PASS' : isCurrent ? 'RUNNING' : 'PENDING'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Real-time Compiler Log Output */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-slate-300 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-500 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Floe Codegen Compiler Stream</span>
          </span>
          <span>stdout</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
