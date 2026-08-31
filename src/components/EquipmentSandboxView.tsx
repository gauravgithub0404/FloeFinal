import React, { useState } from 'react';
import { IntermediateRepresentation } from '../types/floe';
import { AuthUser, UserRole, checkPermission } from '../types/auth';
import { 
  Laptop, Monitor, Headphones, HardDrive, CheckCircle2, XCircle, 
  Sparkles, Clock, Send, ShieldCheck, RefreshCw, AlertTriangle, 
  Package, DollarSign, UserCheck, Key, Shield, ArrowRight
} from 'lucide-react';

interface EquipmentSandboxViewProps {
  ir: IntermediateRepresentation;
  currentUser: AuthUser;
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'laptop' | 'monitor' | 'peripherals' | 'mobile';
  model: string;
  cost: number;
  targetRoles: string[];
  stock: number;
  icon: string;
}

export interface EquipmentRequestRecord {
  id: string;
  requesterName: string;
  requesterEmail: string;
  role: string;
  department: string;
  item: EquipmentItem;
  quantity: number;
  totalCost: number;
  justification: string;
  aiCompatibility: {
    status: 'compatible' | 'mismatch' | 'verified';
    notes: string;
    confidence: number;
  };
  isAutoApproved: boolean;
  status: 'pending' | 'auto_approved' | 'approved_procuring' | 'rejected' | 'dispatched';
  submittedAt: string;
  managerNotes?: string;
  workflowRunId: string;
}

export const CATALOG_ITEMS: EquipmentItem[] = [
  {
    id: 'eq-cat-1',
    name: 'MacBook Pro 16" M3 Max',
    category: 'laptop',
    model: '36GB Unified Memory, 1TB SSD, Space Black',
    cost: 2899,
    targetRoles: ['Engineering Lead', 'Fullstack Engineer', 'Data Scientist', 'DevOps'],
    stock: 14,
    icon: 'Laptop'
  },
  {
    id: 'eq-cat-2',
    name: 'Dell XPS 15 Workstation',
    category: 'laptop',
    model: 'Intel Core i9, 32GB RAM, RTX 4070, 1TB SSD',
    cost: 2250,
    targetRoles: ['Engineering', 'Product', 'Data Analyst'],
    stock: 8,
    icon: 'Laptop'
  },
  {
    id: 'eq-cat-3',
    name: 'Dell UltraSharp 32" 4K USB-C Hub Monitor',
    category: 'monitor',
    model: 'U3223QE 4K IPS Black with 90W Power Delivery',
    cost: 680,
    targetRoles: ['All Roles'],
    stock: 22,
    icon: 'Monitor'
  },
  {
    id: 'eq-cat-4',
    name: 'Logitech MX Master 3S + Craft Keyboard',
    category: 'peripherals',
    model: 'Ergonomic Precision Wireless Bundle',
    cost: 219,
    targetRoles: ['All Roles'],
    stock: 45,
    icon: 'HardDrive'
  },
  {
    id: 'eq-cat-5',
    name: 'Jabra Evolve2 85 ANC Wireless Headset',
    category: 'peripherals',
    model: 'Active Noise Cancelling, MS Teams Certified',
    cost: 349,
    targetRoles: ['All Roles'],
    stock: 30,
    icon: 'Headphones'
  }
];

export const INITIAL_EQUIPMENT_REQUESTS: EquipmentRequestRecord[] = [
  {
    id: 'EQ-8041',
    requesterName: 'Alex Rivera',
    requesterEmail: 'alex.rivera@acme.corp',
    role: 'Senior Fullstack Engineer',
    department: 'Core Infrastructure',
    item: CATALOG_ITEMS[0],
    quantity: 1,
    totalCost: 2899,
    justification: 'Current MacBook M1 Pro thermal throttling under Docker clusters and multi-container development.',
    aiCompatibility: {
      status: 'compatible',
      notes: '🤖 AI Compatibility Node [eq_2]: Verified engineer profile. Hardware tier justified for container compilation workloads. Over $500 threshold → Escalated to Manager Gate.',
      confidence: 0.98
    },
    isAutoApproved: false,
    status: 'pending',
    submittedAt: '2 hours ago',
    workflowRunId: 'wf-eq-7102'
  },
  {
    id: 'EQ-8039',
    requesterName: 'Priya Patel',
    requesterEmail: 'priya.patel@acme.corp',
    role: 'Product Designer',
    department: 'Design System',
    item: CATALOG_ITEMS[2],
    quantity: 1,
    totalCost: 680,
    justification: 'Color-calibrated 4K display for wide-gamut DCI-P3 design system auditing.',
    aiCompatibility: {
      status: 'compatible',
      notes: '🤖 AI Compatibility Node [eq_2]: Verified design specialist profile. Over $500 threshold → Manager approval required.',
      confidence: 0.95
    },
    isAutoApproved: false,
    status: 'approved_procuring',
    submittedAt: 'Yesterday',
    managerNotes: 'Approved by Marcus Vance. Dispatched PO to hardware supplier.',
    workflowRunId: 'wf-eq-7101'
  },
  {
    id: 'EQ-8025',
    requesterName: 'Ravi Sharma',
    requesterEmail: 'ravi.sharma@acme.corp',
    role: 'Engineering Lead',
    department: 'Platform Architecture',
    item: CATALOG_ITEMS[3],
    quantity: 1,
    totalCost: 219,
    justification: 'Replacement for malfunctioning wireless mouse wheel.',
    aiCompatibility: {
      status: 'verified',
      notes: '🤖 AI Policy Node [eq_1]: Cost ($219) < $500 auto-approval threshold. Auto-Approved instantly by deterministic policy rule.',
      confidence: 1.0
    },
    isAutoApproved: true,
    status: 'dispatched',
    submittedAt: '3 days ago',
    managerNotes: 'Auto-approved via deterministic policy rule (<$500). Dispatched to employee address.',
    workflowRunId: 'wf-eq-7098'
  }
];

export const EquipmentSandboxView: React.FC<EquipmentSandboxViewProps> = ({
  ir,
  currentUser,
  activeRole,
  onSwitchRole
}) => {
  const [requests, setRequests] = useState<EquipmentRequestRecord[]>(INITIAL_EQUIPMENT_REQUESTS);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem>(CATALOG_ITEMS[0]);
  const [requesterName, setRequesterName] = useState(currentUser.name || 'Alex Rivera');
  const [requesterEmail, setRequesterEmail] = useState(currentUser.email || 'alex.rivera@acme.corp');
  const [department, setDepartment] = useState('Engineering & Product');
  const [employeeRole, setEmployeeRole] = useState('Senior Fullstack Engineer');
  const [quantity, setQuantity] = useState(1);
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent' | 'New Hire'>('Standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleQuickFill = () => {
    setSelectedItem(CATALOG_ITEMS[0]);
    setRequesterName('Alex Rivera');
    setRequesterEmail('alex.rivera@acme.corp');
    setDepartment('Core Infrastructure');
    setEmployeeRole('Senior Fullstack Engineer');
    setQuantity(1);
    setJustification('High-compute workstation required for running local Kubernetes testbeds, PostgreSQL replicas, and AI compilation loops.');
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    setTimeout(() => {
      const totalCost = selectedItem.cost * quantity;
      const isUnder500 = totalCost < 500;
      const reqId = `EQ-${Math.floor(8100 + Math.random() * 800)}`;
      const wfRunId = `wf-eq-${Math.floor(7200 + Math.random() * 500)}`;

      let compNotes = '';
      if (isUnder500) {
        compNotes = `🤖 AI Policy Node [eq_1]: Requisition total ($${totalCost}) is under the $500 policy threshold. Deterministic branch [under_500] auto-approved and dispatched instantly.`;
      } else {
        compNotes = `🤖 AI Compatibility Node [eq_2]: Verified profile (${employeeRole}). Requisition total ($${totalCost}) exceeds $500 threshold → Routed to Manager Gate [eq_3] for budget sign-off.`;
      }

      const newRecord: EquipmentRequestRecord = {
        id: reqId,
        requesterName,
        requesterEmail,
        role: employeeRole,
        department,
        item: selectedItem,
        quantity,
        totalCost,
        justification: justification || 'Standard equipment upgrade for project deliverables.',
        aiCompatibility: {
          status: 'compatible',
          notes: compNotes,
          confidence: 0.97
        },
        isAutoApproved: isUnder500,
        status: isUnder500 ? 'auto_approved' : 'pending',
        submittedAt: 'Just now',
        managerNotes: isUnder500 ? 'Auto-approved via deterministic policy rule (<$500).' : undefined,
        workflowRunId: wfRunId
      };

      setRequests(prev => [newRecord, ...prev]);
      setIsSubmitting(false);

      if (isUnder500) {
        setFeedback(`✅ Requisition ${reqId} AUTO-APPROVED (<$500): Order dispatched to procurement.`);
      } else {
        setFeedback(`⏳ Requisition ${reqId} SUBMITTED ($${totalCost}): Over $500 threshold. Escalated to Manager Approval Gate.`);
      }
      setJustification('');
    }, 450);
  };

  const handleManagerDecision = (reqId: string, action: 'approve' | 'reject') => {
    setRequests(prev =>
      prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            status: action === 'approve' ? 'approved_procuring' : 'rejected',
            managerNotes: action === 'approve' 
              ? `Approved by ${currentUser.name} (Manager Gate). Purchase Order dispatched.`
              : `Denied by ${currentUser.name}. Please consult with department lead.`
          };
        }
        return r;
      })
    );
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* 1. EMPLOYEE VIEW */}
      {activeRole === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Requisition Form */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <span>Submit IT Hardware & Equipment Request</span>
              </h3>
              <button
                type="button"
                onClick={handleQuickFill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>🪄 1-Click Sample Fill</span>
              </button>
            </div>

            {feedback && (
              <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                feedback.includes('AUTO-APPROVED')
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-800 text-amber-300'
              }`}>
                {feedback}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              
              {/* Select Hardware Item Catalog */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Select Equipment from Hardware Catalog:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATALOG_ITEMS.map(item => {
                    const isSelected = selectedItem.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-xs'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{item.name}</span>
                          <span className="font-mono text-emerald-400 font-bold">${item.cost}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.model}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Stock: {item.stock} units</span>
                          <span className={item.cost < 500 ? 'text-emerald-400' : 'text-amber-400'}>
                            {item.cost < 500 ? '⚡ Auto-Approve (<$500)' : '👔 Manager Gate (>$500)'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Requester Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Email</label>
                  <input
                    type="email"
                    required
                    value={requesterEmail}
                    onChange={e => setRequesterEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Job Title / Role</label>
                  <input
                    type="text"
                    value={employeeRole}
                    onChange={e => setEmployeeRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Business Justification (Analyzed by AI Spec Check node <code className="text-amber-400 font-mono">[eq_2]</code>)
                </label>
                <textarea
                  rows={2}
                  required
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Explain why this equipment is needed for your project deliverables..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Total Calculation & Policy Summary */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Selected Item Total:</span>
                  <span className="font-bold text-white">${selectedItem.cost * quantity}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800">
                  <span className="text-slate-400">Workflow Routing Path:</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                    selectedItem.cost * quantity < 500 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {selectedItem.cost * quantity < 500 ? '⚡ Deterministic Auto-Approve (<$500)' : '👔 Human Manager Sign-Off (>$500)'}
                  </span>
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
                    <span>Evaluating Deterministic Spec & Executing Workflow...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Hardware Requisition</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Active Requisitions History */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>My Hardware Requisitions</span>
                <span className="text-[10px] font-mono text-slate-500">{requests.length} records</span>
              </h4>
              <div className="mt-3 space-y-3">
                {requests.map(r => (
                  <div key={r.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{r.item.name}</span>
                          <span className="text-[10px] font-mono text-indigo-400">({r.id})</span>
                        </div>
                        <span className="text-[11px] text-slate-400">${r.totalCost} • {r.department}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                        r.status === 'auto_approved' || r.status === 'approved_procuring' || r.status === 'dispatched'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : r.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px]">{r.justification}</p>

                    {r.aiCompatibility && (
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono">
                        {r.aiCompatibility.notes}
                      </div>
                    )}

                    {r.managerNotes && (
                      <div className="text-[11px] text-emerald-400 font-sans">
                        <b>Manager Note:</b> {r.managerNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGER VIEW (Approval Queue for >$500 hardware) */}
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
              <h4 className="text-base font-bold text-white mt-2">Hardware Approval Authority Required</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your current persona <b>{currentUser.name}</b> does not possess the <code className="text-rose-300 font-mono">wf:approve_reject</code> permission required to make managerial decisions on equipment requisitions over $500.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => onSwitchRole('manager')}
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
                  <span>Equipment Manager Approval Queue (Human Gate [eq_3])</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Hardware requisitions exceeding the $500 auto-approval threshold awaiting manager sign-off.
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                {pendingCount} pending review
              </span>
            </div>

            {pendingCount === 0 ? (
              <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">All hardware queues are clear!</h4>
                <p className="text-xs text-slate-400 mt-1">No pending equipment requisitions awaiting manager approval.</p>
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
                          <span className="font-bold text-white text-sm">{req.requesterName}</span>
                          <span className="text-xs text-slate-500 font-mono">({req.requesterEmail})</span>
                          <span className="text-xs text-indigo-400">• {req.role}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Requested: <b className="text-white">{req.item.name}</b> (${req.totalCost})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-800/60 font-mono">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>High-Value Asset (&gt;$500)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 block text-[10px]">Business Justification:</span>
                      <p className="text-slate-200 mt-0.5">{req.justification}</p>
                    </div>

                    {req.aiCompatibility && (
                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-indigo-300 font-mono">
                        {req.aiCompatibility.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-500 font-mono">Workflow Run: {req.workflowRunId}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleManagerDecision(req.id, 'reject')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleManagerDecision(req.id, 'approve')}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Dispatch PO</span>
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

      {/* 3. ADMIN / AUDIT VIEW */}
      {activeRole === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Equipment Requisitions Ledger & Telemetry (<code className="font-mono text-xs">equipment_requests</code>)</span>
              </h3>
              <p className="text-xs text-slate-400">PostgreSQL ACID audit log for asset lifecycle events and purchase orders.</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="p-3 font-semibold">PO #</th>
                  <th className="p-3 font-semibold">Requester</th>
                  <th className="p-3 font-semibold">Item & Model</th>
                  <th className="p-3 font-semibold">Cost</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/50">
                    <td className="p-3 text-indigo-400 font-bold">{r.id}</td>
                    <td className="p-3 text-white">{r.requesterName} ({r.role})</td>
                    <td className="p-3 text-slate-300">{r.item.name}</td>
                    <td className="p-3 text-emerald-400 font-bold">${r.totalCost}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        r.status === 'auto_approved' || r.status === 'approved_procuring' || r.status === 'dispatched'
                          ? 'bg-emerald-950 text-emerald-400'
                          : r.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{r.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
