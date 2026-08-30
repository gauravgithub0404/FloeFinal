import React, { useState, useEffect, useRef } from 'react';
import { DOMAINS } from '../data/domains';
import { DomainDefinition, IntermediateRepresentation, ConversationMessage } from '../types/floe';
import { RequirementProfile, UserCountBracket, ApplicationCriticality, DataSensitivity, AvailabilityRequirement, DeploymentProfileOption } from '../types/architecture';
import { DEFAULT_REQUIREMENT_PROFILE, generateArchitecturePlan } from '../engine/architecturePlanner';
import { validateIR } from '../engine/irValidator';
import { 
  Sparkles, Send, CheckCircle2, ArrowRight, Layers, Bot, User, 
  Users, TrendingUp, ShieldCheck, Database, DollarSign, Sliders, MessageSquare, Check, Server
} from 'lucide-react';

interface RequirementsChatProps {
  onCompleteIR: (ir: IntermediateRepresentation) => void;
  onCancel: () => void;
  initialDomainId?: string;
  isDevMode?: boolean;
}

export const RequirementsChat: React.FC<RequirementsChatProps> = ({
  onCompleteIR,
  onCancel,
  initialDomainId,
  isDevMode = false
}) => {
  const initialDomain = DOMAINS.find(d => d.id === initialDomainId) || DOMAINS[0];
  const [selectedDomain, setSelectedDomain] = useState<DomainDefinition>(initialDomain);
  const [activeInputMode, setActiveInputMode] = useState<'chat' | 'form'>('chat');
  const [previewTab, setPreviewTab] = useState<'visual' | 'json' | 'architecture'>(isDevMode ? 'json' : 'visual');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [candidateIr, setCandidateIr] = useState<IntermediateRepresentation>(initialDomain.default_ir);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Requirement Profile State (First-Class Architecture Dimension)
  const [reqProfile, setReqProfile] = useState<RequirementProfile>(DEFAULT_REQUIREMENT_PROFILE);

  // Form builder local fields
  const [formAppName, setFormAppName] = useState(initialDomain.default_ir.name);
  const [formDefaultBal, setFormDefaultBal] = useState('20');
  const [formTimeoutHours, setFormTimeoutHours] = useState('48');

  // Multi-step sequential requirements wizard
  const QUESTIONS_SEQUENCE = [
    {
      id: 'step_name_scope',
      question: `What is the name and primary purpose of your **${selectedDomain.display_name}** application?`,
      suggestions: [
        `${selectedDomain.display_name} Core Portal`,
        `Enterprise ${selectedDomain.display_name} Hub`,
        `Global Operations & Audit Center`
      ]
    },
    {
      id: 'step_user_count',
      question: `**How many total users** do you expect will be registered in the system?`,
      suggestions: [
        '1–10 Users (Small Team)',
        '11–50 Users (Growing Org)',
        '51–250 Users (Mid-Enterprise)',
        '251–1,000 Users (Large Business)',
        '1,000–10,000 Users (High Scale)'
      ]
    },
    {
      id: 'step_concurrency',
      question: `How many users are expected to use the application **at the exact same time** (Peak Concurrency)?`,
      suggestions: [
        '5–10 concurrent users',
        '25–30 concurrent users',
        '50–100 concurrent users',
        '250+ peak concurrent users'
      ]
    },
    {
      id: 'step_growth',
      question: `What is your expected **user growth over the next 12 months**?`,
      suggestions: [
        '2x growth (e.g. 500 users in 12m)',
        '3x–5x rapid scale',
        'Steady state (< 20% growth)'
      ]
    },
    {
      id: 'step_criticality_data',
      question: `How critical is this application and what type of data will it store?`,
      suggestions: [
        'Internal business data (Confidential HR/Operations)',
        'Development / Team Demo prototype',
        'Business Critical (< 1h downtime tolerance)',
        'Highly regulated data (Strict on-prem residency)'
      ]
    },
    {
      id: 'step_target_pref',
      question: `Where should this application run?`,
      suggestions: [
        '⭐ Let Floe recommend based on scale & cost',
        'Deploy to Laptop 2 (gaurav - Private Tailscale)',
        'Amazon Web Services (AWS)',
        'Enterprise On-Premises Server'
      ]
    }
  ];

  // Initialize on domain change
  useEffect(() => {
    const q1 = QUESTIONS_SEQUENCE[0];
    setCandidateIr(selectedDomain.default_ir);
    setFormAppName(selectedDomain.default_ir.name);
    setCurrentStepIndex(0);
    setMessages([
      {
        id: 'msg-init',
        role: 'assistant',
        content: `Hi! I'm your **Floe Requirements & Architecture Agent**.\n\nLet's configure your **${selectedDomain.display_name}** application and synthesize the optimal infrastructure cost model.\n\n${q1.question}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: q1.suggestions
      }
    ]);
  }, [selectedDomain]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ConversationMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const lower = text.toLowerCase();

    // 1. NLP Domain & Requirement Detection
    let nextReq = { ...reqProfile };
    let nextIr: IntermediateRepresentation = JSON.parse(JSON.stringify(candidateIr));

    // Handle user count parsing
    if (lower.includes('1–10') || lower.includes('1-10') || lower.includes('small team')) {
      nextReq.user_count_bracket = '1-10';
      nextReq.total_registered_users = 10;
      nextReq.concurrent_users = 3;
      nextReq.growth_12_months_users = 25;
    } else if (lower.includes('11–50') || lower.includes('11-50')) {
      nextReq.user_count_bracket = '11-50';
      nextReq.total_registered_users = 50;
      nextReq.concurrent_users = 10;
      nextReq.growth_12_months_users = 150;
    } else if (lower.includes('51–250') || lower.includes('51-250') || lower.includes('250')) {
      nextReq.user_count_bracket = '51-250';
      nextReq.total_registered_users = 250;
      nextReq.concurrent_users = 30;
      nextReq.growth_12_months_users = 500;
    } else if (lower.includes('251–1,000') || lower.includes('1000') || lower.includes('1,000')) {
      nextReq.user_count_bracket = '251-1000';
      nextReq.total_registered_users = 1000;
      nextReq.concurrent_users = 120;
      nextReq.growth_12_months_users = 3000;
    } else if (lower.includes('10,000') || lower.includes('enterprise scale')) {
      nextReq.user_count_bracket = '10000+';
      nextReq.total_registered_users = 10000;
      nextReq.concurrent_users = 1200;
      nextReq.growth_12_months_users = 25000;
    }

    // Concurrency parsing
    if (lower.includes('concurrent') || lower.includes('same time')) {
      const match = text.match(/\d+/);
      if (match) {
        nextReq.concurrent_users = parseInt(match[0], 10);
      }
    }

    // Criticality / Data Sensitivity
    if (lower.includes('confidential') || lower.includes('hr') || lower.includes('salary')) {
      nextReq.data_sensitivity = 'confidential';
    } else if (lower.includes('regulated') || lower.includes('hipaa') || lower.includes('strict')) {
      nextReq.data_sensitivity = 'regulated';
      nextReq.availability = 'near_zero_downtime';
    } else if (lower.includes('demo') || lower.includes('development') || lower.includes('prototype')) {
      nextReq.criticality = 'dev_demo';
    } else if (lower.includes('business critical') || lower.includes('< 1h')) {
      nextReq.criticality = 'business_critical';
      nextReq.availability = 'under_1_hour';
    }

    // Handle name
    if (currentStepIndex === 0 && text.length > 3 && !text.includes('1–10')) {
      nextIr.name = text.length > 50 ? text.substring(0, 50) : text;
      setFormAppName(nextIr.name);
    }

    setReqProfile(nextReq);
    nextIr.requirement_profile = nextReq;
    nextIr.architecture_plan = generateArchitecturePlan(nextIr, nextReq);
    setCandidateIr(nextIr);

    setTimeout(() => {
      const nextIdx = currentStepIndex + 1;

      if (nextIdx < QUESTIONS_SEQUENCE.length) {
        setCurrentStepIndex(nextIdx);
        const nextQ = QUESTIONS_SEQUENCE[nextIdx];
        setMessages(prev => [
          ...prev,
          {
            id: `msg-asst-${Date.now()}`,
            role: 'assistant',
            content: nextQ.question,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: nextQ.suggestions
          }
        ]);
      } else {
        const plan = generateArchitecturePlan(nextIr, nextReq);
        const recProfile = plan.profiles[plan.recommended_target];
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg-complete-${Date.now()}`,
            role: 'assistant',
            content: `🎯 **Architecture Plan & Cost Model Synthesized!**\n\nBased on your scale of **${nextReq.total_registered_users} registered users** (${nextReq.concurrent_users} peak concurrent) with **${nextReq.data_sensitivity} data**:\n\n• **Recommended Target**: **${recProfile.display_name}**\n• **Estimated Monthly Cost**: **${recProfile.estimated_monthly_cost_inr.nominal === 0 ? '₹0 / month' : `₹${recProfile.estimated_monthly_cost_inr.min.toLocaleString('en-IN')}–₹${recProfile.estimated_monthly_cost_inr.max.toLocaleString('en-IN')}/mo`}**\n• **Database**: **PostgreSQL 15 (ACID Relational)**\n• **Why Recommended**: ${recProfile.why_recommended_bullet}\n\nClick **"Review Architecture & Cost Model"** on the right to inspect 4-way provider comparisons and approve the plan!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: [
              'Review Architecture & Cost Model 🚀',
              'Recalculate for 1,000 users',
              'Compare AWS vs Azure pricing'
            ]
          }
        ]);
      }
      setIsTyping(false);
    }, 450);
  };

  const handleProceedToReview = () => {
    const finalIr = {
      ...candidateIr,
      requirement_profile: reqProfile,
      architecture_plan: generateArchitecturePlan(candidateIr, reqProfile)
    };
    onCompleteIR(finalIr);
  };

  const currentPlan = candidateIr.architecture_plan || generateArchitecturePlan(candidateIr, reqProfile);
  const recOption = currentPlan.profiles[currentPlan.recommended_target];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">STEP 1 OF 3: REQUIREMENTS & ARCHITECTURE SIZING</span>
          <h2 className="text-xl font-bold text-slate-900">Define Scope, Scale & Cost Model</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {DOMAINS.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedDomain.id === d.id
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.display_name}
              </button>
            ))}
          </div>

          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Grid: Left Chat vs Right Architecture Blueprint & Cost Model */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Requirements Chat / Interactive Questions */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-[640px] justify-between">
          
          <div className="overflow-y-auto space-y-4 pr-2 max-h-[480px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/60">
                      {msg.suggestedReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => {
                            if (reply.includes('Review Architecture') || reply.includes('Review Blueprint')) {
                              handleProceedToReview();
                            } else {
                              handleSendMessage(reply);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 font-semibold text-[11px] shadow-xs hover:bg-indigo-50 transition-all text-left"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Synthesizing requirements & calculating cloud cost model...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Box */}
          <div className="pt-3 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. 250 registered users, 30 peak concurrent, confidential HR data..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Architecture & Cost Preview Card */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm h-[640px] text-slate-100 justify-between">
          
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Architecture & Cost Plan (Live)
                </span>
              </div>

              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[11px]">
                <button
                  onClick={() => setPreviewTab('visual')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewTab === 'visual' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Blueprint
                </button>
                <button
                  onClick={() => setPreviewTab('architecture')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewTab === 'architecture' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Cost Model
                </button>
                <button
                  onClick={() => setPreviewTab('json')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewTab === 'json' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Visual Preview */}
            {previewTab === 'visual' && (
              <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                
                {/* Sizing & Scale Box */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                    Workload & Sizing Profile
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Registered Users:</span>
                      <span className="font-bold text-white text-sm">{reqProfile.total_registered_users}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Peak Concurrent:</span>
                      <span className="font-bold text-emerald-400 text-sm">{reqProfile.concurrent_users}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Deployment Card */}
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      ⭐ Recommended Target
                    </span>
                    <span className="text-xs font-bold text-white">
                      {recOption.estimated_monthly_cost_inr.nominal === 0 ? '₹0 / mo' : `₹${recOption.estimated_monthly_cost_inr.nominal.toLocaleString('en-IN')}/mo`}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{recOption.display_name}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{recOption.why_recommended_bullet}</p>
                </div>

                {/* Database Spec */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                    Database & Relational Model
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold">PostgreSQL 15 (ACID Relational)</span>
                    <span className="text-emerald-400 font-mono text-[11px]">₹0 License (Free)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{candidateIr.entities.length} entities with strict foreign key constraints</p>
                </div>

              </div>
            )}

            {/* Architecture & Cost Model Tab */}
            {previewTab === 'architecture' && (
              <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Estimated 4-Way Infrastructure Costs
                  </span>
                  
                  <div className="space-y-1.5">
                    {(Object.values(currentPlan.profiles) as DeploymentProfileOption[]).map((p) => (
                      <div key={p.target_key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div>
                          <span className="font-semibold text-slate-200 block text-xs">{p.display_name.split('(')[0]}</span>
                          <span className="text-[10px] text-slate-400">{p.compute_spec.vCpu} vCPU, {p.compute_spec.ram_gb}GB RAM</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          {p.estimated_monthly_cost_inr.nominal === 0 ? '₹0/mo' : `₹${p.estimated_monthly_cost_inr.nominal.toLocaleString('en-IN')}/mo`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Raw JSON AST */}
            {previewTab === 'json' && (
              <div className="overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 border border-slate-800 max-h-[460px]">
                <pre className="whitespace-pre-wrap">{JSON.stringify(candidateIr, null, 2)}</pre>
              </div>
            )}

          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-800">
            <button
              id="requirements-proceed-review-btn"
              onClick={handleProceedToReview}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>Review Architecture & Cost Model</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
