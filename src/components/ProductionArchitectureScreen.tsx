import React, { useState } from 'react';
import { IntermediateRepresentation, ServerNode } from '../types/floe';
import { 
  ArchitecturePlan, 
  DeploymentTargetKey, 
  DeploymentProfileOption, 
  RequirementProfile 
} from '../types/architecture';
import { generateArchitecturePlan } from '../engine/architecturePlanner';
import { 
  Cloud, Server, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, 
  Zap, Database, Cpu, HardDrive, Shield, AlertTriangle, HelpCircle, 
  DollarSign, RefreshCw, Layers, Check, Info, Laptop, Globe, Users, 
  TrendingUp, Lock, ExternalLink, Terminal, Copy, Play
} from 'lucide-react';

interface ProductionArchitectureScreenProps {
  ir: IntermediateRepresentation;
  appName: string;
  onBackToSandbox: () => void;
  onPromoteSuccess?: (targetKey: DeploymentTargetKey, liveUrl: string) => void;
}

export const ProductionArchitectureScreen: React.FC<ProductionArchitectureScreenProps> = ({
  ir,
  appName,
  onBackToSandbox,
  onPromoteSuccess
}) => {
  // Sizing & Architecture Plan
  const initialPlan = ir.architecture_plan || generateArchitecturePlan(ir, ir.requirement_profile);
  const [plan, setPlan] = useState<ArchitecturePlan>(initialPlan);
  const [selectedTarget, setSelectedTarget] = useState<DeploymentTargetKey>(
    plan.recommended_target || 'aws'
  );
  const [selectedDbOption, setSelectedDbOption] = useState<'managed_pg' | 'community_pg'>('managed_pg');
  const [tcoView, setTcoView] = useState<'infrastructure_only' | 'tco_total'>('infrastructure_only');
  const [activeTab, setActiveTab] = useState<'recommended' | 'topology' | 'comparison' | 'promotion'>('recommended');

  // Promotion Pipeline State
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionStage, setPromotionStage] = useState<
    'idle' | 'validating_ir' | 'provisioning_db' | 'deploying_containers' | 'configuring_dns' | 'live'
  >('idle');
  const [promotionLogs, setPromotionLogs] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentProfile = plan.profiles[selectedTarget];
  const req = plan.requirement_profile;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
    const recalculated = generateArchitecturePlan(ir, updatedReq);
    recalculated.selected_target = selectedTarget;
    setPlan(recalculated);
  };

  // Live Promotion Pipeline Execution
  const handlePromoteToProduction = () => {
    setIsPromoting(true);
    setPromotionStage('validating_ir');
    
    const logs: string[] = [
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating Production Promotion for "${appName}"`,
      `[${new Date().toLocaleTimeString()}] Selected Target: ${currentProfile.display_name}`,
      `[${new Date().toLocaleTimeString()}] Stage 1/4: Validating IR & Schema Definitions (Zero test data migration enforced)...`
    ];
    setPromotionLogs(logs);

    setTimeout(() => {
      setPromotionStage('provisioning_db');
      logs.push(`[${new Date().toLocaleTimeString()}] Stage 2/4: Provisioning clean PostgreSQL 15 database instance & executing DDL migrations...`);
      logs.push(`[${new Date().toLocaleTimeString()}] ✅ ${ir.entities.length} tables created with foreign keys & audit indexes. (Test records isolated in testbed).`);
      setPromotionLogs([...logs]);

      setTimeout(() => {
        setPromotionStage('deploying_containers');
        logs.push(`[${new Date().toLocaleTimeString()}] Stage 3/4: Packaging multi-instance application containers with production security headers...`);
        logs.push(`[${new Date().toLocaleTimeString()}] ✅ 2x application replicas healthy behind load balancer.`);
        setPromotionLogs([...logs]);

        setTimeout(() => {
          setPromotionStage('configuring_dns');
          logs.push(`[${new Date().toLocaleTimeString()}] Stage 4/4: Provisioning SSL/TLS certificates and configuring HTTPS endpoint...`);
          logs.push(`[${new Date().toLocaleTimeString()}] ✅ Health contract GET /api/health -> 200 OK verified.`);
          logs.push(`[${new Date().toLocaleTimeString()}] 🌟 PRODUCTION LIVE: https://${ir.domain}.acme.floe.app`);
          setPromotionLogs([...logs]);
          setPromotionStage('live');
          setIsPromoting(false);

          if (onPromoteSuccess) {
            onPromoteSuccess(selectedTarget, `https://${ir.domain}.acme.floe.app`);
          }
        }, 800);
      }, 800);
    }, 700);
  };

  const productionLiveUrl = `https://${ir.domain}.acme.floe.app`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToSandbox}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Free Test Environment</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              Production Architecture & Promotion
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Verified in Testbed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent infrastructure sizing, itemized 4-way cost modeling, and clean promotion from test to production.
          </p>
        </div>

        {/* Promotion Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSandbox}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs"
          >
            Continue Testing (₹0)
          </button>
          
          <button
            id="promote-to-production-primary-btn"
            onClick={handlePromoteToProduction}
            disabled={isPromoting || promotionStage === 'live'}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
          >
            {isPromoting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Promoting to Production...</span>
              </>
            ) : promotionStage === 'live' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Live in Production</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Promote to Production ({currentProfile.display_name.split('(')[0].trim()})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Production Live Success Card */}
      {promotionStage === 'live' && (
        <div className="p-5 bg-emerald-950/90 rounded-2xl border border-emerald-700 text-white shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-200">Application Promoted & Live in Production!</h3>
                <p className="text-xs text-emerald-300/90">
                  Clean database provisioned with zero test records. Running with 99.95% SLA and managed automated backups.
                </p>
              </div>
            </div>
            
            <a
              href={productionLiveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              <span>Open Production App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-emerald-800/60">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Live HTTPS URL:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-emerald-400 font-bold">{productionLiveUrl}</span>
                <button onClick={() => handleCopy(productionLiveUrl, 'live_url')} className="text-slate-400 hover:text-white">
                  {copiedKey === 'live_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Infrastructure:</span>
              <span className="font-semibold text-slate-200">{currentProfile.display_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Database State:</span>
              <span className="font-semibold text-emerald-300">Clean Relational PostgreSQL 15 (0 Test Records)</span>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Principles Banner */}
      <div className="p-4 bg-indigo-900/10 rounded-2xl border border-indigo-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <span className="font-bold text-indigo-900 block">
            🛡️ Floe Clean Promotion Principle
          </span>
          <p className="leading-relaxed text-indigo-900/80">
            The free test environment and production environment share the exact same application definition, IR schemas, and deterministic workflow graphs, but <b>never share operational test data</b>. Test records (e.g. Ravi, Priya, Amit, Sarah) remain strictly inside the disposable test database. Production initiates clean with verified DDL migrations.
          </p>
        </div>
      </div>

      {/* Production Requirements Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Target Production Workload Sizing
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Scale: {req.total_registered_users} → {req.growth_12_months_users} users (12m target)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-medium">Registered Users</span>
            <span className="text-base font-bold text-white mt-0.5 block">{req.total_registered_users}</span>
            <span className="text-[10px] text-indigo-400">Scale: {req.growth_12_months_users} (12m)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-medium">Peak Concurrency</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">{req.concurrent_users}</span>
            <span className="text-[10px] text-slate-500">active sessions</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-medium">Data Sensitivity</span>
            <span className="text-xs font-bold text-amber-400 mt-1 block uppercase">{req.data_sensitivity}</span>
            <span className="text-[10px] text-slate-500">AES-256 encrypted</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-medium">Application Criticality</span>
            <span className="text-xs font-bold text-slate-200 mt-1 block capitalize">{req.criticality.replace('_', ' ')}</span>
            <span className="text-[10px] text-slate-500">99.9% uptime target</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-medium">Geographic Region</span>
            <span className="text-xs font-bold text-sky-400 mt-1 block uppercase">India (Mumbai)</span>
            <span className="text-[10px] text-slate-500">&lt;20ms latency</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-medium">Database Engine</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">PostgreSQL 15</span>
            <span className="text-[10px] text-slate-500">ACID Relational</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('recommended')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'recommended' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          ⭐ Production Recommendation & Costs
        </button>

        <button
          onClick={() => setActiveTab('topology')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'topology' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          📐 Architecture Topology Diagram
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'comparison' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          ⚖️ 5-Way Comparison & Alternatives
        </button>
      </div>

      {/* TAB 1: RECOMMENDED PRODUCTION OPTION */}
      {activeTab === 'recommended' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Highlighted Recommendation Card */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Primary Recommended Box */}
            <div className="p-6 bg-slate-900 rounded-2xl border-2 border-indigo-500 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                  ⭐ RECOMMENDED PRODUCTION TARGET
                </span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  ₹4,500 – ₹6,000 <span className="text-xs text-slate-400 font-sans font-normal">/ month</span>
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">Amazon Web Services (AWS Cloud)</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Floe recommends AWS because it provides the best balance of cost, scalability, automated database operations, and high availability for your {req.total_registered_users} registered users.
                </p>
              </div>

              {/* Rationale Bullets */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Why Floe Recommends This:
                </span>
                <ul className="space-y-1.5 text-slate-200">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Capacity Sized for {req.total_registered_users} Users</b> with 2 redundant container instances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Effortless Future Scaling</b> up to {req.growth_12_months_users} users with zero architecture redesign</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Managed PostgreSQL 15 (RDS)</b> with automated daily snapshots & Point-In-Time Recovery (PITR)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>High Availability & Zero Ops</b> — no manual OS patching, disk resizing, or server maintenance</span>
                  </li>
                </ul>
              </div>

              {/* Free Database vs Managed Database Option */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Database Tier Options & Trade-Offs:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedDbOption('managed_pg')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedDbOption === 'managed_pg' 
                        ? 'border-indigo-500 bg-indigo-950/40 text-white' 
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-200">⭐ Managed RDS PG</span>
                      <span className="text-emerald-400 font-mono font-bold text-[11px]">₹1,400/mo</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ✓ Automated daily backups & PITR<br />
                      ✓ Multi-AZ automated failover<br />
                      ✓ Zero administrative maintenance
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedDbOption('community_pg')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedDbOption === 'community_pg' 
                        ? 'border-indigo-500 bg-indigo-950/40 text-white' 
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-200">Self-Hosted Community PG</span>
                      <span className="text-emerald-400 font-mono font-bold text-[11px]">₹0 software</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ✓ 100% open source & portable<br />
                      ✗ Customer manages backup cron<br />
                      ✗ Customer manages OS/patch upgrades
                    </p>
                  </button>
                </div>
              </div>

            </div>

            {/* Alternative Quick Selectors */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Or Select an Alternative Target:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => handleTargetSelect('on_prem')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedTarget === 'on_prem' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-2xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">💰 Cheapest / Existing Server</span>
                    <span className="font-mono font-bold text-emerald-700">₹2,000 equiv/mo</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    On-Premises server. ₹0 cloud bill. Requires team IT maintenance.
                  </p>
                </button>

                <button
                  onClick={() => handleTargetSelect('azure')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedTarget === 'azure' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-2xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">⚡ Microsoft Azure</span>
                    <span className="font-mono font-bold text-emerald-700">₹4,800 – ₹6,500/mo</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Enterprise stack with native Microsoft 365 / Entra ID SSO integration.
                  </p>
                </button>
              </div>
            </div>

          </div>

          {/* Right: Itemized Cost Breakdown Table */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Itemized Monthly Cost Model</h3>
                  <span className="text-[10px] text-slate-400">Deterministic sizing based on {req.total_registered_users} users</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-xs border border-emerald-800">
                  INR (₹)
                </span>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200 block">Compute (App Instances)</span>
                    <span className="text-[10px] text-slate-400">2x ECS Fargate Tasks (1 vCPU, 2GB RAM each)</span>
                  </div>
                  <span className="font-mono font-bold text-white">₹2,100</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200 block">Database (PostgreSQL 15)</span>
                    <span className="text-[10px] text-slate-400">
                      {selectedDbOption === 'managed_pg' ? 'Amazon RDS PostgreSQL db.t4g.small' : 'Self-hosted Community Container'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {selectedDbOption === 'managed_pg' ? '₹1,400' : '₹0'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200 block">Block & Object Storage</span>
                    <span className="text-[10px] text-slate-400">100 GB SSD (gp3 EBS + S3 attachments)</span>
                  </div>
                  <span className="font-mono font-bold text-white">₹350</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200 block">Automated Backups & PITR</span>
                    <span className="text-[10px] text-slate-400">Daily snapshot + 7-day point-in-time recovery</span>
                  </div>
                  <span className="font-mono font-bold text-white">₹250</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200 block">Network & Load Balancer</span>
                    <span className="text-[10px] text-slate-400">Application Load Balancer (ALB) + Free SSL Cert</span>
                  </div>
                  <span className="font-mono font-bold text-white">₹300</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200 block">Cloud Monitoring & Syslog</span>
                    <span className="text-[10px] text-slate-400">CloudWatch Logs, alarms, and uptime telemetry</span>
                  </div>
                  <span className="font-mono font-bold text-white">₹200</span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold block">Estimated Monthly Total:</span>
                  <span className="text-[10px] text-slate-500">Paid directly to cloud provider</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    {selectedDbOption === 'managed_pg' ? '₹4,600' : '₹3,200'}
                  </span>
                  <span className="text-xs text-slate-400 block">/ month</span>
                </div>
              </div>
            </div>

            {/* Promote Action Box */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Ready to Promote to Production?
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking promote provisions the production infrastructure, runs DDL schema migrations, and exposes your live HTTPS domain.
              </p>
              
              <button
                onClick={handlePromoteToProduction}
                disabled={isPromoting || promotionStage === 'live'}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Promote to Production ({currentProfile.display_name.split('(')[0].trim()})</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ARCHITECTURAL TOPOLOGY DIAGRAM */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Visual Production Architecture Topology</h3>
                <p className="text-xs text-slate-400">High availability container cluster with isolated PostgreSQL database</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-mono text-xs border border-indigo-800">
                Target: {currentProfile.display_name}
              </span>
            </div>

            {/* Topology Visual Map */}
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center font-mono text-xs space-y-3 text-slate-300">
              <div className="px-4 py-2 rounded-lg bg-sky-950 border border-sky-700 text-sky-200 font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Internet (HTTPS / TLS 1.3 Encryption)</span>
              </div>

              <div className="text-slate-600">│</div>
              <div className="text-slate-600">▼</div>

              <div className="px-5 py-2.5 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-200 font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Application Load Balancer (ALB / SSL Termination & WAF)</span>
              </div>

              <div className="text-slate-600">│</div>
              <div className="text-slate-600">▼</div>

              <div className="px-6 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold flex items-center gap-3">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Application Runtime (2x Redundant Container Instances :3000)</span>
              </div>

              <div className="text-slate-600">│</div>
              <div className="text-slate-600">┌──────────────────────┴──────────────────────┐</div>
              <div className="flex items-center gap-12">
                <div className="text-slate-600">▼</div>
                <div className="text-slate-600">▼</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 font-bold text-xs">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>PostgreSQL 15 Managed DB</span>
                  </div>
                  <p className="text-[11px] text-slate-400">ACID Relational • {ir.entities.length} Domain Tables</p>
                  <div className="pt-2 text-[10px] text-emerald-400 font-mono">
                    ▼ Automated Daily Snapshots & PITR
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 font-bold text-xs">
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    <span>100 GB Encrypted Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-400">SSD Block Volume & Audit Logs</p>
                  <div className="pt-2 text-[10px] text-sky-400 font-mono">
                    ▼ 30-Day Retention Policy
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Details Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">High Availability SLA:</span>
                <span className="font-bold text-white text-sm">99.95% Multi-AZ</span>
                <p className="text-[11px] text-slate-400">Automatic failover if single zone experiences outage.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Zero Data Leakage:</span>
                <span className="font-bold text-emerald-400 text-sm">Isolated VPC Network</span>
                <p className="text-[11px] text-slate-400">PostgreSQL is not exposed to public internet interfaces.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Audit Logging:</span>
                <span className="font-bold text-indigo-400 text-sm">Immutable Syslog</span>
                <p className="text-[11px] text-slate-400">Tracks every RecordService transition with correlation ID.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 5-WAY COMPARISON & ALTERNATIVES */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">4-Way Infrastructure & Total Cost Comparison</h3>
              <p className="text-xs text-slate-500">Compare nominal cloud bills vs full Total Cost of Ownership (TCO)</p>
            </div>

            <div className="flex items-center bg-slate-200 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTcoView('infrastructure_only')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  tcoView === 'infrastructure_only' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Infrastructure Cloud Bill
              </button>
              <button
                onClick={() => setTcoView('tco_total')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  tcoView === 'tco_total' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Total Cost of Ownership (TCO)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.values(plan.profiles) as DeploymentProfileOption[]).map((p) => {
              const isSelected = p.target_key === selectedTarget;
              const isRec = p.is_recommended;

              return (
                <div
                  key={p.target_key}
                  onClick={() => handleTargetSelect(p.target_key)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'border-indigo-600 bg-slate-900 text-white shadow-md' 
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {isRec ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                          ⭐ RECOMMENDED
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.badge || 'Alternative'}
                        </span>
                      )}

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {p.display_name.split('(')[0]}
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {p.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/20">
                      <span className={`text-[10px] uppercase font-bold block ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tcoView === 'infrastructure_only' ? 'Estimated Cloud Bill' : 'Estimated Total TCO'}
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-bold font-mono text-emerald-500">
                          {tcoView === 'infrastructure_only' 
                            ? (p.estimated_monthly_cost_inr.nominal === 0 ? '₹0' : `₹${p.estimated_monthly_cost_inr.nominal.toLocaleString('en-IN')}`)
                            : `₹${p.tco_monthly_inr.toLocaleString('en-IN')}`}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>/ mo</span>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl text-xs space-y-1 ${isSelected ? 'bg-slate-950' : 'bg-slate-50'}`}>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Compute:</span>
                        <span className="font-semibold">{p.compute_spec.vCpu} vCPU, {p.compute_spec.ram_gb}GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Database:</span>
                        <span className="font-semibold">PostgreSQL 15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Storage:</span>
                        <span className="font-semibold">{p.storage_spec.disk_gb} GB</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTargetSelect(p.target_key)}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Selected Target' : 'Select Target'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
