import { 
  DeploymentRequest, 
  DeploymentStatus, 
  HealthStatus, 
  DeploymentStage,
  DeploymentProvider 
} from '../../types/deployment';
import { LocalMockProvider } from './LocalMockProvider';
import { RenderTestProvider } from './RenderTestProvider';
import { OnPremDeploymentProvider } from './OnPremDeploymentProvider';

export class DeploymentManager {
  private localMockProvider: LocalMockProvider;
  private renderProvider: RenderTestProvider;
  private onPremProvider: OnPremDeploymentProvider;
  private activeTestProvider: 'local_mock' | 'render' = 'local_mock';
  private currentTestDeployment: DeploymentStatus | null = null;

  constructor() {
    this.localMockProvider = new LocalMockProvider();
    this.renderProvider = new RenderTestProvider();
    this.onPremProvider = new OnPremDeploymentProvider();
  }

  setTestProvider(provider: 'local_mock' | 'render') {
    this.activeTestProvider = provider;
  }

  getTestProviderType(): 'local_mock' | 'render' {
    return this.activeTestProvider;
  }

  getLocalMockProvider(): LocalMockProvider {
    return this.localMockProvider;
  }

  getRenderProvider(): RenderTestProvider {
    return this.renderProvider;
  }

  getActiveTestProvider(): DeploymentProvider {
    return this.activeTestProvider === 'render' ? this.renderProvider : this.localMockProvider;
  }

  getOnPremProvider(): OnPremDeploymentProvider {
    return this.onPremProvider;
  }

  async launchTestEnvironment(
    request: DeploymentRequest,
    onProgress?: (stage: DeploymentStage, log: string, status: DeploymentStatus) => void,
    targetProvider?: 'local_mock' | 'render'
  ): Promise<DeploymentStatus> {
    const providerKey = targetProvider || this.activeTestProvider;
    const provider = providerKey === 'render' ? this.renderProvider : this.localMockProvider;
    const deployment = await provider.createTestEnvironment(request, onProgress);
    this.currentTestDeployment = deployment;
    return deployment;
  }

  getCurrentTestDeployment(): DeploymentStatus | null {
    return this.currentTestDeployment;
  }

  async verifyHealth(id?: string): Promise<HealthStatus> {
    const provider = this.getActiveTestProvider();
    if (id) {
      return provider.healthCheck(id);
    }
    if (this.currentTestDeployment) {
      return provider.healthCheck(this.currentTestDeployment.id);
    }
    return {
      healthy: false,
      checkedAt: new Date().toISOString(),
      error: 'No active deployment to check'
    };
  }
}

export const deploymentManager = new DeploymentManager();
