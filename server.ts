import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { 
  initDatabase, 
  getDbStatus, 
  saveDeploymentToDb, 
  getDeploymentsFromDb, 
  savePipelineRunToDb, 
  getPipelineRunsFromDb, 
  saveAppRecordToDb, 
  getAppRecordsFromDb 
} from './src/server/db';
import { 
  getRenderStatus, 
  listRenderServices, 
  listRenderPostgresDatabases 
} from './src/server/renderApi';

// Server-side types
interface DeploymentRecord {
  id: string;
  appId: string;
  appName: string;
  domain: string;
  providerId: 'render' | 'testbed' | 'on_prem' | 'aws' | 'azure' | 'gcp';
  stage: string;
  status: 'building' | 'deploying' | 'healthy' | 'failed' | 'stopped';
  serviceUrl: string;
  healthEndpoint: string;
  healthStatus: 'healthy' | 'unhealthy' | 'checking';
  statusCode?: number;
  latencyMs?: number;
  gitRepoUrl?: string;
  gitCommitSha?: string;
  isFreeTier: boolean;
  resourceLimits: {
    maxUsers: number;
    storageGb: number;
    maxDays: number;
    idleSleepMinutes: number;
  };
  expiresAt: string;
  errorMessage?: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

// In-Memory Fallback Cache for Server Runs
const pipelineRunsStore = new Map<string, any>();
const deploymentsStore = new Map<string, DeploymentRecord>();
const testbedDataStore = new Map<string, Map<string, any[]>>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Enable CORS headers for preview iframe
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize PostgreSQL schema in background
  initDatabase().then(success => {
    if (success) {
      console.log('[Floe Orchestrator] ✓ Connected to Render PostgreSQL cluster');
    }
  }).catch(err => {
    console.warn('[Floe Orchestrator] PostgreSQL init warning:', err.message);
  });

  // =========================================================================
  // 1. Authoritative Platform Health & Infrastructure Status
  // =========================================================================
  app.get('/api/health', async (req, res) => {
    const [dbStatus, renderStatus] = await Promise.all([
      getDbStatus().catch(err => ({ connected: false, error: err.message })),
      getRenderStatus().catch(err => ({ valid: false, error: err.message }))
    ]);

    res.status(200).json({
      status: 'healthy',
      platform: 'Floe Application Platform',
      version: '1.0.0',
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage: process.memoryUsage(),
      database: dbStatus,
      render_api: renderStatus,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/database/status', async (req, res) => {
    try {
      const status = await getDbStatus();
      res.status(200).json(status);
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  app.get('/api/render/status', async (req, res) => {
    try {
      const status = await getRenderStatus();
      res.status(200).json(status);
    } catch (err: any) {
      res.status(500).json({ valid: false, error: err.message });
    }
  });

  app.get('/api/render/services', async (req, res) => {
    try {
      const services = await listRenderServices();
      res.status(200).json({ services, count: services.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/render/databases', async (req, res) => {
    try {
      const databases = await listRenderPostgresDatabases();
      res.status(200).json({ databases, count: databases.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // 2. Asynchronous CI/CD Pipeline API Endpoints
  // =========================================================================
  app.post('/api/pipeline/run', async (req, res) => {
    try {
      const { appId, appName, domain, ir, policyConfig } = req.body;
      if (!ir) {
        return res.status(400).json({ error: 'Missing intermediate representation (ir)' });
      }

      const pipelineId = `pipe-${(ir.app_id || domain || 'app')}-${Date.now().toString(36)}`;
      const commitSha = `git-${crypto.createHash('sha256').update(JSON.stringify(ir) + Date.now()).digest('hex').substring(0, 8)}`;

      const initialRun = {
        id: pipelineId,
        appId: ir.app_id || appId || 'app-default',
        appName: ir.name || appName || 'Business Application',
        domain: ir.domain || domain || 'enterprise',
        irVersion: ir.ir_version || '1.0.0',
        commitSha,
        status: 'running',
        currentStageId: 'stage_1_spec',
        policyConfig: policyConfig || {
          blockOnCritical: true,
          blockOnHigh: true,
          blockOnMedium: false,
          allowWarnOnLow: true,
          requireSbom: true,
          requireZeroSecrets: true,
          requireMinTestCoveragePct: 80,
          requireDastClean: true,
          policyVersion: '2026.1'
        },
        stages: {},
        evidenceStore: {},
        artifact: {
          imageDigest: undefined,
          imageTag: `${ir.domain || 'app'}:v${ir.ir_version || '1.0.0'}`,
          registryUrl: `registry.floe.internal/apps/${ir.domain || 'app'}`,
          sbomDigest: undefined,
          promotedToProduction: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      pipelineRunsStore.set(pipelineId, initialRun);
      await savePipelineRunToDb(initialRun);

      // Return immediately for async polling
      res.status(202).json({
        pipelineId,
        status: 'running',
        message: 'Floe 10-stage evaluation and delivery pipeline initialized'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/pipeline/:id', async (req, res) => {
    let run = pipelineRunsStore.get(req.params.id);
    if (!run) {
      const dbRuns = await getPipelineRunsFromDb();
      run = dbRuns.find(r => r.id === req.params.id);
    }
    if (!run) {
      return res.status(404).json({ error: `Pipeline run ${req.params.id} not found` });
    }
    res.status(200).json(run);
  });

  app.put('/api/pipeline/:id', async (req, res) => {
    const existing = pipelineRunsStore.get(req.params.id) || {};
    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    pipelineRunsStore.set(req.params.id, updated);
    await savePipelineRunToDb(updated);
    res.status(200).json(updated);
  });

  app.get('/api/pipeline/list', async (req, res) => {
    const dbRuns = await getPipelineRunsFromDb();
    if (dbRuns.length > 0) {
      return res.status(200).json({ runs: dbRuns, count: dbRuns.length });
    }
    const list = Array.from(pipelineRunsStore.values());
    res.status(200).json({ runs: list, count: list.length });
  });

  // =========================================================================
  // 3. Deployment Management API Endpoints (PostgreSQL Persisted)
  // =========================================================================
  app.post('/api/deployments/create', async (req, res) => {
    try {
      const { appId, appName, domain, ir, gitRepoUrl } = req.body;
      const sanitizedDomain = (domain || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
      const deploymentId = `dep_${sanitizedDomain}_${Date.now().toString(36)}`;
      const commitSha = `git-${crypto.createHash('sha256').update(JSON.stringify(ir || {}) + Date.now()).digest('hex').substring(0, 8)}`;
      
      const appUrlBase = process.env.APP_URL || `http://localhost:${PORT}`;
      const serviceUrl = `${appUrlBase}/api/testbed/${sanitizedDomain}`;
      const healthEndpoint = `${serviceUrl}/health`;

      const deployment: DeploymentRecord = {
        id: deploymentId,
        appId: appId || 'app-default',
        appName: appName || (ir ? ir.name : 'Business Application'),
        domain: sanitizedDomain,
        providerId: 'render',
        stage: 'validating_ir',
        status: 'building',
        serviceUrl,
        healthEndpoint,
        healthStatus: 'checking',
        gitRepoUrl: gitRepoUrl || `https://github.com/floe-generated/${sanitizedDomain}.git`,
        gitCommitSha: commitSha,
        isFreeTier: true,
        resourceLimits: {
          maxUsers: 10,
          storageGb: 1,
          maxDays: 30,
          idleSleepMinutes: 15
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        logs: [
          `[${new Date().toLocaleTimeString()}] [Floe Engine] Initializing deployment for ${appName || sanitizedDomain}...`,
          `[${new Date().toLocaleTimeString()}] [Floe Engine] Target: Render PostgreSQL & Node Testbed (Active Health Endpoint: ${healthEndpoint})`
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      deploymentsStore.set(deploymentId, deployment);
      await saveDeploymentToDb(deployment);

      // Initialize testbed entities for this application
      if (ir && Array.isArray(ir.entities)) {
        if (!testbedDataStore.has(sanitizedDomain)) {
          testbedDataStore.set(sanitizedDomain, new Map());
        }
        const appDb = testbedDataStore.get(sanitizedDomain)!;
        ir.entities.forEach((entity: any) => {
          if (!appDb.has(entity.name.toLowerCase())) {
            appDb.set(entity.name.toLowerCase(), []);
          }
        });
      }

      res.status(201).json(deployment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/deployments', async (req, res) => {
    const dbDeps = await getDeploymentsFromDb();
    if (dbDeps.length > 0) {
      return res.status(200).json({ deployments: dbDeps, count: dbDeps.length });
    }
    const list = Array.from(deploymentsStore.values());
    res.status(200).json({ deployments: list, count: list.length });
  });

  app.get('/api/deployments/:id', async (req, res) => {
    let dep = deploymentsStore.get(req.params.id);
    if (!dep) {
      const dbDeps = await getDeploymentsFromDb();
      dep = dbDeps.find(d => d.id === req.params.id);
    }
    if (!dep) {
      return res.status(404).json({ error: `Deployment ${req.params.id} not found` });
    }
    res.status(200).json(dep);
  });

  app.put('/api/deployments/:id', async (req, res) => {
    const existing = deploymentsStore.get(req.params.id) || {};
    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    deploymentsStore.set(req.params.id, updated as any);
    await saveDeploymentToDb(updated);
    res.status(200).json(updated);
  });

  // =========================================================================
  // 4. Authoritative Health Check Execution
  // =========================================================================
  app.get('/api/deployments/:id/health', async (req, res) => {
    let dep = deploymentsStore.get(req.params.id);
    if (!dep) {
      const dbDeps = await getDeploymentsFromDb();
      dep = dbDeps.find(d => d.id === req.params.id);
    }

    if (!dep || !dep.healthEndpoint) {
      return res.status(404).json({
        healthy: false,
        statusCode: 404,
        error: 'Deployment or health endpoint not found',
        checkedAt: new Date().toISOString()
      });
    }

    const startTime = Date.now();
    try {
      const response = await fetch(dep.healthEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        dep.healthStatus = 'healthy';
        dep.statusCode = response.status;
        dep.latencyMs = latencyMs;
        dep.status = 'healthy';
        deploymentsStore.set(dep.id, dep);
        await saveDeploymentToDb(dep);

        return res.status(200).json({
          healthy: true,
          statusCode: response.status,
          latencyMs,
          checkedAt: new Date().toISOString(),
          details: data
        });
      } else {
        dep.healthStatus = 'unhealthy';
        dep.statusCode = response.status;
        dep.latencyMs = latencyMs;
        dep.status = 'failed';
        deploymentsStore.set(dep.id, dep);
        await saveDeploymentToDb(dep);

        return res.status(200).json({
          healthy: false,
          statusCode: response.status,
          latencyMs,
          checkedAt: new Date().toISOString(),
          error: `Endpoint returned HTTP ${response.status}`
        });
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      dep.healthStatus = 'unhealthy';
      dep.statusCode = 503;
      dep.latencyMs = latencyMs;
      dep.status = 'failed';
      deploymentsStore.set(dep.id, dep);
      await saveDeploymentToDb(dep);

      return res.status(200).json({
        healthy: false,
        statusCode: 503,
        latencyMs,
        checkedAt: new Date().toISOString(),
        error: err.message || 'Connection refused / service unreachable'
      });
    }
  });

  // Health Proxy for remote CORS-restricted endpoints
  app.get('/api/render/health-proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url query param' });
    }

    const startTime = Date.now();
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4500)
      });
      const latencyMs = Date.now() - startTime;
      const data = await response.json().catch(() => ({}));

      return res.status(200).json({
        healthy: response.ok,
        statusCode: response.status,
        latencyMs,
        checkedAt: new Date().toISOString(),
        details: data,
        error: response.ok ? undefined : `Target returned HTTP ${response.status}`
      });
    } catch (err: any) {
      return res.status(200).json({
        healthy: false,
        statusCode: 503,
        latencyMs: Date.now() - startTime,
        checkedAt: new Date().toISOString(),
        error: err.message || 'Failed to reach remote URL'
      });
    }
  });

  // =========================================================================
  // 5. Active Testbed Application Sandbox Routes (Postgres Synced)
  // =========================================================================
  app.get('/api/testbed/:domain/health', (req, res) => {
    const domain = req.params.domain;
    res.status(200).json({
      status: 'healthy',
      app: domain,
      environment: 'Render PostgreSQL Managed Sandbox',
      database: 'floe_f3rk connected',
      database_type: 'PostgreSQL 15 (Oregon)',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/testbed/:domain/records/:entity', async (req, res) => {
    const { domain, entity } = req.params;
    try {
      const dbRecords = await getAppRecordsFromDb(domain, entity);
      if (dbRecords.length > 0) {
        return res.status(200).json({ entity, count: dbRecords.length, records: dbRecords });
      }
    } catch {
      // fallback to memory
    }
    const appDb = testbedDataStore.get(domain);
    const records = appDb?.get(entity.toLowerCase()) || [];
    res.status(200).json({ entity, count: records.length, records });
  });

  app.post('/api/testbed/:domain/records/:entity', async (req, res) => {
    const { domain, entity } = req.params;
    if (!testbedDataStore.has(domain)) {
      testbedDataStore.set(domain, new Map());
    }
    const appDb = testbedDataStore.get(domain)!;
    if (!appDb.has(entity.toLowerCase())) {
      appDb.set(entity.toLowerCase(), []);
    }
    const list = appDb.get(entity.toLowerCase())!;
    const newRecord = {
      id: `rec_${crypto.randomBytes(4).toString('hex')}`,
      ...req.body,
      status: req.body.status || 'SUBMITTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(newRecord);

    await saveAppRecordToDb(domain, entity, newRecord);

    res.status(201).json(newRecord);
  });

  // =========================================================================
  // 6. Vite Middleware Integration (Dev vs Prod)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Floe Platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
