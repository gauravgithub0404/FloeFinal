import { IntermediateRepresentation, Role, RoleUserCredential } from './floe';

export type UserRole = 
  | 'employee' 
  | 'agent' 
  | 'manager' 
  | 'admin' 
  | 'submitter' 
  | 'finance' 
  | 'hr_admin' 
  | 'it_manager' 
  | 'requester' 
  | 'auditor' 
  | string;

export interface RbacPermission {
  id: string;
  name: string;
  category: 'Entity Data' | 'Workflow Decision' | 'System & Governance';
  description: string;
  allowedRoles: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatar: string;
  balance?: number;
  totalAllowance?: number;
  assignedDomain?: string;
  token?: string;
  tokenExpiry?: string;
  permissions?: string[];
  description?: string;
  scopeBadge?: string;
  accentColor?: string;
}

export interface AppRoleDefinition {
  id: string;
  key: string;
  displayName: string;
  description: string;
  permissions: string[];
  user: AuthUser;
}

export const PRESET_USERS: Record<string, AuthUser> = {
  employee: {
    id: 'usr-emp-01',
    name: 'Alex Rivera',
    email: 'alex.rivera@acme.corp',
    password: 'AlexRivera#2026',
    role: 'employee',
    roleTitle: 'Software Engineer & Requester',
    department: 'Engineering & Product',
    avatar: 'AR',
    balance: 14,
    totalAllowance: 20,
    token: 'jwt_sec_emp_8832a71f09c',
    tokenExpiry: '8 hours',
    description: 'Standard end-user. Can submit new records, track status, and view own transaction history.',
    scopeBadge: 'read:own, create',
    accentColor: 'indigo'
  },
  agent: {
    id: 'usr-agt-02',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.corp',
    password: 'AgentSarah$2026',
    role: 'agent',
    roleTitle: 'Tier 2 Technical Specialist',
    department: 'IT & Service Operations',
    avatar: 'SC',
    token: 'jwt_sec_agt_9941b82e11d',
    tokenExpiry: '8 hours',
    description: 'Service desk operator. Can triage assigned queue, investigate issues, and update statuses.',
    scopeBadge: 'triage, update:status',
    accentColor: 'sky'
  },
  manager: {
    id: 'usr-mgr-03',
    name: 'Marcus Vance',
    email: 'marcus.vance@acme.corp',
    password: 'MarcusVance@2026',
    role: 'manager',
    roleTitle: 'Engineering Director & Approver',
    department: 'Engineering Leadership',
    avatar: 'MV',
    token: 'jwt_sec_mgr_7712c93a44f',
    tokenExpiry: '8 hours',
    description: 'Department approver. Can authorize Human Decision Gates, review quotas, and escalate.',
    scopeBadge: 'approve, override, review',
    accentColor: 'amber'
  },
  admin: {
    id: 'usr-adm-04',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.corp',
    password: 'AdminElena!2026',
    role: 'admin',
    roleTitle: 'Chief Information Security Officer (CISO)',
    department: 'InfoSec & Platform Infrastructure',
    avatar: 'ER',
    token: 'jwt_sec_adm_0023d88b99e',
    tokenExpiry: '8 hours',
    description: 'Full governance authority. Database DDL access, audit trails, and security matrix administration.',
    scopeBadge: 'all:admin, audit, ddl',
    accentColor: 'rose'
  }
};

/**
 * Intelligently generates domain-tailored roles and concrete user credentials (1 user per role)
 * for any generated application IR.
 */
export function getAppRolesAndUsers(ir?: IntermediateRepresentation): AppRoleDefinition[] {
  if (!ir) {
    return Object.entries(PRESET_USERS).map(([key, user]) => ({
      id: key,
      key,
      displayName: user.roleTitle.split('&')[0].trim(),
      description: user.description || 'Application user role',
      permissions: ['read:own', 'create'],
      user
    }));
  }

  const domain = (ir.domain || '').toLowerCase();
  const name = (ir.name || '').toLowerCase();

  // 1. Leave & Time-Off Management
  if (domain.includes('leave') || name.includes('leave') || name.includes('pto') || name.includes('time-off')) {
    return [
      {
        id: 'role-emp',
        key: 'employee',
        displayName: 'Employee (Requester)',
        description: 'Standard staff member. Can submit time-off requests and view leave balances.',
        permissions: ['create:LeaveRequest own', 'read:LeaveRequest own', 'read:Employee own'],
        user: {
          id: 'usr-leave-01',
          name: 'Alex Rivera',
          email: 'alex.rivera@acme.corp',
          password: 'AlexLeave#2026',
          role: 'employee',
          roleTitle: 'Software Engineer',
          department: 'Engineering & Product',
          avatar: 'AR',
          balance: 14,
          totalAllowance: 20,
          token: 'jwt_sec_emp_leave_8832',
          tokenExpiry: '8 hours',
          description: 'Staff member submitting leave requests and monitoring personal PTO balance.',
          scopeBadge: 'read:own, create',
          accentColor: 'indigo'
        }
      },
      {
        id: 'role-mgr',
        key: 'manager',
        displayName: 'Department Manager',
        description: 'Team lead with approval authority. Authorizes/rejects leave requests.',
        permissions: ['read:LeaveRequest team', 'update:LeaveRequest.status team', 'read:Employee team'],
        user: {
          id: 'usr-leave-02',
          name: 'Marcus Vance',
          email: 'marcus.vance@acme.corp',
          password: 'MarcusManager$2026',
          role: 'manager',
          roleTitle: 'Engineering Director & Approver',
          department: 'Engineering Leadership',
          avatar: 'MV',
          token: 'jwt_sec_mgr_leave_7712',
          tokenExpiry: '8 hours',
          description: 'Approves team requests and manages project continuity during leave periods.',
          scopeBadge: 'approve, team_read',
          accentColor: 'amber'
        }
      },
      {
        id: 'role-hr',
        key: 'hr_admin',
        displayName: 'HR & People Operations',
        description: 'HR Authority. Handles 48h timeout escalations, balance audits, and company policies.',
        permissions: ['read:LeaveRequest all', 'update:LeaveRequest.status all', 'read:Employee all', 'update:Employee.leave_balance_days all'],
        user: {
          id: 'usr-leave-03',
          name: 'Sophia Sterling',
          email: 'sophia.sterling@acme.corp',
          password: 'SophiaHR!2026',
          role: 'hr_admin',
          roleTitle: 'VP of People & HR Operations',
          department: 'People & Culture',
          avatar: 'SS',
          token: 'jwt_sec_hr_leave_4491',
          tokenExpiry: '8 hours',
          description: 'Oversees organizational PTO allocations, timeout escalations, and compliance.',
          scopeBadge: 'escalate, balance_all',
          accentColor: 'purple'
        }
      },
      {
        id: 'role-adm',
        key: 'admin',
        displayName: 'System Admin / CISO',
        description: 'Platform Administrator. Full PostgreSQL DDL access, audit logs, and security governance.',
        permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
        user: {
          id: 'usr-leave-04',
          name: 'Elena Rostova',
          email: 'elena.rostova@acme.corp',
          password: 'AdminElena!2026',
          role: 'admin',
          roleTitle: 'Chief Information Security Officer (CISO)',
          department: 'InfoSec & Infrastructure',
          avatar: 'ER',
          token: 'jwt_sec_adm_leave_0023',
          tokenExpiry: '8 hours',
          description: 'System superuser with access to PostgreSQL schema, audit logs, and encryption keys.',
          scopeBadge: 'all:admin, audit_logs',
          accentColor: 'rose'
        }
      }
    ];
  }

  // 2. Expense Reimbursement & Financial Claims
  if (domain.includes('expense') || name.includes('expense') || name.includes('reimburse') || name.includes('claim')) {
    return [
      {
        id: 'role-sub',
        key: 'submitter',
        displayName: 'Claim Submitter',
        description: 'Employee claiming business expenses, travel receipts, and meal allowances.',
        permissions: ['create:ExpenseClaim own', 'read:ExpenseClaim own'],
        user: {
          id: 'usr-exp-01',
          name: 'David Kim',
          email: 'david.kim@acme.corp',
          password: 'DavidExp#2026',
          role: 'submitter',
          roleTitle: 'Senior Field Solutions Architect',
          department: 'Client Solutions & Sales',
          avatar: 'DK',
          balance: 850,
          totalAllowance: 5000,
          token: 'jwt_sec_sub_exp_3319',
          tokenExpiry: '8 hours',
          description: 'Submits receipts and tracks expense disbursement status.',
          scopeBadge: 'create:claim, read:own',
          accentColor: 'emerald'
        }
      },
      {
        id: 'role-mgr',
        key: 'manager',
        displayName: 'Cost Center Manager',
        description: 'Budget approver. Reviews claims against departmental quarterly budgets.',
        permissions: ['read:ExpenseClaim team', 'update:ExpenseClaim.status team'],
        user: {
          id: 'usr-exp-02',
          name: 'Rachel Green',
          email: 'rachel.green@acme.corp',
          password: 'RachelBudget$2026',
          role: 'manager',
          roleTitle: 'VP of Commercial Operations',
          department: 'Commercial Leadership',
          avatar: 'RG',
          token: 'jwt_sec_mgr_exp_8820',
          tokenExpiry: '8 hours',
          description: 'Validates receipt legitimacy and authorizes payouts within department cap.',
          scopeBadge: 'approve:budget, team_read',
          accentColor: 'amber'
        }
      },
      {
        id: 'role-fin',
        key: 'finance',
        displayName: 'Finance & Compliance Auditor',
        description: 'Corporate Finance. Audits AI policy flags, duplicates, and initiates wire reimbursements.',
        permissions: ['read:ExpenseClaim all', 'update:ExpenseClaim.status all', 'audit:policy all'],
        user: {
          id: 'usr-exp-03',
          name: 'Siddharth Nair',
          email: 'siddharth.nair@acme.corp',
          password: 'FinanceAudit!2026',
          role: 'finance',
          roleTitle: 'Senior Corporate Financial Controller',
          department: 'Treasury & Accounts Payable',
          avatar: 'SN',
          token: 'jwt_sec_fin_exp_9912',
          tokenExpiry: '8 hours',
          description: 'Conducts compliance auditing and triggers automated ACH/wire disbursements.',
          scopeBadge: 'audit:finance, reimburse_all',
          accentColor: 'teal'
        }
      },
      {
        id: 'role-adm',
        key: 'admin',
        displayName: 'ERP Platform Administrator',
        description: 'Global Finance System Administrator. Manages ERP connectors and audit logs.',
        permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
        user: {
          id: 'usr-exp-04',
          name: 'Elena Rostova',
          email: 'elena.rostova@acme.corp',
          password: 'AdminElena!2026',
          role: 'admin',
          roleTitle: 'Chief Information Security Officer (CISO)',
          department: 'InfoSec & ERP Infrastructure',
          avatar: 'ER',
          token: 'jwt_sec_adm_exp_0023',
          tokenExpiry: '8 hours',
          description: 'ERP integration lead with full audit trail access and security governance.',
          scopeBadge: 'all:admin, audit_logs',
          accentColor: 'rose'
        }
      }
    ];
  }

  // 3. IT Service Desk & ITSM Incident Management
  if (domain.includes('itsm') || domain.includes('service') || name.includes('ticket') || name.includes('helpdesk') || name.includes('service')) {
    return [
      {
        id: 'role-emp',
        key: 'employee',
        displayName: 'Employee (Requester)',
        description: 'Staff member creating IT tickets, hardware requests, and viewing SLA status.',
        permissions: ['create:ITTicket own', 'read:ITTicket own', 'create:TicketComment own'],
        user: {
          id: 'usr-itsm-01',
          name: 'Alex Rivera',
          email: 'alex.rivera@acme.corp',
          password: 'AlexTech#2026',
          role: 'employee',
          roleTitle: 'Software Engineer',
          department: 'Engineering & Product',
          avatar: 'AR',
          token: 'jwt_sec_emp_itsm_1192',
          tokenExpiry: '8 hours',
          description: 'Submits technical issues, attaches diagnostic logs, and monitors resolution SLAs.',
          scopeBadge: 'create:ticket, read:own',
          accentColor: 'indigo'
        }
      },
      {
        id: 'role-agt',
        key: 'agent',
        displayName: 'Tier 2 Support Specialist',
        description: 'Service Desk Operator. Triages queue, investigates root cause, updates status, and comments.',
        permissions: ['read:ITTicket all', 'update:ITTicket.status assigned', 'create:TicketComment internal'],
        user: {
          id: 'usr-itsm-02',
          name: 'Sarah Chen',
          email: 'sarah.chen@acme.corp',
          password: 'AgentSarah$2026',
          role: 'agent',
          roleTitle: 'Tier 2 Support Engineer',
          department: 'IT Service Operations',
          avatar: 'SC',
          token: 'jwt_sec_agt_itsm_7741',
          tokenExpiry: '8 hours',
          description: 'Investigates and resolves user incident tickets, manages triage queue.',
          scopeBadge: 'triage, resolve, internal_notes',
          accentColor: 'sky'
        }
      },
      {
        id: 'role-mgr',
        key: 'manager',
        displayName: 'IT Operations Lead',
        description: 'Service Desk Manager. Manages SLA escalations, assigns queues, and approves software.',
        permissions: ['read:ITTicket all', 'update:ITTicket.sla all', 'approve:AccessRequest all'],
        user: {
          id: 'usr-itsm-03',
          name: 'Marcus Vance',
          email: 'marcus.vance@acme.corp',
          password: 'ManagerMarcus@2026',
          role: 'manager',
          roleTitle: 'Director of IT Infrastructure',
          department: 'IT & Cloud Operations',
          avatar: 'MV',
          token: 'jwt_sec_mgr_itsm_8820',
          tokenExpiry: '8 hours',
          description: 'Monitors SLA adherence metrics and authorizes high-tier access requests.',
          scopeBadge: 'override_sla, reassign_all',
          accentColor: 'amber'
        }
      },
      {
        id: 'role-adm',
        key: 'admin',
        displayName: 'CISO / Platform Admin',
        description: 'Security & Systems Administrator. Configures SSO, audit logging, and RBAC matrix.',
        permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
        user: {
          id: 'usr-itsm-04',
          name: 'Elena Rostova',
          email: 'elena.rostova@acme.corp',
          password: 'AdminElena!2026',
          role: 'admin',
          roleTitle: 'Chief Information Security Officer (CISO)',
          department: 'InfoSec & Infrastructure',
          avatar: 'ER',
          token: 'jwt_sec_adm_itsm_0023',
          tokenExpiry: '8 hours',
          description: 'Global infrastructure administrator with access to live security telemetry.',
          scopeBadge: 'all:admin, audit_logs',
          accentColor: 'rose'
        }
      }
    ];
  }

  // 4. IT Hardware & Equipment Procurement
  if (domain.includes('equipment') || name.includes('equipment') || name.includes('hardware') || name.includes('asset')) {
    return [
      {
        id: 'role-req',
        key: 'requester',
        displayName: 'Hardware Requester',
        description: 'Staff member requesting workstations, monitors, laptops, and peripheral kits.',
        permissions: ['create:EquipmentRequest own', 'read:EquipmentRequest own'],
        user: {
          id: 'usr-equip-01',
          name: 'Chloe Bennett',
          email: 'chloe.bennett@acme.corp',
          password: 'ChloeDev#2026',
          role: 'requester',
          roleTitle: 'Lead UX Designer',
          department: 'Product & Design',
          avatar: 'CB',
          token: 'jwt_sec_req_equip_9931',
          tokenExpiry: '8 hours',
          description: 'Requests hardware upgrades and monitors procurement tracking.',
          scopeBadge: 'create:request, read:own',
          accentColor: 'indigo'
        }
      },
      {
        id: 'role-it-mgr',
        key: 'it_manager',
        displayName: 'IT Procurement Manager',
        description: 'Hardware Asset Manager. Evaluates vendor inventory, quotes, and approves deliveries.',
        permissions: ['read:EquipmentRequest all', 'update:EquipmentRequest.status all'],
        user: {
          id: 'usr-equip-02',
          name: 'Liam Scott',
          email: 'liam.scott@acme.corp',
          password: 'LiamProcure$2026',
          role: 'it_manager',
          roleTitle: 'IT Procurement & Asset Lead',
          department: 'IT Asset Management',
          avatar: 'LS',
          token: 'jwt_sec_mgr_equip_5521',
          tokenExpiry: '8 hours',
          description: 'Coordinates bulk supplier orders and fulfills developer workstation kits.',
          scopeBadge: 'approve:procurement, manage:inventory',
          accentColor: 'amber'
        }
      },
      {
        id: 'role-adm',
        key: 'admin',
        displayName: 'Asset & Platform Admin',
        description: 'Global Asset Administrator. Oversees depreciation models and serial registry.',
        permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
        user: {
          id: 'usr-equip-03',
          name: 'Elena Rostova',
          email: 'elena.rostova@acme.corp',
          password: 'AdminElena!2026',
          role: 'admin',
          roleTitle: 'Chief Information Security Officer (CISO)',
          department: 'InfoSec & Asset Registry',
          avatar: 'ER',
          token: 'jwt_sec_adm_equip_0023',
          tokenExpiry: '8 hours',
          description: 'Audits hardware custody chains and enforces physical security compliance.',
          scopeBadge: 'all:admin, audit_logs',
          accentColor: 'rose'
        }
      }
    ];
  }

  // 5. If IR has explicit custom roles defined by the user / requirements engine
  if (ir.roles && ir.roles.length > 0) {
    const accentColors = ['indigo', 'sky', 'amber', 'purple', 'teal', 'rose'];
    const namesList = [
      { name: 'Alex Rivera', emailPrefix: 'alex.rivera', title: 'Specialist & Submitter', dept: 'Operations & Engineering' },
      { name: 'Sarah Chen', emailPrefix: 'sarah.chen', title: 'Domain Lead & Operator', dept: 'Workflow Operations' },
      { name: 'Marcus Vance', emailPrefix: 'marcus.vance', title: 'Department Director & Approver', dept: 'Management Leadership' },
      { name: 'Elena Rostova', emailPrefix: 'elena.rostova', title: 'System Administrator & CISO', dept: 'Platform Governance' },
      { name: 'David Kim', emailPrefix: 'david.kim', title: 'Senior Auditor', dept: 'Quality & Compliance' }
    ];

    return ir.roles.map((r, idx) => {
      const fallback = namesList[idx % namesList.length];
      const roleKey = r.name.toLowerCase().replace(/\s+/g, '_');
      const cleanTitle = r.displayName || r.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      const userPersona: AuthUser = {
        id: `usr-gen-${idx + 1}`,
        name: r.userPersona?.name || fallback.name,
        email: r.userPersona?.email || `${fallback.emailPrefix}@acme.corp`,
        password: r.userPersona?.password || `${fallback.name.split(' ')[0]}Pass#2026!`,
        role: roleKey,
        roleTitle: r.userPersona?.roleTitle || (idx === 0 ? `Staff ${cleanTitle}` : idx === ir.roles.length - 1 ? `Chief ${cleanTitle}` : `Lead ${cleanTitle}`),
        department: r.userPersona?.department || fallback.dept,
        avatar: (r.userPersona?.name || fallback.name).split(' ').map(n => n[0]).join('').toUpperCase(),
        token: `jwt_sec_gen_${roleKey}_${idx + 100}`,
        tokenExpiry: '8 hours',
        description: r.description || `Authorized persona for ${cleanTitle} workflow.`,
        scopeBadge: r.permissions.slice(0, 2).join(', ') || 'standard:access',
        accentColor: accentColors[idx % accentColors.length]
      };

      return {
        id: `role-${roleKey}`,
        key: roleKey,
        displayName: cleanTitle,
        description: r.description || `Role authorized to execute ${cleanTitle} workflows.`,
        permissions: r.permissions,
        user: userPersona
      };
    });
  }

  // 6. Generic Default Fallback for custom / novel domains
  return [
    {
      id: 'role-user',
      key: 'employee',
      displayName: 'Standard User (Submitter)',
      description: `Primary end-user persona for ${ir.name}. Can create and track records.`,
      permissions: ['create:record own', 'read:record own'],
      user: {
        id: 'usr-gen-01',
        name: 'Alex Rivera',
        email: 'alex.rivera@acme.corp',
        password: 'AlexUser#2026',
        role: 'employee',
        roleTitle: 'Operations Analyst',
        department: 'Operations & Staff',
        avatar: 'AR',
        token: 'jwt_sec_gen_user_1',
        tokenExpiry: '8 hours',
        description: `Creates submissions and monitors workflows in ${ir.name}.`,
        scopeBadge: 'read:own, create',
        accentColor: 'indigo'
      }
    },
    {
      id: 'role-specialist',
      key: 'agent',
      displayName: 'Domain Specialist / Operator',
      description: 'Reviews active items, updates statuses, and handles operational workflows.',
      permissions: ['read:record all', 'update:record.status assigned'],
      user: {
        id: 'usr-gen-02',
        name: 'Sarah Chen',
        email: 'sarah.chen@acme.corp',
        password: 'SarahSpecialist$2026',
        role: 'agent',
        roleTitle: 'Senior Workflow Specialist',
        department: 'Service Delivery',
        avatar: 'SC',
        token: 'jwt_sec_gen_agent_2',
        tokenExpiry: '8 hours',
        description: 'Processes incoming queues and updates status in real-time.',
        scopeBadge: 'triage, update_status',
        accentColor: 'sky'
      }
    },
    {
      id: 'role-approver',
      key: 'manager',
      displayName: 'Approving Manager',
      description: 'Department Lead. Reviews thresholds, approves decisions, and handles escalations.',
      permissions: ['read:record all', 'approve:decision all', 'update:record all'],
      user: {
        id: 'usr-gen-03',
        name: 'Marcus Vance',
        email: 'marcus.vance@acme.corp',
        password: 'MarcusLead@2026',
        role: 'manager',
        roleTitle: 'Department Director & Approver',
        department: 'Executive Management',
        avatar: 'MV',
        token: 'jwt_sec_gen_mgr_3',
        tokenExpiry: '8 hours',
        description: 'Human decision reviewer for high-value workflow gates and policy overrides.',
        scopeBadge: 'approve, override',
        accentColor: 'amber'
      }
    },
    {
      id: 'role-admin',
      key: 'admin',
      displayName: 'System Admin / CISO',
      description: 'Platform Superuser. Full PostgreSQL DDL access, audit logs, and security governance.',
      permissions: ['read:all', 'update:all', 'admin:ddl', 'admin:audit'],
      user: {
        id: 'usr-gen-04',
        name: 'Elena Rostova',
        email: 'elena.rostova@acme.corp',
        password: 'AdminElena!2026',
        role: 'admin',
        roleTitle: 'Chief Information Security Officer (CISO)',
        department: 'InfoSec & Governance',
        avatar: 'ER',
        token: 'jwt_sec_gen_adm_4',
        tokenExpiry: '8 hours',
        description: 'Superuser with unrestricted access to database schemas, audit logs, and keys.',
        scopeBadge: 'all:admin, audit_logs',
        accentColor: 'rose'
      }
    }
  ];
}

/**
 * Returns a dictionary of AuthUser keyed by role identifier.
 */
export function getAppRolePersonas(ir?: IntermediateRepresentation): Record<string, AuthUser> {
  const roles = getAppRolesAndUsers(ir);
  const result: Record<string, AuthUser> = {};
  roles.forEach(r => {
    result[r.key] = r.user;
  });
  return result;
}

export const RBAC_PERMISSIONS_REGISTRY: RbacPermission[] = [
  {
    id: 'req:create',
    name: 'Create Submissions',
    category: 'Entity Data',
    description: 'Submit new leave requests, expense claims, or IT service tickets.',
    allowedRoles: ['employee', 'agent', 'manager', 'admin', 'submitter', 'requester']
  },
  {
    id: 'req:read_own',
    name: 'Read Own Records',
    category: 'Entity Data',
    description: 'View personally submitted transactions and active status.',
    allowedRoles: ['employee', 'agent', 'manager', 'admin', 'submitter', 'requester', 'finance', 'hr_admin', 'it_manager']
  },
  {
    id: 'req:read_all',
    name: 'Read All Records',
    category: 'Entity Data',
    description: 'Access organization-wide records across all departments.',
    allowedRoles: ['agent', 'manager', 'admin', 'finance', 'hr_admin', 'it_manager', 'auditor']
  },
  {
    id: 'wf:triage',
    name: 'Triage & Update Status',
    category: 'Workflow Decision',
    description: 'Assign tickets, modify status (In Progress, Waiting, Resolved), and add internal tech notes.',
    allowedRoles: ['agent', 'admin', 'it_manager']
  },
  {
    id: 'wf:approve_reject',
    name: 'Approve & Reject Gate',
    category: 'Workflow Decision',
    description: 'Approve or reject requests at Human Gate nodes, mutating balances & state.',
    allowedRoles: ['manager', 'admin', 'finance', 'hr_admin', 'it_manager']
  },
  {
    id: 'wf:override_sla',
    name: 'Override SLA & Escalate',
    category: 'Workflow Decision',
    description: 'Manually adjust SLA target timers or re-route escalated tickets.',
    allowedRoles: ['manager', 'admin', 'hr_admin']
  },
  {
    id: 'sys:audit_logs',
    name: 'Access Audit & DDL Logs',
    category: 'System & Governance',
    description: 'Query runtime PostgreSQL transaction logs, state mutations, and health metrics.',
    allowedRoles: ['admin', 'finance', 'auditor']
  },
  {
    id: 'sys:rbac_manage',
    name: 'Manage RBAC & User Policies',
    category: 'System & Governance',
    description: 'Modify role permission matrices, assign roles, and revoke session tokens.',
    allowedRoles: ['admin']
  }
];

export function checkPermission(userRole: string, permissionId: string): boolean {
  const perm = RBAC_PERMISSIONS_REGISTRY.find(p => p.id === permissionId);
  if (!perm) return false;
  return perm.allowedRoles.includes(userRole) || userRole === 'admin';
}

