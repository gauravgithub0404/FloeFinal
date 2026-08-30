import express from 'express';
import cors from 'cors';
import multer from 'multer';
import os from 'os';
import si from 'systeminformation';
import { DeploymentManager } from './deployment';
import { checkDockerAvailability, getRunningContainers } from './docker';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const deploymentManager = new DeploymentManager();
const AGENT_VERSION = '1.0.0';

// -------------------------------------------------------------
// AGENT HEALTH & SYSTEM METRICS
// -------------------------------------------------------------

app.get('/api/v1/health', async (req, res) => {
  const docker = await checkDockerAvailability();
  res.json({
    status: 'online',
    agent_version: AGENT_VERSION,
    hostname: os.hostname(),
    os: `${os.type()} ${os.release()}`,
    docker_ready: docker.available,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/system', async (req, res) => {
  try {
    const [cpu, mem, fsSize, docker] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      checkDockerAvailability()
    ]);

    const primaryDisk = fsSize[0] || { size: 0, available: 0 };
    const containers = await getRunningContainers();

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpu: {
        current_load_pct: Math.round(cpu.currentLoad),
        cores: os.cpus().length
      },
      memory: {
        total_mb: Math.round(mem.total / (1024 * 1024)),
        used_mb: Math.round(mem.used / (1024 * 1024)),
        free_mb: Math.round(mem.free / (1024 * 1024)),
        usage_pct: Math.round((mem.used / mem.total) * 100)
      },
      disk: {
        total_gb: Math.round((primaryDisk.size || 0) / (1024 * 1024 * 1024)),
        free_gb: Math.round((primaryDisk.available || 0) / (1024 * 1024 * 1024))
      },
      docker: {
        available: docker.available,
        version: docker.version,
        running_containers_count: containers.length,
        containers
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DEPLOYMENT LIFECYCLE ENDPOINTS
// -------------------------------------------------------------

// Deploy via multipart upload or JSON base64
app.post('/api/v1/deploy', upload.single('artifact'), async (req, res) => {
  try {
    let zipBuffer: Buffer;
    let appId: string;
    let domain: string;
    let version: string;
    let healthContract: any;

    if (req.file) {
      zipBuffer = req.file.buffer;
      appId = req.body.appId || 'app-' + Date.now();
      domain = req.body.domain || 'app';
      version = req.body.version || '1.0';
      if (req.body.healthContract) {
        healthContract = JSON.parse(req.body.healthContract);
      }
    } else if (req.body.artifactBase64) {
      zipBuffer = Buffer.from(req.body.artifactBase64, 'base64');
      appId = req.body.appId || 'app-' + Date.now();
      domain = req.body.domain || 'app';
      version = req.body.version || '1.0';
      healthContract = req.body.healthContract;
    } else {
      return res.status(400).json({ error: 'Missing artifact file or artifactBase64' });
    }

    const task = await deploymentManager.createDeployment(appId, domain, version, zipBuffer, healthContract);

    res.status(202).json({
      message: 'Deployment initiated successfully',
      deploymentId: task.id,
      stage: task.stage,
      statusUrl: `/api/v1/deployments/${task.id}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Query deployment status & logs
app.get('/api/v1/deployments/:id', (req, res) => {
  const task = deploymentManager.getDeployment(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(task);
});

// Query deployment logs only
app.get('/api/v1/deployments/:id/logs', (req, res) => {
  const task = deploymentManager.getDeployment(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json({ id: task.id, logs: task.logs, stage: task.stage });
});

// List all deployments
app.get('/api/v1/deployments', (req, res) => {
  res.json(deploymentManager.getAllDeployments());
});

// Stop an app
app.post('/api/v1/apps/:appId/stop', async (req, res) => {
  try {
    const { domain } = req.body;
    await deploymentManager.stopApp(req.params.appId, domain || 'app');
    res.json({ message: `App ${req.params.appId} stopped successfully` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = Number(process.env.AGENT_PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Floe Server Agent daemon listening on http://0.0.0.0:${PORT}`);
  console.log(`Health endpoint: http://0.0.0.0:${PORT}/api/v1/health`);
  console.log(`System metrics: http://0.0.0.0:${PORT}/api/v1/system`);
});
