import React, { useState } from 'react';
import { 
  IntermediateRepresentation 
} from '../types/floe';
import { 
  ArchitecturePlan, 
  RequirementProfile, 
  DeploymentTargetKey, 
  DeploymentProfileOption 
} from '../types/architecture';
import { generateArchitecturePlan } from '../engine/architecturePlanner';
import { 
  Server, Cloud, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, 
  Zap, Database, Cpu, HardDrive, Shield, AlertTriangle, HelpCircle, 
  DollarSign, RefreshCw, Layers, Check, Info, Laptop, Globe, Users, TrendingUp
} from 'lucide-react';

interface ArchitectureReviewScreenProps {
  ir: IntermediateRepresentation;
  onConfirmPlanAndGenerate: (ir: IntermediateRepresentation, plan: ArchitecturePlan) => void;
  onBackToChat: () => void;
}

export const ArchitectureReviewScreen: React.FC<ArchitectureReviewScreenProps> = ({
  ir,
  onConfirmPlanAndGenerate,
  onBackToChat
}) => {
  // Initialize Architecture Plan from IR requirement profile
  const initialPlan = ir.architecture_plan || generateArchitecturePlan(ir, ir.requirement_profile);
  const [plan, setPlan] = useState<ArchitecturePlan>(initialPlan);
  const [selectedTarget, setSelectedTarget] = useState<DeploymentTargetKey>(plan.selected_target || plan.recommended_target || 'on_prem');
  const [selectedDbEngine, setSelectedDbEngine] = useState<'postgresql' | 'mysql' | 'sqlite'>('postgresql');
  const [activeTab, setActiveTab] = useState<'recommendation' | 'comparison' | 'breakdown' | 'requirements'>('recommendation');
  const [tcoView, setTcoView] = useState<'infrastructure_only' | 'tco_total'>('infrastructure_only');

  const currentProfile = plan.profiles?.[selectedTarget] || plan.profiles?.[plan.recommended_target] || plan.profiles?.['on_prem'] || plan.profiles?.['aws'] || Object.values(plan.profiles || {})[0];
  const req: RequirementProfile = plan.requirement_profile || {
    user_count_bracket: '51-250',
    total_registered_users: 250,
    concurrent_users: 30,
    growth_12_months_users: 500,
    growth_multiple: 2,
    criticality: 'internal_business',
    data_sensitivity: 'confidential',
    geographic_reach: 'india',
    availability: 'several_hours',
    internal_vs_external: 'internal_only',
    cloud_provider_preference: 'none'
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
      ...req,
      [field]: value
    };
    // Recalculate architecture plan and pricing deterministically
    const recalculated = generateArchitecturePlan(ir, updatedReq);
    recalculated.selected_target = selectedTarget;
    setPlan(recalculated);
  };

  const handleProceed = () => {
    const updatedIr: IntermediateRepresentation = {
      ...ir,
      requirement_profile: plan.requirement_profile,
      architecture_plan: {
        ...plan,
        selected_target: selectedTarget
      }
    };
    onConfirmPlanAndGenerate(updatedIr, plan);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-1 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Requirements Agent</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              STEP 2: ARCHITECTURE & COST MODEL
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Domain: {ir.domain}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Architecture Plan & Cost Recommendation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Floe synthesized your user count, concurrency, growth, and sensitivity requirements to build a transparent cost model.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="proceed-to-generation-btn"
            onClick={handleProceed}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Approve Architecture & Generate</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requirement Profile Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Active Requirement Profile</div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{req.total_registered_users} Registered Users</span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                  {req.concurrent_users} Peak Concurrent
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {req.growth_12_months_users} in 12m ({req.growth_multiple}x growth)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Data Sensitivity:</span>{' '}
              <strong className="text-slate-900 capitalize font-medium">{req.data_sensitivity}</strong>
            </div>
            <div>
              <span className="text-slate-400">Criticality:</span>{' '}
              <strong className="text-slate-900 capitalize font-medium">{req.criticality.replace('_', ' ')}</strong>
            </div>
            <div>
              <span className="text-slate-400">Availability:</span>{' '}
              <strong className="text-slate-900 font-medium">{req.availability.replace(/_/g, ' ')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('recommendation')}
          className={`pb-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'recommendation'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Floe Advisory Recommendation</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'comparison'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>4-Way Infrastructure & Cost Comparison</span>
        </button>

        <button
          onClick={() => setActiveTab('breakdown')}
          className={`pb-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'breakdown'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          <span>Itemized Resource Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`pb-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'requirements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-600" />
          <span>Adjust Scale & Constraints</span>
        </button>
      </div>

      {/* TAB 1: FLOE RECOMMENDATION & RATIONALE */}
      {activeTab === 'recommendation' && (
        <div className="space-y-6">
          
          {/* Primary Recommendation Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-indigo-700/50 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
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

              <div className="text-right">
                <div className="text-xs text-indigo-200/70">Estimated Infrastructure Cost</div>
                <div className="text-2xl font-black text-emerald-400">
                  {plan.profiles?.[plan.recommended_target]?.estimated_monthly_cost_inr
                    ? (plan.profiles[plan.recommended_target].estimated_monthly_cost_inr.nominal === 0
                        ? '₹0 / month'
                        : `₹${plan.profiles[plan.recommended_target].estimated_monthly_cost_inr.min.toLocaleString('en-IN')}–₹${plan.profiles[plan.recommended_target].estimated_monthly_cost_inr.max.toLocaleString('en-IN')}/mo`)
                    : '₹0 / month'}
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

          {/* "Why Not?" Alternatives Explainer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Why Not the Alternatives? (Transparent Architectural Reasoning)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Floe provides transparent reasoning comparing trade-offs so you stay in complete control.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(plan.recommendation_rationale?.why_not_alternatives || {}).map(([key, reason]) => {
                if (key === plan.recommended_target) return null;
                const profile = plan.profiles?.[key as DeploymentTargetKey];
                if (!profile) return null;
                return (
                  <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
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

          {/* Database Recommendation & Override Engine */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Database Engine Recommendation</h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    PostgreSQL 15 (Recommended)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Floe selected PostgreSQL based on relational schema requirements, state machine consistency, and audit integrity.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Override Database:</span>
                <select
                  value={selectedDbEngine}
                  onChange={(e: any) => setSelectedDbEngine(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="postgresql">PostgreSQL 15 (Recommended)</option>
                  <option value="mysql">MySQL 8.0</option>
                  <option value="sqlite">SQLite (Prototype only)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <span className="text-xs font-bold text-indigo-900">Why PostgreSQL for this domain:</span>
                <ul className="text-xs text-indigo-800 space-y-1 list-disc pl-4">
                  {plan.recommended_database.reason.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900">Database Licensing & Deployment:</span>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• <strong>Free / Self-Hosted:</strong> PostgreSQL Community Edition (₹0 license, 100% portable)</p>
                  <p>• <strong>Managed Alternative:</strong> Amazon RDS / Azure Flexible Server (Automated backups, PITR)</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: 4-WAY INFRASTRUCTURE COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Deployment Target Selection</h3>
              <p className="text-xs text-slate-500">
                Choose where Floe should generate and target your deployment packages.
              </p>
            </div>

            {/* Toggle TCO vs Infrastructure Cost */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setTcoView('infrastructure_only')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  tcoView === 'infrastructure_only'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Infrastructure Cost
              </button>
              <button
                onClick={() => setTcoView('tco_total')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  tcoView === 'tco_total'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total Ownership Cost (TCO)
              </button>
            </div>
          </div>

          {/* 4 Cards Grid */}
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                        <span className="font-semibold">{opt.storage_spec.backup_retention_days} Days Retention</span>
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
      )}

      {/* TAB 3: ITEMIZED RESOURCE BREAKDOWN */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Itemized Cost Breakdown for {currentProfile?.display_name || 'Target'}
                </h3>
                <p className="text-xs text-slate-500">
                  Deterministic resource specification based on {req.total_registered_users} registered users ({req.concurrent_users} concurrent).
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Total Monthly Cost</div>
                <div className="text-xl font-bold text-indigo-600">
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

            {/* Assumptions Footnote */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cost Model Assumptions & Usage Guardrails:</span>
              </div>
              <p>• Estimated Monthly Requests: <strong className="text-slate-900">{currentProfile.assumptions.monthly_requests}</strong></p>
              <p>• Provisioned Storage: <strong className="text-slate-900">{currentProfile.assumptions.storage_gb} GB</strong> with <strong className="text-slate-900">{currentProfile.assumptions.backup_frequency}</strong></p>
              <p>• Target Region: <strong className="text-slate-900">{currentProfile.assumptions.region}</strong></p>
              <p className="text-[11px] text-slate-500 italic mt-1">
                *Actual cloud provider invoices may vary based on exact bandwidth egress, burst CPU usage, and regional tax policies.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: ADJUST SCALE & CONSTRAINTS */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Scale & Workload Parameters</h3>
              <p className="text-xs text-slate-500">
                Modify user count, concurrency, and SLA requirements to dynamically recalculate the architecture plan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* User Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900">Expected Registered Users</label>
                <select
                  value={req.total_registered_users}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    const conc = Math.max(5, Math.round(count * 0.12));
                    const growth = count * 2;
                    handleRequirementChange('total_registered_users', count);
                    handleRequirementChange('concurrent_users', conc);
                    handleRequirementChange('growth_12_months_users', growth);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value={10}>1–10 Users (Small Team)</option>
                  <option value={50}>11–50 Users (Growing Org)</option>
                  <option value={250}>51–250 Users (Mid-Enterprise)</option>
                  <option value={1000}>251–1,000 Users (Large Business)</option>
                  <option value={5000}>1,000–10,000 Users (Enterprise Scale)</option>
                </select>
                <p className="text-[11px] text-slate-500">Auto-derives concurrent peak connection pools.</p>
              </div>

              {/* Peak Concurrency */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900">Peak Concurrent Users</label>
                <input
                  type="number"
                  value={req.concurrent_users}
                  onChange={(e) => handleRequirementChange('concurrent_users', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">Determines backend connection sizing.</p>
              </div>

              {/* 12 Month Growth */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900">12-Month Target Users</label>
                <input
                  type="number"
                  value={req.growth_12_months_users}
                  onChange={(e) => handleRequirementChange('growth_12_months_users', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">Ensures infrastructure headroom.</p>
              </div>

              {/* Data Sensitivity */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900">Data Sensitivity</label>
                <select
                  value={req.data_sensitivity}
                  onChange={(e: any) => handleRequirementChange('data_sensitivity', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="public">Public Information</option>
                  <option value="internal">Internal Business Data</option>
                  <option value="confidential">Confidential (HR / Salary / Financial)</option>
                  <option value="regulated">Regulated (HIPAA / GDPR / Banking)</option>
                </select>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900">Availability & Downtime Tolerance</label>
                <select
                  value={req.availability}
                  onChange={(e: any) => handleRequirementChange('availability', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="several_hours">Several Hours Tolerable (Standard)</option>
                  <option value="under_4_hours">&lt; 4 Hours Tolerable</option>
                  <option value="under_1_hour">&lt; 1 Hour Tolerable</option>
                  <option value="near_zero_downtime">Near Zero Downtime (99.95% Multi-AZ)</option>
                </select>
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900">Network Exposure</label>
                <select
                  value={req.internal_vs_external}
                  onChange={(e: any) => handleRequirementChange('internal_vs_external', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="internal_only">Internal Company Mesh / LAN Only</option>
                  <option value="external_facing">Public Internet Facing (Customer Portal)</option>
                  <option value="hybrid">Hybrid (Internal + External Partners)</option>
                </select>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
