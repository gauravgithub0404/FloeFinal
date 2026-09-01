import { ArchitecturePlan, RequirementProfile } from './architecture';
import { DeploymentStage } from './deployment';

export type ExecutionMode = 'deterministic' | 'ai' | 'agentic' | 'human';

export interface EntityField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text' | 'enum' | `ref:${string}`;
  required?: boolean;
  default?: string | number | boolean;
  values?: string[]; // for enum
  description?: string;
}

export interface Entity {
  name: string;
  description?: string;
  fields: EntityField[];
}

export interface Relationship {
  from: string;
  field: string;
  to: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

export interface RoleUserCredential {
  name: string;
  email: string;
  password?: string;
  roleTitle: string;
  department: string;
  avatar?: string;
  balance?: number;
  totalAllowance?: number;
}

export interface Role {
  name: string;
  displayName?: string;
  description?: string;
  permissions: string[];
  userPersona?: RoleUserCredential;
}

export interface ExpressionAST {
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte' | 'and' | 'or' | 'in';
  left: { ref?: string; value?: string | number | boolean };
  right: { ref?: string; value?: string | number | boolean };
}

export interface MutationDeclaration {
  target: string; // e.g. "LeaveRequest.status" or "Employee.leave_balance_days"
  op?: 'set' | 'subtract' | 'add';
  value?: string;
  set?: string;
  guard?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'human' | 'terminal';
  execution_mode: ExecutionMode;
  action?: string;
  label?: string;
  goal?: string;
  scope?: string;
  role?: string;
  timeout?: string; // e.g. "48h"
  on_timeout?: string; // e.g. "escalate_to_hr"
  expression?: ExpressionAST;
  mutations?: MutationDeclaration[];
  logic?: string;
  outcome?: string; // for terminal nodes ('approved', 'rejected', 'completed', etc.)
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
  fallback?: boolean;
  label?: string;
}

export interface Workflow {
  name: string;
  description?: string;
  trigger: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Integration {
  type: 'email' | 'slack' | 'webhook' | 'calendar' | 'sms';
  purpose: string;
  config?: Record<string, string>;
}

export interface DeploymentHealthContract {
  path: string;
  port: number;
  timeout_seconds: number;
  expected_status?: number;
}

export interface DeploymentConfig {
  target_options: ('cloud_paas' | 'on_prem' | 'local')[];
  default: 'cloud_paas' | 'on_prem' | 'local';
  containerization: 'docker-compose';
  health_check: DeploymentHealthContract;
  network?: {
    internal_only_db: boolean;
    reverse_proxy: boolean;
  };
}

export interface IntermediateRepresentation {
  ir_version: string;
  app_id: string;
  domain: string;
  name: string;
  logo?: string; // Data URL, image URL, or emoji/icon representation
  icon?: string;
  description?: string;
  created_from_conversation_id?: string;
  metadata?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  policies?: Record<string, unknown>;
  entities: Entity[];
  relationships: Relationship[];
  roles: Role[];
  workflows: Workflow[];
  integrations: Integration[];
  deployment: DeploymentConfig;
  requirement_profile?: RequirementProfile;
  architecture_plan?: ArchitecturePlan;
}

// Validation types
export interface ValidationError {
  type: 'schema' | 'semantic';
  severity: 'error' | 'warning';
  message: string;
  path: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    entityCount: number;
    nodeCount: number;
    executionModes: Record<ExecutionMode, number>;
  };
}

// Floe Platform database entities
export type AppStatus = 'gathering_requirements' | 'ir_ready' | 'generating' | 'ready' | 'failed';

export interface FloeApp {
  id: string;
  account_id: string;
  domain_id: string;
  domain_key: string;
  name: string;
  logo?: string;
  status: AppStatus;
  current_ir_version_id?: string;
  created_at: string;
  updated_at: string;
  ir?: IntermediateRepresentation;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedReplies?: string[];
  extractedFacts?: Record<string, string>;
}

export interface Conversation {
  id: string;
  app_id: string;
  messages: ConversationMessage[];
  currentQuestionIndex: number;
  completed: boolean;
}

export interface DomainQuestion {
  id: string;
  prompt?: string;
  question?: string;
  kind?: 'text' | 'choice';
  options?: readonly string[] | string[];
  placeholder?: string;
  category?: 'scope' | 'entities' | 'workflow' | 'roles' | 'notifications' | 'scale' | 'reliability' | 'hosting' | 'budget';
  suggestions?: string[];
  fieldMappingHint?: string;
}

export interface DomainDefinition {
  id: string;
  key: string;
  display_name: string;
  icon: string;
  description: string;
  /**
   * Free-text signal words/phrases used by the NL intent matcher
   * (src/engine/domainMatcher.ts) to score a user's plain-English request
   * against this template. Keep these domain-specific and low-overlap with
   * other templates so scoring stays meaningful.
   */
  keywords?: string[];
  /**
   * Human-readable list of key capabilities this template ships with out of
   * the box (shown to the user in the template picker so they can see what
   * they're getting before generating the app).
   */
  features?: string[];
  question_set: DomainQuestion[];
  default_ir: IntermediateRepresentation;
}

export interface GenerationRun {
  id: string;
  app_id: string;
  ir_version_id: string;
  status: 'running' | 'succeeded' | 'failed';
  artifact_path?: string;
  logs: string[];
  duration_ms: number;
  cost_total: number;
  created_at: string;
}

export interface AgentExecution {
  id: string;
  app_id: string;
  node_execution_id?: string;
  context: 'ir_compile' | 'codegen' | 'workflow_step' | 'validation';
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number; // in USD
  latency_ms: number;
  success: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  account_id: string;
  app_id?: string;
  actor_type: 'user' | 'system';
  actor_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  before_state?: unknown;
  after_state?: unknown;
  correlation_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// -------------------------------------------------------------
// REAL DEPLOYMENT LIFECYCLE & SERVER REGISTRY
// -------------------------------------------------------------

export * from './deployment';

export interface DeploymentEvent {
  id: string;
  deployment_id: string;
  stage: DeploymentStage;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
  timestamp: string;
}

export interface DeploymentRecord {
  id: string;
  app_id: string;
  server_id: string;
  version: string;
  stage: DeploymentStage;
  url?: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  events: DeploymentEvent[];
  health_check_passed: boolean;
}

export interface UiSuggestion {
  id: string;
  category: 'trust' | 'workflow' | 'form' | 'telemetry';
  title: string;
  summary: string;
  rationale: string;
  codeSnippet?: string;
  applied?: boolean;
}
