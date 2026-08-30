import { 
  DeploymentRequest, 
  DeploymentStatus, 
  HealthStatus, 
  DeploymentStage,
  DeploymentProvider 
} from '../../types/deployment';
import { RenderTestProvider } from './RenderTestProvider';
import { OnPremDeploymentProvider } from './OnPremDeploymentProvider';

export class DeploymentManager {
  private testProvider: RenderTestProvider;
  private onPremProvider: OnPremDeploymentProvider;
  private currentTestDeployment: DeploymentStatus | null = null;

  constructor() {
    this.testProvider = new RenderTestProvider();
    this.onPremProvider = new OnPremDeploymentProvider();
  }

  getTestProvider(): RenderTestProvider {
    return this.testProvider;
  }

  getOnPremProvider(): OnPremDeploymentProvider {
    return this.onPremProvider;
  }

  async launchTestEnvironment(
    request: DeploymentRequest,
    onProgress?: (stage: DeploymentStage, log: string, status: DeploymentStatus) => void
  ): Promise<DeploymentStatus> {
    const deployment = await this.testProvider.createTestEnvironment(request, onProgress);
    this.currentTestDeployment = deployment;
    return deployment;
  }

  getCurrentTestDeployment(): DeploymentStatus | null {
    return this.currentTestDeployment;
  }

  async verifyHealth(id?: string): Promise<HealthStatus> {
    if (id) {
      return this.testProvider.healthCheck(id);
    }
    if (this.currentTestDeployment) {
      return this.testProvider.healthCheck(this.currentTestDeployment.id);
    }
    return {
      healthy: false,
      checkedAt: new Date().toISOString(),
      error: 'No active deployment to check'
    };
  }
}

export const deploymentManager = new DeploymentManager();
