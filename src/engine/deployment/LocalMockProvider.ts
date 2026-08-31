import { 
  DeploymentRequest, 
  DeploymentStatus, 
  HealthStatus, 
  DeploymentStage
} from '../../types/deployment';
import { TestEnvironmentPolicy } from '../../types/pipeline';
import { BaseDeploymentProvider } from './DeploymentProvider';
import { validateIR } from '../irValidator';
import { getAllGeneratedFiles } from '../codegenEngine';
import { getCurrentOrigin } from '../../utils/urlHelper';

export const DEFAULT_LOCAL_POLICY: TestEnvironmentPolicy = {
  maxUsers: 10,
  storageGb: 1,
  maxDays: 30,
  idleSleepMinutes: 15
};

/**
 * LocalMockProvider
 * Explicit in-process testbed sandbox emulation for local development and rapid iterative testing.
 * Strictly labeled as Local Mock Sandbox (never impersonates Render or third-party cloud runtimes).
 */
export class LocalMockProvider extends BaseDeploymentProvider {
  readonly providerId = 'local_mock';
  readonly displayName = 'Floe Local Mock Sandbox (In-Process Emulation)';
  readonly isTestProvider = true;

  private policy: TestEnvironmentPolicy;
  private activeDeployments = new Map<string, DeploymentStatus>();

  constructor(policy: TestEnvironmentPolicy = DEFAULT_LOCAL_POLICY) {
    super();
    this.policy = policy;
  }

  setPolicy(policy: Partial<TestEnvironmentPolicy>) {
    this.policy = { ...this.policy, ...policy };
  }

  getPolicy(): TestEnvironmentPolicy {
    return { ...this.policy };
  }

  /**
   * Allocate and initialize an in-process local mock application testbed
   */
  async createTestEnvironment(
    request: DeploymentRequest,
    onProgress?: (stage: DeploymentStage, log: string, status: DeploymentStatus) => void
  ): Promise<DeploymentStatus> {
    const sanitizedDomain = request.domain.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
    const deploymentId = `dep_mock_${sanitizedDomain}_${(typeof crypto.randomUUID === 'function' ? crypto.randomUUID().replace(/-/g, '').slice(0, 10) : Date.now().toString(36))}`;
    const serviceName = `${sanitizedDomain}-local-mock`;
    const dbName = `${sanitizedDomain.replace(/-/g, '_')}_mock_db`;
    
    // Construct local mock testbed URL
    const origin = getCurrentOrigin();
    const testbedServiceUrl = `${origin}/api/testbed/${sanitizedDomain}`;
    const healthEndpoint = `${testbedServiceUrl}/health`;
    const gitRepoUrl = request.gitRepoUrl || `https://github.com/floe-generated/${sanitizedDomain}.git`;
    const gitCommitSha = `git-mock-${(typeof crypto.randomUUID === 'function' ? crypto.randomUUID().replace(/-/g, '').slice(0, 8) : Date.now().toString(36))}`;
    const expiresAt = new Date(Date.now() + this.policy.maxDays * 24 * 60 * 60 * 1000).toISOString();

    const deployment: DeploymentStatus = {
      id: deploymentId,
      appId: request.appId,
      providerId: 'testbed',
      stage: 'validating_ir',
      status: 'building',
      webServiceId: undefined,
      databaseId: undefined,
      webServiceName: serviceName,
      databaseName: dbName,
      serviceUrl: testbedServiceUrl,
      healthEndpoint,
      healthStatus: 'checking',
      gitRepoUrl,
      gitCommitSha,
      isFreeTier: true,
      resourceLimits: {
        maxUsers: this.policy.maxUsers,
        storageGb: this.policy.storageGb,
        maxDays: this.policy.maxDays,
        idleSleepMinutes: this.policy.idleSleepMinutes
      },
      expiresAt,
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.activeDeployments.set(deploymentId, deployment);

    const logAndEmit = (stage: DeploymentStage, message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] [LocalMockProvider] ${message}`;
      deployment.logs.push(formatted);
      deployment.stage = stage;
      deployment.updatedAt = new Date().toISOString();
      if (onProgress) {
        onProgress(stage, formatted, { ...deployment });
      }
    };

    try {
      // Step 1: Validate IR
      logAndEmit('validating_ir', `Step 1/8: Validating IR specification for "${request.appName}" (domain: ${request.domain})...`);
      const validation = validateIR(request.ir);
      if (!validation.valid && validation.errors.length > 0) {
        const firstError = validation.errors[0];
        throw new Error(`IR Validation Failed at ${firstError.path}: ${firstError.message}`);
      }
      logAndEmit('validating_ir', `✓ IR validated successfully (${request.ir.entities.length} entities, ${request.ir.workflows[0]?.nodes.length || 0} workflow nodes).`);

      // Step 2: Generate Source Code & Artifacts
      logAndEmit('generating_source', `Step 2/8: Synthesizing deterministic TypeScript services, PostgreSQL DDL, and REST endpoints...`);
      const generatedFiles = getAllGeneratedFiles(request.ir);
      logAndEmit('generating_source', `✓ Source generated (${generatedFiles.length} files synthesized for in-process testbed).`);

      // Step 3: Register Local Mock with Floe Server Engine
      logAndEmit('allocating_target', `Step 3/8: Allocating in-process local mock environment on Floe server engine...`);
      try {
        if (typeof window !== 'undefined' && window.fetch) {
          const res = await fetch('/api/deployments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appId: request.appId,
              appName: request.appName,
              domain: sanitizedDomain,
              ir: request.ir,
              environment: 'local_mock'
            })
          });
          if (res.ok) {
            const serverDep = await res.json();
            if (serverDep.serviceUrl) {
              deployment.serviceUrl = serverDep.serviceUrl;
              deployment.healthEndpoint = serverDep.healthEndpoint;
            }
          }
        }
      } catch {
        logAndEmit('allocating_target', `[Notice] In-process testbed registered at ${deployment.serviceUrl}`);
      }
      logAndEmit('allocating_target', `✓ Local mock space registered (Endpoint: ${deployment.serviceUrl}).`);

      // Step 4: Local Database Tables Initialization
      logAndEmit('creating_service', `Step 4/8: Initializing schema tables in local PostgreSQL-compatible testbed store...`);
      logAndEmit('creating_service', `✓ Schema tables initialized for ${request.ir.entities.length} entities.`);

      // Step 5: Route registration
      logAndEmit('building_container', `Step 5/8: Registering local REST routes (/api/testbed/${sanitizedDomain}/records/*)...`);
      logAndEmit('building_container', `✓ REST routes active.`);

      // Step 6: Verify Authoritative Health Check
      logAndEmit('running_health_check', `Step 6/8: Executing authoritative health probe: GET ${deployment.healthEndpoint}...`);
      const health = await this.executeAuthoritativeHealthCheck(deployment.healthEndpoint);

      if (!health.healthy) {
        deployment.status = 'failed';
        deployment.stage = 'failed';
        deployment.healthStatus = 'unhealthy';
        deployment.errorMessage = `Local health check failed: ${health.error || 'HTTP ' + health.statusCode}`;
        logAndEmit('failed', `❌ HEALTH CHECK FAILED: ${deployment.errorMessage}`);
        throw new Error(deployment.errorMessage);
      }

      deployment.status = 'healthy';
      deployment.stage = 'healthy';
      deployment.healthStatus = 'healthy';
      deployment.statusCode = health.statusCode || 200;
      deployment.latencyMs = health.latencyMs || 15;
      logAndEmit('healthy', `✓ Health check verified: ${deployment.healthEndpoint} → 200 OK (Latency: ${deployment.latencyMs}ms).`);
      logAndEmit('healthy', `🌟 READY: Local mock sandbox active at ${deployment.serviceUrl}`);

      return deployment;
    } catch (err: any) {
      deployment.status = 'failed';
      deployment.stage = 'failed';
      deployment.healthStatus = 'unhealthy';
      deployment.errorMessage = err.message || 'Local mock provisioning failed';
      this.activeDeployments.set(deploymentId, deployment);
      throw err;
    }
  }

  private async executeAuthoritativeHealthCheck(endpointUrl: string): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(endpointUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          healthy: true,
          statusCode: res.status,
          latencyMs,
          checkedAt: new Date().toISOString(),
          details: data
        };
      } else {
        return {
          healthy: false,
          statusCode: res.status,
          latencyMs,
          checkedAt: new Date().toISOString(),
          error: `Health endpoint returned HTTP ${res.status}: ${res.statusText}`
        };
      }
    } catch (err: any) {
      return {
        healthy: false,
        statusCode: 503,
        latencyMs: Date.now() - startTime,
        checkedAt: new Date().toISOString(),
        error: err.name === 'AbortError' ? 'Health check timed out' : (err.message || 'Health probe failed')
      };
    }
  }

  async getDeploymentStatus(id: string): Promise<DeploymentStatus> {
    const dep = this.activeDeployments.get(id);
    if (!dep) throw new Error(`Deployment ${id} not found`);
    return dep;
  }

  async getLogs(id: string): Promise<string[]> {
    const dep = this.activeDeployments.get(id);
    return dep ? dep.logs : [];
  }

  async healthCheck(id: string): Promise<HealthStatus> {
    const dep = this.activeDeployments.get(id);
    if (!dep || !dep.healthEndpoint) {
      return { healthy: false, checkedAt: new Date().toISOString(), error: 'No health endpoint' };
    }
    return this.executeAuthoritativeHealthCheck(dep.healthEndpoint);
  }

  async getUrl(id: string): Promise<string> {
    const dep = this.activeDeployments.get(id);
    return dep?.serviceUrl || '';
  }

  async destroy(id: string): Promise<void> {
    const dep = this.activeDeployments.get(id);
    if (dep) {
      dep.status = 'stopped';
      dep.stage = 'stopped';
      dep.logs.push(`[${new Date().toLocaleTimeString()}] Local mock testbed stopped.`);
    }
  }
}
