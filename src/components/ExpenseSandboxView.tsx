import React, { useState } from 'react';
import { IntermediateRepresentation } from '../types/floe';
import { AuthUser, UserRole, checkPermission } from '../types/auth';
import { 
  Receipt, DollarSign, CheckCircle2, XCircle, Sparkles, 
  Send, ShieldCheck, RefreshCw, AlertTriangle, Shield, 
  FileText, ArrowRight
} from 'lucide-react';

interface ExpenseSandboxViewProps {
  ir: IntermediateRepresentation;
  currentUser: AuthUser;
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
}

export interface ExpenseRecord {
  id: string;
  claimantName: string;
  claimantEmail: string;
  category: 'Travel & Flights' | 'Hotel & Lodging' | 'Meals & Team Dinner' | 'Software Subscriptions' | 'Office Supplies';
  merchant: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  claimDate: string;
  description: string;
  receiptName?: string;
  aiPolicyAudit: {
    status: 'compliant' | 'warning' | 'flagged';
    notes: string;
    confidence: number;
  };
  isAutoApproved: boolean;
  status: 'pending' | 'auto_approved' | 'approved' | 'rejected';
  submittedAt: string;
  managerNotes?: string;
  workflowRunId: string;
}

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'EXP-5104',
    claimantName: 'Alex Rivera',
    claimantEmail: 'alex.rivera@acme.corp',
    category: 'Meals & Team Dinner',
    merchant: 'The Grill House',
    amount: 145.50,
    currency: 'USD',
    claimDate: '2026-08-28',
    description: 'Team project milestone celebratory lunch with engineering interns.',
    receiptName: 'receipt_grillhouse_20260828.pdf',
    aiPolicyAudit: {
      status: 'compliant',
      notes: '🤖 AI Policy Node [exp_2]: Itemized receipt verified. Per-head expenditure ($36.37) within allowable travel & entertainment guidelines. Over $100 threshold → Escalated to Manager Gate.',
      confidence: 0.96
    },
    isAutoApproved: false,
    status: 'pending',
    submittedAt: '3 hours ago',
    workflowRunId: 'wf-exp-6019'
  },
  {
    id: 'EXP-5098',
    claimantName: 'Sarah Connor',
    claimantEmail: 'sarah.connor@acme.corp',
    category: 'Software Subscriptions',
    merchant: 'GitHub Copilot Enterprise',
    amount: 39.00,
    currency: 'USD',
    claimDate: '2026-08-27',
    description: 'Monthly AI pair-programming seat license for development workstation.',
    receiptName: 'github_copilot_invoice.pdf',
    aiPolicyAudit: {
      status: 'compliant',
      notes: '🤖 AI Policy Node [exp_1]: Amount ($39) is below $100 auto-approval threshold. Auto-Approved instantly by deterministic micro-expense rule.',
      confidence: 1.0
    },
    isAutoApproved: true,
    status: 'auto_approved',
    submittedAt: 'Yesterday',
    managerNotes: 'Auto-approved via deterministic policy rule (<$100). Reimbursed on next payroll cycle.',
    workflowRunId: 'wf-exp-6015'
  },
  {
    id: 'EXP-5082',
    claimantName: 'Amit Verma',
    claimantEmail: 'amit.verma@acme.corp',
    category: 'Travel & Flights',
    merchant: 'Delta Airlines',
    amount: 680.00,
    currency: 'USD',
    claimDate: '2026-08-20',
    description: 'Direct flight to Seattle for enterprise client customer on-site review.',
    receiptName: 'delta_ticket_sea_sfo.pdf',
    aiPolicyAudit: {
      status: 'compliant',
      notes: '🤖 AI Policy Node [exp_2]: Verified 14-day advance booking window. Compliant with corporate flight booking policy.',
      confidence: 0.99
    },
    isAutoApproved: false,
    status: 'approved',
    submittedAt: '5 days ago',
    managerNotes: 'Approved by Marcus Vance. Reimbursed.',
    workflowRunId: 'wf-exp-6008'
  }
];

export const ExpenseSandboxView: React.FC<ExpenseSandboxViewProps> = ({
  ir,
  currentUser,
  activeRole,
  onSwitchRole
}) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [claimantName, setClaimantName] = useState(currentUser.name || 'Alex Rivera');
  const [claimantEmail, setClaimantEmail] = useState(currentUser.email || 'alex.rivera@acme.corp');
  const [category, setCategory] = useState<ExpenseRecord['category']>('Meals & Team Dinner');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState<number>(45.00);
  const [currency, setCurrency] = useState<ExpenseRecord['currency']>('USD');
  const [description, setDescription] = useState('');
  const [receiptAttachment, setReceiptAttachment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleQuickFill = () => {
    setClaimantName('Alex Rivera');
    setClaimantEmail('alex.rivera@acme.corp');
    setCategory('Meals & Team Dinner');
    setMerchant('Blue Bottle Coffee & Bakery');
    setAmount(28.50);
    setCurrency('USD');
    setDescription('Breakfast alignment session with mobile engineering team before Q3 roadmap sprint.');
    setReceiptAttachment('bluebottle_receipt_828.png');
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    setTimeout(() => {
      const isUnder100 = amount < 100;
      const expId = `EXP-${Math.floor(5200 + Math.random() * 800)}`;
      const wfRunId = `wf-exp-${Math.floor(6100 + Math.random() * 500)}`;

      let auditNotes = '';
      if (isUnder100) {
        auditNotes = `🤖 AI Policy Node [exp_1]: Expense claim ($${amount} ${currency}) is below the $100 policy threshold. Deterministic branch [under_100] auto-approved instantly.`;
      } else {
        auditNotes = `🤖 AI Policy Node [exp_2]: Claim ($${amount} ${currency}) exceeds $100 threshold → Routed to Manager Approval Gate [exp_3] for audit verification.`;
      }

      const newRecord: ExpenseRecord = {
        id: expId,
        claimantName,
        claimantEmail,
        category,
        merchant: merchant || 'Business Merchant',
        amount,
        currency,
        claimDate: new Date().toISOString().split('T')[0],
        description: description || 'Standard business expense.',
        receiptName: receiptAttachment || undefined,
        aiPolicyAudit: {
          status: 'compliant',
          notes: auditNotes,
          confidence: 0.98
        },
        isAutoApproved: isUnder100,
        status: isUnder100 ? 'auto_approved' : 'pending',
        submittedAt: 'Just now',
        managerNotes: isUnder100 ? 'Auto-approved via deterministic policy rule (<$100).' : undefined,
        workflowRunId: wfRunId
      };

      setExpenses(prev => [newRecord, ...prev]);
      setIsSubmitting(false);

      if (isUnder100) {
        setFeedback(`✅ Claim ${expId} AUTO-APPROVED (<$100): Scheduled for next automatic payroll disbursement.`);
      } else {
        setFeedback(`⏳ Claim ${expId} SUBMITTED ($${amount}): Exceeds $100. Escalated to Manager Approval Gate.`);
      }
      setMerchant('');
      setDescription('');
      setReceiptAttachment('');
    }, 450);
  };

  const handleManagerDecision = (claimId: string, action: 'approve' | 'reject') => {
    setExpenses(prev =>
      prev.map(e => {
        if (e.id === claimId) {
          return {
            ...e,
            status: action === 'approve' ? 'approved' : 'rejected',
            managerNotes: action === 'approve'
              ? `Approved by ${currentUser.name} (Manager Gate). Forwarded to Finance.`
              : `Denied by ${currentUser.name}. Please attach itemized tax invoice.`
          };
        }
        return e;
      })
    );
  };

  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* 1. EMPLOYEE VIEW */}
      {activeRole === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Claim Form */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span>Submit Expense Reimbursement Claim</span>
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

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={claimantName}
                    onChange={e => setClaimantName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Email</label>
                  <input
                    type="email"
                    required
                    value={claimantEmail}
                    onChange={e => setClaimantEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Expense Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Travel & Flights">✈️ Travel & Flights</option>
                    <option value="Hotel & Lodging">🏨 Hotel & Lodging</option>
                    <option value="Meals & Team Dinner">🍽️ Meals & Team Dinner</option>
                    <option value="Software Subscriptions">💻 Software Subscriptions</option>
                    <option value="Office Supplies">📦 Office Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Merchant / Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uber, Delta, Starbucks"
                    value={merchant}
                    onChange={e => setMerchant(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Business Purpose & Notes
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="State the project or client purpose for this business expenditure..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Receipt Document / Invoice</label>
                <input
                  type="text"
                  placeholder="e.g. invoice_202608.pdf (Simulated optical receipt upload)"
                  value={receiptAttachment}
                  onChange={e => setReceiptAttachment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Policy Threshold Rule */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Claim Amount:</span>
                  <span className="font-bold text-white">${amount.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800">
                  <span className="text-slate-400">Deterministic Policy Evaluation:</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                    amount < 100 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {amount < 100 ? '⚡ Auto-Approved (<$100)' : '👔 Manager Approval Required (>$100)'}
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
                    <span>Auditing Policy Compliance & Executing Workflow...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Expense Claim</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Claims History */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>My Reimbursement Claims</span>
                <span className="text-[10px] font-mono text-slate-500">{expenses.length} claims</span>
              </h4>
              <div className="mt-3 space-y-3">
                {expenses.map(exp => (
                  <div key={exp.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{exp.merchant}</span>
                          <span className="text-[10px] font-mono text-indigo-400">({exp.id})</span>
                        </div>
                        <span className="text-[11px] text-slate-400">${exp.amount.toFixed(2)} • {exp.category}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                        exp.status === 'auto_approved' || exp.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : exp.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {exp.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px]">{exp.description}</p>

                    {exp.aiPolicyAudit && (
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono">
                        {exp.aiPolicyAudit.notes}
                      </div>
                    )}

                    {exp.managerNotes && (
                      <div className="text-[11px] text-emerald-400 font-sans">
                        <b>Manager Note:</b> {exp.managerNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGER VIEW (Approval Queue for >$100 claims) */}
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
              <h4 className="text-base font-bold text-white mt-2">Expense Approval Authority Required</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your current persona <b>{currentUser.name}</b> does not possess the <code className="text-rose-300 font-mono">wf:approve_reject</code> permission required to make managerial decisions on claims over $100.
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
                  <span>Expense Policy Approval Queue (Human Gate [exp_3])</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Claims exceeding the $100 micro-expense auto-approval threshold awaiting manager audit.
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                {pendingCount} pending audit
              </span>
            </div>

            {pendingCount === 0 ? (
              <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">All expense claims are cleared!</h4>
                <p className="text-xs text-slate-400 mt-1">No pending expense claims awaiting manager sign-off.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.filter(e => e.status === 'pending').map(claim => (
                  <div
                    key={claim.id}
                    className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{claim.claimantName}</span>
                          <span className="text-xs text-slate-500 font-mono">({claim.claimantEmail})</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Merchant: <b className="text-white">{claim.merchant}</b> (${claim.amount.toFixed(2)} {claim.currency})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-800/60 font-mono">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>High-Value Claim (&gt;$100)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 block text-[10px]">Claim Purpose & Description:</span>
                      <p className="text-slate-200 mt-0.5">{claim.description}</p>
                    </div>

                    {claim.aiPolicyAudit && (
                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-indigo-300 font-mono">
                        {claim.aiPolicyAudit.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-500 font-mono">Workflow Run: {claim.workflowRunId}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleManagerDecision(claim.id, 'reject')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleManagerDecision(claim.id, 'approve')}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Forward to Payroll</span>
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
                <span>Expense Claims Ledger & DDL Audit (<code className="font-mono text-xs">expense_claims</code>)</span>
              </h3>
              <p className="text-xs text-slate-400">PostgreSQL ACID financial audit log for all corporate expense vouchers.</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="p-3 font-semibold">Claim ID</th>
                  <th className="p-3 font-semibold">Claimant</th>
                  <th className="p-3 font-semibold">Merchant & Category</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-900/50">
                    <td className="p-3 text-indigo-400 font-bold">{exp.id}</td>
                    <td className="p-3 text-white">{exp.claimantName}</td>
                    <td className="p-3 text-slate-300">{exp.merchant} ({exp.category})</td>
                    <td className="p-3 text-emerald-400 font-bold">${exp.amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        exp.status === 'auto_approved' || exp.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-400'
                          : exp.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{exp.submittedAt}</td>
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
