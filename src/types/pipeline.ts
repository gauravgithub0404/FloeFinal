import { IntermediateRepresentation } from './floe';

export type PipelineStageId = 
  | 'stage_1_spec'
  | 'stage_2_ir'
  | 'stage_3_codegen'
  | 'stage_4_testing'
  | 'stage_5_security'
  | 'stage_6_sbom'
  | 'stage_7_governance_gate'
  | 'stage_8_deploy_test'
  | 'stage_9_dast'
  | 'stage_10_final_gate';

export type StageStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed' | 'skipped';

export type ToolStatus = 'active' | 'configured' | 'available' | 'running' | 'passed' | 'failed' | 'skipped' | 'unavailable';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  tool: 'Floe SAST' | 'Floe Container' | 'Floe Secret' | 'Floe DAST' | 'Semgrep' | 'Trivy' | 'Gitleaks' | 'Dependency' | 'OWASP ZAP' | 'Devzy' | string;
  category: 'SAST' | 'Container' | 'Secret' | 'Dependency' | 'DAST' | 'Compliance';
  severity: SeverityLevel;
  ruleId: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  url?: string;
  remediation?: string;
  evidenceCode?: string;
}

export interface TestResultItem {
  id: string;
  name: string;
  type: 'unit' | 'api' | 'e2e';
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  details?: string;
}

export interface SbomComponent {
  name: string;
  version: string;
  type: 'library' | 'framework' | 'container-base' | 'runtime';
  purl: string;
  license: string;
  sha256?: string;
  vulnerabilitiesCount: number;
}

export interface SbomReport {
  bomFormat: 'CycloneDX' | 'SPDX';
  specVersion: string;
  serialNumber: string;
  timestamp: string;
  components: SbomComponent[];
  totalDependencies: number;
  totalDirect: number;
  licensesFound: string[];
  sbomSha256?: string;
}

export interface GovernancePolicyConfig {
  blockOnCritical: boolean;
  blockOnHigh: boolean;
  blockOnMedium: boolean;
  allowWarnOnLow: boolean;
  requireSbom: boolean;
  requireZeroSecrets: boolean;
  requireMinTestCoveragePct: number;
  requireDastClean: boolean;
  policyVersion?: string;
}

export interface GovernanceResult {
  gateType?: 'GATE_A_PRE_TEST' | 'GATE_B_PRODUCTION_PROMOTION';
  decision: 'PASS' | 'REVIEW' | 'BLOCK';
  reasons: string[];
  policyVersion: string;
  evidenceIds: string[];
  evaluatedAt: string;
  score: number;
  metrics: {
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    testPassRatePct: number;
    sbomPresent: boolean;
    dastClean?: boolean;
    testbedHealthy?: boolean;
    testbedLatencyMs?: number;
  };
}

export interface TestEnvironmentPolicy {
  maxUsers: number;
  storageGb: number;
  maxDays: number;
  idleSleepMinutes: number;
}

export interface PipelineStageResult {
  id: PipelineStageId;
  stageNumber: number;
  name: string;
  description: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  summary: string;
  logs: string[];
  findings?: SecurityFinding[];
  testResults?: TestResultItem[];
  sbom?: SbomReport;
  governanceResult?: GovernanceResult;
  metrics?: Record<string, string | number | boolean>;
}

export interface PipelineEvidenceItem {
  stageId: PipelineStageId;
  type: string;
  payload: any;
  hash: string;
  timestamp: string;
}

export interface PipelineInstance {
  id: string;
  appId: string;
  appName: string;
  domain: string;
  irVersion: string;
  commitSha: string;
  status: 'idle' | 'running' | 'passed' | 'failed' | 'blocked';
  currentStageId: PipelineStageId;
  policyConfig: GovernancePolicyConfig;
  governanceDecision?: GovernanceResult;
  gateADecision?: GovernanceResult;
  gateBDecision?: GovernanceResult;
  stages: Record<PipelineStageId, PipelineStageResult>;
  evidenceStore: Record<string, PipelineEvidenceItem>;
  artifact: {
    sourceArtifactDigest?: string;
    imageDigest?: string;
    imageTag?: string;
    registryUrl?: string;
    sbomDigest?: string;
    promotedToProduction: boolean;
    promotedAt?: string;
    promotedTarget?: 'aws' | 'azure' | 'gcp' | 'on_prem';
  };
  createdAt: string;
  updatedAt: string;
}

// Pluggable Provider Registry Architecture
export interface PluggableProviderInfo {
  category: 'SAST' | 'ContainerScanner' | 'SecretScanner' | 'DependencyScanner' | 'DAST' | 'TestRunner' | 'SBOMGenerator' | 'ExternalValidator' | 'DeploymentProvider';
  activeProvider: string;
  isOptional?: boolean;
  availableProviders: Array<{
    name: string;
    description: string;
    version: string;
    status: ToolStatus;
  }>;
}
