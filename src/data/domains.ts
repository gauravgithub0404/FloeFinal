import { DomainDefinition, IntermediateRepresentation } from '../types/floe';

export const LEAVE_MANAGEMENT_IR: IntermediateRepresentation = {
  ir_version: '1.0',
  app_id: 'app-acme-leave-01',
  domain: 'leave-management',
  name: 'Acme Leave Manager',
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
      description: 'Standard staff member',
      permissions: ['create:LeaveRequest own', 'read:LeaveRequest own', 'read:Employee own']
    },
    {
      name: 'manager',
      description: 'Team lead with approval authority',
      permissions: ['read:LeaveRequest team', 'update:LeaveRequest.status team', 'read:Employee team']
    },
    {
      name: 'hr_admin',
      description: 'Human Resources escalated authority',
      permissions: ['read:LeaveRequest all', 'update:LeaveRequest.status all', 'read:Employee all', 'update:Employee.leave_balance_days all']
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
  app_id: 'app-acme-expense-02',
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
    { name: 'submitter', permissions: ['create:ExpenseClaim own', 'read:ExpenseClaim own'] },
    { name: 'manager', permissions: ['read:ExpenseClaim team', 'update:ExpenseClaim.status team'] },
    { name: 'finance', permissions: ['read:ExpenseClaim all', 'update:ExpenseClaim.status all'] }
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
  app_id: 'app-acme-itsm-04',
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
      description: 'Standard staff requester',
      permissions: ['create:ITTicket own', 'read:ITTicket own', 'create:TicketComment own']
    },
    {
      name: 'service_desk_agent',
      description: 'Tier 1/2 IT Support Specialist',
      permissions: ['read:ITTicket all', 'update:ITTicket.status all', 'update:ITTicket.assigned_agent_id all', 'create:TicketComment all']
    },
    {
      name: 'it_manager',
      description: 'IT Operations & SLA Compliance Lead',
      permissions: ['read:ITTicket all', 'update:ITTicket all', 'delete:ITTicket all', 'read:ServiceDeskAgent all']
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
  app_id: 'app-acme-it-03',
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
    { name: 'requester', permissions: ['create:EquipmentRequest own', 'read:EquipmentRequest own'] },
    { name: 'it_manager', permissions: ['read:EquipmentRequest all', 'update:EquipmentRequest.status all'] }
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

export const DOMAINS: DomainDefinition[] = [
  {
    id: 'dom-leave',
    key: 'leave-management',
    display_name: 'Leave & Time-Off Management',
    icon: 'Palmtree',
    description: 'PTO requests, auto balance deduction, AI reason tagging, and manager timeout escalation.',
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the primary name and objective for this application?',
        placeholder: 'e.g. Acme Leave Manager for our 120-person distributed engineering team',
        suggestions: [
          'Acme Leave Manager for engineering & sales',
          'Global PTO & Time-Off Portal with regional holidays',
          'Shift-Worker Sick Leave & Shift Swap System'
        ]
      },
      {
        id: 'q2',
        category: 'entities',
        question: 'What default annual leave balance should new employees start with?',
        placeholder: 'e.g. 20 days standard PTO',
        suggestions: [
          '20 days standard annual PTO',
          '25 days European standard allowance',
          'Unlimited PTO with manager oversight threshold'
        ]
      },
      {
        id: 'q3',
        category: 'workflow',
        question: 'How should managers handle leave approvals and escalation timeouts?',
        placeholder: 'e.g. 48 hours to approve or escalate to HR Director',
        suggestions: [
          '48 hours timeout → Escalate to HR',
          '24 hours timeout → Auto-remind manager via email',
          'Immediate auto-approval if balance > requested and duration < 2 days'
        ]
      },
      {
        id: 'q4',
        category: 'roles',
        question: 'How would you like AI to assist in evaluating submissions?',
        placeholder: 'e.g. Categorize free-text reason into Medical, Vacation, or Caregiving',
        suggestions: [
          'Categorize unstructured notes into Medical / Family / Vacation for HR reporting',
          'Check for overlap conflicts with other teammates on leave',
          'Read-only sentiment & emergency urgency tagging'
        ]
      },
      {
        id: 'q5',
        category: 'notifications',
        question: 'What notification channels should be wired up?',
        placeholder: 'e.g. Email notifications to manager on submission',
        suggestions: [
          'Email notifications with one-click magic approval tokens',
          'Email + Slack webhook channel alerts',
          'Calendar invite generation upon approval'
        ]
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
    question_set: [
      {
        id: 'q1',
        category: 'scope',
        question: 'What is the name of your IT Hardware Portal?',
        placeholder: 'e.g. Acme Tech Gear & Laptop Hub',
        suggestions: ['Acme Tech Gear & Laptop Hub', 'Remote Worker Hardware Portal', 'Developer Workstation Requisitions']
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
  }
];
