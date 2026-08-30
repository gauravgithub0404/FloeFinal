import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { runDockerComposeBuildAndUp, stopDockerApp } from './docker';
import { pollHealthCheckEndpoint } from './health';

export type DeploymentStage =
  | 'idle'
  | 'deployment_requested'
  | 'artifact_uploaded'
  | 'container_building'
  | 'services_started'
  | 'health_check_running'
  | 'healthy'
  | 'failed'
  | 'stopped';

export interface DeploymentTask {
  id: string;
  appId: string;
  domain: string;
  version: string;
  stage: DeploymentStage;
  logs: string[];
  startedAt: string;
  completedAt?: string;
  error?: string;
  healthContract?: {
    path: string;
    port: number;
    timeoutSeconds: number;
  };
  deployedUrl?: string;
}

export class DeploymentManager {
  private baseDir: string;
  private deployments: Map<string, DeploymentTask> = new Map();

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'deployed_apps');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getDeployment(id: string): DeploymentTask | undefined {
    return this.deployments.get(id);
  }

  getAllDeployments(): DeploymentTask[] {
    return Array.from(this.deployments.values());
  }

  async createDeployment(
    appId: string,
    domain: string,
    version: string,
    zipBuffer: Buffer,
    healthContract?: { path: string; port: number; timeoutSeconds: number }
  ): Promise<DeploymentTask> {
    const deploymentId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const task: DeploymentTask = {
      id: deploymentId,
      appId,
      domain,
      version,
      stage: 'deployment_requested',
      logs: [],
      startedAt: new Date().toISOString(),
      healthContract: healthContract || { path: '/api/health', port: 4000, timeoutSeconds: 45 }
    };

    this.deployments.set(deploymentId, task);

    // Launch async execution of deployment state machine
    this.executeDeploymentPipeline(task, zipBuffer).catch((err) => {
      task.stage = 'failed';
      task.error = err.message;
      task.logs.push(`[Fatal] Pipeline error: ${err.message}`);
    });

    return task;
  }

  private addLog(task: DeploymentTask, message: string) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const logLine = `[${timestamp}] ${message}`;
    task.logs.push(logLine);
    console.log(`[Dep:${task.id}] ${logLine}`);
  }

  private async executeDeploymentPipeline(task: DeploymentTask, zipBuffer: Buffer): Promise<void> {
    const appDir = path.join(this.baseDir, `${task.domain}_${task.appId}`);
    
    // Stage 1: Artifact Uploaded & Extracted
    task.stage = 'artifact_uploaded';
    this.addLog(task, `Artifact received (${(zipBuffer.length / 1024).toFixed(1)} KB). Unpacking to ${appDir}...`);

    if (fs.existsSync(appDir)) {
      this.addLog(task, `Cleaning previous deployment directory...`);
      fs.rmSync(appDir, { recursive: true, force: true });
    }
    fs.mkdirSync(appDir, { recursive: true });

    const zip = await JSZip.loadAsync(zipBuffer);
    for (const [relativePath, file] of Object.entries(zip.files)) {
      if (file.dir) {
        fs.mkdirSync(path.join(appDir, relativePath), { recursive: true });
      } else {
        const content = await file.async('nodebuffer');
        const filePath = path.join(appDir, relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
      }
    }
    this.addLog(task, `Extracted ${Object.keys(zip.files).length} files successfully.`);

    // Stage 2: Container Building & Starting
    task.stage = 'container_building';
    this.addLog(task, `Launching Docker Compose orchestrator...`);

    await runDockerComposeBuildAndUp(appDir, (msg) => {
      this.addLog(task, msg);
    });

    task.stage = 'services_started';
    this.addLog(task, `Docker Compose services are up. Awaiting health probe...`);

    // Stage 3: Health Verification Contract
    task.stage = 'health_check_running';
    const contract = task.healthContract!;
    
    const isHealthy = await pollHealthCheckEndpoint(
      {
        host: 'localhost',
        port: contract.port,
        path: contract.path,
        timeoutSeconds: contract.timeoutSeconds
      },
      (msg) => this.addLog(task, msg)
    );

    if (isHealthy) {
      task.stage = 'healthy';
      task.completedAt = new Date().toISOString();
      task.deployedUrl = `http://${process.env.TAILSCALE_IP || 'localhost'}:${contract.port}`;
      this.addLog(task, `[SUCCESS] Deployment is healthy and serving at ${task.deployedUrl}`);
    } else {
      task.stage = 'failed';
      task.completedAt = new Date().toISOString();
      task.error = `Service failed mandatory health check on ${contract.path}`;
      this.addLog(task, `[FAILED] ${task.error}`);
    }
  }

  async stopApp(appId: string, domain: string): Promise<void> {
    const appDir = path.join(this.baseDir, `${domain}_${appId}`);
    if (fs.existsSync(appDir)) {
      await stopDockerApp(appDir);
    }
  }
}
