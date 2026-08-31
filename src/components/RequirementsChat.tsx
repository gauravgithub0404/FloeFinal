import React, { useState, useEffect, useRef } from 'react';
import { DOMAINS } from '../data/domains';
import { DomainDefinition, IntermediateRepresentation, ConversationMessage } from '../types/floe';
import { RequirementProfile, UserCountBracket, ApplicationCriticality, DataSensitivity, AvailabilityRequirement, DeploymentProfileOption } from '../types/architecture';
import { DEFAULT_REQUIREMENT_PROFILE, generateArchitecturePlan } from '../engine/architecturePlanner';
import { validateIR } from '../engine/irValidator';
import { AppLogoBadge } from './AppLogoBadge';
import { BrandingEditorModal } from './BrandingEditorModal';
import { 
  Sparkles, Send, CheckCircle2, ArrowRight, Layers, Bot, User, 
  Users, TrendingUp, ShieldCheck, Database, DollarSign, Sliders, MessageSquare, Check, Server,
  Edit3, Image, Upload, Smile, Palette
} from 'lucide-react';

interface RequirementsChatProps {
  onCompleteIR: (ir: IntermediateRepresentation) => void;
  onCancel: () => void;
  initialDomainId?: string;
  isDevMode?: boolean;
}

const QUICK_LOGO_PRESETS = ['🌴', '🏖️', '💳', '🧾', '🎧', '💻', '🏢', '🚀', '🛡️', '📋', '⚡', '🎯', '📊', '🌿'];

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
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Requirement Profile State (First-Class Architecture Dimension)
  const [reqProfile, setReqProfile] = useState<RequirementProfile>(DEFAULT_REQUIREMENT_PROFILE);

  // Form builder local fields
  const [formAppName, setFormAppName] = useState(initialDomain.default_ir.name);
  const [formLogo, setFormLogo] = useState(initialDomain.default_ir.logo || '🌴');
  const [formDefaultBal, setFormDefaultBal] = useState('20');
  const [formTimeoutHours, setFormTimeoutHours] = useState('48');

  // Multi-step sequential requirements wizard
  const QUESTIONS_SEQUENCE = [
    {
      id: 'step_name_scope',
      question: `🎨 **Step 1: Application Name & Brand Identity**\nWhat would you like to **name your application**, and which **logo / icon** should represent it?`,
      suggestions: [
        `${selectedDomain.display_name} Core Portal`,
        `Enterprise ${selectedDomain.display_name} Hub`,
        `Acme Global ${selectedDomain.display_name}`,
        `Modern ${selectedDomain.display_name} Studio`
      ]
    },
    {
      id: 'step_user_count',
      question: `👥 **Step 2: Total User Base**\nHow many **total registered users** do you expect will use the application?`,
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
      question: `⚡ **Step 3: Peak Concurrency**\nHow many users are expected to use the application **at the exact same time**?`,
      suggestions: [
        '5–10 concurrent users',
        '25–30 concurrent users',
        '50–100 concurrent users',
        '250+ peak concurrent users'
      ]
    },
    {
      id: 'step_growth',
      question: `📈 **Step 4: Scale & Growth**\nWhat is your expected **user growth over the next 12 months**?`,
      suggestions: [
        '2x growth (e.g. 500 users in 12m)',
        '3x–5x rapid scale',
        'Steady state (< 20% growth)'
      ]
    },
    {
      id: 'step_criticality_data',
      question: `🛡️ **Step 5: Data Sensitivity & SLA**\nHow critical is this application and what type of data will it store?`,
      suggestions: [
        'Internal business data (Confidential HR/Operations)',
        'Development / Team Demo prototype',
        'Business Critical (< 1h downtime tolerance)',
        'Highly regulated data (Strict on-prem residency)'
      ]
    },
    {
      id: 'step_target_pref',
      question: `🚀 **Step 6: Hosting Target**\nWhere should this application run in production?`,
      suggestions: [
        '⭐ Let Floe recommend based on scale & cost',
        'Amazon Web Services (AWS)',
        'Enterprise On-Premises Server',
        'Deploy to Laptop 2 (gaurav - Private Tailscale)'
      ]
    }
  ];

  // Initialize on domain change
  useEffect(() => {
    const q1 = QUESTIONS_SEQUENCE[0];
    const defaultLogo = selectedDomain.id.includes('leave') ? '🌴' : 
                        selectedDomain.id.includes('expense') ? '💳' : 
                        selectedDomain.id.includes('equipment') ? '💻' : 
                        selectedDomain.id.includes('service') ? '🎧' : '🏢';
    
    const initialIr = {
      ...selectedDomain.default_ir,
      logo: selectedDomain.default_ir.logo || defaultLogo
    };

    setCandidateIr(initialIr);
    setFormAppName(initialIr.name);
    setFormLogo(defaultLogo);
    setCurrentStepIndex(0);
    setMessages([
      {
        id: 'msg-init',
        role: 'assistant',
        content: `Hi! I'm your **Floe Requirements & Architecture Agent**.\n\nLet's configure your **${selectedDomain.display_name}** application, define your logo & branding, and compile your database.\n\n${q1.question}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: q1.suggestions
      }
    ]);
  }, [selectedDomain]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleUpdateBranding = (newName: string, newLogo: string) => {
    setCandidateIr(prev => ({
      ...prev,
      name: newName,
      logo: newLogo
    }));
    setFormAppName(newName);
    setFormLogo(newLogo);

    const userMsg: ConversationMessage = {
      id: `msg-brand-${Date.now()}`,
      role: 'user',
      content: `Updated app branding: **${newName}** (Logo: ${newLogo.startsWith('data:') ? 'Custom Upload' : newLogo})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [
      ...prev, 
      userMsg,
      {
        id: `msg-brand-ack-${Date.now()}`,
        role: 'assistant',
        content: `✅ Perfect! Application brand configured as **${newName}** with updated visual logo.\n\nNow, how many **total registered users** do you expect in the system?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: QUESTIONS_SEQUENCE[1].suggestions
      }
    ]);

    if (currentStepIndex === 0) {
      setCurrentStepIndex(1);
    }
  };

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

    // Handle name input on step 0
    if (currentStepIndex === 0 && text.length > 2 && !text.includes('1–10')) {
      nextIr.name = text.length > 60 ? text.substring(0, 60) : text;
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
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg-complete-${Date.now()}`,
            role: 'assistant',
            content: `🎉 **Application Blueprint & Specifications Ready!**\n\nApp Identity: **${nextIr.name}**\n\n• **🧪 Test Environment**: **Free Sandbox (₹0 Cost)** — Deploy instantly to verify database tables, workflow state changes, and role permissions.\n• **🚀 Production Deployment**: Ready for promotion (AWS, Azure, GCP, or On-Premises) with real-time cost analysis when you decide to go live!\n• **Database Architecture**: **PostgreSQL 15 (ACID Relational)** with ${nextIr.entities.length} tables & strict foreign key governance.\n\nClick **"Review & Launch Free Testbed"** on the right to review schemas and start testing!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: [
              'Review & Launch Free Testbed 🚀',
              'Check workflow state diagram',
              'View entity relationships'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">STEP 1 OF 3: REQUIREMENTS & BRANDING</span>
          <h2 className="text-xl font-bold text-slate-900">Define App Name, Logo & Business Workflows</h2>
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
            onClick={() => setIsBrandingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Customize Logo & Name</span>
          </button>

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
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-[660px] justify-between">
          
          <div className="overflow-y-auto space-y-4 pr-2 max-h-[500px]">
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
                  className={`p-3.5 rounded-2xl max-w-[88%] space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Interactive Branding Card in Chat for Step 0 */}
                  {msg.id === 'msg-init' && (
                    <div className="mt-3 p-3.5 bg-white rounded-xl border border-indigo-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AppLogoBadge logo={candidateIr.logo} name={candidateIr.name} domain={candidateIr.domain} size="md" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Selected Brand Identity</span>
                            <span className="text-xs font-bold text-slate-900">{candidateIr.name}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsBrandingModalOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Change Logo & Name</span>
                        </button>
                      </div>

                      {/* Quick Icon Selector Row */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1.5">Pick a quick logo icon:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_LOGO_PRESETS.map((icon, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCandidateIr(prev => ({ ...prev, logo: icon }));
                                setFormLogo(icon);
                              }}
                              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all border ${
                                candidateIr.logo === icon
                                  ? 'bg-indigo-50 border-indigo-500 scale-110 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/60">
                      {msg.suggestedReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => {
                            if (reply.includes('Review & Launch Free Testbed') || reply.includes('Review Architecture') || reply.includes('Review Blueprint')) {
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
                <span>Synthesizing requirements & compiling blueprint...</span>
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
              <button
                type="button"
                onClick={() => setIsBrandingModalOpen(true)}
                title="Edit App Name & Logo"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors shrink-0"
              >
                <Palette className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentStepIndex === 0 ? "Type your app name (e.g. Acme Global Leave & PTO)..." : "e.g. 250 registered users, 30 peak concurrent, confidential HR data..."}
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
        <div className="lg:col-span-5 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm h-[660px] text-slate-100 justify-between">
          
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Architecture & Branding (Live)
                </span>
              </div>

              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[11px]">
                <button
                  onClick={() => setPreviewTab('visual')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewTab === 'visual' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Testbed
                </button>
                <button
                  onClick={() => setPreviewTab('architecture')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewTab === 'architecture' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Prod Sizing
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
              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
                
                {/* Brand Identity Card */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AppLogoBadge logo={candidateIr.logo} name={candidateIr.name} domain={candidateIr.domain} size="md" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Application Identity</span>
                      <h4 className="text-xs font-bold text-white truncate">{candidateIr.name}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBrandingModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-400" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Free Sandbox Badge Card */}
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      🧪 Free Sandbox Testbed
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-300">
                      ₹0 Free Plan
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">Live Interactive Testbed</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Test live forms, role workflows, and CRUD operations for free in the sandbox before committing to production.
                  </p>
                </div>

                {/* Scope Profile */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                    Domain & Target Scope
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Entities (Tables):</span>
                      <span className="font-bold text-white text-sm">{candidateIr.entities.length} Tables</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Workflow Steps:</span>
                      <span className="font-bold text-emerald-400 text-sm">{candidateIr.workflows[0]?.nodes?.length || 4} States</span>
                    </div>
                  </div>
                </div>

                {/* Database Spec */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                    Database & Relational Model
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold">PostgreSQL 15 (ACID Relational)</span>
                    <span className="text-emerald-400 font-mono text-[11px]">₹0 Sandbox</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{candidateIr.entities.length} entities with strict foreign key constraints</p>
                </div>

                {/* Note about production */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
                  💡 <span className="text-slate-300 font-semibold">Production Cloud Hosting (AWS / Azure / GCP / On-Prem)</span> cost analysis is configured when you promote to production after testing.
                </div>

              </div>
            )}

            {/* Architecture & Cost Model Tab */}
            {previewTab === 'architecture' && (
              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Production Cloud Sizing
                    </span>
                    <span className="text-[10px] text-indigo-400 font-semibold">On Promotion</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sized for {reqProfile.total_registered_users} registered users ({reqProfile.concurrent_users} peak concurrent).
                  </p>
                  
                  <div className="space-y-1.5 pt-1">
                    {(Object.values(currentPlan.profiles || {}) as DeploymentProfileOption[]).map((p) => (
                      <div key={p.target_key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div>
                          <span className="font-semibold text-slate-200 block text-xs">{p.display_name.split('(')[0]}</span>
                          <span className="text-[10px] text-slate-400">{p.compute_spec.vCpu} vCPU, {p.compute_spec.ram_gb}GB RAM</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          {p.estimated_monthly_cost_inr ? (p.estimated_monthly_cost_inr.nominal === 0 ? '₹0/mo' : `₹${p.estimated_monthly_cost_inr.nominal.toLocaleString('en-IN')}/mo`) : '₹0/mo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Raw JSON AST */}
            {previewTab === 'json' && (
              <div className="overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 border border-slate-800 max-h-[480px]">
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
              <span>Review Blueprint & Launch Testbed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Branding Editor Modal */}
      <BrandingEditorModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        appName={candidateIr.name}
        appLogo={candidateIr.logo}
        domain={candidateIr.domain}
        onSave={handleUpdateBranding}
      />

    </div>
  );
};

