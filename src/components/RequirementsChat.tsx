import React, { useState, useEffect, useRef } from 'react';
import { DOMAINS } from '../data/domains';
import { DomainDefinition, IntermediateRepresentation, ConversationMessage } from '../types/floe';
import { RequirementProfile, UserCountBracket, ApplicationCriticality, DataSensitivity, AvailabilityRequirement, DeploymentProfileOption } from '../types/architecture';
import { DEFAULT_REQUIREMENT_PROFILE, generateArchitecturePlan } from '../engine/architecturePlanner';
import { validateIR } from '../engine/irValidator';
import { AppLogoBadge } from './AppLogoBadge';
import { BrandingEditorModal } from './BrandingEditorModal';
import { WorkflowGraph } from './WorkflowGraph';
import { WorkflowStateDiagramModal } from './WorkflowStateDiagramModal';
import { EntityRelationshipsModal } from './EntityRelationshipsModal';
import { 
  Sparkles, Send, CheckCircle2, ArrowRight, Layers, Bot, User, 
  Users, TrendingUp, ShieldCheck, Database, DollarSign, Sliders, MessageSquare, Check, Server,
  Edit3, Image, Upload, Smile, Palette, Clock, Bell, GitBranch, Key, FileText, CheckSquare, Zap, Shield, HelpCircle,
  Maximize2, Table, Link2, ExternalLink
} from 'lucide-react';

interface RequirementsChatProps {
  onCompleteIR: (ir: IntermediateRepresentation) => void;
  onCancel: () => void;
  initialDomainId?: string;
  initialAppName?: string;
  initialLogo?: string;
  isDevMode?: boolean;
  activeAiModel?: string;
  onOpenAiSettings?: () => void;
}

const QUICK_LOGO_PRESETS = ['🌴', '🏖️', '💳', '🧾', '🎧', '💻', '🏢', '🚀', '🛡️', '📋', '⚡', '🎯', '📊', '🌿'];

interface QuestionStep {
  id: string;
  category: 'identity' | 'workflow' | 'roles' | 'policy' | 'notifications' | 'scale' | 'hosting' | 'scope' | 'entities' | 'reliability' | 'budget';
  categoryLabel: string;
  title: string;
  iconName: string;
  prompt: string;
  kind: 'text' | 'choice';
  options?: readonly string[] | string[];
  explanation: string;
  suggestions: {
    label: string;
    sublabel?: string;
    value: string;
    isRecommended?: boolean;
  }[];
}

export const RequirementsChat: React.FC<RequirementsChatProps> = ({
  onCompleteIR,
  onCancel,
  initialDomainId,
  initialAppName,
  initialLogo,
  isDevMode = false,
  activeAiModel = 'gpt-oss:120b-cloud',
  onOpenAiSettings
}) => {
  const initialDomain = DOMAINS.find(d => d.id === initialDomainId) || DOMAINS[0];
  const [selectedDomain, setSelectedDomain] = useState<DomainDefinition>(initialDomain);
  const [previewTab, setPreviewTab] = useState<'visual' | 'workflow' | 'erd' | 'architecture' | 'json'>(isDevMode ? 'json' : 'visual');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [candidateIr, setCandidateIr] = useState<IntermediateRepresentation>({
    ...initialDomain.default_ir,
    name: initialAppName || initialDomain.default_ir.name,
    logo: initialLogo || initialDomain.default_ir.logo || '🌴'
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isErdModalOpen, setIsErdModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Requirement Profile State (First-Class Architecture Dimension)
  const [reqProfile, setReqProfile] = useState<RequirementProfile>(DEFAULT_REQUIREMENT_PROFILE);

  // Form builder local fields
  const [formAppName, setFormAppName] = useState(initialAppName || initialDomain.default_ir.name);
  const [formLogo, setFormLogo] = useState(initialLogo || initialDomain.default_ir.logo || '🌴');

  // Build domain-adaptive, plain-language questions (Design Doc §1.2 & §1.3)
  const getDomainSpecificQuestions = (domain: DomainDefinition): QuestionStep[] => {
    const isLeave = domain.id.includes('leave');
    const isExpense = domain.id.includes('expense');
    const isEquipment = domain.id.includes('equipment');
    const isItsm = domain.id.includes('itsm') || domain.id.includes('service');
    const isFinance = domain.id.includes('finance') || domain.id.includes('invoice');

    // 1. app_name (kind: "text")
    const qAppName: QuestionStep = {
      id: 'app_name',
      category: 'identity',
      categoryLabel: 'App Name',
      title: 'App Name & Logo',
      iconName: 'Sparkles',
      prompt: 'What would you like to call this app?',
      kind: 'text',
      explanation: 'Defines your app title, UI header badge, and primary branding across all web views.',
      suggestions: [
        { label: `${domain.display_name} Portal`, sublabel: 'Standard Team Workspace', value: `${domain.display_name} Portal`, isRecommended: true },
        { label: `Enterprise ${domain.display_name} Hub`, sublabel: 'Multi-Department Suite', value: `Enterprise ${domain.display_name} Hub` },
        { label: `Modern ${domain.display_name}`, sublabel: 'Fast-Paced Workspace', value: `Modern ${domain.display_name}` },
        { label: `Global ${domain.display_name} System`, sublabel: 'Organization-Wide', value: `Global ${domain.display_name} System` }
      ]
    };

    // 2. what_to_track (kind: "text")
    const trackExample = isLeave
      ? 'employee leave requests and balances'
      : isExpense
      ? 'employee expense claims, receipts, and reimbursement balances'
      : isEquipment
      ? 'hardware items, asset assignments, and loaner returns'
      : isItsm
      ? 'IT support tickets, incident severity, and SLA timers'
      : isFinance
      ? 'vendor invoices, purchase order matching, and payment status'
      : 'requests, balances, records, and approvals';

    const qWhatToTrack: QuestionStep = {
      id: 'what_to_track',
      category: 'entities',
      categoryLabel: 'What to Track',
      title: 'Core Tracking Target',
      iconName: 'FileText',
      prompt: `What do you want to track? (e.g. ${trackExample})`,
      kind: 'text',
      explanation: 'Defines the core database entities, primary tracking ledger, and field relationships.',
      suggestions: [
        { label: `Track ${trackExample}`, sublabel: 'Standard core tracking profile', value: `Track ${trackExample}`, isRecommended: true },
        { label: `Detailed records with file attachments & notes`, sublabel: 'Rich document and history tracking', value: `Track ${trackExample} with detailed audit logs and document attachments` }
      ]
    };

    // 3. who_is_involved (kind: "text")
    const rolesExample = isLeave
      ? 'employees, their managers, HR'
      : isExpense
      ? 'employees, department managers, finance accounting'
      : isEquipment
      ? 'employees, IT custodians, asset administrators'
      : isItsm
      ? 'employees, support agents, IT department leads'
      : isFinance
      ? 'purchasers, vendors, finance controllers'
      : 'standard users, line managers, department admins';

    const qWhoIsInvolved: QuestionStep = {
      id: 'who_is_involved',
      category: 'roles',
      categoryLabel: 'Who is Involved',
      title: 'Stakeholders & Roles',
      iconName: 'Users',
      prompt: `Who's involved in this process? (e.g. ${rolesExample})`,
      kind: 'text',
      explanation: 'Configures role-based access control (RBAC), persona logins, and row-level data visibility.',
      suggestions: [
        { label: `Standard: ${rolesExample}`, sublabel: 'Multi-role permission matrix', value: `Standard roles: ${rolesExample}`, isRecommended: true },
        { label: `Strict Segregation: Requester, Approver, Auditor`, sublabel: 'Enterprise governance with dedicated audit persona', value: `Requester, Manager Approver, Auditor, and Admin` }
      ]
    };

    // 4. approval_needed (kind: "choice")
    const qApprovalNeeded: QuestionStep = {
      id: 'approval_needed',
      category: 'workflow',
      categoryLabel: 'Approval Needed',
      title: 'Approval Decision',
      iconName: 'GitBranch',
      prompt: "Does someone need to approve a request before it's final, or does it happen automatically?",
      kind: 'choice',
      options: ['Someone approves it', 'It happens automatically'] as const,
      explanation: 'Generates state machine transitions, manager sign-off stages, and conditional approval rules.',
      suggestions: [
        { label: 'Someone approves it', sublabel: 'Requires human review and sign-off', value: 'Someone approves it', isRecommended: true },
        { label: 'It happens automatically', sublabel: 'Immediate auto-approval with policy verification', value: 'It happens automatically' }
      ]
    };

    // 5. escalation (kind: "choice")
    const qEscalation: QuestionStep = {
      id: 'escalation',
      category: 'workflow',
      categoryLabel: 'Escalation',
      title: 'Timeout Escalation',
      iconName: 'Clock',
      prompt: "If the approver doesn't respond in time, should it go to someone else automatically?",
      kind: 'choice',
      options: ['Yes, escalate to someone else', 'No, just keep waiting'] as const,
      explanation: 'Configures SLA timers and automatic escalation nodes to department heads or HR.',
      suggestions: [
        { label: 'Yes, escalate to someone else', sublabel: '48-hour timeout escalates to senior admin', value: 'Yes, escalate to someone else', isRecommended: true },
        { label: 'No, just keep waiting', sublabel: 'Request remains pending until original approver acts', value: 'No, just keep waiting' }
      ]
    };

    // 6. notifications (kind: "choice")
    const qNotifications: QuestionStep = {
      id: 'notifications',
      category: 'notifications',
      categoryLabel: 'Notifications',
      title: 'Email & In-App Alerts',
      iconName: 'Bell',
      prompt: 'Should people get an email when something changes (like a request being approved)?',
      kind: 'choice',
      options: ['Yes', 'No'] as const,
      explanation: 'Enables email dispatch integrations and real-time in-app notification toasts.',
      suggestions: [
        { label: 'Yes', sublabel: 'Send automated email notifications & in-app alerts', value: 'Yes', isRecommended: true },
        { label: 'No', sublabel: 'In-app dashboard notifications only', value: 'No' }
      ]
    };

    // 7. expected_scale (kind: "choice")
    const qExpectedScale: QuestionStep = {
      id: 'expected_scale',
      category: 'scale',
      categoryLabel: 'User Scale',
      title: 'Expected Scale',
      iconName: 'Users',
      prompt: 'Roughly how many people will use this?',
      kind: 'choice',
      options: ['Fewer than 50', '50 to 500', '500 to 5,000', 'More than 5,000'] as const,
      explanation: 'Sizes database connection pools, caching memory, and background worker threads.',
      suggestions: [
        { label: '50 to 500', sublabel: 'Standard mid-size enterprise department', value: '50 to 500', isRecommended: true },
        { label: 'Fewer than 50', sublabel: 'Small team or agile squad', value: 'Fewer than 50' },
        { label: '500 to 5,000', sublabel: 'Large enterprise division with high concurrency', value: '500 to 5,000' },
        { label: 'More than 5,000', sublabel: 'Company-wide global deployment', value: 'More than 5,000' }
      ]
    };

    // 8. reliability (kind: "choice")
    const qReliability: QuestionStep = {
      id: 'reliability',
      category: 'reliability',
      categoryLabel: 'Reliability',
      title: 'Availability SLA',
      iconName: 'Shield',
      prompt: 'How important is it that this is always available?',
      kind: 'choice',
      options: ['Standard', 'Business-critical'] as const,
      explanation: 'Configures database multi-AZ failover, automated health checks, and backup frequency.',
      suggestions: [
        { label: 'Standard', sublabel: 'Normal business-hours availability with regular backups', value: 'Standard', isRecommended: true },
        { label: 'Business-critical', sublabel: '99.9% uptime SLA with active read-replicas & immediate failover', value: 'Business-critical' }
      ]
    };

    // 9. hosting_preference (kind: "choice")
    const qHostingPreference: QuestionStep = {
      id: 'hosting_preference',
      category: 'hosting',
      categoryLabel: 'Hosting Target',
      title: 'Hosting Preference',
      iconName: 'Server',
      prompt: 'Where do you want it hosted?',
      kind: 'choice',
      options: ['We host it for you', 'My own server', 'Just testing for now'] as const,
      explanation: 'Produces deployment manifests: Free Sandbox, Docker Compose, or Managed Cloud (AWS/GCP).',
      suggestions: [
        { label: 'We host it for you', sublabel: 'Fully managed cloud PaaS with automated patching', value: 'We host it for you', isRecommended: true },
        { label: 'My own server', sublabel: 'Self-hosted Docker Compose / On-premises VM', value: 'My own server' },
        { label: 'Just testing for now', sublabel: 'Instant free sandbox preview testbed', value: 'Just testing for now' }
      ]
    };

    // 10. budget_band (kind: "choice")
    const qBudgetBand: QuestionStep = {
      id: 'budget_band',
      category: 'budget',
      categoryLabel: 'Monthly Budget',
      title: 'Budget Band',
      iconName: 'DollarSign',
      prompt: "What's a comfortable monthly budget for running this?",
      kind: 'choice',
      options: ['Minimal', 'Low', 'Moderate', 'Higher'] as const,
      explanation: 'Tailors hardware tiering, serverless scale-to-zero settings, and cost optimization alerts.',
      suggestions: [
        { label: 'Low', sublabel: '$10 – $50/mo (Optimized lightweight container & managed database)', value: 'Low', isRecommended: true },
        { label: 'Minimal', sublabel: '$0 – $10/mo (Scale-to-zero serverless or free sandbox)', value: 'Minimal' },
        { label: 'Moderate', sublabel: '$50 – $200/mo (High reliability with dedicated resources)', value: 'Moderate' },
        { label: 'Higher', sublabel: '$200+/mo (High concurrency, multi-AZ, and strict SLA compliance)', value: 'Higher' }
      ]
    };

    return [
      qAppName,
      qWhatToTrack,
      qWhoIsInvolved,
      qApprovalNeeded,
      qEscalation,
      qNotifications,
      qExpectedScale,
      qReliability,
      qHostingPreference,
      qBudgetBand
    ];
  };

  const QUESTIONS_SEQUENCE = getDomainSpecificQuestions(selectedDomain);

  // Initialize on domain change
  useEffect(() => {
    const questions = getDomainSpecificQuestions(selectedDomain);
    const q1 = questions[0];
    const defaultLogo = initialLogo || (selectedDomain.id.includes('leave') ? '🌴' : 
                        selectedDomain.id.includes('expense') ? '💳' : 
                        selectedDomain.id.includes('equipment') ? '💻' : 
                        selectedDomain.id.includes('service') ? '🎧' : '🏢');
    
    const initialIr = {
      ...selectedDomain.default_ir,
      name: initialAppName || selectedDomain.default_ir.name,
      logo: defaultLogo
    };

    setCandidateIr(initialIr);
    setFormAppName(initialIr.name);
    setFormLogo(defaultLogo);
    setCurrentStepIndex(0);
    setMessages([
      {
        id: 'msg-init',
        role: 'assistant',
        content: `Hi! I'm your **Floe Requirements & Architecture Agent**.\n\nLet's configure your **${initialIr.name}** application, define your workflow approval rules, configure access roles, and compile your PostgreSQL database.\n\n${q1.prompt}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: q1.suggestions.map(s => s.value)
      }
    ]);
  }, [selectedDomain, initialAppName, initialLogo]);

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

    const nextQ = QUESTIONS_SEQUENCE[1];
    setMessages(prev => [
      ...prev, 
      userMsg,
      {
        id: `msg-brand-ack-${Date.now()}`,
        role: 'assistant',
        content: `✅ Perfect! Application brand configured as **${newName}** with updated visual logo.\n\n${nextQ.prompt}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: nextQ.suggestions.map(s => s.value)
      }
    ]);

    if (currentStepIndex === 0) {
      setCurrentStepIndex(1);
    }
  };

  /**
   * Apply predefined archetype configurations to accelerate setup
   */
  const handleApplyPresetPack = (packType: 'lean' | 'enterprise' | 'strict') => {
    let nextReq = { ...reqProfile };
    let nextIr: IntermediateRepresentation = JSON.parse(JSON.stringify(candidateIr));

    if (packType === 'lean') {
      nextReq.user_count_bracket = '11-50';
      nextReq.total_registered_users = 50;
      nextReq.concurrent_users = 10;
      nextReq.criticality = 'internal_business';
      nextReq.data_sensitivity = 'internal';
      nextReq.cloud_provider_preference = 'none';
      nextReq.availability = 'several_hours';
    } else if (packType === 'enterprise') {
      nextReq.user_count_bracket = '51-250';
      nextReq.total_registered_users = 250;
      nextReq.concurrent_users = 30;
      nextReq.criticality = 'business_critical';
      nextReq.data_sensitivity = 'confidential';
      nextReq.cloud_provider_preference = 'aws';
      nextReq.availability = 'under_1_hour';
    } else if (packType === 'strict') {
      nextReq.user_count_bracket = '251-1000';
      nextReq.total_registered_users = 1000;
      nextReq.concurrent_users = 120;
      nextReq.criticality = 'business_critical';
      nextReq.data_sensitivity = 'regulated';
      nextReq.cloud_provider_preference = 'none';
      nextReq.availability = 'near_zero_downtime';
    }

    setReqProfile(nextReq);
    nextIr.requirement_profile = nextReq;
    nextIr.architecture_plan = generateArchitecturePlan(nextIr, nextReq);
    setCandidateIr(nextIr);

    const packTitle = packType === 'lean' ? '⚡ Lean Fast-Track (1-Tier / 24h SLA)' : 
                      packType === 'enterprise' ? '🏢 Enterprise Standard (2-Tier / 48h SLA / Confidential)' : 
                      '🛡️ Strict Compliance & Audit (Multi-Tier / Regulated / On-Prem)';

    const userMsg: ConversationMessage = {
      id: `msg-user-preset-${Date.now()}`,
      role: 'user',
      content: `Applied preset archetype: **${packTitle}**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [
      ...prev,
      userMsg,
      {
        id: `msg-ack-preset-${Date.now()}`,
        role: 'assistant',
        content: `✅ Applied **${packTitle}**! Configured approval workflows, SLA timers, and database schemas.\n\nBlueprint is synchronized. You can review and launch your testbed immediately, or customize any remaining rule!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: [
          'Review & Launch Free Testbed 🚀',
          'Customize Role Permissions',
          'Adjust Timeout & Escalations'
        ]
      }
    ]);
  };

  const handleOpenWorkflowDiagram = () => {
    setPreviewTab('workflow');
    setIsWorkflowModalOpen(true);

    const userMsg: ConversationMessage = {
      id: `msg-user-wf-${Date.now()}`,
      role: 'user',
      content: 'Check workflow state diagram',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const wf = candidateIr.workflows[0];
    const nodeCount = wf?.nodes?.length || 4;
    const statesSummary = wf?.nodes?.map(n => `**${n.label || n.action || n.id}** (${n.execution_mode})`).join(' ➔ ') || 'Submitted ➔ Policy Check ➔ Manager Review ➔ Terminal Complete';

    const asstMsg: ConversationMessage = {
      id: `msg-asst-wf-${Date.now()}`,
      role: 'assistant',
      content: `📊 **Workflow State Machine Topology (${nodeCount} States)**\n\n• **Execution Path**: ${statesSummary}\n• **Deterministic AST Operations**: ₹0 token cost, instant execution without model drift.\n• **SLA Boundaries**: Human review gates include 48h timeout with automated escalation.\n\nI have opened the **Interactive Workflow State Graph Inspector**. You can also inspect the workflow topology anytime in the right tab!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedReplies: [
        'Review & Launch Free Testbed 🚀',
        'View entity relationships',
        'Check workflow state diagram'
      ]
    };

    setMessages(prev => [...prev, userMsg, asstMsg]);
  };

  const handleOpenEntityRelationships = () => {
    setPreviewTab('erd');
    setIsErdModalOpen(true);

    const userMsg: ConversationMessage = {
      id: `msg-user-erd-${Date.now()}`,
      role: 'user',
      content: 'View entity relationships',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const entitiesSummary = candidateIr.entities.map(e => `**${e.name}** (${e.fields.length} columns)`).join(', ');

    const asstMsg: ConversationMessage = {
      id: `msg-asst-erd-${Date.now()}`,
      role: 'assistant',
      content: `🗄️ **PostgreSQL 15 Relational Entity Diagram (ERD)**\n\n• **Tables (${candidateIr.entities.length})**: ${entitiesSummary}\n• **Foreign Key Integrity**: Strict UUID primary keys & relational foreign key cascades.\n• **Prisma / SQL Schema**: Fully compiled DDL available for instant inspection and export.\n\nI have opened the **Entity Relationships & Schema Inspector**. You can also explore tables in the right panel!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedReplies: [
        'Review & Launch Free Testbed 🚀',
        'Check workflow state diagram',
        'View entity relationships'
      ]
    };

    setMessages(prev => [...prev, userMsg, asstMsg]);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const lower = text.toLowerCase();

    // Check for workflow or ERD intent
    if (lower.includes('workflow state diagram') || lower.includes('workflow diagram') || lower.includes('state diagram') || lower.includes('workflow graph') || lower === 'workflow') {
      handleOpenWorkflowDiagram();
      setInputValue('');
      return;
    }

    if (lower.includes('entity relationship') || lower.includes('entity relationships') || lower.includes('erd') || lower.includes('database schema') || lower.includes('view schema') || lower.includes('tables')) {
      handleOpenEntityRelationships();
      setInputValue('');
      return;
    }

    const userMsg: ConversationMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // 1. Domain & Requirement Mapping based on current step
    let nextReq = { ...reqProfile };
    let nextIr: IntermediateRepresentation = JSON.parse(JSON.stringify(candidateIr));

    const currentQ = QUESTIONS_SEQUENCE[currentStepIndex];
    if (currentQ) {
      if (currentQ.id === 'app_name') {
        if (text.trim().length > 1) {
          nextIr.name = text.length > 60 ? text.substring(0, 60) : text.trim();
          setFormAppName(nextIr.name);
        }
      } else if (currentQ.id === 'what_to_track') {
        nextIr.description = text.trim();
      } else if (currentQ.id === 'who_is_involved') {
        // Roles context mapping
      } else if (currentQ.id === 'approval_needed') {
        if (lower.includes('automatically') || lower.includes('auto') || lower.includes('without approval')) {
          if (nextIr.workflows && nextIr.workflows[0]?.nodes) {
            nextIr.workflows[0].nodes = nextIr.workflows[0].nodes.map(n => 
              n.type === 'human' ? { ...n, type: 'action' as const, label: 'Policy Auto-Verification' } : n
            );
          }
        }
      } else if (currentQ.id === 'escalation') {
        if (lower.includes('yes') || lower.includes('escalate')) {
          if (nextIr.workflows && nextIr.workflows[0]?.nodes) {
            nextIr.workflows[0].nodes.forEach(n => {
              if (n.type === 'human') n.timeout = '48h';
            });
          }
        } else if (lower.includes('no') || lower.includes('waiting')) {
          if (nextIr.workflows && nextIr.workflows[0]?.nodes) {
            nextIr.workflows[0].nodes.forEach(n => {
              if (n.type === 'human') delete n.timeout;
            });
          }
        }
      } else if (currentQ.id === 'notifications') {
        if (lower.includes('yes')) {
          if (!nextIr.integrations?.some(i => i.type === 'email')) {
            nextIr.integrations = [
              ...(nextIr.integrations || []),
              { type: 'email', purpose: 'Email Delivery (SMTP/SendGrid)', config: { event: 'status_changed' } }
            ];
          }
        } else if (lower.includes('no')) {
          nextIr.integrations = (nextIr.integrations || []).filter(i => i.type !== 'email');
        }
      } else if (currentQ.id === 'expected_scale') {
        if (lower.includes('fewer than 50') || lower.includes('<50') || lower.includes('small') || lower.includes('1–10')) {
          nextReq.user_count_bracket = '11-50';
          nextReq.total_registered_users = 50;
          nextReq.concurrent_users = 10;
          nextReq.growth_12_months_users = 150;
        } else if (lower.includes('50 to 500') || lower.includes('250')) {
          nextReq.user_count_bracket = '51-250';
          nextReq.total_registered_users = 250;
          nextReq.concurrent_users = 30;
          nextReq.growth_12_months_users = 500;
        } else if (lower.includes('500 to 5,000') || lower.includes('500 to 5000') || lower.includes('1000')) {
          nextReq.user_count_bracket = '251-1000';
          nextReq.total_registered_users = 1000;
          nextReq.concurrent_users = 120;
          nextReq.growth_12_months_users = 3000;
        } else if (lower.includes('more than 5,000') || lower.includes('more than 5000') || lower.includes('10,000')) {
          nextReq.user_count_bracket = '10000+';
          nextReq.total_registered_users = 10000;
          nextReq.concurrent_users = 1200;
          nextReq.growth_12_months_users = 25000;
        }
      } else if (currentQ.id === 'reliability') {
        if (lower.includes('business-critical') || lower.includes('critical') || lower.includes('99.9')) {
          nextReq.criticality = 'business_critical';
          nextReq.availability = 'under_1_hour';
        } else {
          nextReq.criticality = 'internal_business';
          nextReq.availability = 'several_hours';
        }
      } else if (currentQ.id === 'hosting_preference') {
        if (lower.includes('we host') || lower.includes('managed') || lower.includes('cloud')) {
          nextReq.cloud_provider_preference = 'aws';
        } else if (lower.includes('my own server') || lower.includes('on-prem') || lower.includes('docker')) {
          nextReq.cloud_provider_preference = 'none';
        } else if (lower.includes('testing') || lower.includes('sandbox')) {
          nextReq.cloud_provider_preference = 'none';
        }
      } else if (currentQ.id === 'budget_band') {
        if (lower.includes('minimal') || lower.includes('under $20')) {
          nextReq.criticality = 'dev_demo';
          nextReq.availability = 'several_hours';
        } else if (lower.includes('low')) {
          nextReq.criticality = 'internal_business';
        } else if (lower.includes('moderate')) {
          nextReq.criticality = 'internal_business';
        } else if (lower.includes('higher') || lower.includes('$200+')) {
          nextReq.criticality = 'business_critical';
          nextReq.availability = 'under_1_hour';
        }
      }
    }

    // Additional NLP fallback checks
    if (lower.includes('confidential') || lower.includes('hr') || lower.includes('salary')) {
      nextReq.data_sensitivity = 'confidential';
    } else if (lower.includes('regulated') || lower.includes('hipaa') || lower.includes('strict')) {
      nextReq.data_sensitivity = 'regulated';
      nextReq.availability = 'near_zero_downtime';
    }

    if (lower.includes('aws') || lower.includes('amazon')) {
      nextReq.cloud_provider_preference = 'aws';
    } else if (lower.includes('azure') || lower.includes('microsoft')) {
      nextReq.cloud_provider_preference = 'azure';
    } else if (lower.includes('gcp') || lower.includes('google')) {
      nextReq.cloud_provider_preference = 'gcp';
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
            content: `${nextQ.prompt}\n\n*💡 ${nextQ.explanation}*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: nextQ.suggestions.map(s => s.value)
          }
        ]);
      } else {
        const plan = generateArchitecturePlan(nextIr, nextReq);
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg-complete-${Date.now()}`,
            role: 'assistant',
            content: `🎉 **Application Blueprint & Specifications Ready!**\n\nApp Identity: **${nextIr.name}**\n\n• **🧪 Test Environment**: **Free Sandbox (₹0 Cost)** — Deploy instantly to verify database tables, workflow state changes, and role permissions.\n• **👥 RBAC Roles**: ${nextIr.roles?.length || 4} configured personas with simulated logins.\n• **🔄 State Machine**: ${nextIr.workflows[0]?.nodes?.length || 4} states with automated escalation.\n• **🗄️ Database Architecture**: **PostgreSQL 15 (ACID Relational)** with ${nextIr.entities.length} tables & strict foreign key governance.\n\nClick **"Review & Launch Free Testbed"** on the right to review schemas and start testing!`,
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
    }, 400);
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
  const activeStep = QUESTIONS_SEQUENCE[Math.min(currentStepIndex, QUESTIONS_SEQUENCE.length - 1)];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">STEP 1 OF 3: REQUIREMENTS & ARCHITECTURE SPEC</span>
          <h2 className="text-xl font-bold text-slate-900">Define App Name, Logo & Business Rules</h2>
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

          {onOpenAiSettings && (
            <button
              onClick={onOpenAiSettings}
              title="Configure AI Model & Keys"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-semibold border border-slate-700 transition-colors shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeAiModel}</span>
            </button>
          )}

          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Archetype Quick Preset Bar */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Quick Configuration Presets:</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Apply standard enterprise or startup rules in one click:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleApplyPresetPack('lean')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
          >
            <span>⚡ Lean Fast-Track (24h SLA)</span>
          </button>
          <button
            onClick={() => handleApplyPresetPack('enterprise')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1 border-indigo-200"
          >
            <span>🏢 Enterprise Standard (48h / 2-Tier)</span>
          </button>
          <button
            onClick={() => handleApplyPresetPack('strict')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
          >
            <span>🛡️ Strict Compliance (On-Prem)</span>
          </button>
        </div>
      </div>

      {/* Step Navigation Progress Chips (10 Steps) */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
        {QUESTIONS_SEQUENCE.map((q, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <button
              key={q.id}
              onClick={() => {
                setCurrentStepIndex(idx);
                setMessages(prev => [
                  ...prev,
                  {
                    id: `msg-nav-${Date.now()}`,
                    role: 'assistant',
                    content: `Switched to **${q.title}** (${q.categoryLabel}):\n\n${q.prompt}\n\n*💡 ${q.explanation}*`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    suggestedReplies: q.suggestions.map(s => s.value)
                  }
                ]);
              }}
              className={`p-2 rounded-xl text-left border transition-all ${
                isCurrent 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                  : isCompleted 
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Step {idx + 1}
                </span>
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
              <p className="text-xs font-bold truncate">{q.categoryLabel}</p>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Chat vs Right Architecture Blueprint & Cost Model */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Requirements Chat / Interactive Questions */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-[680px] justify-between">
          
          <div className="overflow-y-auto space-y-4 pr-2 max-h-[520px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-[90%] space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>

                  {/* Interactive Branding Card in Chat for Step 0 */}
                  {msg.id === 'msg-init' && (
                    <div className="mt-3 p-4 bg-white rounded-xl border border-indigo-200/90 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span>App Identity & Branding</span>
                        </span>
                        <button
                          onClick={() => setIsBrandingModalOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-colors flex items-center gap-1"
                        >
                          <Palette className="w-3 h-3" />
                          <span>Full Branding Studio</span>
                        </button>
                      </div>

                      {/* App Name Direct Prompt Field */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase text-slate-700">
                          Application Name
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={candidateIr.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCandidateIr(prev => ({ ...prev, name: val }));
                              setFormAppName(val);
                            }}
                            placeholder="Enter your application name..."
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Quick Icon Selector Row */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-600">Application Logo / Icon:</span>
                          <span className="text-[10px] text-indigo-600 font-medium">Selected: {candidateIr.logo?.startsWith('data:') ? 'Custom Image' : candidateIr.logo}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_LOGO_PRESETS.map((icon, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCandidateIr(prev => ({ ...prev, logo: icon }));
                                setFormLogo(icon);
                              }}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all border ${
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

                  {/* Rich Suggestion Cards */}
                  {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200/60">
                      {msg.suggestedReplies.map((reply, rIdx) => {
                        const isReviewBtn = reply.includes('Review & Launch Free Testbed') || reply.includes('Review Architecture') || reply.includes('Review Blueprint');
                        const isWorkflowBtn = reply.toLowerCase().includes('workflow state diagram') || reply.toLowerCase().includes('workflow diagram') || reply.toLowerCase().includes('state diagram');
                        const isErdBtn = reply.toLowerCase().includes('entity relationship') || reply.toLowerCase().includes('entity relationships') || reply.toLowerCase().includes('database schema') || reply.toLowerCase().includes('erd');

                        return (
                          <button
                            key={rIdx}
                            onClick={() => {
                              if (isReviewBtn) {
                                handleProceedToReview();
                              } else if (isWorkflowBtn) {
                                handleOpenWorkflowDiagram();
                              } else if (isErdBtn) {
                                handleOpenEntityRelationships();
                              } else {
                                handleSendMessage(reply);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                              isReviewBtn 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-emerald-500 shadow-sm'
                                : isWorkflowBtn
                                ? 'bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200 text-indigo-950 font-semibold'
                                : isErdBtn
                                ? 'bg-sky-50/80 hover:bg-sky-100/80 border-sky-200 text-sky-950 font-semibold'
                                : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              {isWorkflowBtn && <GitBranch className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                              {isErdBtn && <Database className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                              <span className={`text-xs block ${isReviewBtn ? 'text-white font-bold' : isWorkflowBtn ? 'text-indigo-900 font-bold' : isErdBtn ? 'text-sky-900 font-bold' : 'font-semibold text-slate-900'}`}>
                                {reply}
                              </span>
                            </div>
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isReviewBtn ? 'text-white' : isWorkflowBtn ? 'text-indigo-600' : isErdBtn ? 'text-sky-600' : 'text-indigo-500'}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Synthesizing requirements & updating PostgreSQL schemas...</span>
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
                placeholder={currentStepIndex === 0 ? "Type your app name (e.g. Enterprise Global Leave & PTO)..." : `Answer Step ${currentStepIndex + 1} (${activeStep.categoryLabel}) or customize rules...`}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Architecture & Cost Preview Card */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm h-[680px] text-slate-100 justify-between">
          
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Architecture Blueprint (Live)
                </span>
              </div>

              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[11px] overflow-x-auto max-w-full">
                <button
                  onClick={() => setPreviewTab('visual')}
                  className={`px-2 py-0.5 rounded font-medium shrink-0 ${
                    previewTab === 'visual' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Testbed
                </button>
                <button
                  onClick={() => setPreviewTab('workflow')}
                  className={`px-2 py-0.5 rounded font-medium shrink-0 flex items-center gap-1 ${
                    previewTab === 'workflow' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitBranch className="w-3 h-3" />
                  <span>Workflow</span>
                </button>
                <button
                  onClick={() => setPreviewTab('erd')}
                  className={`px-2 py-0.5 rounded font-medium shrink-0 flex items-center gap-1 ${
                    previewTab === 'erd' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>ERD & Tables</span>
                </button>
                <button
                  onClick={() => setPreviewTab('architecture')}
                  className={`px-2 py-0.5 rounded font-medium shrink-0 ${
                    previewTab === 'architecture' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Prod Sizing
                </button>
                <button
                  onClick={() => setPreviewTab('json')}
                  className={`px-2 py-0.5 rounded font-medium shrink-0 ${
                    previewTab === 'json' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Visual Preview */}
            {previewTab === 'visual' && (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                
                {/* Brand Identity Card */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                      Domain & Target Scope
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleOpenWorkflowDiagram}
                        className="text-[10px] text-indigo-300 hover:text-white font-medium flex items-center gap-1 bg-indigo-900/50 hover:bg-indigo-900 px-2 py-0.5 rounded border border-indigo-700/50 transition-colors"
                      >
                        <GitBranch className="w-2.5 h-2.5" />
                        <span>Diagram</span>
                      </button>
                      <button
                        onClick={handleOpenEntityRelationships}
                        className="text-[10px] text-sky-300 hover:text-white font-medium flex items-center gap-1 bg-sky-900/50 hover:bg-sky-900 px-2 py-0.5 rounded border border-sky-700/50 transition-colors"
                      >
                        <Database className="w-2.5 h-2.5" />
                        <span>ERD</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div 
                      onClick={handleOpenEntityRelationships}
                      className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all"
                    >
                      <span className="text-slate-400 text-[10px] block">Entities:</span>
                      <span className="font-bold text-white text-sm">{candidateIr.entities.length} Tables</span>
                    </div>
                    <div 
                      onClick={handleOpenWorkflowDiagram}
                      className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all"
                    >
                      <span className="text-slate-400 text-[10px] block">Workflow:</span>
                      <span className="font-bold text-emerald-400 text-sm">{candidateIr.workflows[0]?.nodes?.length || 4} States</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Roles:</span>
                      <span className="font-bold text-indigo-400 text-sm">{candidateIr.roles?.length || 4} Roles</span>
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
                  <p className="text-[11px] text-slate-400">{candidateIr.entities.length} entities with strict foreign key constraints & Prisma schema</p>
                </div>

                {/* Note about production */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
                  💡 <span className="text-slate-300 font-semibold">Production Cloud Hosting (AWS / Azure / GCP / On-Prem)</span> cost analysis is configured when you promote to production after testing.
                </div>

              </div>
            )}

            {/* Workflow State Machine Tab */}
            {previewTab === 'workflow' && (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">State Machine Topology</span>
                    <h4 className="text-xs font-bold text-white">{candidateIr.workflows[0]?.name || 'Primary Workflow Engine'}</h4>
                  </div>
                  <button
                    onClick={() => setIsWorkflowModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand Graph</span>
                  </button>
                </div>

                {/* Interactive Workflow Graph */}
                {candidateIr.workflows[0] && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
                    <WorkflowGraph workflow={candidateIr.workflows[0]} />
                  </div>
                )}

                {/* States Breakdown */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    State Machine Nodes ({candidateIr.workflows[0]?.nodes?.length || 0})
                  </span>
                  {(candidateIr.workflows[0]?.nodes || []).map((node, idx) => (
                    <div key={node.id || idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 block truncate">{node.label || node.action || node.id}</span>
                          <span className="text-[10px] text-slate-400">{node.type} node</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        node.execution_mode === 'deterministic' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' :
                        (node.execution_mode === 'ai' || node.execution_mode === 'agentic') ? 'bg-purple-950 text-purple-300 border border-purple-800/50' :
                        'bg-amber-950 text-amber-300 border border-amber-800/50'
                      }`}>
                        {node.execution_mode || 'deterministic'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entity Relationships & Tables Tab */}
            {previewTab === 'erd' && (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-sky-950/40 border border-sky-800/40">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">PostgreSQL Relational ERD</span>
                    <h4 className="text-xs font-bold text-white">{candidateIr.entities.length} Relational Entities</h4>
                  </div>
                  <button
                    onClick={() => setIsErdModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand ERD</span>
                  </button>
                </div>

                {/* Entity Tables List */}
                <div className="space-y-2">
                  {candidateIr.entities.map((entity, eIdx) => (
                    <div key={entity.name || eIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Table className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-xs font-bold text-slate-100">{entity.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{entity.fields.length} fields</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {entity.fields.slice(0, 6).map((field) => (
                          <div key={field.name} className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80">
                            <span className="text-slate-300 truncate font-mono text-[10px]">{field.name}</span>
                            <span className="text-[10px] text-sky-400 font-mono font-medium">{field.type}</span>
                          </div>
                        ))}
                      </div>
                      {entity.fields.length > 6 && (
                        <p className="text-[10px] text-slate-400 text-center pt-0.5">
                          + {entity.fields.length - 6} more fields in full schema
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Architecture & Cost Model Tab */}
            {previewTab === 'architecture' && (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 text-xs">
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
              <div className="overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 border border-slate-800 max-h-[500px]">
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

      {/* Workflow State Machine Diagram Modal */}
      <WorkflowStateDiagramModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        ir={candidateIr}
        onProceedToTestbed={handleProceedToReview}
      />

      {/* Entity Relationships & SQL DDL Modal */}
      <EntityRelationshipsModal
        isOpen={isErdModalOpen}
        onClose={() => setIsErdModalOpen(false)}
        ir={candidateIr}
        onProceedToTestbed={handleProceedToReview}
      />

    </div>
  );
};


