import { DomainDefinition, DomainQuestion, IntermediateRepresentation } from '../types/floe';

// Hardcoded domain definition for P0 (design doc §1.3: "keep the domain definition
// itself in a data table, so adding domain #2 later is data entry, not a rewrite").
// This is plain-language, progressive questions for the Requirements Agent with no technical jargon.
export const questionSet = [
  {
    id: "app_name",
    prompt: "What would you like to call this app?",
    kind: "text",
    category: "scope" as const,
  },
  {
    id: "what_to_track",
    prompt: "What do you want to track? (e.g. employee leave requests and balances)",
    kind: "text",
    category: "entities" as const,
  },
  {
    id: "who_is_involved",
    prompt: "Who's involved in this process? (e.g. employees, their managers, HR)",
    kind: "text",
    category: "roles" as const,
  },
  {
    id: "approval_needed",
    prompt: "Does someone need to approve a request before it's final, or does it happen automatically?",
    kind: "choice",
    options: ["Someone approves it", "It happens automatically"],
    category: "workflow" as const,
  },
  {
    id: "escalation",
    prompt: "If the approver doesn't respond in time, should it go to someone else automatically?",
    kind: "choice",
    options: ["Yes, escalate to someone else", "No, just keep waiting"],
    category: "workflow" as const,
  },
  {
    id: "notifications",
    prompt: "Should people get an email when something changes (like a request being approved)?",
    kind: "choice",
    options: ["Yes", "No"],
    category: "notifications" as const,
  },
  // Technology Selector questions (design doc §5)
  {
    id: "expected_scale",
    prompt: "Roughly how many people will use this?",
    kind: "choice",
    options: ["Fewer than 50", "50 to 500", "500 to 5,000", "More than 5,000"],
    category: "scale" as const,
  },
  {
    id: "reliability",
    prompt: "How important is it that this is always available?",
    kind: "choice",
    options: ["Standard", "Business-critical"],
    category: "reliability" as const,
  },
  {
    id: "hosting_preference",
    prompt: "Where do you want it hosted?",
    kind: "choice",
    options: ["We host it for you", "My own server", "Just testing for now"],
    category: "hosting" as const,
  },
  {
    id: "budget_band",
    prompt: "What's a comfortable monthly budget for running this?",
    kind: "choice",
    options: ["Minimal", "Low", "Moderate", "Higher"],
    category: "budget" as const,
  },
] as const;

export const entityTemplate = {
  entities: [
    {
      name: "Employee",
      fields: [
        { name: "full_name", type: "string", required: true },
        { name: "email", type: "string", required: true },
        { name: "leave_balance_days", type: "number", default: 20 },
      ],
    },
    {
      name: "LeaveRequest",
      fields: [
        { name: "employee_id", type: "ref:Employee", required: true },
        { name: "start_date", type: "date", required: true },
        { name: "end_date", type: "date", required: true },
        { name: "requested_days", type: "number", required: true, default: 1 },
        { name: "reason_text", type: "text" },
        { name: "status", type: "enum", values: ["pending", "approved", "rejected"] },
      ],
    },
  ],
  relationships: [
    { from: "LeaveRequest", field: "employee_id", to: "Employee", cardinality: "many-to-one" },
  ],
  roles: [
    { name: "employee", permissions: ["create:LeaveRequest own", "read:LeaveRequest own"] },
    { name: "manager", permissions: ["read:LeaveRequest team", "update:LeaveRequest.status team"] },
    { name: "hr", permissions: ["read:LeaveRequest all", "update:LeaveRequest.status all"] },
  ],
};

export const workflowTemplate = {
  workflows: [
    {
      name: "submit_leave_request",
      trigger: "employee submits request",
      nodes: [
        {
          id: "s1",
          type: "condition",
          execution_mode: "deterministic",
          action: "validate_balance",
          expression: {
            operator: "lte",
            left: { ref: "leave_request.requested_days" },
            right: { ref: "employee.leave_balance_days" },
          },
        },
        {
          id: "s2",
          type: "action",
          execution_mode: "ai",
          action: "interpret_free_text_reason",
          goal: "classify reason_text into a standard category for reporting",
          scope: "read-only, no state mutation",
        },
        {
          id: "s3",
          type: "human",
          execution_mode: "human",
          action: "manager_approval",
          role: "manager",
          timeout: "48h",
        },
        {
          id: "s3_escalate",
          type: "human",
          execution_mode: "human",
          action: "hr_escalation_approval",
          role: "hr",
        },
        {
          id: "s4_approve",
          type: "action",
          execution_mode: "deterministic",
          action: "apply_approval",
          logic: "set status = approved, deduct requested_days from employee.leave_balance_days",
        },
        {
          id: "s4_reject",
          type: "action",
          execution_mode: "deterministic",
          action: "apply_rejection",
          logic: "set status = rejected",
        },
        { id: "approved", type: "terminal", outcome: "approved" },
        { id: "rejected", type: "terminal", outcome: "rejected" },
      ],
      edges: [
        { from: "s1", to: "s2", condition: "valid" },
        { from: "s1", to: "s4_reject", condition: "invalid" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4_approve", condition: "approve" },
        { from: "s3", to: "s4_reject", condition: "reject" },
        { from: "s3", to: "s3_escalate", condition: "timeout" },
        { from: "s3_escalate", to: "s4_approve", condition: "approve" },
        { from: "s3_escalate", to: "s4_reject", condition: "reject" },
        { from: "s4_approve", to: "approved" },
        { from: "s4_reject", to: "rejected" },
      ],
    },
  ],
  integrations: [{ type: "email", purpose: "notify manager and employee on status change" }],
};

export const LEAVE_MANAGEMENT_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-leave-01',
  domain: 'leave-management',
  name: 'Enterprise Leave Manager',
  description: 'Automated employee leave requests, AI categorization, manager approvals with 48h timeout escalation, and balance management.',
  entities: [
    {
      name: 'Employee',
      description: 'Internal organization staff member',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'full_name', type: 'string', required: true, description: 'Employee legal name' },
        { name: 'email', type: 'string', required: true, description: 'Corporate email address' },
        { name: 'department', type: 'string', required: true, default: 'Engineering' },
        { name: 'leave_balance_days', type: 'number', required: true, default: 20, description: 'Available PTO balance in days' },
        { name: 'manager_email', type: 'string', required: false }
      ]
    },
    {
      name: 'LeaveRequest',
      description: 'Formal time-off application record',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'employee_id', type: 'ref:Employee', required: true, description: 'Foreign key to applicant' },
        { name: 'start_date', type: 'date', required: true, description: 'Leave start date' },
        { name: 'end_date', type: 'date', required: true, description: 'Leave end date' },
        { name: 'requested_days', type: 'number', required: true, default: 1, description: 'Calculated business days' },
        { name: 'reason_text', type: 'text', description: 'Free-form employee reason' },
        { name: 'ai_category', type: 'string', description: 'AI-classified reason tag (e.g. Medical, Vacation, Personal)' },
        { name: 'status', type: 'enum', values: ['pending', 'approved', 'rejected', 'escalated'], required: true, default: 'pending' },
        { name: 'approval_note', type: 'text', description: 'Manager decision comment' },
        { name: 'created_at', type: 'date', required: true }
      ]
    }
  ],
  relationships: [
    { from: 'LeaveRequest', field: 'employee_id', to: 'Employee', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'employee',
      displayName: 'Employee (Requester)',
      description: 'Standard staff member. Submits time-off requests and monitors personal PTO balance.',
      permissions: ['create:LeaveRequest own', 'read:LeaveRequest own', 'read:Employee own'],
      userPersona: {
        name: 'Alex Rivera',
        email: 'alex.rivera@floe.internal',
        password: 'AlexLeave#2026',
        roleTitle: 'Software Engineer',
        department: 'Engineering & Product',
        avatar: 'AR',
        balance: 14,
        totalAllowance: 20
      }
    },
    {
      name: 'manager',
      displayName: 'Department Manager',
      description: 'Team lead with approval authority. Authorizes or rejects leave requests within 48h SLA.',
      permissions: ['read:LeaveRequest team', 'update:LeaveRequest.status team', 'read:Employee team'],
      userPersona: {
        name: 'Marcus Vance',
        email: 'marcus.vance@floe.internal',
        password: 'MarcusManager$2026',
        roleTitle: 'Engineering Director & Approver',
        department: 'Engineering Leadership',
        avatar: 'MV'
      }
    },
    {
      name: 'hr_admin',
      displayName: 'HR & People Operations',
      description: 'Human Resources escalated authority. Handles 48h timeout escalations, balance audits, and policies.',
      permissions: ['read:LeaveRequest all', 'update:LeaveRequest.status all', 'read:Employee all', 'update:Employee.leave_balance_days all'],
      userPersona: {
        name: 'Sophia Sterling',
        email: 'sophia.sterling@floe.internal',
        password: 'SophiaHR!2026',
        roleTitle: 'VP of People & HR Operations',
        department: 'People & Culture',
        avatar: 'SS'
      }
    },
    {
      name: 'admin',
      displayName: 'System Admin / CISO',
      description: 'Chief Information Security Officer. Database DDL access, audit trails, and platform governance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Infrastructure',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'submit_leave_request',
      description: 'Standard 4-tier leave validation, classification, and approval process',
      trigger: 'employee submits leave request form',
      nodes: [
        {
          id: 's1',
          type: 'condition',
          execution_mode: 'deterministic',
          action: 'validate_balance',
          label: 'Check PTO Balance',
          expression: {
            operator: 'lte',
            left: { ref: 'leave_request.requested_days' },
            right: { ref: 'employee.leave_balance_days' }
          }
        },
        {
          id: 's2',
          type: 'action',
          execution_mode: 'ai',
          action: 'interpret_free_text_reason',
          label: 'AI Reason Categorizer',
          goal: 'Classify unstructured reason_text into Medical, Vacation, Caregiving, or Personal Emergency',
          scope: 'Read-only context analysis, outputs category string to context'
        },
        {
          id: 's3',
          type: 'human',
          execution_mode: 'human',
          action: 'manager_approval',
          label: 'Manager Decision Review',
          role: 'manager',
          timeout: '48h',
          on_timeout: 'escalate_to_hr'
        },
        {
          id: 's4',
          type: 'action',
          execution_mode: 'deterministic',
          action: 'apply_decision',
          label: 'Deduct Balance & Finalize',
          mutations: [
            {
              target: 'LeaveRequest.status',
              set: '$context.inputs.action'
            },
            {
              target: 'Employee.leave_balance_days',
              op: 'subtract',
              value: '$context.record.requested_days',
              guard: "$context.inputs.action === 'approve'"
            }
          ]
        },
        {
          id: 'approved',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_approved',
          label: 'Request Approved',
          outcome: 'approved'
        },
        {
          id: 'rejected',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_rejected',
          label: 'Request Rejected',
          outcome: 'rejected'
        }
      ],
      edges: [
        { from: 's1', to: 's2', condition: 'valid', label: 'Balance Sufficient' },
        { from: 's1', to: 'rejected', condition: 'invalid', label: 'Insufficient Days' },
        { from: 's2', to: 's3', label: 'Categorized' },
        { from: 's3', to: 's4', condition: 'approve', label: 'Approved' },
        { from: 's3', to: 'rejected', condition: 'reject', label: 'Rejected' },
        { from: 's4', to: 'approved', label: 'Applied' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Notify manager on submission & employee on decision' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: {
      path: '/api/health',
      port: 4000,
      timeout_seconds: 30,
      expected_status: 200
    },
    network: {
      internal_only_db: true,
      reverse_proxy: true
    }
  }
};

export const EXPENSE_MANAGEMENT_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-expense-02',
  domain: 'expense-reimbursement',
  name: 'Apex Expense Claim Hub',
  description: 'Corporate travel & expense submissions, receipt optical OCR categorization, policy limit checks, and finance payouts.',
  entities: [
    {
      name: 'Employee',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'full_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'cost_center', type: 'string', required: true, default: 'R&D-102' }
      ]
    },
    {
      name: 'ExpenseClaim',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'employee_id', type: 'ref:Employee', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'currency', type: 'string', default: 'USD' },
        { name: 'merchant_name', type: 'string', required: true },
        { name: 'expense_date', type: 'date', required: true },
        { name: 'receipt_notes', type: 'text' },
        { name: 'ai_policy_flag', type: 'enum', values: ['compliant', 'suspicious_duplicate', 'exceeds_threshold'] },
        { name: 'status', type: 'enum', values: ['submitted', 'manager_approved', 'reimbursed', 'rejected'] }
      ]
    }
  ],
  relationships: [
    { from: 'ExpenseClaim', field: 'employee_id', to: 'Employee', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'submitter',
      displayName: 'Claim Submitter',
      description: 'Field consultant / staff member uploading receipts and claiming business travel expenses.',
      permissions: ['create:ExpenseClaim own', 'read:ExpenseClaim own'],
      userPersona: {
        name: 'David Kim',
        email: 'david.kim@floe.internal',
        password: 'DavidExp#2026',
        roleTitle: 'Senior Solutions Consultant',
        department: 'Client Solutions & Sales',
        avatar: 'DK',
        balance: 850,
        totalAllowance: 5000
      }
    },
    {
      name: 'manager',
      displayName: 'Department Budget Approver',
      description: 'Reviews claims against team budget caps, checks receipts, and authorizes payout.',
      permissions: ['read:ExpenseClaim team', 'update:ExpenseClaim.status team'],
      userPersona: {
        name: 'Rachel Green',
        email: 'rachel.green@floe.internal',
        password: 'RachelBudget$2026',
        roleTitle: 'VP of Commercial Operations',
        department: 'Commercial Leadership',
        avatar: 'RG'
      }
    },
    {
      name: 'finance',
      displayName: 'Finance & Compliance Auditor',
      description: 'Corporate Finance. Audits AI policy flags, duplicates, and initiates wire reimbursements.',
      permissions: ['read:ExpenseClaim all', 'update:ExpenseClaim.status all', 'audit:policy all'],
      userPersona: {
        name: 'Siddharth Nair',
        email: 'siddharth.nair@floe.internal',
        password: 'FinanceAudit!2026',
        roleTitle: 'Senior Financial Controller',
        department: 'Treasury & Accounts Payable',
        avatar: 'SN'
      }
    },
    {
      name: 'admin',
      displayName: 'ERP Platform Administrator',
      description: 'Global Finance System Administrator. Manages ERP connectors, audit logs, and security governance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & ERP Infrastructure',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'process_expense_claim',
      trigger: 'employee uploads receipt & submits claim',
      nodes: [
        {
          id: 'exp_1',
          type: 'condition',
          execution_mode: 'deterministic',
          action: 'threshold_check',
          label: 'Check Auto-Approval Limit (< $100)',
          expression: {
            operator: 'lt',
            left: { ref: 'expense_claim.amount' },
            right: { value: 100 }
          }
        },
        {
          id: 'exp_2',
          type: 'action',
          execution_mode: 'ai',
          action: 'audit_policy_compliance',
          label: 'AI Receipt & Policy Auditor',
          goal: 'Inspect merchant itemization against anti-alcohol and duplicate submission policy',
          scope: 'Flags items as compliant or flagged'
        },
        {
          id: 'exp_3',
          type: 'human',
          execution_mode: 'human',
          action: 'finance_approval',
          label: 'Finance Director Review',
          role: 'finance',
          timeout: '72h',
          on_timeout: 'auto_escalate_cfo'
        },
        {
          id: 'exp_4',
          type: 'action',
          execution_mode: 'deterministic',
          action: 'trigger_payout_record',
          label: 'Disburse Payout',
          mutations: [
            { target: 'ExpenseClaim.status', set: "'reimbursed'" }
          ]
        },
        { id: 'reimbursed', type: 'terminal', execution_mode: 'deterministic', outcome: 'reimbursed', label: 'Claim Paid' },
        { id: 'rejected', type: 'terminal', execution_mode: 'deterministic', outcome: 'rejected', label: 'Claim Denied' }
      ],
      edges: [
        { from: 'exp_1', to: 'exp_4', condition: 'under_limit', label: 'Auto-Approve (<$100)' },
        { from: 'exp_1', to: 'exp_2', condition: 'over_limit', label: 'Over $100' },
        { from: 'exp_2', to: 'exp_3', label: 'Audit Passed' },
        { from: 'exp_3', to: 'exp_4', condition: 'approve', label: 'Approved' },
        { from: 'exp_3', to: 'rejected', condition: 'reject', label: 'Rejected' },
        { from: 'exp_4', to: 'reimbursed' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Send payout remittance advice' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: {
      path: '/api/health',
      port: 4000,
      timeout_seconds: 30,
      expected_status: 200
    },
    network: {
      internal_only_db: true,
      reverse_proxy: true
    }
  }
};

export const IT_SERVICE_DESK_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-itsm-04',
  domain: 'it-service-desk',
  name: 'Enterprise IT Service Desk & SLA Manager',
  description: 'IT ticket lifecycle management with automatic category/priority routing, SLA tracking, agent assignments, and internal comments.',
  entities: [
    {
      name: 'Employee',
      description: 'Requesting employee or staff member',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'full_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'department', type: 'string', required: true, default: 'Engineering' }
      ]
    },
    {
      name: 'ServiceDeskAgent',
      description: 'IT support tier specialist',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'full_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'specialty', type: 'string', default: 'Hardware & Access' },
        { name: 'active_tickets_count', type: 'number', default: 0 }
      ]
    },
    {
      name: 'ITTicket',
      description: 'Core IT service request or incident record',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'ticket_number', type: 'string', required: true },
        { name: 'requester_id', type: 'ref:Employee', required: true },
        { name: 'assigned_agent_id', type: 'ref:ServiceDeskAgent', required: false },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'category', type: 'enum', values: ['Hardware', 'Software', 'Access & Permissions', 'Network & VPN', 'Email & Collaboration'], required: true },
        { name: 'priority', type: 'enum', values: ['P1_Critical', 'P2_High', 'P3_Medium', 'P4_Low'], required: true, default: 'P3_Medium' },
        { name: 'status', type: 'enum', values: ['open', 'assigned', 'in_progress', 'waiting_on_user', 'resolved', 'closed'], required: true, default: 'open' },
        { name: 'attachment_url', type: 'string', required: false },
        { name: 'sla_target_hours', type: 'number', required: true, default: 24 },
        { name: 'sla_breached', type: 'boolean', default: false },
        { name: 'created_at', type: 'date', required: true },
        { name: 'resolved_at', type: 'date', required: false }
      ]
    },
    {
      name: 'TicketComment',
      description: 'Audit thread conversation or internal agent notes',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'ticket_id', type: 'ref:ITTicket', required: true },
        { name: 'author_email', type: 'string', required: true },
        { name: 'is_internal_note', type: 'boolean', default: false },
        { name: 'message', type: 'text', required: true },
        { name: 'created_at', type: 'date', required: true }
      ]
    }
  ],
  relationships: [
    { from: 'ITTicket', field: 'requester_id', to: 'Employee', cardinality: 'many-to-one' },
    { from: 'ITTicket', field: 'assigned_agent_id', to: 'ServiceDeskAgent', cardinality: 'many-to-one' },
    { from: 'TicketComment', field: 'ticket_id', to: 'ITTicket', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'employee',
      displayName: 'Employee (Requester)',
      description: 'Staff member creating IT incident tickets, diagnostic attachments, and tracking SLA resolution.',
      permissions: ['create:ITTicket own', 'read:ITTicket own', 'create:TicketComment own'],
      userPersona: {
        name: 'Alex Rivera',
        email: 'alex.rivera@floe.internal',
        password: 'AlexTech#2026',
        roleTitle: 'Software Engineer',
        department: 'Engineering & Product',
        avatar: 'AR'
      }
    },
    {
      name: 'service_desk_agent',
      displayName: 'Tier 2 Support Specialist',
      description: 'Service desk operator. Investigates root causes, triages priority, updates status, and adds technical notes.',
      permissions: ['read:ITTicket all', 'update:ITTicket.status all', 'update:ITTicket.assigned_agent_id all', 'create:TicketComment all'],
      userPersona: {
        name: 'Sarah Chen',
        email: 'sarah.chen@floe.internal',
        password: 'AgentSarah$2026',
        roleTitle: 'Tier 2 Support Engineer',
        department: 'IT Service Operations',
        avatar: 'SC'
      }
    },
    {
      name: 'it_manager',
      displayName: 'IT Operations Lead',
      description: 'Service Desk Manager. Manages SLA adherence, queue re-assignment, and high-impact access approvals.',
      permissions: ['read:ITTicket all', 'update:ITTicket all', 'delete:ITTicket all', 'read:ServiceDeskAgent all'],
      userPersona: {
        name: 'Marcus Vance',
        email: 'marcus.vance@floe.internal',
        password: 'ManagerMarcus@2026',
        roleTitle: 'Director of IT Infrastructure',
        department: 'IT & Cloud Operations',
        avatar: 'MV'
      }
    },
    {
      name: 'admin',
      displayName: 'CISO / Platform Admin',
      description: 'Chief Information Security Officer. Database DDL access, audit trails, and zero-trust policy management.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Infrastructure',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'process_it_ticket_lifecycle',
      trigger: 'employee submits an IT incident or service request',
      nodes: [
        {
          id: 'it_1',
          type: 'condition',
          execution_mode: 'deterministic',
          action: 'calculate_sla_target',
          label: 'Determine SLA by Priority (P1=4h, P2=8h, P3=24h, P4=48h)',
          expression: {
            operator: 'eq',
            left: { ref: 'it_ticket.priority' },
            right: { value: 'P1_Critical' }
          }
        },
        {
          id: 'it_2',
          type: 'action',
          execution_mode: 'ai',
          action: 'triage_category_and_solution',
          label: 'AI Diagnostic & Auto-Assignment Suggestion',
          goal: 'Analyze ticket description for suggested troubleshooting steps, severity verification, and category routing',
          scope: 'Read-only context analysis'
        },
        {
          id: 'it_3',
          type: 'action',
          execution_mode: 'deterministic',
          action: 'auto_dispatch_agent',
          label: 'Auto-Assign Service Desk Agent',
          mutations: [
            { target: 'ITTicket.status', set: "'assigned'" }
          ]
        },
        {
          id: 'it_4',
          type: 'human',
          execution_mode: 'human',
          action: 'agent_investigation_and_resolve',
          label: 'Service Desk Agent Troubleshooting & Resolution',
          role: 'service_desk_agent',
          timeout: '24h',
          on_timeout: 'escalate_to_it_manager'
        },
        { id: 'resolved', type: 'terminal', execution_mode: 'deterministic', outcome: 'resolved', label: 'Ticket Resolved' },
        { id: 'escalated', type: 'terminal', execution_mode: 'deterministic', outcome: 'escalated', label: 'SLA Escalated to Manager' }
      ],
      edges: [
        { from: 'it_1', to: 'it_2', label: 'SLA Bound' },
        { from: 'it_2', to: 'it_3', label: 'Triaged' },
        { from: 'it_3', to: 'it_4', label: 'Assigned to Agent' },
        { from: 'it_4', to: 'resolved', condition: 'resolve', label: 'Resolved' },
        { from: 'it_4', to: 'escalated', condition: 'sla_breach', label: 'SLA Breach Escalation' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Notify employee on status update and alert agent on new assignment' },
    { type: 'slack', purpose: 'P1 Critical incident channel broadcast' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: {
      path: '/api/health',
      port: 4000,
      timeout_seconds: 30,
      expected_status: 200
    },
    network: {
      internal_only_db: true,
      reverse_proxy: true
    }
  }
};

export const IT_EQUIPMENT_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-it-03',
  domain: 'it-equipment-request',
  name: 'IT Equipment & Hardware Hub',
  description: 'Streamlined laptop, monitor, and peripheral requests with inventory check, AI spec matching, and IT Lead approval.',
  entities: [
    {
      name: 'Employee',
      description: 'Requesting staff member',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'full_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'department', type: 'string', required: true, default: 'Product' }
      ]
    },
    {
      name: 'EquipmentRequest',
      description: 'Hardware or peripheral request record',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'employee_id', type: 'ref:Employee', required: true },
        { name: 'item_type', type: 'enum', values: ['MacBook Pro M3', 'Dell XPS 15', '4K Monitor', 'Noise-Cancelling Headset', 'Ergonomic Chair'], required: true },
        { name: 'business_justification', type: 'text', required: true },
        { name: 'urgency_level', type: 'enum', values: ['standard', 'urgent_onboarding', 'replacement_damaged'], default: 'standard' },
        { name: 'estimated_cost', type: 'number', required: true, default: 1200 },
        { name: 'status', type: 'enum', values: ['pending_it_review', 'approved_procuring', 'delivered', 'rejected'], default: 'pending_it_review' }
      ]
    }
  ],
  relationships: [
    { from: 'EquipmentRequest', field: 'employee_id', to: 'Employee', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'requester',
      displayName: 'Hardware Requester',
      description: 'Staff member requesting workstations, monitors, laptops, and peripheral kits.',
      permissions: ['create:EquipmentRequest own', 'read:EquipmentRequest own'],
      userPersona: {
        name: 'Chloe Bennett',
        email: 'chloe.bennett@floe.internal',
        password: 'ChloeDev#2026',
        roleTitle: 'Lead UX Designer',
        department: 'Product & Design',
        avatar: 'CB'
      }
    },
    {
      name: 'it_manager',
      displayName: 'IT Procurement Manager',
      description: 'Hardware Asset Manager. Evaluates vendor inventory, quotes, and approves deliveries.',
      permissions: ['read:EquipmentRequest all', 'update:EquipmentRequest.status all'],
      userPersona: {
        name: 'Liam Scott',
        email: 'liam.scott@floe.internal',
        password: 'LiamProcure$2026',
        roleTitle: 'IT Procurement & Asset Lead',
        department: 'IT Asset Management',
        avatar: 'LS'
      }
    },
    {
      name: 'admin',
      displayName: 'Asset & Platform Admin',
      description: 'Global Asset Administrator. Oversees depreciation models, serial registry, and compliance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Asset Registry',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'process_equipment_request',
      trigger: 'employee submits hardware requisition form',
      nodes: [
        {
          id: 'eq_1',
          type: 'condition',
          execution_mode: 'deterministic',
          action: 'budget_threshold_check',
          label: 'Budget Threshold (< $500)',
          expression: {
            operator: 'lt',
            left: { ref: 'equipment_request.estimated_cost' },
            right: { value: 500 }
          }
        },
        {
          id: 'eq_2',
          type: 'action',
          execution_mode: 'ai',
          action: 'spec_compatibility_check',
          label: 'AI Spec Compatibility & Urgency Check',
          goal: 'Verify compatibility of requested hardware with employee role & validate justification',
          scope: 'Read-only context analysis'
        },
        {
          id: 'eq_3',
          type: 'human',
          execution_mode: 'human',
          action: 'it_lead_approval',
          label: 'IT Lead Review & Fulfillment',
          role: 'it_manager',
          timeout: '48h',
          on_timeout: 'escalate_to_procurement'
        },
        {
          id: 'eq_4',
          type: 'action',
          execution_mode: 'deterministic',
          action: 'mark_approved_order',
          label: 'Approve & Dispatch PO',
          mutations: [
            { target: 'EquipmentRequest.status', set: "'approved_procuring'" }
          ]
        },
        { id: 'approved', type: 'terminal', execution_mode: 'deterministic', outcome: 'approved_procuring', label: 'Order Dispatched' },
        { id: 'rejected', type: 'terminal', execution_mode: 'deterministic', outcome: 'rejected', label: 'Request Denied' }
      ],
      edges: [
        { from: 'eq_1', to: 'eq_4', condition: 'under_500', label: 'Auto-Approve (<$500)' },
        { from: 'eq_1', to: 'eq_2', condition: 'over_500', label: 'Over $500' },
        { from: 'eq_2', to: 'eq_3', label: 'Compatibility Checked' },
        { from: 'eq_3', to: 'eq_4', condition: 'approve', label: 'Approved' },
        { from: 'eq_3', to: 'rejected', condition: 'reject', label: 'Rejected' },
        { from: 'eq_4', to: 'approved' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Notify IT support team on submission' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: {
      path: '/api/health',
      port: 4000,
      timeout_seconds: 30,
      expected_status: 200
    },
    network: {
      internal_only_db: true,
      reverse_proxy: true
    }
  }
};

export const CRM_SALES_PIPELINE_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-crm-01',
  domain: 'crm-sales-pipeline',
  name: 'Enterprise CRM & Sales Pipeline',
  description: 'Lead capture, opportunity pipeline stages, AI lead scoring, and deal-close approval workflow.',
  entities: [
    {
      name: 'Contact',
      description: 'A prospect or customer individual',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'full_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'company_name', type: 'string', required: false },
        { name: 'phone', type: 'string', required: false },
        { name: 'owner_email', type: 'string', required: true, description: 'Assigned sales rep' }
      ]
    },
    {
      name: 'Opportunity',
      description: 'A sales deal moving through the pipeline',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'contact_id', type: 'ref:Contact', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'deal_value', type: 'number', required: true, default: 0 },
        { name: 'stage', type: 'enum', values: ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], required: true, default: 'new' },
        { name: 'ai_lead_score', type: 'number', description: 'AI-computed 0-100 propensity to close' },
        { name: 'close_notes', type: 'text', description: 'Rep notes on why deal was won or lost' },
        { name: 'created_at', type: 'date', required: true }
      ]
    }
  ],
  relationships: [
    { from: 'Opportunity', field: 'contact_id', to: 'Contact', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'sales_rep',
      displayName: 'Sales Representative',
      description: 'Owns contacts and opportunities; moves deals through the pipeline.',
      permissions: ['create:Opportunity own', 'read:Opportunity own', 'update:Opportunity own', 'read:Contact own', 'create:Contact own'],
      userPersona: {
        name: 'Priya Nair',
        email: 'priya.nair@floe.internal',
        password: 'PriyaSales#2026',
        roleTitle: 'Account Executive',
        department: 'Sales',
        avatar: 'PN'
      }
    },
    {
      name: 'sales_manager',
      displayName: 'Sales Manager',
      description: 'Approves discounts above threshold and reviews team pipeline.',
      permissions: ['read:Opportunity team', 'update:Opportunity.stage team', 'read:Contact team'],
      userPersona: {
        name: 'Marcus Vance',
        email: 'marcus.vance@floe.internal',
        password: 'MarcusManager$2026',
        roleTitle: 'Regional Sales Manager',
        department: 'Sales Leadership',
        avatar: 'MV'
      }
    },
    {
      name: 'admin',
      displayName: 'System Admin / CISO',
      description: 'Chief Information Security Officer. Database DDL access, audit trails, and platform governance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Infrastructure',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'advance_opportunity_stage',
      description: 'Score and validate a deal before advancing stage, with manager approval to close-won above a discount threshold',
      trigger: 'sales rep updates opportunity stage',
      nodes: [
        {
          id: 's1',
          type: 'action',
          execution_mode: 'ai',
          action: 'score_lead',
          label: 'AI Lead Scoring',
          goal: 'Estimate propensity to close based on engagement and deal size',
          scope: 'Read-only context analysis, outputs ai_lead_score to context'
        },
        {
          id: 's2',
          type: 'condition',
          execution_mode: 'deterministic',
          action: 'check_discount_threshold',
          label: 'Check Discount Threshold',
          expression: {
            operator: 'lte',
            left: { ref: 'opportunity.deal_value' },
            right: { value: 100000 }
          }
        },
        {
          id: 's3',
          type: 'human',
          execution_mode: 'human',
          action: 'manager_close_approval',
          label: 'Manager Close Approval',
          role: 'sales_manager',
          timeout: '24h',
          on_timeout: 'escalate_to_manager'
        },
        {
          id: 'won',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_won',
          label: 'Deal Won',
          outcome: 'won'
        }
      ],
      edges: [
        { from: 's1', to: 's2', label: 'Scored' },
        { from: 's2', to: 'won', condition: 'valid', label: 'Within Threshold' },
        { from: 's2', to: 's3', condition: 'invalid', label: 'Needs Manager Approval' },
        { from: 's3', to: 'won', condition: 'approve', label: 'Approved' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Notify rep and manager on stage changes and approval requests' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: { path: '/api/health', port: 4000, timeout_seconds: 30, expected_status: 200 },
    network: { internal_only_db: true, reverse_proxy: true }
  }
};

export const FINANCE_INVOICE_APPROVAL_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-finance-01',
  domain: 'finance-invoice-approval',
  name: 'Enterprise Finance & Invoice Approval Hub',
  description: 'Vendor invoice intake, budget compliance checks, multi-level financial approval, and payment scheduling.',
  entities: [
    {
      name: 'Vendor',
      description: 'A registered supplier/vendor',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'name', type: 'string', required: true },
        { name: 'tax_id', type: 'string', required: false },
        { name: 'bank_account_ref', type: 'string', required: false, description: 'Tokenized reference to bank details, never raw account numbers' }
      ]
    },
    {
      name: 'Invoice',
      description: 'A vendor invoice awaiting review and payment',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'vendor_id', type: 'ref:Vendor', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'currency', type: 'string', required: true, default: 'USD' },
        { name: 'cost_center', type: 'string', required: true },
        { name: 'status', type: 'enum', values: ['submitted', 'under_review', 'approved', 'rejected', 'paid'], required: true, default: 'submitted' },
        { name: 'ai_budget_flag', type: 'string', description: 'AI-flagged budget/duplicate/policy risk note' },
        { name: 'approval_note', type: 'text' },
        { name: 'created_at', type: 'date', required: true }
      ]
    }
  ],
  relationships: [
    { from: 'Invoice', field: 'vendor_id', to: 'Vendor', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'ap_clerk',
      displayName: 'Accounts Payable Clerk',
      description: 'Enters and submits vendor invoices for review.',
      permissions: ['create:Invoice own', 'read:Invoice own', 'read:Vendor all', 'create:Vendor own'],
      userPersona: {
        name: 'Wei Zhang',
        email: 'wei.zhang@floe.internal',
        password: 'WeiFinance#2026',
        roleTitle: 'Accounts Payable Clerk',
        department: 'Finance Operations',
        avatar: 'WZ'
      }
    },
    {
      name: 'finance_manager',
      displayName: 'Finance Manager',
      description: 'Reviews and approves invoices within budget thresholds.',
      permissions: ['read:Invoice all', 'update:Invoice.status all', 'read:Vendor all'],
      userPersona: {
        name: 'Sophia Sterling',
        email: 'sophia.sterling.finance@floe.internal',
        password: 'SophiaFinance!2026',
        roleTitle: 'Finance Manager',
        department: 'Finance',
        avatar: 'SS'
      }
    },
    {
      name: 'admin',
      displayName: 'System Admin / CISO',
      description: 'Chief Information Security Officer. Database DDL access, audit trails, and platform governance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Infrastructure',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'review_invoice',
      description: 'Budget and duplicate check, then manager approval before scheduling payment',
      trigger: 'AP clerk submits invoice',
      nodes: [
        {
          id: 's1',
          type: 'action',
          execution_mode: 'ai',
          action: 'check_budget_and_duplicates',
          label: 'AI Budget & Duplicate Check',
          goal: 'Flag invoices exceeding cost-center budget or matching a recent duplicate submission',
          scope: 'Read-only context analysis, outputs ai_budget_flag to context'
        },
        {
          id: 's2',
          type: 'human',
          execution_mode: 'human',
          action: 'finance_manager_approval',
          label: 'Finance Manager Approval',
          role: 'finance_manager',
          timeout: '72h',
          on_timeout: 'escalate_to_manager'
        },
        {
          id: 's3',
          type: 'action',
          execution_mode: 'deterministic',
          action: 'apply_decision',
          label: 'Update Status',
          mutations: [
            { target: 'Invoice.status', set: '$context.inputs.action' }
          ]
        },
        {
          id: 'approved',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_approved',
          label: 'Invoice Approved',
          outcome: 'approved'
        },
        {
          id: 'rejected',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_rejected',
          label: 'Invoice Rejected',
          outcome: 'rejected'
        }
      ],
      edges: [
        { from: 's1', to: 's2', label: 'Checked' },
        { from: 's2', to: 's3', condition: 'approve', label: 'Approved' },
        { from: 's2', to: 'rejected', condition: 'reject', label: 'Rejected' },
        { from: 's3', to: 'approved', label: 'Applied' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Notify AP clerk and finance manager on submission and decision' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: { path: '/api/health', port: 4000, timeout_seconds: 30, expected_status: 200 },
    network: { internal_only_db: true, reverse_proxy: true }
  }
};

export const PAYROLL_PROCESSING_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-payroll-01',
  domain: 'payroll-processing',
  name: 'Enterprise Payroll Processing & Compliance Hub',
  description: 'Monthly payroll run generation, deduction/tax compliance checks, and multi-stage payroll sign-off before disbursement.',
  entities: [
    {
      name: 'PayrollEmployee',
      description: 'Employee payroll profile (kept separate from HR Employee entity for least-privilege access)',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'full_name', type: 'string', required: true },
        { name: 'employee_code', type: 'string', required: true },
        { name: 'base_salary', type: 'number', required: true },
        { name: 'tax_region', type: 'string', required: true, default: 'US-Federal' },
        { name: 'bank_account_ref', type: 'string', required: false, description: 'Tokenized reference, never raw bank details' }
      ]
    },
    {
      name: 'PayrollRun',
      description: 'A single payroll cycle covering a pay period',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Primary key UUID' },
        { name: 'employee_id', type: 'ref:PayrollEmployee', required: true },
        { name: 'pay_period_start', type: 'date', required: true },
        { name: 'pay_period_end', type: 'date', required: true },
        { name: 'gross_pay', type: 'number', required: true },
        { name: 'deductions_total', type: 'number', required: true, default: 0 },
        { name: 'net_pay', type: 'number', required: true },
        { name: 'status', type: 'enum', values: ['draft', 'under_review', 'approved', 'disbursed', 'rejected'], required: true, default: 'draft' },
        { name: 'ai_compliance_flag', type: 'string', description: 'AI-flagged tax/deduction anomaly note' },
        { name: 'created_at', type: 'date', required: true }
      ]
    }
  ],
  relationships: [
    { from: 'PayrollRun', field: 'employee_id', to: 'PayrollEmployee', cardinality: 'many-to-one' }
  ],
  roles: [
    {
      name: 'payroll_admin',
      displayName: 'Payroll Administrator',
      description: 'Generates and prepares payroll runs for review.',
      permissions: ['create:PayrollRun own', 'read:PayrollRun own', 'update:PayrollRun own', 'read:PayrollEmployee all'],
      userPersona: {
        name: 'Wei Zhang',
        email: 'wei.zhang.payroll@floe.internal',
        password: 'WeiPayroll#2026',
        roleTitle: 'Payroll Administrator',
        department: 'Finance Operations',
        avatar: 'WZ'
      }
    },
    {
      name: 'finance_controller',
      displayName: 'Finance Controller',
      description: 'Signs off on payroll runs before disbursement.',
      permissions: ['read:PayrollRun all', 'update:PayrollRun.status all'],
      userPersona: {
        name: 'Sophia Sterling',
        email: 'sophia.sterling.payroll@floe.internal',
        password: 'SophiaPayroll!2026',
        roleTitle: 'Finance Controller',
        department: 'Finance',
        avatar: 'SS'
      }
    },
    {
      name: 'admin',
      displayName: 'System Admin / CISO',
      description: 'Chief Information Security Officer. Database DDL access, audit trails, and platform governance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      userPersona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@floe.internal',
        password: 'AdminElena!2026',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Infrastructure',
        avatar: 'ER'
      }
    }
  ],
  workflows: [
    {
      name: 'process_payroll_run',
      description: 'Compliance check then controller sign-off before disbursement',
      trigger: 'payroll admin submits a payroll run for review',
      nodes: [
        {
          id: 's1',
          type: 'action',
          execution_mode: 'ai',
          action: 'check_tax_and_deduction_compliance',
          label: 'AI Tax & Deduction Compliance Check',
          goal: 'Flag anomalies vs. prior pay periods, incorrect tax region rates, or missing statutory deductions',
          scope: 'Read-only context analysis, outputs ai_compliance_flag to context'
        },
        {
          id: 's2',
          type: 'human',
          execution_mode: 'human',
          action: 'controller_signoff',
          label: 'Finance Controller Sign-off',
          role: 'finance_controller',
          timeout: '48h',
          on_timeout: 'escalate_to_manager'
        },
        {
          id: 's3',
          type: 'action',
          execution_mode: 'deterministic',
          action: 'apply_decision',
          label: 'Update Status',
          mutations: [
            { target: 'PayrollRun.status', set: '$context.inputs.action' }
          ]
        },
        {
          id: 'approved',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_approved',
          label: 'Payroll Run Approved',
          outcome: 'approved'
        },
        {
          id: 'rejected',
          type: 'terminal',
          execution_mode: 'deterministic',
          action: 'terminal_rejected',
          label: 'Payroll Run Rejected',
          outcome: 'rejected'
        }
      ],
      edges: [
        { from: 's1', to: 's2', label: 'Checked' },
        { from: 's2', to: 's3', condition: 'approve', label: 'Approved' },
        { from: 's2', to: 'rejected', condition: 'reject', label: 'Rejected' },
        { from: 's3', to: 'approved', label: 'Applied' }
      ]
    }
  ],
  integrations: [
    { type: 'email', purpose: 'Notify payroll admin and finance controller on submission and sign-off' }
  ],
  deployment: {
    target_options: ['local', 'cloud_paas', 'on_prem'],
    default: 'cloud_paas',
    containerization: 'docker-compose',
    health_check: { path: '/api/health', port: 4000, timeout_seconds: 30, expected_status: 200 },
    network: { internal_only_db: true, reverse_proxy: true }
  }
};

export const DOMAINS: DomainDefinition[] = [
  {
    id: 'dom-leave',
    key: 'leave-management',
    display_name: 'Leave & Time-Off Management',
    icon: 'Palmtree',
    description: 'PTO requests, auto balance deduction, AI reason tagging, and manager timeout escalation.',
    keywords: [
      'leave', 'time off', 'time-off', 'pto', 'vacation', 'holiday request', 'sick leave',
      'absence', 'leave management', 'annual leave', 'time off tracker'
    ],
    features: [
      'Employee leave request submission with date range & reason',
      'Automatic leave balance deduction & tracking',
      'AI-assisted free-text reason categorization (Medical / Family / Vacation)',
      'Manager approval workflow with 48h timeout escalation to HR',
      'Role-based access: Employee, Manager, HR Admin, System Admin (CISO)',
      'Email notifications on submission, approval, and escalation'
    ],
    question_set: [
      {
        id: 'app_name',
        category: 'scope',
        prompt: 'What would you like to call this app?',
        kind: 'text',
        placeholder: 'e.g. Enterprise Leave Manager',
        suggestions: ['Enterprise Leave Manager', 'Global PTO & Time-Off Portal', 'Team Absence Hub']
      },
      {
        id: 'what_to_track',
        category: 'entities',
        prompt: 'What do you want to track? (e.g. employee leave requests and balances)',
        kind: 'text',
        placeholder: 'e.g. Employee leave requests, PTO balances, and reasons',
        suggestions: [
          'Employee leave requests, 20 days annual PTO balances, and reason notes',
          'Sick leave, vacation requests, and doctor notes',
          'Paid time off with carryover balances and department holiday calendars'
        ]
      },
      {
        id: 'who_is_involved',
        category: 'roles',
        prompt: "Who's involved in this process? (e.g. employees, their managers, HR)",
        kind: 'text',
        placeholder: 'e.g. Employees (requesters), Department Managers (approvers), HR Ops (admins)',
        suggestions: [
          'Employees (requesters), Line Managers (approvers), HR Operations (escalation & audits)',
          'Team members and direct managers only (2-tier)',
          'All staff, department leads, HR Directors, and System Admin'
        ]
      },
      {
        id: 'approval_needed',
        category: 'workflow',
        prompt: "Does someone need to approve a request before it's final, or does it happen automatically?",
        kind: 'choice',
        options: ['Someone approves it', 'It happens automatically'],
        suggestions: [
          'Someone approves it (Line manager reviews)',
          'It happens automatically if balance is sufficient (< 3 days)',
          'Tiered: Auto-approve 1 day, Manager review for longer'
        ]
      },
      {
        id: 'escalation',
        category: 'workflow',
        prompt: "If the approver doesn't respond in time, should it go to someone else automatically?",
        kind: 'choice',
        options: ['Yes, escalate to someone else', 'No, just keep waiting'],
        suggestions: [
          'Yes, escalate to someone else (48h timeout → Escalate to HR)',
          'No, just keep waiting (send periodic email reminder)',
          'Yes, escalate to department head after 24 hours'
        ]
      },
      {
        id: 'notifications',
        category: 'notifications',
        prompt: 'Should people get an email when something changes (like a request being approved)?',
        kind: 'choice',
        options: ['Yes', 'No'],
        suggestions: [
          'Yes (Email notification on status change)',
          'No (In-app dashboard alerts only)',
          'Yes (Email + Slack channel notification)'
        ]
      },
      {
        id: 'expected_scale',
        category: 'scale',
        prompt: 'Roughly how many people will use this?',
        kind: 'choice',
        options: ['Fewer than 50', '50 to 500', '500 to 5,000', 'More than 5,000'],
        suggestions: ['Fewer than 50', '50 to 500', '500 to 5,000', 'More than 5,000']
      },
      {
        id: 'reliability',
        category: 'reliability',
        prompt: 'How important is it that this is always available?',
        kind: 'choice',
        options: ['Standard', 'Business-critical'],
        suggestions: ['Standard (99.5% uptime)', 'Business-critical (99.99% high-availability)']
      },
      {
        id: 'hosting_preference',
        category: 'hosting',
        prompt: 'Where do you want it hosted?',
        kind: 'choice',
        options: ['We host it for you', 'My own server', 'Just testing for now'],
        suggestions: ['We host it for you (Cloud Managed)', 'My own server (On-Premises / Docker)', 'Just testing for now (Free Sandbox)']
      },
      {
        id: 'budget_band',
        category: 'budget',
        prompt: "What's a comfortable monthly budget for running this?",
        kind: 'choice',
        options: ['Minimal', 'Low', 'Moderate', 'Higher'],
        suggestions: ['Minimal ($0 - $20/mo)', 'Low ($20 - $100/mo)', 'Moderate ($100 - $300/mo)', 'Higher ($300+/mo)']
      }
    ],
    default_ir: LEAVE_MANAGEMENT_IR
  },
  {
    id: 'dom-expense',
    key: 'expense-reimbursement',
    display_name: 'Expense Reimbursement & Policy Auditor',
    icon: 'Receipt',
    description: 'Corporate travel & expense claims, receipt optical analysis, limit compliance, and finance approval.',
    keywords: [
      'expense', 'reimbursement', 'travel expense', 'expense claim', 'receipt', 'expense report',
      'expense management', 'per diem', 'mileage claim'
    ],
    features: [
      'Expense claim submission with receipt & merchant details',
      'AI-assisted receipt/policy compliance auditing (duplicates, disallowed categories)',
      'Configurable auto-approval threshold for low-value claims (< $100)',
      'Finance approval workflow with 72h timeout escalation to CFO',
      'Role-based access: Submitter, Department Manager, Finance Auditor, System Admin (CISO)',
      'Reimbursement payout status tracking'
    ],
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name and scope of your expense system?',
        placeholder: 'e.g. Apex Expense Claim Hub',
        suggestions: ['Apex Expense Claim Hub', 'Global Travel & Meals Reimbursement', 'R&D Equipment Purchasing Portal']
      },
      {
        id: 'q2',
        category: 'entities',
        question: 'What is the auto-approval threshold without requiring VP sign-off?',
        placeholder: 'e.g. $100 auto-approved for verified merchants',
        suggestions: ['$100 threshold', '$250 threshold', 'Every claim requires direct manager sign-off']
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'How should AI audit receipt line items and policies?',
        placeholder: 'e.g. Detect alcohol, personal items, duplicate claims',
        suggestions: [
          'Detect unallowable categories and duplicate merchant receipts',
          'Currency conversion & receipt math total verification',
          'Strict per-diem meals boundary check'
        ]
      }
    ],
    default_ir: EXPENSE_MANAGEMENT_IR
  },
  {
    id: 'dom-equipment',
    key: 'it-equipment-request',
    display_name: 'IT Hardware & Equipment Request',
    icon: 'Laptop',
    description: 'Laptops, monitors, software licenses, budget compliance, and IT team dispatch.',
    keywords: [
      'equipment request', 'hardware request', 'laptop request', 'it equipment', 'asset request',
      'software license request', 'device provisioning', 'hardware procurement'
    ],
    features: [
      'Hardware/software request submission with cost estimate & justification',
      'Configurable auto-approval limit for low-cost items (< $500)',
      'AI-assisted role-compatibility & urgency-justification check',
      'IT Lead review & procurement dispatch workflow with 48h timeout escalation',
      'Role-based access: Hardware Requester, IT Procurement Manager, System Admin (CISO)',
      'Urgency-level flagging (standard / urgent onboarding / damaged replacement)'
    ],
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name of your IT Hardware Portal?',
        placeholder: 'e.g. Enterprise Tech Gear & Laptop Hub',
        suggestions: ['Enterprise Tech Gear & Laptop Hub', 'Remote Worker Hardware Portal', 'Developer Workstation Requisitions']
      },
      {
        id: 'q2',
        category: 'entities',
        question: 'What is the auto-approval limit for accessories?',
        placeholder: 'e.g. $500 for headsets & keyboards',
        suggestions: ['$500 auto-approval limit', '$300 standard allowance', 'All hardware requires IT Lead sign-off']
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'How should AI assist with equipment requisitions?',
        placeholder: 'e.g. Check role compatibility and detect duplicates',
        suggestions: [
          'Verify role compatibility (e.g. GPU for ML engineers)',
          'Check warranty & asset inventory availability',
          'Flag high-urgency onboarding requests'
        ]
      }
    ],
    default_ir: IT_EQUIPMENT_IR
  },
  {
    id: 'dom-itsm',
    key: 'it-service-desk',
    display_name: 'IT Service Management & Helpdesk (ITSM)',
    icon: 'Headset',
    description: 'Ticket lifecycle, automatic category/priority routing, SLA tracking, agent assignments, and manager performance.',
    keywords: [
      'itsm', 'helpdesk', 'help desk', 'service desk', 'ticket', 'incident management',
      'support ticket', 'sla tracking', 'it support'
    ],
    features: [
      'Full ticket lifecycle management (open → assigned → in progress → resolved → closed)',
      'AI-assisted diagnostic suggestions, category & priority triage',
      'SLA target auto-calculation by priority (P1=4h, P2=8h, P3=24h, P4=48h) with breach tracking',
      'Auto-assignment to service desk agents',
      'Internal notes & requester-visible comment threads per ticket',
      'Role-based access: Employee, Tier 2 Support Agent, IT Operations Lead, System Admin (CISO)',
      'Email notifications & Slack broadcast for P1 Critical incidents'
    ],
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name and scope of your IT Service Management portal?',
        placeholder: 'e.g. Enterprise IT Service Desk & Incident Hub',
        suggestions: [
          'Enterprise IT Service Desk & Incident Hub',
          'Global IT Helpdesk & SLA Tracker',
          'DevOps & Infrastructure Support Portal'
        ]
      },
      {
        id: 'q2',
        category: 'workflow',
        question: 'How should tickets be automatically assigned to service desk agents?',
        placeholder: 'e.g. Auto-assign based on category specialty and current workload',
        suggestions: [
          'Auto-assign based on category specialty & current workload',
          'Round-robin distribution across available on-shift agents',
          'Unassigned triage pool with agent self-claim'
        ]
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'What default SLA resolution target should apply to P1 Critical tickets?',
        placeholder: 'e.g. 4 hours resolution target for P1 Critical',
        suggestions: [
          '4 hours resolution target for P1 Critical (24h for standard)',
          '2 hours rapid response for P1 Critical (8h for P2 High)',
          'Custom business hours SLA calendar (9am-5pm)'
        ]
      },
      {
        id: 'q4',
        category: 'roles',
        question: 'How should AI assist service desk agents during triage?',
        placeholder: 'e.g. Diagnostic suggestion and sentiment analysis',
        suggestions: [
          'Analyze description for suggested solutions and category verification',
          'Detect duplicate incidents and relate to major outages',
          'Draft instant troubleshooting steps for requester'
        ]
      },
      {
        id: 'q5',
        category: 'notifications',
        question: 'What automated notifications should trigger on ticket updates?',
        placeholder: 'e.g. Email requester on status changes & alert manager on SLA breach',
        suggestions: [
          'Email requester on status changes & alert manager on SLA breach',
          'Email + Slack channel broadcast for P1 Critical tickets',
          'Daily digest to managers for overdue and unassigned tickets'
        ]
      }
    ],
    default_ir: IT_SERVICE_DESK_IR
  },
  {
    id: 'dom-crm',
    key: 'crm-sales-pipeline',
    display_name: 'CRM & Sales Pipeline',
    icon: 'Building2',
    description: 'Lead capture, opportunity pipeline stages, AI lead scoring, and deal-close approval workflow.',
    keywords: [
      'crm', 'sales pipeline', 'sales crm', 'lead management', 'opportunity tracking',
      'customer relationship management', 'deal tracking', 'sales tracker', 'lead scoring'
    ],
    features: [
      'Contact & opportunity capture with pipeline stage tracking',
      'Sales pipeline stages (new → qualified → proposal → negotiation → won/lost)',
      'AI-assisted lead scoring (0-100) based on engagement & deal size',
      'Manager close-approval workflow for deals above a configurable discount threshold',
      'Role-based access: Sales Representative, Sales Manager, System Admin (CISO)',
      'Email notifications on stage changes and approval requests'
    ],
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name and scope of your CRM?',
        placeholder: 'e.g. Enterprise CRM & Sales Pipeline',
        suggestions: ['Enterprise CRM & Sales Pipeline', 'Regional Field Sales Tracker', 'Enterprise Account Management Hub']
      },
      {
        id: 'q2',
        category: 'workflow',
        question: 'What deal-value threshold requires manager approval to close-won?',
        placeholder: 'e.g. $100,000 requires manager sign-off',
        suggestions: ['$100,000 threshold', '$50,000 threshold', 'Every deal requires manager sign-off']
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'How should AI assist with lead scoring and pipeline hygiene?',
        placeholder: 'e.g. Score leads 0-100 based on engagement and deal size',
        suggestions: [
          'Score leads 0-100 based on engagement and deal size',
          'Flag stalled opportunities with no activity in 14 days',
          'Summarize call/email notes into next-step recommendations'
        ]
      },
      {
        id: 'q4',
        category: 'notifications',
        question: 'What notifications should trigger on pipeline stage changes?',
        placeholder: 'e.g. Notify manager when a deal moves to negotiation',
        suggestions: [
          'Email manager when a deal enters negotiation or closes',
          'Slack alert on deals stalled longer than 14 days',
          'Daily digest of pipeline movement to sales leadership'
        ]
      }
    ],
    default_ir: CRM_SALES_PIPELINE_IR
  },
  {
    id: 'dom-finance',
    key: 'finance-invoice-approval',
    display_name: 'Finance & Invoice Approval',
    icon: 'Receipt',
    description: 'Vendor invoice intake, budget compliance checks, multi-level financial approval, and payment scheduling.',
    keywords: [
      'finance', 'invoice approval', 'accounts payable', 'vendor invoice', 'ap workflow',
      'budget compliance', 'invoice processing', 'financial approval', 'purchase order'
    ],
    features: [
      'Vendor invoice intake with cost-center & amount capture',
      'AI-assisted budget & duplicate-submission compliance check',
      'Finance Manager approval workflow with 72h timeout escalation',
      'Vendor record management (create/read)',
      'Role-based access: Accounts Payable Clerk, Finance Manager, System Admin (CISO)',
      'Email notifications on submission and approval decision'
    ],
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name and scope of your finance/invoice system?',
        placeholder: 'e.g. Enterprise Finance & Invoice Approval Hub',
        suggestions: ['Enterprise Finance & Invoice Approval Hub', 'Global AP Vendor Payment Portal', 'Procurement & Purchase Order Tracker']
      },
      {
        id: 'q2',
        category: 'entities',
        question: 'What invoice amount requires finance manager approval vs. auto-clear?',
        placeholder: 'e.g. $5,000 threshold',
        suggestions: ['$5,000 threshold', '$1,000 threshold', 'Every invoice requires manager approval']
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'How should AI assist with budget and duplicate checks?',
        placeholder: 'e.g. Flag invoices exceeding cost-center budget or duplicate submissions',
        suggestions: [
          'Flag invoices exceeding cost-center budget for the period',
          'Detect duplicate vendor/amount submissions within 30 days',
          'Cross-check invoice line items against purchase order'
        ]
      }
    ],
    default_ir: FINANCE_INVOICE_APPROVAL_IR
  },
  {
    id: 'dom-payroll',
    key: 'payroll-processing',
    display_name: 'Payroll Processing & Compliance',
    icon: 'Building2',
    description: 'Monthly payroll run generation, deduction/tax compliance checks, and multi-stage payroll sign-off before disbursement.',
    keywords: [
      'payroll', 'salary processing', 'payroll compliance', 'pay run', 'wage processing',
      'payroll management', 'tax deduction', 'disbursement', 'salary disbursement'
    ],
    features: [
      'Payroll run generation per employee for a pay period (gross, deductions, net)',
      'AI-assisted tax & deduction compliance anomaly detection',
      'Finance Controller sign-off workflow with 48h timeout escalation',
      'Tokenized bank-account references (never raw account numbers stored)',
      'Role-based access: Payroll Administrator, Finance Controller, System Admin (CISO)',
      'Email notifications on submission and sign-off decision'
    ],
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name and scope of your payroll system?',
        placeholder: 'e.g. Enterprise Payroll Processing & Compliance Hub',
        suggestions: ['Enterprise Payroll Processing & Compliance Hub', 'Multi-Region Payroll Compliance Portal', 'Contractor & Freelancer Payout System']
      },
      {
        id: 'q2',
        category: 'workflow',
        question: 'Who must sign off on a payroll run before disbursement?',
        placeholder: 'e.g. Finance Controller sign-off required within 48h',
        suggestions: [
          'Finance Controller sign-off required within 48h',
          'Two-person sign-off: Controller + CFO for runs above $500k',
          'Payroll Admin can self-approve runs under $10k'
        ]
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'How should AI assist with tax and deduction compliance checks?',
        placeholder: 'e.g. Flag anomalies vs. prior pay periods or incorrect tax region rates',
        suggestions: [
          'Flag anomalies vs. prior pay periods per employee',
          'Verify statutory deductions match tax region rules',
          'Detect missing or duplicate bank account references'
        ]
      }
    ],
    default_ir: PAYROLL_PROCESSING_IR
  }
];
