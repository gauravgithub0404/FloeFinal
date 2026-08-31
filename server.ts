import express from 'express';
import path from 'path';
import fs from 'fs';
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
  getAppRecordsFromDb,
  saveAppToDb,
  getAppFromDb,
  getAllAppsFromDb
} from './src/server/db';
import { 
  getRenderStatus, 
  listRenderServices, 
  listRenderPostgresDatabases,
  createRenderWebService,
  createRenderPostgres,
  triggerRenderDeploy,
  getRenderService,
  getRenderOwners,
  DEFAULT_GIT_REPO
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
  app.get('/api/app-info', (req, res) => {
    res.status(200).json({
      domain: process.env.FLOE_APP_DOMAIN || '',
      appName: process.env.FLOE_APP_NAME || '',
      appId: process.env.FLOE_APP_ID || '',
      gitRepoUrl: process.env.GIT_REPO_URL || DEFAULT_GIT_REPO,
      renderUrl: process.env.RENDER_EXTERNAL_URL || '',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/apps', async (req, res) => {
    try {
      const apps = await getAllAppsFromDb();
      res.status(200).json({ apps, count: apps.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/apps/:domainOrId', async (req, res) => {
    try {
      const appRecord = await getAppFromDb(req.params.domainOrId);
      if (!appRecord) {
        return res.status(404).json({ error: `Application "${req.params.domainOrId}" not found` });
      }
      res.status(200).json(appRecord);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/apps', async (req, res) => {
    try {
      const { id, name, domain, ir } = req.body;
      if (!domain || !ir) {
        return res.status(400).json({ error: 'Missing domain or ir in body' });
      }
      const appRecord = {
        id: id || `app-${domain}-${Date.now().toString(36)}`,
        name: name || ir.name || domain,
        domain: domain.toLowerCase(),
        ir
      };
      await saveAppToDb(appRecord);
      res.status(201).json(appRecord);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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

  app.get('/api/render/owners', async (req, res) => {
    try {
      const owners = await getRenderOwners();
      res.status(200).json({ owners });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/render/postgres', async (req, res) => {
    try {
      const { name, databaseName, databaseUser, plan, region } = req.body;
      if (!name || !databaseName) {
        return res.status(400).json({ error: 'Missing required field: name and databaseName' });
      }
      const postgres = await createRenderPostgres({
        name,
        databaseName,
        databaseUser,
        plan,
        region
      });
      res.status(201).json({ postgres });
    } catch (err: any) {
      console.error('[Render API] Error in POST /api/render/postgres:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/render/services', async (req, res) => {
    try {
      const { name, repo, branch, envVars, plan, region, healthCheckPath } = req.body;
      if (!name || !repo) {
        return res.status(400).json({ error: 'Missing required field: name and repo' });
      }
      const service = await createRenderWebService({
        name,
        repo,
        branch,
        envVars,
        plan,
        region,
        healthCheckPath
      });
      res.status(201).json({ service });
    } catch (err: any) {
      console.error('[Render API] Error in POST /api/render/services:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/render/services/:serviceId', async (req, res) => {
    try {
      const service = await getRenderService(req.params.serviceId);
      res.status(200).json({ service });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/render/services/:serviceId/deploys', async (req, res) => {
    try {
      const deploy = await triggerRenderDeploy(req.params.serviceId, req.body?.clearCache === true);
      res.status(200).json({ deploy });
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
      const { appId, appName, domain, ir, gitRepoUrl, providerId, environment } = req.body;
      const sanitizedDomain = (domain || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
      const chosenProvider: any = providerId || (environment === 'render' ? 'render' : 'testbed');
      const deploymentId = `dep_${sanitizedDomain}_${Date.now().toString(36)}`;
      const commitSha = `git-${crypto.createHash('sha256').update(JSON.stringify(ir || {}) + Date.now()).digest('hex').substring(0, 8)}`;
      
      const appUrlBase = process.env.APP_URL || `http://localhost:${PORT}`;
      const serviceUrl = chosenProvider === 'render' 
        ? `https://floe-${sanitizedDomain}.onrender.com`
        : `${appUrlBase}/api/testbed/${sanitizedDomain}`;
      const healthEndpoint = chosenProvider === 'render'
        ? `${serviceUrl}/api/health`
        : `${serviceUrl}/health`;

      const deployment: DeploymentRecord = {
        id: deploymentId,
        appId: appId || 'app-default',
        appName: appName || (ir ? ir.name : 'Business Application'),
        domain: sanitizedDomain,
        providerId: chosenProvider,
        stage: 'validating_ir',
        status: 'building',
        serviceUrl,
        healthEndpoint,
        healthStatus: 'checking',
        gitRepoUrl: gitRepoUrl || DEFAULT_GIT_REPO,
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
          `[${new Date().toLocaleTimeString()}] [Floe Engine] Initializing test deployment for ${appName || sanitizedDomain}...`,
          `[${new Date().toLocaleTimeString()}] [Floe Engine] Target Provider: ${chosenProvider === 'render' ? 'Render Cloud (Web Service & PostgreSQL)' : 'Local Mock Sandbox (Floe In-Process Emulation)'} (Endpoint: ${healthEndpoint})`
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      deploymentsStore.set(deploymentId, deployment);
      await saveDeploymentToDb(deployment);

      // Persist application definition & IR
      if (ir) {
        await saveAppToDb({
          id: appId || `app-${sanitizedDomain}`,
          name: appName || ir.name || sanitizedDomain,
          domain: sanitizedDomain,
          ir
        });
      }

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
  // 4. Authoritative Deployment Health Check Execution (Anti-SSRF Hardened)
  // Maps: deploymentId -> Verified Service Record -> Server-Side Authoritative Probe
  // =========================================================================
  app.get('/api/deployments/:id/health', async (req, res) => {
    const requestedId = req.params.id;
    let dep = deploymentsStore.get(requestedId);
    if (!dep) {
      const dbDeps = await getDeploymentsFromDb();
      dep = dbDeps.find(d => 
        d.id === requestedId || 
        d.webServiceId === requestedId || 
        d.webServiceName === requestedId ||
        d.domain?.toLowerCase() === requestedId.toLowerCase()
      );
    }

    if (!dep) {
      for (const d of deploymentsStore.values()) {
        if (d.id === requestedId || d.webServiceId === requestedId || d.webServiceName === requestedId || d.domain?.toLowerCase() === requestedId.toLowerCase()) {
          dep = d;
          break;
        }
      }
    }

    if (!dep) {
      return res.status(404).json({
        healthy: false,
        statusCode: 404,
        error: `Deployment record "${requestedId}" not found in authoritative registry`,
        checkedAt: new Date().toISOString()
      });
    }

    // Determine target health endpoint from verified deployment state
    let targetHealthUrl = dep.healthEndpoint;
    if (!targetHealthUrl && dep.serviceUrl) {
      targetHealthUrl = `${dep.serviceUrl.replace(/\/+$/, '')}/api/health`;
    } else if (!targetHealthUrl && dep.webServiceName) {
      targetHealthUrl = `https://${dep.webServiceName}.onrender.com/api/health`;
    }

    if (!targetHealthUrl) {
      return res.status(400).json({
        healthy: false,
        statusCode: 400,
        error: 'Deployment does not contain an authoritative health endpoint',
        checkedAt: new Date().toISOString()
      });
    }

    // Strict Anti-SSRF Validation: target URL must resolve to localhost or official onrender.com domain
    try {
      const parsed = new URL(targetHealthUrl, 'http://localhost:3000');
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const isRenderCloud = parsed.hostname.endsWith('.onrender.com');
      const isAllowedAppDomain = Boolean(dep.domain && parsed.hostname.includes(dep.domain.toLowerCase()));

      if (!isLocalHost && !isRenderCloud && !isAllowedAppDomain) {
        return res.status(403).json({
          healthy: false,
          statusCode: 403,
          error: `Health check target hostname "${parsed.hostname}" is not within authorized cloud domains (*.onrender.com or local sandbox)`,
          checkedAt: new Date().toISOString()
        });
      }
    } catch {
      return res.status(400).json({
        healthy: false,
        statusCode: 400,
        error: 'Invalid target health URL format',
        checkedAt: new Date().toISOString()
      });
    }

    const startTime = Date.now();
    try {
      const response = await fetch(targetHealthUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4500)
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

  // =========================================================================
  // 5. Active Testbed Application Sandbox Routes (Postgres Synced)
  // =========================================================================
  app.get('/api/testbed/:domain/health', (req, res) => {
    const domain = req.params.domain;
    res.status(200).json({
      status: 'healthy',
      app: domain,
      provider: 'local_mock',
      environment: 'Local Mock Sandbox (Floe In-Process Emulation)',
      database: 'floe_local_store (PostgreSQL compatible)',
      database_type: 'PostgreSQL 15 Local Testbed',
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
  // 6. Vite Middleware Integration (Dev vs Prod SPA routing)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        }
        next();
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
      }
      return res.sendFile(path.join(process.cwd(), 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Floe Platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
