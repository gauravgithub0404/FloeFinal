import React, { useState } from 'react';
import { IntermediateRepresentation } from '../types/floe';
import { AuthUser, PRESET_USERS, UserRole, checkPermission } from '../types/auth';
import { AppLoginScreen } from './auth/AppLoginScreen';
import { RbacMatrixViewer } from './auth/RbacMatrixViewer';
import { AppLogoBadge } from './AppLogoBadge';
import { EquipmentSandboxView } from './EquipmentSandboxView';
import { ExpenseSandboxView } from './ExpenseSandboxView';
import { 
  Play, Sparkles, CheckCircle2, XCircle, Clock, ShieldCheck, User, 
  ArrowRight, RefreshCw, Send, AlertCircle, Info, Database, Headset, 
  MessageSquare, Tag, Paperclip, BarChart3, Users, Check, AlertTriangle, 
  Filter, Zap, Shield, HelpCircle, LogOut, Key, Lock, ChevronDown
} from 'lucide-react';

interface LiveAppSandboxProps {
  ir: IntermediateRepresentation;
  appName?: string;
  onGoToProduction?: () => void;
}

interface SimulatedLeaveRequest {
  id: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reasonText: string;
  aiCategory?: string;
  aiConfidence?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  submittedAt: string;
  managerNotes?: string;
  workflowRunId: string;
}

interface SimulatedTicket {
  id: string;
  ticketNumber: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  category: 'Hardware' | 'Software & OS' | 'Access & Permissions' | 'Network & VPN' | 'Email & Communication';
  priority: 'P1_Critical' | 'P2_High' | 'P3_Medium' | 'P4_Low';
  description: string;
  attachmentName?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_on_user' | 'resolved';
  assignedAgent?: string;
  slaTargetHours: number;
  slaRemainingMinutes: number;
  aiDiagnostic?: string;
  submittedAt: string;
  resolvedAt?: string;
  comments: Array<{
    id: string;
    author: string;
    role: UserRole;
    text: string;
    timestamp: string;
    isInternal?: boolean;
  }>;
}

export interface SampleEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  balance: number;
  totalAllowance: number;
}

export const SAMPLE_EMPLOYEES: SampleEmployee[] = [
  { id: 'emp-1', name: 'Ravi Sharma', email: 'ravi.sharma@acme.corp', role: 'Engineering Lead', avatar: 'RS', balance: 14, totalAllowance: 20 },
  { id: 'emp-2', name: 'Priya Patel', email: 'priya.patel@acme.corp', role: 'Product Designer', avatar: 'PP', balance: 18, totalAllowance: 20 },
  { id: 'emp-3', name: 'Amit Verma', email: 'amit.verma@acme.corp', role: 'DevOps Specialist', avatar: 'AV', balance: 12, totalAllowance: 20 },
  { id: 'emp-4', name: 'Sarah Connor', email: 'sarah.connor@acme.corp', role: 'Operations Manager', avatar: 'SC', balance: 17, totalAllowance: 20 },
];

export const INITIAL_SAMPLE_LEAVE_REQUESTS: SimulatedLeaveRequest[] = [
  {
    id: 'lr-101',
    employeeName: 'Ravi Sharma',
    employeeEmail: 'ravi.sharma@acme.corp',
    startDate: '2026-10-12',
    endDate: '2026-10-15',
    requestedDays: 3,
    reasonText: 'Annual family festival gathering and celebration. Handover complete with senior dev.',
    aiCategory: 'Festival & Personal',
    aiConfidence: 0.96,
    status: 'approved',
    submittedAt: '2 days ago',
    managerNotes: 'Approved. Sprint deliverables are on track.',
    workflowRunId: 'wf-run-8821'
  },
  {
    id: 'lr-102',
    employeeName: 'Priya Patel',
    employeeEmail: 'priya.patel@acme.corp',
    startDate: '2026-09-18',
    endDate: '2026-09-20',
    requestedDays: 2,
    reasonText: 'Scheduled medical specialist consultation and subsequent recovery rest.',
    aiCategory: 'Medical Leave',
    aiConfidence: 0.98,
    status: 'pending',
    submittedAt: '3 hours ago',
    workflowRunId: 'wf-run-8822'
  },
  {
    id: 'lr-103',
    employeeName: 'Amit Verma',
    employeeEmail: 'amit.verma@acme.corp',
    startDate: '2026-09-01',
    endDate: '2026-09-06',
    requestedDays: 5,
    reasonText: 'Annual holiday mountain trek trip with family.',
    aiCategory: 'Vacation Travel',
    aiConfidence: 0.94,
    status: 'rejected',
    submittedAt: '1 week ago',
    managerNotes: 'Rejected: Overlaps with the critical Q3 production migration window. Please reschedule for late September.',
    workflowRunId: 'wf-run-8820'
  },
  {
    id: 'lr-104',
    employeeName: 'Sarah Connor',
    employeeEmail: 'sarah.connor@acme.corp',
    startDate: '2026-09-10',
    endDate: '2026-09-11',
    requestedDays: 1,
    reasonText: 'Client on-site alignment session rescheduled.',
    aiCategory: 'Personal Admin',
    aiConfidence: 0.91,
    status: 'cancelled',
    submittedAt: '4 days ago',
    managerNotes: 'Cancelled by employee prior to manager review.',
    workflowRunId: 'wf-run-8819'
  }
];

export const INITIAL_SAMPLE_TICKETS: SimulatedTicket[] = [
  {
    id: 'tkt-4021',
    ticketNumber: 'INC-4021',
    requesterName: 'Alex Rivera',
    requesterEmail: 'alex.rivera@acme.corp',
    title: 'GlobalProtect VPN tunnel terminates every 10 min during batch EMEA sync',
    category: 'Network & VPN',
    priority: 'P2_High',
    description: 'VPN tunnel drops with SSL handshake timeout during large batch queries to the EMEA data warehouse.',
    status: 'in_progress',
    assignedAgent: 'Elena Rostova (NetOps Engineer)',
    slaTargetHours: 8,
    slaRemainingMinutes: 340,
    aiDiagnostic: '🤖 AI Diagnostic: Intermittent MTU packet loss detected. Recommended: Update MTU to 1420 & refresh SSL profile.',
    submittedAt: '1.5 hours ago',
    comments: [
      { id: 'c-1', author: 'System Dispatcher', role: 'agent', text: 'Auto-routed to Elena Rostova based on Network & VPN specialty.', timestamp: '10:15 AM', isInternal: true },
      { id: 'c-2', author: 'Elena Rostova (NetOps Engineer)', role: 'agent', text: 'Analyzing packet captures from the Singapore gateway router.', timestamp: '10:45 AM' }
    ]
  },
  {
    id: 'tkt-3890',
    ticketNumber: 'INC-3890',
    requesterName: 'David Kim',
    requesterEmail: 'david.kim@acme.corp',
    title: 'MacBook Pro M2 trackpad unresponsive & battery thermal warning',
    category: 'Hardware',
    priority: 'P1_Critical',
    description: 'Hardware safety warning triggered in diagnostic log. Trackpad physical click stuck due to swelling.',
    status: 'assigned',
    assignedAgent: 'Dave Miller (IT Support)',
    slaTargetHours: 4,
    slaRemainingMinutes: 195,
    aiDiagnostic: '🤖 AI Diagnostic: Battery swelling hazard detected. Immediate replacement unit dispatched.',
    submittedAt: '45 mins ago',
    comments: [
      { id: 'c-3', author: 'Dave Miller (IT Support)', role: 'agent', text: 'Replacement M3 MacBook unit reserved from local IT locker. Please bring device immediately.', timestamp: '11:10 AM' }
    ]
  },
  {
    id: 'tkt-3104',
    ticketNumber: 'INC-3104',
    requesterName: 'Lisa Wong',
    requesterEmail: 'lisa.wong@acme.corp',
    title: 'Access to AWS Production Billing S3 bucket for quarterly financial audit',
    category: 'Access & Permissions',
    priority: 'P3_Medium',
    description: 'Read-only temporary IAM role required for external audit compliance review.',
    status: 'resolved',
    assignedAgent: 'Michael Scott (SecOps Admin)',
    slaTargetHours: 24,
    slaRemainingMinutes: 0,
    aiDiagnostic: '🤖 AI Diagnostic: Verified against Active Directory finance-auditor policy group.',
    submittedAt: 'Yesterday',
    resolvedAt: 'Yesterday at 4:30 PM',
    comments: [
      { id: 'c-4', author: 'Michael Scott (SecOps Admin)', role: 'agent', text: 'Temporary STS token provisioned with 7-day TTL and read-only S3 scope.', timestamp: '4:30 PM' }
    ]
  }
];

export const LiveAppSandbox: React.FC<LiveAppSandboxProps> = ({ ir, onGoToProduction, appName = ir.name }) => {
  const isItsm = ir.domain === 'it-service-desk' || 
    ir.name.toLowerCase().includes('service') || 
    ir.name.toLowerCase().includes('ticket') || 
    ir.name.toLowerCase().includes('itsm') ||
    ir.name.toLowerCase().includes('helpdesk');

  const isEquipment = ir.domain === 'it-equipment-request' ||
    ir.domain.toLowerCase().includes('equipment') ||
    ir.name.toLowerCase().includes('equipment') ||
    ir.name.toLowerCase().includes('hardware') ||
    ir.name.toLowerCase().includes('gear') ||
    ir.name.toLowerCase().includes('laptop');

  const isExpense = ir.domain === 'expense-reimbursement' ||
    ir.domain.toLowerCase().includes('expense') ||
    ir.name.toLowerCase().includes('expense') ||
    ir.name.toLowerCase().includes('reimburse') ||
    ir.name.toLowerCase().includes('claim');

  // Authentication & RBAC State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthUser>(PRESET_USERS.employee);
  const [activeMainTab, setActiveMainTab] = useState<'app_views' | 'rbac_governance'>('app_views');

  // Roles toggle
  const [activeRole, setActiveRole] = useState<UserRole>('employee');

  // Active Employee selection for Leave App
  const [selectedEmployee, setSelectedEmployee] = useState<SampleEmployee>(SAMPLE_EMPLOYEES[0]);

  // Handle Login
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    setIsAuthenticated(true);
    setActiveMainTab('app_views');
  };

  // Handle Sign Out
  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  // Handle Fast Impersonate / Role Change
  const handleSwitchUserRole = (role: UserRole) => {
    setActiveRole(role);
    setCurrentUser(PRESET_USERS[role]);
    if (role === 'employee') {
      setSelectedEmployee(SAMPLE_EMPLOYEES[0]);
    }
  };

  // === ITSM State ===
  const [tickets, setTickets] = useState<SimulatedTicket[]>(INITIAL_SAMPLE_TICKETS);
  const [ticketRequesterName, setTicketRequesterName] = useState('Alex Rivera');
  const [ticketRequesterEmail, setTicketRequesterEmail] = useState('alex.rivera@acme.corp');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState<SimulatedTicket['category']>('Network & VPN');
  const [ticketPriority, setTicketPriority] = useState<SimulatedTicket['priority']>('P2_High');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketAttachment, setTicketAttachment] = useState('');
  const [itsmFilterCategory, setItsmFilterCategory] = useState<string>('all');
  const [itsmFilterPriority, setItsmFilterPriority] = useState<string>('all');
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [isInternalNote, setIsInternalNote] = useState<Record<string, boolean>>({});

  // === Leave App State ===
  const [employeeBalance, setEmployeeBalance] = useState<number>(selectedEmployee.balance);
  const [employeeName, setEmployeeName] = useState(selectedEmployee.name);
  const [employeeEmail, setEmployeeEmail] = useState(selectedEmployee.email);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestedDays, setRequestedDays] = useState(1);
  const [reasonText, setReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [requests, setRequests] = useState<SimulatedLeaveRequest[]>(INITIAL_SAMPLE_LEAVE_REQUESTS);

  // Switch active employee context
  const handleSelectEmployee = (emp: SampleEmployee) => {
    setSelectedEmployee(emp);
    setEmployeeName(emp.name);
    setEmployeeEmail(emp.email);
    setEmployeeBalance(emp.balance);
  };

  // 1-Click Sample Fill for Leave
  const handleQuickDemoFillLeave = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endWeek = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000);
    setStartDate(nextWeek.toISOString().split('T')[0]);
    setEndDate(endWeek.toISOString().split('T')[0]);
    setRequestedDays(2);
    setReasonText('Attending the annual engineering leadership summit. Knowledge transfer planned.');
  };

  // 1-Click Sample Fill for ITSM
  const handleQuickDemoFillItsm = () => {
    setTicketRequesterName('Alex Rivera');
    setTicketRequesterEmail('alex.rivera@acme.corp');
    setTicketTitle('VPN disconnects every 10 minutes when querying EMEA database');
    setTicketCategory('Network & VPN');
    setTicketPriority('P2_High');
    setTicketDescription('GlobalProtect VPN tunnel terminates with SSL handshake timeout during large batch queries to the EMEA data warehouse. Needs network certificate revalidation.');
    setTicketAttachment('vpn_debug_log.txt');
  };

  // Submit ITSM Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionFeedback(null);

    setTimeout(() => {
      const slaMap: Record<SimulatedTicket['priority'], number> = {
        'P1_Critical': 4,
        'P2_High': 8,
        'P3_Medium': 24,
        'P4_Low': 48
      };

      const slaHours = slaMap[ticketPriority] || 8;
      const ticketNum = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

      // Auto-assign agents based on category specialty
      const agentSpecialists: Record<string, string> = {
        'Hardware': 'Dave Miller (IT Support)',
        'Software & OS': 'Sarah Chen (Tier 2 Tech)',
        'Access & Permissions': 'Michael Scott (SecOps Admin)',
        'Network & VPN': 'Elena Rostova (NetOps Engineer)',
        'Email & Communication': 'Sarah Chen (Tier 2 Tech)'
      };
      const autoAssignedAgent = agentSpecialists[ticketCategory] || 'Sarah Chen (Tier 2 Tech)';

      // AI Diagnostic
      let diagnostic = 'Standard incident routing applied.';
      if (ticketCategory === 'Network & VPN') {
        diagnostic = '🤖 AI Diagnostic: Identified intermittent MTU packet loss / SSL tunnel timeout. Suggested resolution: Update VPN client profile & reset DNS cache.';
      } else if (ticketCategory === 'Hardware') {
        diagnostic = '🤖 AI Diagnostic: Hardware triage detected. Warranty verification requested.';
      } else if (ticketCategory === 'Access & Permissions') {
        diagnostic = '🤖 AI Diagnostic: Access authorization verified against Active Directory group policy.';
      }

      const newTicket: SimulatedTicket = {
        id: `tkt-${Date.now()}`,
        ticketNumber: ticketNum,
        requesterName: ticketRequesterName,
        requesterEmail: ticketRequesterEmail,
        title: ticketTitle,
        category: ticketCategory,
        priority: ticketPriority,
        description: ticketDescription,
        attachmentName: ticketAttachment || undefined,
        status: 'assigned',
        assignedAgent: autoAssignedAgent,
        slaTargetHours: slaHours,
        slaRemainingMinutes: slaHours * 60 - 5,
        aiDiagnostic: diagnostic,
        submittedAt: 'Just now',
        comments: [
          {
            id: `c-${Date.now()}`,
            author: 'System Dispatcher',
            role: 'agent',
            text: `Ticket auto-routed to ${autoAssignedAgent} based on category specialty [${ticketCategory}] and priority [${ticketPriority}]. SLA target: ${slaHours} hours.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isInternal: true
          }
        ]
      };

      setTickets(prev => [newTicket, ...prev]);
      setIsSubmitting(false);
      setSubmissionFeedback(`✅ Ticket #${ticketNum} created and dispatched to ${autoAssignedAgent}! SLA clock running (${slaHours}h target).`);
      setTicketTitle('');
      setTicketDescription('');
      setTicketAttachment('');
    }, 500);
  };

  // Agent Status Update
  const handleUpdateTicketStatus = (ticketId: string, newStatus: SimulatedTicket['status']) => {
    if (!checkPermission(currentUser.role, 'wf:triage')) {
      alert(`[RBAC Policy Violation] Persona ${currentUser.name} (${currentUser.role}) does not have 'wf:triage' permission to update ticket status.`);
      return;
    }

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const isResolving = newStatus === 'resolved';
      return {
        ...t,
        status: newStatus,
        resolvedAt: isResolving ? 'Just now' : t.resolvedAt,
        comments: [
          ...t.comments,
          {
            id: `c-${Date.now()}`,
            author: activeRole === 'agent' ? 'Service Desk Agent' : currentUser.name,
            role: currentUser.role === 'admin' ? 'admin' : 'agent',
            text: `Status changed to: ${newStatus.toUpperCase().replace('_', ' ')} by ${currentUser.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
    }));
  };

  // Add Comment to Ticket
  const handleAddComment = (ticketId: string) => {
    const text = newCommentText[ticketId];
    if (!text || !text.trim()) return;

    const isInternal = !!isInternalNote[ticketId];
    if (isInternal && !checkPermission(currentUser.role, 'sec:internal_notes')) {
      alert(`[RBAC Policy Violation] Persona ${currentUser.name} (${currentUser.role}) is forbidden from adding internal agent notes ('sec:internal_notes').`);
      return;
    }

    const author = activeRole === 'employee' ? (ticketRequesterName || currentUser.name) : `${currentUser.name} (${currentUser.role.toUpperCase()})`;

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        comments: [
          ...t.comments,
          {
            id: `c-${Date.now()}`,
            author,
            role: currentUser.role,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isInternal
          }
        ]
      };
    }));

    setNewCommentText(prev => ({ ...prev, [ticketId]: '' }));
  };

  // Submit Leave Request
  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(currentUser.role, 'rec:create')) {
      setSubmissionFeedback(`❌ RBAC Violation: Role ${currentUser.role} does not have record creation authority.`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    setTimeout(() => {
      if (requestedDays > employeeBalance) {
        setSubmissionFeedback(`❌ Rejected by Deterministic Balance Check: Requested ${requestedDays} days exceeds current balance (${employeeBalance} days).`);
        setIsSubmitting(false);
        return;
      }

      let aiCategory = 'Personal Emergency';
      let confidence = 0.91;
      const lower = reasonText.toLowerCase();
      if (lower.includes('wedding') || lower.includes('family') || lower.includes('child')) {
        aiCategory = 'Family & Caregiving';
        confidence = 0.95;
      } else if (lower.includes('doctor') || lower.includes('sick') || lower.includes('surgery') || lower.includes('health')) {
        aiCategory = 'Medical / Health';
        confidence = 0.98;
      } else if (lower.includes('trip') || lower.includes('vacation') || lower.includes('flight') || lower.includes('beach')) {
        aiCategory = 'Vacation / Leisure';
        confidence = 0.94;
      }

      const newReq: SimulatedLeaveRequest = {
        id: `req-${Date.now().toString().slice(-4)}`,
        employeeName,
        employeeEmail,
        startDate,
        endDate,
        requestedDays,
        reasonText,
        aiCategory,
        aiConfidence: confidence,
        status: 'pending',
        submittedAt: 'Just now',
        workflowRunId: `run-${Date.now().toString().slice(-4)}`
      };

      setRequests(prev => [newReq, ...prev]);
      setIsSubmitting(false);
      setSubmissionFeedback(`✅ Request submitted! Step 1 (Balance Validated) and Step 2 (AI Categorized: ${aiCategory}) executed.`);
    }, 500);
  };

  const handleManagerDecisionLeave = (reqId: string, action: 'approve' | 'reject') => {
    if (!checkPermission(currentUser.role, 'wf:approve_reject')) {
      alert(`[RBAC Policy Violation] Persona ${currentUser.name} (${currentUser.role}) does not have 'wf:approve_reject' manager permission.`);
      return;
    }

    const target = requests.find(r => r.id === reqId);
    if (!target) return;

    if (action === 'approve' && target.employeeName === employeeName) {
      setEmployeeBalance(prev => Math.max(0, prev - target.requestedDays));
    }

    setRequests(prev =>
      prev.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: action === 'approve' ? 'approved' : 'rejected',
              managerNotes: action === 'approve' ? `Approved by ${currentUser.name} (Manager Gate)` : `Denied by ${currentUser.name}`
            }
          : r
      )
    );
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (itsmFilterCategory !== 'all' && t.category !== itsmFilterCategory) return false;
    if (itsmFilterPriority !== 'all' && t.priority !== itsmFilterPriority) return false;
    return true;
  });

  const openTicketsCount = tickets.filter(t => t.status !== 'resolved').length;
  const p1Count = tickets.filter(t => t.priority === 'P1_Critical' && t.status !== 'resolved').length;

  // 1. Unauthenticated State: Show full enterprise login screen
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
        <AppLoginScreen 
          ir={ir}
          appName={appName}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // Helper to determine avatar initials
  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
      
      {/* Top Header: Enterprise Navigation & Authenticated User Profile */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: App Identity & Navigation Mode Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <AppLogoBadge logo={ir.logo} name={appName} domain={ir.domain} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{appName}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  🧪 Cloud Testbed (₹0)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEquipment 
                  ? 'Hardware inventory, role compatibility AI check & $500 procurement threshold.'
                  : isExpense
                  ? 'Expense claim audit, per-diem rules & automated reimbursement workflow.'
                  : isItsm
                  ? 'Service desk SLA routing, agent workflows & ticket lifecycle.'
                  : 'PostgreSQL RecordService & Workflow Engine in-browser.'}
              </p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMainTab('app_views')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeMainTab === 'app_views' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💻 Application Views</span>
            </button>
            <button
              onClick={() => setActiveMainTab('rbac_governance')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeMainTab === 'rbac_governance' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>🛡️ RBAC Permissions Matrix</span>
            </button>
          </div>
        </div>

        {/* Right: Authenticated User & Impersonation Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[10px] border border-indigo-500/40">
              {userInitials}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-semibold text-white block leading-tight text-[11px]">{currentUser.name}</span>
              <span className="text-[9px] text-slate-400 font-mono block leading-tight">{currentUser.email}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              currentUser.role === 'admin' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
              currentUser.role === 'manager' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              currentUser.role === 'agent' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
              'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }`}>
              {currentUser.role}
            </span>
          </div>

          {/* Quick Impersonate Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={currentUser.role}
              onChange={(e) => handleSwitchUserRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
              title="Test application behavior under different role permissions"
            >
              <option value="employee">👨‍💻 Impersonate: Employee (Alex)</option>
              <option value="agent">🎧 Impersonate: Agent (Sarah)</option>
              <option value="manager">👔 Impersonate: Manager (Marcus)</option>
              <option value="admin">🛡️ Impersonate: Admin (Elena)</option>
            </select>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            title="Log out and test Login screen"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          {onGoToProduction && (
            <button
              onClick={onGoToProduction}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Go to Production 🚀</span>
            </button>
          )}
        </div>
      </div>

      {/* Free Test Environment Resource Limits Banner */}
      <div className="px-6 py-2 bg-indigo-950/80 border-b border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-200">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <b>RBAC Session Active:</b> Authenticated as <b className="text-white">{currentUser.name}</b> with <code className="font-mono text-indigo-300 uppercase">{currentUser.role}</code> authority & row-level security.
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Status: Testbed Active (₹0 Free Tier)</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 bg-slate-900/70">
        
        {/* RBAC MATRIX VIEW */}
        {activeMainTab === 'rbac_governance' ? (
          <RbacMatrixViewer 
            currentUser={currentUser} 
            onSwitchRole={handleSwitchUserRole} 
          />
        ) : (
          <>
            {/* Persona Role Sub-Switcher (when in application views) */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Select Operational View:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveRole('employee')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      activeRole === 'employee' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Employee View
                  </button>
                  
                  {isItsm ? (
                    <button
                      onClick={() => setActiveRole('agent')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors relative ${
                        activeRole === 'agent' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>Service Desk Agent</span>
                      {openTicketsCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-bold text-[10px]">
                          {openTicketsCount}
                        </span>
                      )}
                    </button>
                  ) : null}

                  <button
                    onClick={() => setActiveRole('manager')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors relative ${
                      activeRole === 'manager' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Manager & SLA View</span>
                    {isItsm && p1Count > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                        {p1Count} P1
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveRole('admin')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      activeRole === 'admin' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Audit & DDL Logs
                  </button>
                </div>
              </div>

              {/* Active Role Indicator */}
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Active Scope:</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white font-mono font-semibold uppercase text-[11px]">
                  {activeRole}
                </span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* === ITSM APPLICATION RUNTIME ============================ */}
            {/* ========================================================= */}
            {isItsm ? (
              <>
            {/* 1. ITSM Employee View */}
            {activeRole === 'employee' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Create Ticket Form */}
                <div className="lg:col-span-7 bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Headset className="w-4 h-4 text-indigo-400" />
                      <span>Submit New IT Service Ticket</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleQuickDemoFillItsm}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>🪄 1-Click Sample Fill</span>
                    </button>
                  </div>

                  {submissionFeedback && (
                    <div className="p-3 rounded-lg text-xs leading-relaxed border bg-emerald-950/60 border-emerald-800 text-emerald-300">
                      {submissionFeedback}
                    </div>
                  )}

                  <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Employee Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alex Rivera"
                          value={ticketRequesterName}
                          onChange={e => setTicketRequesterName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Employee Email</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. alex.rivera@acme.corp"
                          value={ticketRequesterEmail}
                          onChange={e => setTicketRequesterEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Ticket Title / Summary</label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of the issue..."
                        value={ticketTitle}
                        onChange={e => setTicketTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Category</label>
                        <select
                          value={ticketCategory}
                          onChange={e => setTicketCategory(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Hardware">Hardware (Laptops, Screens, Printers)</option>
                          <option value="Software & OS">Software & Operating System</option>
                          <option value="Access & Permissions">Access & Permissions (SSO, IAM)</option>
                          <option value="Network & VPN">Network & VPN</option>
                          <option value="Email & Communication">Email & Collaboration Tools</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Priority & Target SLA</label>
                        <select
                          value={ticketPriority}
                          onChange={e => setTicketPriority(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="P1_Critical">P1 Critical (4h SLA Target)</option>
                          <option value="P2_High">P2 High (8h SLA Target)</option>
                          <option value="P3_Medium">P3 Medium (24h SLA Target)</option>
                          <option value="P4_Low">P4 Low (48h SLA Target)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Detailed Issue Description</label>
                      <textarea
                        rows={3}
                        required
                        value={ticketDescription}
                        onChange={e => setTicketDescription(e.target.value)}
                        placeholder="Provide details, error messages, steps to reproduce..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Attachment (Optional File/Log)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. error_log.txt or screenshot.png"
                          value={ticketAttachment}
                          onChange={e => setTicketAttachment(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setTicketAttachment('system_diagnostic_dump.log')}
                          className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attach Log</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Routing & Calculating SLA...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Ticket & Dispatch to Service Desk</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* My Tickets List & Status */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        <span>My Active IT Tickets ({tickets.length})</span>
                      </h4>
                      <span className="text-[10px] text-slate-500">Live Status & Chat</span>
                    </div>

                    {tickets.length === 0 ? (
                      <div className="p-6 bg-slate-900/60 rounded-lg border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-1">
                        <p>No tickets submitted yet.</p>
                        <p className="text-[11px] text-slate-400">Click <b>🪄 1-Click Sample Fill</b> to test an instant submission!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {tickets.map(t => (
                          <div key={t.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-[11px] text-indigo-400 font-bold">{t.ticketNumber}</span>
                                <h5 className="font-semibold text-white text-xs mt-0.5">{t.title}</h5>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 ${
                                t.status === 'resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                t.status === 'in_progress' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                                'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {t.status.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span className="bg-slate-800 px-2 py-0.5 rounded">{t.category}</span>
                              <span className="font-mono text-amber-400">{t.priority}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-300">Agent: <b>{t.assignedAgent}</b></span>
                            </div>

                            {t.aiDiagnostic && (
                              <div className="p-2 bg-indigo-950/40 rounded-lg border border-indigo-900/60 text-[11px] text-indigo-200">
                                {t.aiDiagnostic}
                              </div>
                            )}

                            {/* Ticket Comments Stream */}
                            <div className="pt-2 border-t border-slate-800 space-y-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">Communication Log:</span>
                              {t.comments.map(c => (
                                <div key={c.id} className={`p-2 rounded text-[11px] ${c.isInternal ? 'bg-amber-950/30 border border-amber-800/40 text-amber-200' : 'bg-slate-950 text-slate-300'}`}>
                                  <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                                    <span className="font-bold text-slate-400">{c.author} {c.isInternal ? '(Internal Note)' : ''}</span>
                                    <span>{c.timestamp}</span>
                                  </div>
                                  <p>{c.text}</p>
                                </div>
                              ))}

                              {/* Add reply */}
                              <div className="flex items-center gap-1.5 pt-1.5">
                                <input
                                  type="text"
                                  placeholder="Reply to agent..."
                                  value={newCommentText[t.id] || ''}
                                  onChange={e => setNewCommentText({ ...newCommentText, [t.id]: e.target.value })}
                                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddComment(t.id)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ITSM Service Desk Agent View */}
            {activeRole === 'agent' && (
              !checkPermission(currentUser.role, 'wf:triage') ? (
                <div className="bg-slate-950 p-8 rounded-xl border border-rose-900/60 text-center space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 mx-auto">
                    <Headset className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800">
                      HTTP 403 Forbidden • RBAC Access Policy Guard
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">Support Agent Privilege Required</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your current persona <b>{currentUser.name}</b> (<span className="text-indigo-400 uppercase font-mono font-bold">{currentUser.role}</span>) does not possess the <code className="text-rose-300 font-mono">wf:triage</code> permission required to access internal ticket queues and update ticket statuses.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleSwitchUserRole('agent')}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <Headset className="w-4 h-4" />
                      <span>Impersonate Support Agent (Sarah Chen) →</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Headset className="w-4 h-4 text-indigo-400" />
                      <span>Service Desk Triage & Assignment Queue</span>
                    </h3>
                    <p className="text-xs text-slate-400">Manage incoming incidents, respond to employees, and resolve tickets.</p>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={itsmFilterPriority}
                      onChange={e => setItsmFilterPriority(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
                    >
                      <option value="all">All Priorities</option>
                      <option value="P1_Critical">P1 Critical Only</option>
                      <option value="P2_High">P2 High Only</option>
                      <option value="P3_Medium">P3 Medium Only</option>
                    </select>

                    <select
                      value={itsmFilterCategory}
                      onChange={e => setItsmFilterCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
                    >
                      <option value="all">All Categories</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Network & VPN">Network & VPN</option>
                      <option value="Software & OS">Software & OS</option>
                      <option value="Access & Permissions">Access & Permissions</option>
                    </select>
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="bg-slate-950 p-10 rounded-xl border border-slate-800 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="text-sm font-bold text-white">All queues cleared!</h4>
                    <p className="text-xs text-slate-400">Switch to <b>Employee View</b> and click <b>🪄 1-Click Sample Fill</b> to generate an incoming incident.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTickets.map(ticket => (
                      <div key={ticket.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-indigo-400 font-bold">{ticket.ticketNumber}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ticket.priority === 'P1_Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                  ticket.priority === 'P2_High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {ticket.priority}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1">{ticket.title}</h4>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 ${
                              ticket.status === 'resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              ticket.status === 'in_progress' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                              'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                            {ticket.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span>Requester: <b className="text-white">{ticket.requesterName}</b> ({ticket.requesterEmail})</span>
                            <span>•</span>
                            <span>Assigned: <b className="text-indigo-400">{ticket.assignedAgent}</b></span>
                          </div>

                          {/* SLA Clock */}
                          <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg text-xs font-mono text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>SLA Clock: <b>{ticket.slaTargetHours}h Target</b> ({ticket.slaRemainingMinutes} min remaining)</span>
                          </div>

                          {/* Comments Stream */}
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {ticket.comments.map(c => (
                              <div key={c.id} className={`p-2 rounded text-[11px] ${c.isInternal ? 'bg-amber-950/40 border border-amber-800/50 text-amber-200' : 'bg-slate-900 text-slate-300'}`}>
                                <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                                  <span className="font-bold">{c.author} {c.isInternal ? '🔒 (Internal)' : '🌐 (Public)'}</span>
                                  <span>{c.timestamp}</span>
                                </div>
                                <p>{c.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Agent Action Controls */}
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="text"
                              placeholder="Add agent update or resolution note..."
                              value={newCommentText[ticket.id] || ''}
                              onChange={e => setNewCommentText({ ...newCommentText, [ticket.id]: e.target.value })}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(ticket.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                            >
                              Post
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                                className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-medium"
                              >
                                Mark In Progress
                              </button>
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'waiting_on_user')}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                              >
                                Need User Info
                              </button>
                            </div>

                            {ticket.status !== 'resolved' ? (
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Resolve Ticket</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolved</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            )}

            {/* 3. ITSM Manager View */}
            {activeRole === 'manager' && (
              !checkPermission(currentUser.role, 'wf:approve_reject') ? (
                <div className="bg-slate-950 p-8 rounded-xl border border-rose-900/60 text-center space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800">
                      HTTP 403 Forbidden • RBAC Policy Guard
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">Manager Approval Privileges Required</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your current authenticated persona <b>{currentUser.name}</b> (<span className="text-indigo-400 uppercase font-mono font-bold">{currentUser.role}</span>) does not possess the <code className="text-rose-300 font-mono">wf:approve_reject</code> permission required to authorize requests or view SLA escalation metrics.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleSwitchUserRole('manager')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Impersonate Manager (Marcus Vance) →</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="space-y-6">
                
                {/* KPI Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">SLA Compliance Rate</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-emerald-400">98.5%</span>
                      <span className="text-xs text-emerald-500">Above Target</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Target: &gt;95.0% compliance</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Active Open Incidents</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-white">{openTicketsCount}</span>
                      <span className="text-xs text-indigo-400 font-mono">in queue</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Total created: {tickets.length}</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">P1 Critical Incidents</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-2xl font-bold ${p1Count > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {p1Count}
                      </span>
                      <span className="text-xs text-slate-400">4h resolution</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Zero breach tolerance</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Avg First Response Time</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-indigo-400">14 min</span>
                      <span className="text-xs text-emerald-400">-3m vs avg</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Automated triage active</p>
                  </div>
                </div>

                {/* Team Performance & Category Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Agent Workload Table */}
                  <div className="lg:col-span-8 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Service Desk Agent Performance & Capacity</span>
                      </h4>
                      <span className="text-[10px] text-slate-500">Live Workload Distribution</span>
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                            <th className="pb-2 font-semibold">Agent Name</th>
                            <th className="pb-2 font-semibold">Specialty</th>
                            <th className="pb-2 font-semibold">Active Queue</th>
                            <th className="pb-2 font-semibold">SLA Health</th>
                            <th className="pb-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          <tr>
                            <td className="py-2.5 font-bold text-white">Sarah Chen</td>
                            <td className="py-2.5 text-slate-400">Tier 2 Tech & Software</td>
                            <td className="py-2.5 font-mono text-indigo-400">
                              {tickets.filter(t => t.assignedAgent?.includes('Sarah') && t.status !== 'resolved').length} tickets
                            </td>
                            <td className="py-2.5 text-emerald-400 font-mono">100%</td>
                            <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">Active</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-white">Elena Rostova</td>
                            <td className="py-2.5 text-slate-400">NetOps & Infrastructure</td>
                            <td className="py-2.5 font-mono text-indigo-400">
                              {tickets.filter(t => t.assignedAgent?.includes('Elena') && t.status !== 'resolved').length} tickets
                            </td>
                            <td className="py-2.5 text-emerald-400 font-mono">96.8%</td>
                            <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">Active</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-white">Dave Miller</td>
                            <td className="py-2.5 text-slate-400">Hardware & Workstations</td>
                            <td className="py-2.5 font-mono text-indigo-400">
                              {tickets.filter(t => t.assignedAgent?.includes('Dave') && t.status !== 'resolved').length} tickets
                            </td>
                            <td className="py-2.5 text-emerald-400 font-mono">99.1%</td>
                            <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">Active</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Incident Category Stats */}
                  <div className="lg:col-span-4 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Category Distribution</span>
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Network & VPN</span>
                          <span className="font-mono text-indigo-400">42%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[42%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Software & OS</span>
                          <span className="font-mono text-indigo-400">28%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[28%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Hardware Requisitions</span>
                          <span className="font-mono text-indigo-400">18%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[18%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Access & SSO</span>
                          <span className="font-mono text-indigo-400">12%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[12%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            )}
          </>
        ) : isEquipment ? (
          /* ========================================================= */
          /* === IT EQUIPMENT & HARDWARE REQUISITION RUNTIME ========= */
          /* ========================================================= */
          <EquipmentSandboxView
            ir={ir}
            currentUser={currentUser}
            activeRole={activeRole}
            onSwitchRole={handleSwitchUserRole}
          />
        ) : isExpense ? (
          /* ========================================================= */
          /* === EXPENSE REIMBURSEMENT RUNTIME ======================= */
          /* ========================================================= */
          <ExpenseSandboxView
            ir={ir}
            currentUser={currentUser}
            activeRole={activeRole}
            onSwitchRole={handleSwitchUserRole}
          />
        ) : (
          /* ========================================================= */
          /* === LEAVE MANAGEMENT & OTHER RUNTIMES =================== */
          /* ========================================================= */
          <>
            {/* Role: Employee View */}
            {activeRole === 'employee' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Form */}
                <div className="lg:col-span-7 bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Submit Time-Off Application</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleQuickDemoFillLeave}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>🪄 1-Click Sample Fill</span>
                    </button>
                  </div>

                  {/* Employee Switcher Bar */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Select Pre-Loaded Employee Context:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SAMPLE_EMPLOYEES.map(emp => {
                        const isSelected = selectedEmployee.id === emp.id;
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleSelectEmployee(emp)}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-xs' 
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-xs">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-indigo-300">
                                {emp.avatar}
                              </span>
                              <span className="truncate">{emp.name.split(' ')[0]}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                              {emp.balance}/{emp.totalAllowance}d left
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {submissionFeedback && (
                    <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                      submissionFeedback.startsWith('✅')
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-800 text-rose-300'
                    }`}>
                      {submissionFeedback}
                    </div>
                  )}

                  <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Employee Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alex Rivera"
                          value={employeeName}
                          onChange={e => setEmployeeName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Employee Email</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. alex.rivera@acme.corp"
                          value={employeeEmail}
                          onChange={e => setEmployeeEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Start Date</label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">End Date</label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Requested Business Days</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={requestedDays}
                        onChange={e => setRequestedDays(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">
                        Reason Notes (Unstructured text evaluated by AI node <code className="text-amber-400 font-mono">[s2]</code>)
                      </label>
                      <textarea
                        rows={3}
                        value={reasonText}
                        onChange={e => setReasonText(e.target.value)}
                        placeholder="Provide details (e.g. medical doctor visit, vacation travel, family wedding)..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-700 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Current Available Balance:</span>
                        <span className="font-bold text-slate-200">{employeeBalance} days</span>
                      </div>
                      <div className="flex justify-between text-indigo-400">
                        <span>This Request:</span>
                        <span className="font-bold">-{requestedDays} days</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-800 text-emerald-400 font-semibold">
                        <span>Estimated Balance After Approval:</span>
                        <span>{Math.max(0, employeeBalance - requestedDays)} days</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing Workflow Run...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit & Trigger Workflow</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Employee Balance Card & History */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">PTO Leave Balance</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-white">{employeeBalance}</span>
                      <span className="text-xs text-slate-400">/ 20 days</span>
                    </div>
                    <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${(employeeBalance / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">My Recent Requests</h4>
                    <div className="space-y-2.5">
                      {requests.filter(r => (employeeName ? r.employeeName === employeeName : true)).length === 0 ? (
                        <div className="p-4 bg-slate-900/60 rounded-lg border border-dashed border-slate-800 text-center text-xs text-slate-500">
                          No requests submitted yet. Use the form above to submit your first leave application.
                        </div>
                      ) : (
                        requests.filter(r => (employeeName ? r.employeeName === employeeName : true)).map(r => (
                          <div key={r.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200">{r.startDate} to {r.endDate}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                                r.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                r.status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-1">{r.reasonText}</p>
                            {r.aiCategory && (
                              <div className="mt-2 text-[10px] text-amber-400 font-mono">
                                AI Tag: {r.aiCategory} ({(r.aiConfidence! * 100).toFixed(0)}%)
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Role: Manager View (Leave) */}
            {activeRole === 'manager' && (
              !checkPermission(currentUser.role, 'wf:approve_reject') ? (
                <div className="bg-slate-950 p-8 rounded-xl border border-rose-900/60 text-center space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800">
                      HTTP 403 Forbidden • RBAC Policy Guard
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">Manager Approval Authority Required</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your current persona <b>{currentUser.name}</b> (<span className="text-indigo-400 uppercase font-mono font-bold">{currentUser.role}</span>) does not possess the <code className="text-rose-300 font-mono">wf:approve_reject</code> permission required to make managerial decisions on leave requests.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleSwitchUserRole('manager')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Impersonate Manager (Marcus Vance) →</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span>Manager Approval Queue (Human Gate [s3])</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Requests awaiting decision before 48h timeout auto-escalates to HR Admin.
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                    {requests.filter(r => r.status === 'pending').length} pending action
                  </span>
                </div>

                {requests.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">Queue is all clear!</h4>
                    <p className="text-xs text-slate-400 mt-1">No pending leave requests awaiting approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.filter(r => r.status === 'pending').map(req => (
                      <div
                        key={req.id}
                        className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{req.employeeName}</span>
                              <span className="text-xs text-slate-500 font-mono">({req.employeeEmail})</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                              Dates: <b className="text-indigo-400">{req.startDate}</b> to <b className="text-indigo-400">{req.endDate}</b> ({req.requestedDays} days)
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-800/60 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Timeout: 42h remaining → HR Escalation</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                          <span className="text-slate-400 block text-[10px]">Employee's Stated Reason:</span>
                          <p className="text-slate-200 mt-0.5">{req.reasonText}</p>
                        </div>

                        {req.aiCategory && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>AI Reason Classification: <b>{req.aiCategory}</b> ({(req.aiConfidence! * 100).toFixed(0)}% confidence)</span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <span className="text-[11px] text-slate-500 font-mono">Run: {req.workflowRunId}</span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleManagerDecisionLeave(req.id, 'reject')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleManagerDecisionLeave(req.id, 'approve')}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Deduct Days</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* === SHARED AUDIT & DDL LOGS ============================= */}
        {/* ========================================================= */}
        {activeRole === 'admin' && (
          !checkPermission(currentUser.role, 'sys:audit_logs') ? (
            <div className="bg-slate-950 p-8 rounded-xl border border-rose-900/60 text-center space-y-4 max-w-xl mx-auto my-8">
              <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800">
                  HTTP 403 Forbidden • Super Admin Clearance
                </span>
                <h4 className="text-base font-bold text-white mt-2">Administrator DDL & Telemetry Restricted</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your current persona <b>{currentUser.name}</b> (<span className="text-indigo-400 uppercase font-mono font-bold">{currentUser.role}</span>) does not possess the <code className="text-rose-300 font-mono">sys:audit_logs</code> permission. Access to raw PostgreSQL transaction logs is restricted to Super Administrators.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleSwitchUserRole('admin')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Impersonate Super Admin (Elena Rostova) →</span>
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Platform Runtime Database Logs (<code className="font-mono text-xs">workflow_runs</code> & <code className="font-mono text-xs">node_executions</code>)</span>
                </h3>
                <p className="text-xs text-slate-400">Direct query view of the generated application's execution state.</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                    <th className="p-3 font-semibold">Record ID</th>
                    <th className="p-3 font-semibold">Entity</th>
                    <th className="p-3 font-semibold">Requester / Subject</th>
                    <th className="p-3 font-semibold">Priority / Days</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {isItsm ? (
                    tickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                          No runtime records logged yet. Submit a ticket in Employee view to inspect live audit entries.
                        </td>
                      </tr>
                    ) : (
                      tickets.map(t => (
                        <tr key={t.id} className="hover:bg-slate-900/50">
                          <td className="p-3 text-indigo-400 font-bold">{t.ticketNumber}</td>
                          <td className="p-3 text-amber-400">it_tickets</td>
                          <td className="p-3 text-white">{t.title} ({t.requesterName})</td>
                          <td className="p-3 text-slate-300">{t.priority}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              t.status === 'resolved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{t.submittedAt}</td>
                        </tr>
                      ))
                    )
                  ) : (
                    requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                          No runtime records logged yet. Records will populate as users submit applications.
                        </td>
                      </tr>
                    ) : (
                      requests.map(r => (
                        <tr key={r.id} className="hover:bg-slate-900/50">
                          <td className="p-3 text-indigo-400 font-bold">{r.id}</td>
                          <td className="p-3 text-amber-400">leave_requests</td>
                          <td className="p-3 text-white">{r.employeeName}</td>
                          <td className="p-3">{r.requestedDays}d</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              r.status === 'approved' ? 'bg-emerald-950 text-emerald-400' :
                              r.status === 'rejected' ? 'bg-rose-950 text-rose-400' :
                              'bg-amber-950 text-amber-400'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{r.submittedAt}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )
        )}
          </>
        )}

        {/* Bottom "Ready for Production?" Conversion Card */}
        {onGoToProduction && (
          <div className="mt-6 p-5 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono uppercase">
                  🧪 Test Environment Verified
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {requests.length + tickets.length} transactions executed in isolated testbed
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Ready to deploy this application to Production?
              </h3>
              <p className="text-xs text-slate-400">
                View recommended cloud target (AWS / Azure / On-Prem), transparent itemized cost models, and promote with clean zero-data-leakage database migrations.
              </p>
            </div>

            <button
              onClick={onGoToProduction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Zap className="w-4 h-4" />
              <span>Go to Production 🚀</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
