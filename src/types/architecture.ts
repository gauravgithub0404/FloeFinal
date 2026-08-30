// ============================================================================
// FLOE ARCHITECTURE & COST MODEL CONTRACTS
// ============================================================================

export type UserCountBracket = 
  | '1-10'
  | '11-50'
  | '51-250'
  | '251-1000'
  | '1000-10000'
  | '10000+'
  | 'not_sure';

export type ApplicationCriticality = 
  | 'dev_demo'
  | 'internal_business'
  | 'business_critical'
  | 'mission_critical';

export type DataSensitivity = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'highly_sensitive'
  | 'regulated';

export type GeographicReach = 
  | 'india'
  | 'asia'
  | 'europe'
  | 'us'
  | 'global';

export type AvailabilityRequirement = 
  | 'several_hours'
  | 'under_4_hours'
  | 'under_1_hour'
  | 'near_zero_downtime';

export interface RequirementProfile {
  user_count_bracket: UserCountBracket;
  total_registered_users: number;
  concurrent_users: number;
  growth_12_months_users: number;
  growth_multiple: number;
  criticality: ApplicationCriticality;
  data_sensitivity: DataSensitivity;
  geographic_reach: GeographicReach;
  availability: AvailabilityRequirement;
  internal_vs_external: 'internal_only' | 'external_facing' | 'hybrid';
  cloud_provider_preference?: 'aws' | 'azure' | 'gcp' | 'none';
}

export type DeploymentTargetKey = 'on_prem' | 'aws' | 'azure' | 'gcp';

export interface ComponentCostBreakdown {
  component: string;
  name: string;
  spec: string;
  monthly_cost_inr: number;
  is_free_included?: boolean;
}

export interface DeploymentProfileOption {
  target_key: DeploymentTargetKey;
  display_name: string;
  subtitle: string;
  badge?: string;
  is_recommended: boolean;
  why_recommended_bullet?: string;
  why_not_bullet?: string;
  
  // Cost modeling
  estimated_monthly_cost_inr: {
    min: number;
    max: number;
    nominal: number;
  };
  tco_monthly_inr: number; // Total ownership cost (hardware depreciation, ops)
  
  // Resource Specs
  compute_spec: {
    vCpu: number;
    ram_gb: number;
    instances: number;
    description: string;
  };
  database_spec: {
    engine: 'postgresql';
    tier: string;
    ram_gb: number;
    storage_gb: number;
    high_availability: boolean;
    license_cost_inr: number;
  };
  storage_spec: {
    disk_gb: number;
    backup_retention_days: number;
  };

  // Cost breakdown items
  breakdown: ComponentCostBreakdown[];

  // Qualitative analysis
  benefits: string[];
  limitations: string[];
  assumptions: {
    registered_users: number;
    concurrent_users: number;
    monthly_requests: string;
    storage_gb: number;
    backup_frequency: string;
    region: string;
  };
}

export interface ArchitecturePlan {
  domain: string;
  app_name: string;
  requirement_profile: RequirementProfile;
  recommended_database: {
    engine: 'postgresql';
    version: '15-alpine';
    reason: string[];
  };
  recommended_target: DeploymentTargetKey;
  recommendation_rationale: {
    headline: string;
    summary: string;
    reasons: string[];
    trade_off: string;
    why_not_alternatives: Record<string, string>;
  };
  profiles: Record<DeploymentTargetKey, DeploymentProfileOption>;
  selected_target: DeploymentTargetKey;
}

// ============================================================================
// MASTER ARCHITECTURAL EXTENSIONS (Principal Architect Specifications)
// ============================================================================

export type StepExecutionClassification = 'deterministic' | 'ai' | 'agentic' | 'human';

export interface PolarizerStepClassification {
  stepId: string;
  stepName: string;
  classification: StepExecutionClassification;
  rationale: string;
  isolationContract: string;
  slaTimeout: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface WorkflowRiskPolicy {
  workflowName: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  testingDepth: 'standard_smoke' | 'extended_integration' | 'full_e2e_compliance';
  approvalRequirement: 'automatic' | 'user_confirmation' | 'security_compliance_signoff';
  deploymentPolicy: 'auto_testbed' | 'staged_canary' | 'gated_promotion';
}

export interface ApplicationContract {
  contractVersion: string;
  appId: string;
  appName: string;
  domain: string;
  entities: {
    name: string;
    fieldsCount: number;
    primaryKey: string;
    relationships: string[];
  }[];
  roles: {
    roleName: string;
    permissions: string[];
  }[];
  apiContracts: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    roleRequired: string;
    idempotent: boolean;
  }[];
  workflows: {
    workflowName: string;
    stepClassifications: PolarizerStepClassification[];
    riskPolicy: WorkflowRiskPolicy;
  }[];
  nonFunctionalRequirements: {
    targetAvailability: string;
    dataSensitivity: DataSensitivity;
    p95LatencyMs: number;
    networkIsolation: boolean;
    auditLevel: 'strict' | 'standard';
  };
  testCriteria: string[];
}

export interface EvaluationGateItem {
  id: string;
  category: 'schema' | 'contract' | 'code_quality' | 'security' | 'e2e' | 'smoke';
  name: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
  latencyMs?: number;
}

export interface EvaluationGateReport {
  timestamp: string;
  overallStatus: 'passed' | 'failed';
  totalPassed: number;
  totalChecks: number;
  items: EvaluationGateItem[];
  remediationPlan?: string;
}

export interface ImmutableArtifact {
  artifactId: string;
  version: string;
  irVersion: string;
  commitHash: string;
  sbomDigest: string;
  dockerDigest: string;
  createdAt: string;
  isPromoted: boolean;
  evaluationStatus: 'all_passed' | 'gated';
  lifecycleState: 'active' | 'deprecated' | 'archived' | 'deleted';
}

export interface ApplicationChangeRequest {
  id: string;
  title: string;
  fromVersion: string;
  toVersion: string;
  author: string;
  status: 'draft' | 'under_evaluation' | 'approved' | 'promoted' | 'rejected';
  diffSummary: string[];
  evaluationSummary: EvaluationGateReport;
  createdAt: string;
  promotedAt?: string;
}

export interface ChronoviewEntry {
  version: string;
  timestamp: string;
  eventType: 'requirement_created' | 'ir_compiled' | 'evaluation_passed' | 'testbed_deployed' | 'promoted_to_production';
  actor: string;
  changeSummary: string;
  irSnapshotId: string;
  auditTrailId: string;
}

