export type UserRole = 'employee' | 'agent' | 'manager' | 'admin';

export interface RbacPermission {
  id: string;
  name: string;
  category: 'Entity Data' | 'Workflow Decision' | 'System & Governance';
  description: string;
  allowedRoles: UserRole[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatar: string;
  balance?: number;
  totalAllowance?: number;
  assignedDomain?: string;
  token?: string;
  tokenExpiry?: string;
}

export const PRESET_USERS: Record<UserRole, AuthUser> = {
  employee: {
    id: 'usr-emp-01',
    name: 'Alex Rivera',
    email: 'alex.rivera@acme.corp',
    role: 'employee',
    roleTitle: 'Software Engineer',
    department: 'Engineering & Product',
    avatar: 'AR',
    balance: 14,
    totalAllowance: 20,
    token: 'jwt_sec_emp_8832a71f09c',
    tokenExpiry: '8 hours'
  },
  agent: {
    id: 'usr-agt-02',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.corp',
    role: 'agent',
    roleTitle: 'Tier 2 Support Specialist',
    department: 'IT Service Operations',
    avatar: 'SC',
    token: 'jwt_sec_agt_9941b82e11d',
    tokenExpiry: '8 hours'
  },
  manager: {
    id: 'usr-mgr-03',
    name: 'Marcus Vance',
    email: 'marcus.vance@acme.corp',
    role: 'manager',
    roleTitle: 'Engineering Director & Approver',
    department: 'Engineering Leadership',
    avatar: 'MV',
    token: 'jwt_sec_mgr_7712c93a44f',
    tokenExpiry: '8 hours'
  },
  admin: {
    id: 'usr-adm-04',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.corp',
    role: 'admin',
    roleTitle: 'Chief Information Security Officer (CISO)',
    department: 'InfoSec & Platform Infrastructure',
    avatar: 'ER',
    token: 'jwt_sec_adm_0023d88b99e',
    tokenExpiry: '8 hours'
  }
};

export const RBAC_PERMISSIONS_REGISTRY: RbacPermission[] = [
  {
    id: 'req:create',
    name: 'Create Submissions',
    category: 'Entity Data',
    description: 'Submit new leave requests, expense claims, or IT service tickets.',
    allowedRoles: ['employee', 'agent', 'manager', 'admin']
  },
  {
    id: 'req:read_own',
    name: 'Read Own Records',
    category: 'Entity Data',
    description: 'View personally submitted transactions and active status.',
    allowedRoles: ['employee', 'agent', 'manager', 'admin']
  },
  {
    id: 'req:read_all',
    name: 'Read All Records',
    category: 'Entity Data',
    description: 'Access organization-wide records across all departments.',
    allowedRoles: ['agent', 'manager', 'admin']
  },
  {
    id: 'wf:triage',
    name: 'Triage & Update Status',
    category: 'Workflow Decision',
    description: 'Assign tickets, modify status (In Progress, Waiting, Resolved), and add internal tech notes.',
    allowedRoles: ['agent', 'admin']
  },
  {
    id: 'wf:approve_reject',
    name: 'Approve & Reject Gate',
    category: 'Workflow Decision',
    description: 'Approve or reject requests at Human Gate nodes, mutating balances & state.',
    allowedRoles: ['manager', 'admin']
  },
  {
    id: 'wf:override_sla',
    name: 'Override SLA & Escalate',
    category: 'Workflow Decision',
    description: 'Manually adjust SLA target timers or re-route escalated tickets.',
    allowedRoles: ['manager', 'admin']
  },
  {
    id: 'sys:audit_logs',
    name: 'Access Audit & DDL Logs',
    category: 'System & Governance',
    description: 'Query runtime PostgreSQL transaction logs, state mutations, and health metrics.',
    allowedRoles: ['admin']
  },
  {
    id: 'sys:rbac_manage',
    name: 'Manage RBAC & User Policies',
    category: 'System & Governance',
    description: 'Modify role permission matrices, assign roles, and revoke session tokens.',
    allowedRoles: ['admin']
  }
];

export function checkPermission(userRole: UserRole, permissionId: string): boolean {
  const perm = RBAC_PERMISSIONS_REGISTRY.find(p => p.id === permissionId);
  if (!perm) return false;
  return perm.allowedRoles.includes(userRole);
}
