import { IntermediateRepresentation } from './floe';

export type DeploymentStage = 
  | 'idle'
  | 'validating_ir'
  | 'generating_source'
  | 'allocating_target'
  | 'creating_service'
  | 'building_container'
  | 'starting_service'
  | 'running_health_check'
  | 'healthy'
  | 'failed'
  | 'stopped';

export interface DeploymentRequest {
  appId: string;
  appName: string;
  domain: string;
  ir: IntermediateRepresentation;
  environment: 'test' | 'production';
  gitRepoUrl?: string;
  branch?: string;
  envVars?: Record<string, string>;
  apiKey?: string;
}

export interface ResourceLimits {
  maxUsers: number;
  storageGb: number;
  maxDays: number;
  idleSleepMinutes: number;
}

export interface DeploymentStatus {
  id: string;
  appId: string;
  providerId: 'render' | 'on_prem' | 'aws' | 'azure' | 'gcp';
  stage: DeploymentStage;
  status: 'idle' | 'building' | 'deploying' | 'healthy' | 'failed' | 'stopped';
  webServiceId?: string;
  databaseId?: string;
  webServiceName?: string;
  databaseName?: string;
  serviceUrl?: string;
  healthEndpoint?: string;
  healthStatus?: 'healthy' | 'unhealthy' | 'checking';
  statusCode?: number;
  latencyMs?: number;
  gitRepoUrl?: string;
  gitCommitSha?: string;
  isFreeTier: boolean;
  resourceLimits?: ResourceLimits;
  expiresAt?: string;
  errorMessage?: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServerNode {
  id: string;
  name: string;
  hostname: string;
  tailscale_ip: string;
  agent_port: number;
  app_port: number;
  status: 'online' | 'offline' | 'busy';
  os: string;
  docker_running: boolean;
  agent_version?: string;
  active_apps_count: number;
  capacity?: {
    cpu_usage_pct: number;
    memory_usage_pct: number;
    disk_free_gb: number;
  };
}

export interface DeploymentHealthContract {
  path: string;
  port: number;
  expectedStatus?: number;
  timeoutSeconds: number;
}

export interface HealthStatus {
  healthy: boolean;
  statusCode?: number;
  latencyMs?: number;
  checkedAt: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DeploymentProvider {
  readonly providerId: string;
  readonly displayName: string;
  readonly isTestProvider: boolean;

  createTestEnvironment(input: DeploymentRequest): Promise<DeploymentStatus>;
  getDeploymentStatus(id: string): Promise<DeploymentStatus>;
  getLogs(id: string): Promise<string[]>;
  healthCheck(id: string): Promise<HealthStatus>;
  getUrl(id: string): Promise<string>;
  destroy(id: string): Promise<void>;
}
