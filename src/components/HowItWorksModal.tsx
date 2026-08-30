import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Sparkles, MessageSquare, ShieldCheck, Play, HelpCircle, Layers, Users, Zap } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewApp: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartNewApp
}) => {
  const [activeView, setActiveView] = useState<'quickstart' | 'architecture'>('quickstart');
  const [selectedDiagram, setSelectedDiagram] = useState<'pipeline' | 'providers' | 'lifecycle' | 'deployment' | 'runtime'>('pipeline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">How Floe Works: Lifecycle & Architecture</h3>
              <p className="text-xs text-slate-500">From conversational requirements to proven, testable, production applications</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveView('quickstart')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeView === 'quickstart' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quick Guide
              </button>
              <button
                onClick={() => setActiveView('architecture')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeView === 'architecture' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Master Architecture (4 Views)
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeView === 'quickstart' ? (
          /* 3 Step Walkthrough */
          <div className="py-5 space-y-4">
            
            {/* Step 1 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Describe your workplace workflow</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    Plain English
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pick a template (like <b>Vacation PTO</b> or <b>Expense Claims</b>) or answer simple guided questions with 1-click suggestion chips. Tell Floe who submits, who approves, and what rules apply.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Review Application Blueprint & Polarizer</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Zero Code
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Floe compiles your answers into an explicit Application Contract & IR. Step modes are separated (Deterministic vs AI vs Human) and verified through a 12-point quality gate.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Test live on Free Testbed & Go Production</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ₹0 Instant Sandbox
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Try the app right in your browser! Submit test requests, switch roles, and when ready, review multi-cloud infrastructure plans or deploy on-premise.
                </p>
              </div>
            </div>

            {/* FAQ / Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Safe AI Boundaries (Polarizer)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Business calculations & entity state mutations are strictly deterministic. AI handles unstructured categorization under read-only contracts.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Transparent Cost Modeling</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Transparent 4-way TCO comparison (On-Prem, AWS, Azure, GCP) tailored to your user counts and data sensitivity requirements.
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* Master Architecture (4 Views) */
          <div className="py-4 space-y-4">
            
            {/* Spine */}
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
              <div className="font-bold text-indigo-900 mb-1 font-mono">
                Spine: Requirement ──► Spec ──► Contract ──► IR ──► Artifact ──► Eval Gate ──► Free Testbed ──► Production
              </div>
              <p className="text-[11px] text-slate-600">
                Floe proves that the generated application conforms to its formal contract before deployment eligibility.
              </p>
            </div>

            {/* Diagram Buttons */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {[
                { key: 'pipeline', label: '1. CI/CD Pipeline Engine' },
                { key: 'providers', label: '2. Pluggable Providers' },
                { key: 'lifecycle', label: '3. Product Lifecycle' },
                { key: 'deployment', label: '4. Artifact Promotion' },
                { key: 'runtime', label: '5. Runtime Architecture' }
              ].map(d => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDiagram(d.key as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedDiagram === d.key ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Terminal Display */}
            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs max-h-80 overflow-y-auto">
              {selectedDiagram === 'pipeline' && (
                <pre className="text-indigo-300 leading-relaxed">
{`Diagram 1 — Floe Standardized 10-Stage CI/CD Pipeline Engine

                       FLOE APPLICATION
                              │
                              ▼
                      Source Repository
                              │
                              ▼
               ┌──────────────────────────────┐
               │    FLOE CI/CD & EVAL ENGINE  │
               └──────────────┬───────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
    Stage 1: Validate Spec                  Stage 2: Validate IR
    (Entities, Roles, Workflows)            (Schema, FKs, Permissions)
          │                                       │
          └───────────────────┬───────────────────┘
                              ▼
                    Stage 3: Build Application
                    (React UI, Express REST, DDL, Docker)
                              │
                              ▼
                    Stage 4: Automated Testing
                    (Unit Tests, REST API, Playwright E2E)
                              │
                              ▼
                    Stage 5: Security Scans
                    (Semgrep SAST, Trivy CVEs, Gitleaks)
                              │
                              ▼
                    Stage 6: Generate SBOM
                    (Syft CycloneDX 1.5 JSON & License Audit)
                              │
                              ▼
               ┌──────────────────────────────┐
               │   Stage 7: GOVERNANCE GATE   │
               │   (Critical/High: BLOCK)     │
               └──────────────┬───────────────┘
                              │
                              ▼ PASS
                    Stage 8: Deploy TEST (Render Free Tier)
                    (Web Service + PostgreSQL 15, GET /api/health)
                              │
                              ▼
                    Stage 9: Dynamic DAST (OWASP ZAP)
                    (Active Penetration Scan on Live URL)
                              │
                              ▼
               ┌──────────────────────────────┐
               │   Stage 10: FINAL TEST GATE  │
               └──────────────┬───────────────┘
                              │
                              ▼
                    User Acceptance Testing
                              │
                              ▼
                    Promote Same Tested Artifact (AWS/Azure/GCP/On-Prem)`}
                </pre>
              )}

              {selectedDiagram === 'providers' && (
                <pre className="text-emerald-400 leading-relaxed">
{`Diagram 2 — Floe Pluggable Provider Architecture

                 FLOE CI/CD ORCHESTRATOR
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
 Functional              Security             Governance
 Evaluation              Evaluation           Evaluation
       │                    │                    │
 ┌─────┴──────┐       ┌─────┴──────┐       ┌─────┴──────┐
 │ Test Runner│       │  Scanner   │       │  Policy    │
 │ (Vitest /  │       │ Interfaces │       │  Engine    │
 │ Playwright)│       │            │       │ (Threshold)│
 └────────────┘       └─────┬──────┘       └────────────┘
                            │
      ┌─────────────┬───────┴─────┬─────────────┬─────────────┐
      ▼             ▼             ▼             ▼             ▼
 SAST Provider  Dependency    Secret Scanner Container    DAST Provider
  (Semgrep)     & Package      (Gitleaks)    Scanner       (OWASP ZAP)
                 (Trivy)                     (Trivy)
                                                │
                                                ▼
                                         SBOM Generator
                                            (Syft)
                                                │
                                                ▼
                                   External Validation Provider
                                            (Devzy.ai)`}
                </pre>
              )}

              {selectedDiagram === 'lifecycle' && (
                <pre className="text-emerald-400 leading-relaxed">
{`Diagram 3 — Floe Product Lifecycle

Problem
   │
   ▼
Requirements  (Domain discovery & guided user Q&A)
   │
   ▼
Specification (Formal application contract & data definitions)
   │
   ▼
Prototype     (Generated IR & executable sandbox)
   │
   ▼
Test          (Free Testbed on Render/local — ₹0 user test loop)
   │
   ├───────────► Doesn't meet need? ──► Iterate back to Requirements
   │
   ▼ Works!
Production    (Cost-modeled architecture plan & gated deployment)`}
                </pre>
              )}

              {selectedDiagram === 'deployment' && (
                <pre className="text-amber-300 leading-relaxed">
{`Diagram 4 — Immutable Artifact Promotion Flow

                   IDENTICAL TESTED ARTIFACT
                     (sha256:4a8f9c... digest)
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
       TEST ENVIRONMENT                PRODUCTION ENVIRONMENT
         (Render Free)                     (Multi-Cloud)
               │                                 │
     • Free Web Service                • AWS (ECS/RDS)
     • Free PostgreSQL 15              • Azure (App Service)
     • DAST / OWASP ZAP                • GCP (Cloud Run)
     • User Acceptance Loop            • Air-Gapped On-Prem
                                                 │
                                       (Promoted Without Rebuilding)`}
                </pre>
              )}

              {selectedDiagram === 'runtime' && (
                <pre className="text-cyan-300 leading-relaxed">
{`Diagram 5 — Runtime Architecture

                   Application Gateway (:4000)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
     Deterministic Runtime              Agentic / AI Runtime
       (ACID Mutations)                   (Bounded Contracts)
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
                      Record Layer (PostgreSQL)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                Analytics         Observability & Audit`}
                </pre>
              )}
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
          >
            Close
          </button>
          
          <button
            onClick={() => {
              onClose();
              onStartNewApp();
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create an App Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
