import React, { useState } from 'react';
import { IntermediateRepresentation, ValidationResult } from '../types/floe';
import { ArchitecturePlan, DeploymentTargetKey, RequirementProfile } from '../types/architecture';
import { generateArchitecturePlan } from '../engine/architecturePlanner';
import { validateIR } from '../engine/irValidator';
import { WorkflowGraph } from './WorkflowGraph';
import { AppLogoBadge } from './AppLogoBadge';
import { BrandingEditorModal } from './BrandingEditorModal';
import { 
  CheckCircle2, ArrowLeft, Cpu, Database, Shield, Zap, Sparkles, 
  UserCheck, Code, Edit3, ArrowRight, Server, Cloud, Globe, 
  HelpCircle, DollarSign, Laptop, Check, Info, Users, TrendingUp, AlertTriangle,
  Palette, ShieldCheck
} from 'lucide-react';

interface ReviewScreenProps {
  ir: IntermediateRepresentation;
  onConfirmBuild: (ir: IntermediateRepresentation) => void;
  onBackToChat: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  ir,
  onConfirmBuild,
  onBackToChat
}) => {
  const [currentIr, setCurrentIr] = useState<IntermediateRepresentation>(ir);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(ir, null, 2));
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  // Architecture Plan & Selected Target
  const initialPlan = ir.architecture_plan || generateArchitecturePlan(ir, ir.requirement_profile);
  const [plan, setPlan] = useState<ArchitecturePlan>(initialPlan);
  const [selectedTarget, setSelectedTarget] = useState<DeploymentTargetKey>(plan.selected_target || plan.recommended_target || 'on_prem');
  const [tcoView, setTcoView] = useState<'infrastructure_only' | 'tco_total'>('infrastructure_only');
  const [selectedDbEngine, setSelectedDbEngine] = useState<'postgresql' | 'mysql' | 'sqlite'>('postgresql');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'testbed_preview' | 'overview' | 'workflow' | 'schema' | 'architecture_pricing' | 'json'>('testbed_preview');

  const validation: ValidationResult = validateIR(currentIr);

  const handleUpdateBranding = (newName: string, newLogo: string) => {
    const updated = {
      ...currentIr,
      name: newName,
      logo: newLogo
    };
    setCurrentIr(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setCurrentIr(parsed);
    } catch {
      // JSON is still being typed
    }
  };

  const handleTargetSelect = (key: DeploymentTargetKey) => {
    setSelectedTarget(key);
    setPlan(prev => ({
      ...prev,
      selected_target: key
    }));
  };

  const handleRequirementChange = (field: keyof RequirementProfile, value: any) => {
    const updatedReq: RequirementProfile = {
      ...plan.requirement_profile,
      [field]: value
    };
    const recalculated = generateArchitecturePlan(currentIr, updatedReq);
    recalculated.selected_target = selectedTarget;
    setPlan(recalculated);
  };

  const handleBuild = () => {
    const updatedIr: IntermediateRepresentation = {
      ...currentIr,
      requirement_profile: plan.requirement_profile,
      architecture_plan: {
        ...plan,
        selected_target: selectedTarget
      }
    };
    onConfirmBuild(updatedIr);
  };

  const workflow = currentIr.workflows[0] || {
    name: 'default',
    trigger: 'manual',
    nodes: [],
    edges: []
  };

  const currentProfile = plan.profiles?.[selectedTarget] || plan.profiles?.[plan.recommended_target] || plan.profiles?.['on_prem'] || plan.profiles?.['aws'] || Object.values(plan.profiles || {})[0];
  const req = plan.requirement_profile || {
    total_registered_users: 250,
    concurrent_users: 30,
    growth_12_months_users: 500,
    data_sensitivity: 'confidential',
    criticality: 'business_standard',
    availability: 'several_hours'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Requirements Agent</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              STEP 2 OF 3: BLUEPRINT & TESTBED REVIEW
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Domain: {currentIr.domain}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Review Blueprint & Launch Free Test Environment</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="review-build-app-btn"
            onClick={handleBuild}
            disabled={!validation.valid}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Approve & Launch Free Testbed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Banner & App Identity Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* App Identity Banner */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <AppLogoBadge logo={currentIr.logo} name={currentIr.name} domain={currentIr.domain} size="md" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">App Identity</span>
              <h3 className="text-sm font-bold text-slate-900 truncate">{currentIr.name}</h3>
            </div>
          </div>
          <button
            onClick={() => setIsBrandingModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors shrink-0"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Edit Branding</span>
          </button>
        </div>

        {/* Validation Banner */}
        <div className="md:col-span-7">
          {validation.valid ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  <b>Validated:</b> {validation.summary.entityCount} entities, foreign keys, & {validation.summary.nodeCount} workflow states.
                </span>
              </div>
              <span className="text-emerald-700 font-mono font-medium shrink-0 ml-2">₹0 Free Testbed</span>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800">
              <b>Schema Validation Errors:</b>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {validation.errors.map((e, idx) => (
                  <li key={idx}>
                    <span className="font-mono text-rose-900">[{e.path}]</span>: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('testbed_preview')}
          className={`pb-3 px-3 border-b-2 font-bold flex items-center gap-2 transition-colors shrink-0 ${
            activeTab === 'testbed_preview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>🧪 Free Testbed Ready (₹0)</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 font-bold flex items-center gap-2 transition-colors shrink-0 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span>Governance & Boundaries</span>
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`pb-3 px-3 border-b-2 font-bold flex items-center gap-2 transition-colors shrink-0 ${
            activeTab === 'workflow'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>4-Mode Workflow Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-3 px-3 border-b-2 font-bold flex items-center gap-2 transition-colors shrink-0 ${
            activeTab === 'schema'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-sky-600" />
          <span>Entities & Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture_pricing')}
          className={`pb-3 px-3 border-b-2 font-bold flex items-center gap-2 transition-colors shrink-0 ${
            activeTab === 'architecture_pricing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Production Sizing & Cost (Preview)</span>
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`pb-3 px-3 border-b-2 font-bold flex items-center gap-2 transition-colors shrink-0 ${
            activeTab === 'json'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-slate-600" />
          <span>IR AST (JSON)</span>
        </button>
      </div>

      {/* TAB: TESTBED PREVIEW (DEFAULT) */}
      {activeTab === 'testbed_preview' && (
        <div className="space-y-6">
          
          {/* Main Hero Card for Free Test Environment */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-emerald-700/50 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                    STEP 1: FREE TEST ENVIRONMENT FIRST
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Deploy to Free Sandbox Testbed for Verification
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-emerald-200/70">Testbed Hosting Cost</div>
                <div className="text-2xl font-black text-emerald-400">
                  ₹0 / month
                </div>
                <div className="text-[10px] text-emerald-300 font-mono">100% Free Sandbox</div>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed border-t border-emerald-800/60 pt-3">
              You will first test your application in a dedicated, isolated testbed. Once you are satisfied that data flows, form validations, and user roles work as expected, you can click <b>"Promote to Production"</b> to review cloud provider sizing (AWS, Azure, GCP, On-Prem) and cost models.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-900/60 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Isolated Test Database</span>
                </div>
                <p className="text-xs text-slate-300">
                  PostgreSQL 15 relational instance with seeded sample data for {currentIr.entities.length} entities.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-900/60 space-y-1.5">
                <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Interactive Test GUI</span>
                </div>
                <p className="text-xs text-slate-300">
                  Simulate user roles, create live records, trigger approvals, and test rejection edge cases.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-900/60 space-y-1.5">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Seamless Promotion</span>
                </div>
                <p className="text-xs text-slate-300">
                  Promote to AWS, Azure, GCP, or On-Premises with full infrastructure cost breakdown whenever ready.
                </p>
              </div>
            </div>
          </div>

          {/* Sizing & Specifications Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Entities to be Provisioned ({currentIr.entities.length})</span>
              </h3>
              <div className="space-y-2">
                {currentIr.entities.map((e, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800">{e.name}</span>
                    <span className="text-slate-500">{e.fields.length} columns & constraints</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Workflow & Role Governance</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Workflow States</span>
                  <span className="font-bold text-indigo-700 font-mono">{workflow.nodes.length} Steps</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Configured User Roles</span>
                  <span className="font-bold text-indigo-700 font-mono">{currentIr.roles.map(r => r.name).join(', ')}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Data Classification</span>
                  <span className="font-bold text-emerald-700 font-mono uppercase">{req.data_sensitivity}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 1: ARCHITECTURE & COST MODEL */}
      {activeTab === 'architecture_pricing' && (
        <div className="space-y-6">
          
          {/* Primary Recommendation Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-indigo-700/50 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
                  <Server className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    FLOE ARCHITECTURAL RECOMMENDATION
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {plan.recommendation_rationale.headline}
                  </h2>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs text-indigo-200/80 font-medium">Estimated monthly infrastructure cost</div>
                <div className="text-2xl font-black text-emerald-400">
                  {plan.profiles?.[plan.recommended_target]?.estimated_monthly_cost_inr
                    ? (plan.profiles[plan.recommended_target].estimated_monthly_cost_inr.nominal === 0
                        ? '₹0 / month'
                        : `₹${plan.profiles[plan.recommended_target].estimated_monthly_cost_inr.min.toLocaleString('en-IN')}–₹${plan.profiles[plan.recommended_target].estimated_monthly_cost_inr.max.toLocaleString('en-IN')}/mo`)
                    : '₹0 / month'}
                </div>
                <div className="text-[10px] text-indigo-300/70 font-mono">
                  Architecture estimate • Actual bill: Provider-controlled
                </div>
              </div>
            </div>

            <p className="text-xs text-indigo-100/90 leading-relaxed border-t border-indigo-800/60 pt-3">
              {plan.recommendation_rationale.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-900/60 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Why Floe recommends this target</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {plan.recommendation_rationale.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-900/60 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Trade-off & Constraint</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {plan.recommendation_rationale.trade_off}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 font-mono">
                  Database: PostgreSQL 15 (Community Edition / ACID Relational)
                </div>
              </div>
            </div>
          </div>

          {/* 4-Way Interactive Target Selection Cards */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Deployment Target</h3>
                <p className="text-xs text-slate-500">
                  Floe's recommendation is advisory. You can select any target to generate customized deployment manifests.
                </p>
              </div>

              {/* Toggle TCO */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setTcoView('infrastructure_only')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    tcoView === 'infrastructure_only'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Infrastructure Cost
                </button>
                <button
                  onClick={() => setTcoView('tco_total')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    tcoView === 'tco_total'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Total Cost of Ownership (TCO)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['on_prem', 'aws', 'azure', 'gcp'] as DeploymentTargetKey[]).map((key) => {
                const opt = plan.profiles?.[key];
                if (!opt) return null;
                const isSelected = selectedTarget === key;
                const isRecommended = plan.recommended_target === key;

                const costDisplay = tcoView === 'infrastructure_only'
                  ? (opt.estimated_monthly_cost_inr ? (opt.estimated_monthly_cost_inr.nominal === 0 ? '₹0 / mo' : `₹${opt.estimated_monthly_cost_inr.min.toLocaleString('en-IN')}–₹${opt.estimated_monthly_cost_inr.max.toLocaleString('en-IN')}/mo`) : '₹0 / mo')
                  : `₹${(opt.tco_monthly_inr || 0).toLocaleString('en-IN')}/mo (TCO)`;

                return (
                  <div
                    key={key}
                    onClick={() => handleTargetSelect(key)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                        : isRecommended
                        ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {key === 'on_prem' && <Server className="w-4 h-4 text-slate-700" />}
                          {key === 'aws' && <Cloud className="w-4 h-4 text-amber-500" />}
                          {key === 'azure' && <Globe className="w-4 h-4 text-sky-500" />}
                          {key === 'gcp' && <Cloud className="w-4 h-4 text-blue-500" />}
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {key === 'on_prem' ? 'On-Premises' : key === 'aws' ? 'AWS Cloud' : key === 'azure' ? 'Azure Cloud' : 'Google Cloud (GCP)'}
                          </span>
                        </div>

                        {isRecommended && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>

                      <div className="pt-1">
                        <div className="text-lg font-black text-slate-900">
                          {costDisplay}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {opt.subtitle}
                        </p>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Compute:</span>
                          <span className="font-semibold">{opt.compute_spec.vCpu} vCPU, {opt.compute_spec.ram_gb}GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Database:</span>
                          <span className="font-semibold">PostgreSQL ({opt.database_spec.ram_gb}GB RAM)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Backups:</span>
                          <span className="font-semibold">{opt.storage_spec.backup_retention_days}d Retention</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Benefits</span>
                        <ul className="text-[11px] text-slate-600 space-y-1">
                          {opt.benefits.slice(0, 2).map((b, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTargetSelect(key);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ Selected Target' : 'Select Target'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Why Not?" Alternatives Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Why Not the Alternatives? (Transparent Architectural Trade-offs)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed comparison of why other targets were not selected as the primary recommendation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {Object.entries(plan.recommendation_rationale?.why_not_alternatives || {}).map(([key, reason]) => {
                if (key === plan.recommended_target) return null;
                const profile = plan.profiles?.[key as DeploymentTargetKey];
                if (!profile) return null;
                return (
                  <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{profile.display_name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {profile.estimated_monthly_cost_inr ? (profile.estimated_monthly_cost_inr.nominal === 0
                          ? '₹0/mo'
                          : `₹${profile.estimated_monthly_cost_inr.nominal.toLocaleString('en-IN')}/mo`) : '₹0/mo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itemized Cost Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Itemized Cost Breakdown for {currentProfile?.display_name || 'Selected Target'}
                </h3>
                <p className="text-xs text-slate-500">
                  Resource specifications sized for {req.total_registered_users} registered users ({req.concurrent_users} peak concurrent).
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Total Monthly Cost</div>
                <div className="text-lg font-bold text-indigo-600">
                  {currentProfile?.estimated_monthly_cost_inr ? (currentProfile.estimated_monthly_cost_inr.nominal === 0
                    ? '₹0 / month'
                    : `₹${currentProfile.estimated_monthly_cost_inr.nominal.toLocaleString('en-IN')} / month`) : '₹0 / month'}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Infrastructure Component</th>
                    <th className="py-2.5 px-3">Allocated Resource / Service</th>
                    <th className="py-2.5 px-3">Specification</th>
                    <th className="py-2.5 px-3 text-right">Estimated Cost (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(currentProfile?.breakdown || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{item.component}</td>
                      <td className="py-3 px-3 text-slate-700">{item.name}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{item.spec}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {item.monthly_cost_inr === 0 ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ₹0 (Included)
                          </span>
                        ) : (
                          `₹${item.monthly_cost_inr.toLocaleString('en-IN')}/mo`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing Disclaimer & Distinction Notice */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Estimated monthly infrastructure cost</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Actual bill: Provider-controlled
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Actual charges may vary based on usage, network traffic, storage and provider pricing.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: OVERVIEW & GOVERNANCE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">{currentIr.name}</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {currentIr.description}
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
                  <Database className="w-4 h-4" />
                  <span>Deterministic Data Layer</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  PostgreSQL DDL with foreign key checks, uuid-ossp keys, and atomic state machines.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Categorizer (Bounded)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bounded single-inference step for free-text classification. Zero unconstrained autonomous mutations.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs mb-1">
                  <UserCheck className="w-4 h-4" />
                  <span>Human Approval & Escalation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Human approval gate with timeout escalation. Transparent audit logs on all state transitions.
                </p>
              </div>
            </div>
          </div>

          {/* 4-Mode Execution Trust Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>4-Mode Workflow Execution Trust Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Floe strictly categorizes every step to avoid accidental hallucinations or uncontrolled AI state mutation.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold">Step ID</th>
                    <th className="py-2.5 px-3 font-semibold">Label / Action</th>
                    <th className="py-2.5 px-3 font-semibold">Execution Mode</th>
                    <th className="py-2.5 px-3 font-semibold">Governance & Boundaries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {workflow.nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-indigo-600">{node.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{node.label || node.action}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono capitalize ${
                          node.execution_mode === 'deterministic'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : node.execution_mode === 'ai'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {node.execution_mode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {node.execution_mode === 'deterministic' && 'Deterministic rule/mutation. Zero token cost.'}
                        {node.execution_mode === 'ai' && `${node.goal || 'Read-only inference analysis.'} Bounded token scope.`}
                        {node.execution_mode === 'human' && `Assigned to role: ${node.role || 'manager'}. Timeout: ${node.timeout || '48h'} (Escalates to ${node.on_timeout || 'HR'}).`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKFLOW GRAPH */}
      {activeTab === 'workflow' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Visual Workflow Topology</h3>
            <p className="text-xs text-slate-500">
              Interactive state graph representing the execution flow for "{workflow.name}".
            </p>
          </div>
          <WorkflowGraph workflow={workflow} />
        </div>
      )}

      {/* TAB 4: SCHEMA & PERMISSIONS */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Domain Entities ({currentIr.entities.length})</span>
            </h3>

            <div className="space-y-4">
              {currentIr.entities.map((e, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs font-mono">{e.name}</span>
                    <span className="text-[10px] text-slate-500">{e.fields.length} fields</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1">
                    {e.fields.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                        <span>{f.name}</span>
                        <span className="text-slate-400">{f.type} {f.required ? '*' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Roles & Permissions ({currentIr.roles.length})</span>
            </h3>

            <div className="space-y-3">
              {currentIr.roles.map((r, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 text-xs font-mono uppercase">{r.name}</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.permissions.map((p, pIdx) => (
                      <span key={pIdx} className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-indigo-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: JSON AST */}
      {activeTab === 'json' && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">IR JSON Specification</span>
            <button
              onClick={() => setIsEditingJson(!isEditingJson)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingJson ? 'Done Editing' : 'Edit IR Directly'}</span>
            </button>
          </div>

          {isEditingJson ? (
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={22}
              className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-4 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            <pre className="bg-slate-950 font-mono text-xs text-slate-300 p-4 rounded-lg border border-slate-800 overflow-x-auto max-h-[500px]">
              {JSON.stringify(currentIr, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onBackToChat}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Cancel / Back to Requirements
        </button>

        <button
          onClick={handleBuild}
          disabled={!validation.valid}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Approve & Launch Free Testbed</span>
        </button>
      </div>

      {/* Branding Editor Modal */}
      <BrandingEditorModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        appName={currentIr.name}
        appLogo={currentIr.logo}
        domain={currentIr.domain}
        onSave={handleUpdateBranding}
      />

    </div>
  );
};
