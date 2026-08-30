import { 
  DeploymentRequest, 
  DeploymentStatus, 
  HealthStatus, 
  DeploymentProvider 
} from '../../types/deployment';

export type { DeploymentRequest, DeploymentStatus, HealthStatus, DeploymentProvider };

export abstract class BaseDeploymentProvider implements DeploymentProvider {
  abstract readonly providerId: string;
  abstract readonly displayName: string;
  abstract readonly isTestProvider: boolean;

  abstract createTestEnvironment(input: DeploymentRequest): Promise<DeploymentStatus>;
  abstract getDeploymentStatus(id: string): Promise<DeploymentStatus>;
  abstract getLogs(id: string): Promise<string[]>;
  abstract healthCheck(id: string): Promise<HealthStatus>;
  abstract getUrl(id: string): Promise<string>;
  abstract destroy(id: string): Promise<void>;
}
