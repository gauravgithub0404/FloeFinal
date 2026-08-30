import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DockerHealthStatus {
  available: boolean;
  version?: string;
  error?: string;
}

export async function checkDockerAvailability(): Promise<DockerHealthStatus> {
  try {
    const { stdout } = await execAsync('docker --version');
    return {
      available: true,
      version: stdout.trim()
    };
  } catch (err: any) {
    return {
      available: false,
      error: err.message || 'Docker command failed'
    };
  }
}

export async function runDockerComposeBuildAndUp(projectDir: string, onLog: (log: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    onLog(`[Docker] Executing: docker compose up --build -d in ${projectDir}`);
    
    // Support both `docker compose` (v2) and `docker-compose` (v1)
    const proc = exec('docker compose up --build -d', { cwd: projectDir });

    proc.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((l: string) => {
        if (l.trim()) onLog(`[Docker Stdout] ${l}`);
      });
    });

    proc.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((l: string) => {
        if (l.trim()) onLog(`[Docker] ${l}`);
      });
    });

    proc.on('close', (code) => {
      if (code === 0) {
        onLog(`[Docker] Containers started successfully.`);
        resolve();
      } else {
        reject(new Error(`Docker Compose exited with non-zero exit code: ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

export async function stopDockerApp(projectDir: string): Promise<void> {
  await execAsync('docker compose down', { cwd: projectDir });
}

export async function getRunningContainers(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}"');
    return stdout.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
