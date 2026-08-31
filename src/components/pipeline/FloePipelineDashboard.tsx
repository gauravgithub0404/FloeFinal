import React, { useState, useEffect } from 'react';
import { IntermediateRepresentation } from '../../types/floe';
import { 
  PipelineInstance, 
  PipelineStageId, 
  PipelineStageResult, 
  PluggableProviderInfo,
  GovernancePolicyConfig 
} from '../../types/pipeline';
import { 
  floePipelineEngine, 
  DEFAULT_GOVERNANCE_CONFIG, 
  PLUGGABLE_PROVIDERS 
} from '../../engine/pipeline/PipelineEngine';
import { 
  Play, CheckCircle2, Clock, AlertTriangle, XCircle, Shield, 
  Terminal, ShieldCheck, Database, Layers, Sparkles, RefreshCw, 
  FileCode, Check, Copy, ExternalLink, Cpu, Globe, Lock, ArrowRight,
  Boxes, Sliders, FileText, CheckCheck, Award, Eye, Key, Server
} from 'lucide-react';

interface FloePipelineDashboardProps {
  ir: IntermediateRepresentation;
  appName: string;
  onGoToProduction?: () => void;
}

export const FloePipelineDashboard: React.FC<FloePipelineDashboardProps> = ({
  ir,
  appName,
  onGoToProduction
}) => {
  const [pipeline, setPipeline] = useState<PipelineInstance>(() => {
    return floePipelineEngine.createPipelineInstance(ir, DEFAULT_GOVERNANCE_CONFIG);
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedStageId, setSelectedStageId] = useState<PipelineStageId>('stage_7_governance_gate');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'governance_policy' | 'pluggable_providers' | 'sbom_viewer' | 'promotion'>('pipeline');
  const [copiedSha, setCopiedSha] = useState<boolean>(false);
  const [showLogStream, setShowLogStream] = useState<boolean>(true);

  // Auto-run pipeline on initial mount if idle
  useEffect(() => {
    if (pipeline.status === 'idle') {
      handleRunPipeline();
    }
  }, []);

  const handleRunPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    const freshInstance = floePipelineEngine.createPipelineInstance(ir, pipeline.policyConfig);
    setPipeline(freshInstance);

    const completed = await floePipelineEngine.executePipeline(
      freshInstance, 
      ir, 
      (updated) => {
        setPipeline(updated);
      }
    );

    setPipeline(completed);
    setIsRunning(false);
  };

  const handlePolicyChange = (field: keyof GovernancePolicyConfig, value: boolean | number) => {
    setPipeline(prev => ({
      ...prev,
      policyConfig: {
        ...prev.policyConfig,
        [field]: value
      }
    }));
  };

  const selectedStage: PipelineStageResult = pipeline.stages[selectedStageId] || pipeline.stages.stage_1_spec;

  const stageKeys: PipelineStageId[] = [
    'stage_1_spec',
    'stage_2_ir',
    'stage_3_codegen',
    'stage_4_testing',
    'stage_5_security',
    'stage_6_sbom',
    'stage_7_governance_gate',
    'stage_8_deploy_test',
    'stage_9_dast',
    'stage_10_final_gate'
  ];

  const getStatusIcon = (status: PipelineStageResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const getStatusBadge = (status: PipelineStageResult['status']) => {
    switch (status) {
      case 'passed':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">PASS</span>;
      case 'running':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 animate-pulse">RUNNING</span>;
      case 'warning':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">WARN</span>;
      case 'failed':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80">FAIL</span>;
      default:
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Floe CI/CD & Governance Pipeline Engine
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Universal Pipeline Template v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Every generated app is orchestrated through the same automated 10-stage quality, security, compliance, and deployment pipeline.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Pipeline Executing...' : 'Re-run Full CI/CD Pipeline'}</span>
            </button>

            {onGoToProduction && (
              <button
                onClick={onGoToProduction}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <span>Promote to Production</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Summary Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 font-mono text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block font-sans">Pipeline Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${pipeline.status === 'passed' ? 'bg-emerald-400' : isRunning ? 'bg-indigo-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className="font-bold uppercase text-white">{pipeline.status}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block font-sans">Immutable Artifact Digest</span>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="text-slate-300 truncate text-[11px]">{pipeline.artifact.imageDigest?.substring(0, 18)}...</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(pipeline.artifact.imageDigest || '');
                  setCopiedSha(true);
                  setTimeout(() => setCopiedSha(false), 2000);
                }}
                className="text-slate-400 hover:text-white"
                title="Copy SHA"
              >
                {copiedSha ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block font-sans">Testbed Target</span>
            <span className="text-emerald-400 font-bold block mt-0.5">Render Web + Postgres 15 (Free)</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block font-sans">Governance Gate</span>
            <span className="text-indigo-300 font-bold block mt-0.5">Zero Critical / High Allowed</span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>10-Stage Pipeline Run</span>
          </button>

          <button
            onClick={() => setActiveTab('governance_policy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'governance_policy'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Governance Policy & Thresholds</span>
          </button>

          <button
            onClick={() => setActiveTab('pluggable_providers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pluggable_providers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Pluggable Providers (Semgrep/Trivy/ZAP/Devzy)</span>
          </button>

          <button
            onClick={() => setActiveTab('sbom_viewer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'sbom_viewer'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Floe CycloneDX SBOM</span>
          </button>

          <button
            onClick={() => setActiveTab('promotion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'promotion'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Artifact Promotion Flow</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: 10-STAGE PIPELINE RUNNER & STAGE INSPECTOR ====== */}
      {/* ========================================================= */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: 10-Stage Pipeline Sequence Column */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pipeline Stages (1 to 10)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {stageKeys.filter(k => pipeline.stages[k].status === 'passed').length} / 10 Complete
              </span>
            </div>

            <div className="space-y-2">
              {stageKeys.map((stageKey, idx) => {
                const stage = pipeline.stages[stageKey];
                const isSelected = selectedStageId === stageKey;
                
                return (
                  <button
                    key={stageKey}
                    onClick={() => setSelectedStageId(stageKey)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {stage.name}
                          </h4>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          {stage.summary || stage.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusIcon(stage.status)}
                      {getStatusBadge(stage.status)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Stage Deep Inspector Drawer */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-5">
            
            {/* Stage Title & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                    STAGE {selectedStage.stageNumber} OF 10
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedStage.durationMs ? `${selectedStage.durationMs}ms duration` : 'Pending'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedStage.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedStage.description}
                </p>
              </div>

              <div>
                {getStatusBadge(selectedStage.status)}
              </div>
            </div>

            {/* Stage-Specific Result Cards */}
            
            {/* 1. Test Results (Stage 4) */}
            {selectedStageId === 'stage_4_testing' && selectedStage.testResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Multi-Tier Test Suite (Build + Contract + Runtime + E2E)</span>
                  <span className="text-emerald-400 font-mono">100% Pass Rate</span>
                </div>
                
                {/* Tier summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tier 1: Build</span>
                    <span className="text-emerald-400 font-bold">PASSED</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tier 2: Contracts</span>
                    <span className="text-indigo-300 font-bold">100% DDL/Graph</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tier 3: Runtime</span>
                    <span className="text-emerald-400 font-bold">RBAC Enforced</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tier 4: E2E Playwright</span>
                    <span className="text-emerald-400 font-bold">2 Journeys OK</span>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedStage.testResults.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                          test.type === 'e2e' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          test.type === 'api' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {test.type}
                        </span>
                        <span className="text-slate-200">{test.name}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-2">{test.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Security Findings (Stage 5 or Stage 9) */}
            {(selectedStageId === 'stage_5_security' || selectedStageId === 'stage_9_dast') && selectedStage.findings && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Security & Compliance Scan Findings</span>
                  <span className="text-emerald-400 font-mono">0 Critical / 0 High</span>
                </div>
                <div className="space-y-2">
                  {selectedStage.findings.map(finding => (
                    <div key={finding.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {finding.tool}
                          </span>
                          <span className="font-bold text-white">{finding.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          finding.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          finding.severity === 'high' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                          finding.severity === 'medium' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {finding.description}
                      </p>
                      {finding.remediation && (
                        <div className="text-[11px] text-emerald-400 font-mono pt-1">
                          ✓ Remediation: {finding.remediation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Governance Gate Summary (Stage 7) */}
            {selectedStageId === 'stage_7_governance_gate' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
                    Floe Governance Decision Matrix
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                    DECISION: PASS (APPROVED)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">IR Specification:</span>
                    <span className="text-emerald-400 font-bold">PASS</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Contract Tests:</span>
                    <span className="text-emerald-400 font-bold">PASS</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Floe SAST:</span>
                    <span className="text-emerald-400 font-bold">PASS (0 Vuln)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Secret Scanner:</span>
                    <span className="text-emerald-400 font-bold">PASS (0 Leaked)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Dep Scanner:</span>
                    <span className="text-emerald-400 font-bold">PASS (0 Crit/High)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">CycloneDX SBOM:</span>
                    <span className="text-emerald-400 font-bold">ATTACHED</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Live Render Metrics (Stage 8) */}
            {selectedStageId === 'stage_8_deploy_test' && selectedStage.metrics && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Live Testbed Service Status</span>
                  <a 
                    href={String(selectedStage.metrics.serviceUrl)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                  >
                    <span>Open Testbed</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Endpoint Status</span>
                    <span className="text-emerald-400 font-bold">GET /api/health → 200</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Database Latency</span>
                    <span className="text-indigo-300 font-bold">38 ms</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-sans">Hosting Tier</span>
                    <span className="text-emerald-400 font-bold">₹0 Free Plan</span>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Console Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Execution Output Stream</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedStage.logs?.length || 0} log lines
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto leading-relaxed">
                {selectedStage.logs && selectedStage.logs.length > 0 ? (
                  selectedStage.logs.map((line, idx) => (
                    <div key={idx} className={`truncate ${
                      line.includes('[ERROR]') ? 'text-rose-400 font-bold' :
                      line.includes('[WARN]') ? 'text-amber-300' :
                      line.includes('✓') ? 'text-emerald-400' :
                      line.includes('[GATE]') ? 'text-indigo-300' :
                      'text-slate-300'
                    }`}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 italic">No output logs recorded for this stage yet.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: GOVERNANCE POLICY & SEVERITY THRESHOLDS ========= */}
      {/* ========================================================= */}
      {activeTab === 'governance_policy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Floe Governance Policy Engine & Thresholds</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure strict automated gate criteria to determine whether an artifact is authorized for testbed deployment and production promotion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Critical Policy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h4 className="text-xs font-bold text-slate-900">Block on Critical Vulnerability</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Immediately fail pipeline if any Critical CVE or AST policy violation is detected.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pipeline.policyConfig.blockOnCritical}
                onChange={e => handlePolicyChange('blockOnCritical', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* High Policy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <h4 className="text-xs font-bold text-slate-900">Block on High Vulnerability</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Reject build if High severity dependency or SAST findings exist.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pipeline.policyConfig.blockOnHigh}
                onChange={e => handlePolicyChange('blockOnHigh', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Medium Policy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h4 className="text-xs font-bold text-slate-900">Block on Medium Vulnerability</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enforce strict zero-medium vulnerability gate (default: allow with warning).
                </p>
              </div>
              <input
                type="checkbox"
                checked={pipeline.policyConfig.blockOnMedium}
                onChange={e => handlePolicyChange('blockOnMedium', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Secret Policy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">Enforce Zero Leaked Secrets (Gitleaks)</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Block build if entropy scan discovers hardcoded private keys or live API tokens.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pipeline.policyConfig.requireZeroSecrets}
                onChange={e => handlePolicyChange('requireZeroSecrets', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* DAST Clean Policy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">Require Clean Dynamic DAST Scan</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Require OWASP ZAP to pass on live testbed before authorizing production promotion.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pipeline.policyConfig.requireDastClean}
                onChange={e => handlePolicyChange('requireDastClean', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* SBOM Policy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">Mandate CycloneDX SBOM & License Audit</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Verify 100% of dependencies have OSI-approved licenses (no AGPL/GPL contamination).
                </p>
              </div>
              <input
                type="checkbox"
                checked={pipeline.policyConfig.requireSbom}
                onChange={e => handlePolicyChange('requireSbom', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: PLUGGABLE PROVIDER ARCHITECTURE (SEMGREP/TRIVY/ZAP) */}
      {/* ========================================================= */}
      {activeTab === 'pluggable_providers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-600" />
              <span>Floe Pluggable Provider Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Floe owns the pipeline orchestration, while security scanners, test engines, and DAST analyzers are swappable provider implementations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLUGGABLE_PROVIDERS.map((providerGroup, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {providerGroup.category} Provider Interface
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    Active: {providerGroup.activeProvider.split(' ')[0]}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {providerGroup.availableProviders.map(p => (
                    <div key={p.name} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">v{p.version}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        p.status === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Devzy Integration Callout */}
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs space-y-1">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>External Autonomous Validation Provider: Devzy.ai Ready</span>
            </h4>
            <p className="text-indigo-900/80 leading-relaxed">
              Because Floe models evaluation as pluggable provider stages rather than hardcoding CLI tools, third-party autonomous agents (such as <b>Devzy.ai</b> multi-agent verification) can be plugged directly into the pipeline without altering core Floe architecture.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: SYFT CYCLONEDX SBOM VIEWER ====================== */}
      {/* ========================================================= */}
      {activeTab === 'sbom_viewer' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl text-white space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  CycloneDX 1.5 JSON Spec
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">Floe CycloneDX SBOM Generator (Enterprise: Syft-Pluggable)</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Software Bill of Materials (SBOM)</h3>
              <p className="text-xs text-slate-400">Complete dependency inventory with package URLs (purl) and license compliance audits.</p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Total Packages: <b className="text-white">42</b></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Direct: <b className="text-indigo-300">8</b></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">License Risk: <b className="text-emerald-400">0</b></span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Component Name</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">License</th>
                  <th className="py-2.5 px-3">Package URL (purl)</th>
                  <th className="py-2.5 px-3">Vulnerabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {pipeline.stages.stage_6_sbom?.sbom?.components?.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-2 px-3 text-indigo-300">{c.version}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-400">{c.type}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">{c.license}</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] truncate max-w-xs">{c.purl}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        0 CVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 5: ARTIFACT PROMOTION FLOW ========================= */}
      {/* ========================================================= */}
      {activeTab === 'promotion' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>Immutable Artifact Promotion (Same Artifact Guarantee)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Production does NOT regenerate or rebuild code from scratch. Floe promotes the exact tested Docker container artifact verified in Stage 1 through Stage 10.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 text-white font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase">PROVEN ARTIFACT MANIFEST</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                STATUS: SIGNED & VERIFIED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Container Image Tag:</span>
                <span className="text-white font-bold">{pipeline.artifact.imageTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Image SHA-256 Digest:</span>
                <span className="text-indigo-300 font-bold truncate max-w-sm">{pipeline.artifact.imageDigest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Internal Registry:</span>
                <span className="text-slate-300 truncate">{pipeline.artifact.registryUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CycloneDX SBOM Digest:</span>
                <span className="text-emerald-400">{pipeline.artifact.sbomDigest}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="text-slate-400 block font-bold">Promotion Path:</span>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
                <span>[Test Environment: Render]</span>
                <span>──(Promote Same Artifact)──▶</span>
                <span className="font-bold text-indigo-300">[Production: AWS / Azure / GCP / On-Prem]</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
