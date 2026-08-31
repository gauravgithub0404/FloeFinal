import { RequirementProfile, DeploymentProfileOption, ComponentCostBreakdown } from '../../types/architecture';

export interface PricingDimensions {
  vCpu: number;
  ramGb: number;
  storageGb: number;
  monthlyBandwidthGb: number;
  dbType: 'postgresql' | 'mysql' | 'sqlserver';
  dbHighAvailability: boolean;
  backupRetentionDays: number;
  totalUsers: number;
  concurrentUsers: number;
}

export interface PricingAdapter {
  readonly providerId: string;
  readonly displayName: string;
  readonly region: string;
  calculateCost(req: RequirementProfile, isRecommended: boolean): DeploymentProfileOption;
}

/**
 * AWS Pricing Provider Adapter
 * Calculates AWS resources (Fargate/ECS, RDS Aurora PostgreSQL, S3, Application Load Balancer, CloudWatch)
 */
export class AwsPricingAdapter implements PricingAdapter {
  readonly providerId = 'aws';
  readonly displayName = 'Amazon Web Services (AWS)';
  readonly region = 'ap-south-1 (Mumbai)';

  // USD to INR conversion base
  private readonly usdToInr = 83.5;

  calculateCost(req: RequirementProfile, isRecommended: boolean): DeploymentProfileOption {
    const isHighScale = req.total_registered_users > 1000 || req.concurrent_users > 100;
    const isMissionCritical = req.criticality === 'mission_critical' || req.availability === 'near_zero_downtime';

    const computeVCpu = isHighScale ? 4 : 2;
    const computeRamGb = isHighScale ? 8 : 4;
    const dbRamGb = isHighScale ? 16 : 8;
    const storageGb = Math.max(50, Math.ceil(req.total_registered_users * 0.4));

    // Dynamic component breakdown
    const computeCostInr = isHighScale ? 4200 : 2100;
    const dbCostInr = isMissionCritical ? (isHighScale ? 5400 : 3600) : (isHighScale ? 2800 : 1400);
    const storageCostInr = Math.ceil(storageGb * 3.5);
    const albCostInr = 1850;
    const cloudWatchCostInr = 450;

    const nominalCost = computeCostInr + dbCostInr + storageCostInr + albCostInr + cloudWatchCostInr;
    const tcoCost = Math.round(nominalCost * 1.35); // includes support, egress, snapshots

    const breakdown: ComponentCostBreakdown[] = [
      {
        component: 'Container Compute',
        name: 'AWS Fargate / ECS Container Service',
        spec: `${computeVCpu} vCPU, ${computeRamGb} GB RAM (Auto-scaling 1-4 tasks)`,
        monthly_cost_inr: computeCostInr
      },
      {
        component: 'Managed Database',
        name: isMissionCritical ? 'Amazon RDS Aurora PostgreSQL (Multi-AZ)' : 'Amazon RDS PostgreSQL 15 (Single-AZ)',
        spec: `${dbRamGb} GB RAM, db.t4g.${isHighScale ? 'large' : 'medium'}, gp3 SSD`,
        monthly_cost_inr: dbCostInr
      },
      {
        component: 'Object & Backup Storage',
        name: 'Amazon S3 Standard + Automated Snapshots',
        spec: `${storageGb} GB encrypted volume, 30-day retention`,
        monthly_cost_inr: storageCostInr
      },
      {
        component: 'Networking & Routing',
        name: 'AWS Application Load Balancer (ALB) + Route 53',
        spec: 'SSL termination, HTTP/2, health probe checks',
        monthly_cost_inr: albCostInr
      },
      {
        component: 'Observability & Security',
        name: 'AWS CloudWatch Metrics & AWS Secrets Manager',
        spec: 'Log aggregation, alarms, automated secret rotation',
        monthly_cost_inr: cloudWatchCostInr
      }
    ];

    return {
      target_key: 'aws',
      display_name: 'Amazon Web Services (AWS)',
      subtitle: 'Managed ECS Fargate + Amazon RDS PostgreSQL 15',
      badge: isRecommended ? '⭐ Top Recommended Cloud' : 'Enterprise Standard',
      is_recommended: isRecommended,
      why_recommended_bullet: 'Elastic container scaling, managed Aurora HA failover, and high Indian datacenter footprint.',
      why_not_bullet: 'Higher variable network egress and multi-AZ database monthly commitment.',
      estimated_monthly_cost_inr: {
        min: Math.round(nominalCost * 0.85),
        max: Math.round(nominalCost * 1.3),
        nominal: nominalCost
      },
      tco_monthly_inr: tcoCost,
      compute_spec: {
        vCpu: computeVCpu,
        ram_gb: computeRamGb,
        instances: isHighScale ? 2 : 1,
        description: 'AWS Fargate serverless containers running in ap-south-1 (Mumbai)'
      },
      database_spec: {
        engine: 'postgresql',
        tier: isMissionCritical ? 'Amazon RDS PostgreSQL Multi-AZ (db.t4g.medium)' : 'Amazon RDS PostgreSQL Single-AZ',
        ram_gb: dbRamGb,
        storage_gb: storageGb,
        high_availability: isMissionCritical,
        license_cost_inr: 0
      },
      storage_spec: {
        disk_gb: storageGb,
        backup_retention_days: 30
      },
      breakdown,
      benefits: [
        '99.95% SLA with automated Aurora failover',
        'Serverless compute scales to zero during off-peak hours',
        'Direct VPC private networking between API and Database',
        'Native KMS encryption at rest and in transit'
      ],
      limitations: [
        'Monthly recurring AWS bill required',
        'Requires IAM permission boundary governance'
      ],
      assumptions: {
        registered_users: req.total_registered_users,
        concurrent_users: req.concurrent_users,
        monthly_requests: `~${(req.concurrent_users * 50000).toLocaleString('en-IN')}`,
        storage_gb: storageGb,
        backup_frequency: 'Daily automated snapshot with point-in-time recovery',
        region: 'AWS ap-south-1 (Mumbai, India)'
      }
    };
  }
}

/**
 * Azure Pricing Provider Adapter
 * Calculates Azure Container Apps, Azure Database for PostgreSQL Flexible Server, Azure Storage
 */
export class AzurePricingAdapter implements PricingAdapter {
  readonly providerId = 'azure';
  readonly displayName = 'Microsoft Azure Cloud';
  readonly region = 'Central India (Pune)';

  calculateCost(req: RequirementProfile, isRecommended: boolean): DeploymentProfileOption {
    const isHighScale = req.total_registered_users > 1000 || req.concurrent_users > 100;
    const isMissionCritical = req.criticality === 'mission_critical' || req.availability === 'near_zero_downtime';

    const computeVCpu = isHighScale ? 4 : 2;
    const computeRamGb = isHighScale ? 8 : 4;
    const dbRamGb = isHighScale ? 16 : 8;
    const storageGb = Math.max(50, Math.ceil(req.total_registered_users * 0.4));

    const computeCostInr = isHighScale ? 3900 : 1950;
    const dbCostInr = isMissionCritical ? (isHighScale ? 5100 : 3400) : (isHighScale ? 2600 : 1350);
    const storageCostInr = Math.ceil(storageGb * 3.2);
    const appGatewayCostInr = 1750;
    const monitorCostInr = 400;

    const nominalCost = computeCostInr + dbCostInr + storageCostInr + appGatewayCostInr + monitorCostInr;
    const tcoCost = Math.round(nominalCost * 1.32);

    const breakdown: ComponentCostBreakdown[] = [
      {
        component: 'Container Apps',
        name: 'Azure Container Apps (Serverless Microservices)',
        spec: `${computeVCpu} vCPU, ${computeRamGb} GB RAM, Dapr enabled`,
        monthly_cost_inr: computeCostInr
      },
      {
        component: 'Managed PostgreSQL',
        name: 'Azure Database for PostgreSQL Flexible Server',
        spec: `General Purpose D2ds_v5, ${dbRamGb} GB RAM, Zone-redundant HA`,
        monthly_cost_inr: dbCostInr
      },
      {
        component: 'Storage & Blob',
        name: 'Azure Blob Storage (Hot Tier) + Backup Vault',
        spec: `${storageGb} GB ZRS replication`,
        monthly_cost_inr: storageCostInr
      },
      {
        component: 'Network & Ingress',
        name: 'Azure Front Door / Container App Ingress',
        spec: 'Built-in HTTPS TLS 1.3 certificate management',
        monthly_cost_inr: appGatewayCostInr
      },
      {
        component: 'Monitoring & Key Vault',
        name: 'Azure Monitor Log Analytics & Azure Key Vault',
        spec: 'Application Insights telemetry and hardware secrets',
        monthly_cost_inr: monitorCostInr
      }
    ];

    return {
      target_key: 'azure',
      display_name: 'Microsoft Azure Cloud',
      subtitle: 'Azure Container Apps + Azure Database for PostgreSQL',
      badge: isRecommended ? '⭐ Recommended for Microsoft 365 / Entra ID' : 'Enterprise Cloud',
      is_recommended: isRecommended,
      why_recommended_bullet: 'Seamless enterprise Active Directory (Entra ID) single sign-on integration and Central India residency.',
      why_not_bullet: 'Slightly higher cold-start container latency during cold scale-up.',
      estimated_monthly_cost_inr: {
        min: Math.round(nominalCost * 0.85),
        max: Math.round(nominalCost * 1.28),
        nominal: nominalCost
      },
      tco_monthly_inr: tcoCost,
      compute_spec: {
        vCpu: computeVCpu,
        ram_gb: computeRamGb,
        instances: isHighScale ? 2 : 1,
        description: 'Azure Container Apps in Central India (Pune)'
      },
      database_spec: {
        engine: 'postgresql',
        tier: 'Azure PostgreSQL Flexible Server (General Purpose)',
        ram_gb: dbRamGb,
        storage_gb: storageGb,
        high_availability: isMissionCritical,
        license_cost_inr: 0
      },
      storage_spec: {
        disk_gb: storageGb,
        backup_retention_days: 30
      },
      breakdown,
      benefits: [
        'Deep single sign-on with corporate Microsoft Entra ID',
        'PostgreSQL Flexible Server with maintenance window controls',
        'Native integration with Power BI and Azure Synapse',
        'Central India (Pune) & South India (Chennai) compliance'
      ],
      limitations: [
        'Requires Azure Subscription setup and Resource Group management'
      ],
      assumptions: {
        registered_users: req.total_registered_users,
        concurrent_users: req.concurrent_users,
        monthly_requests: `~${(req.concurrent_users * 50000).toLocaleString('en-IN')}`,
        storage_gb: storageGb,
        backup_frequency: 'Daily geo-redundant snapshot',
        region: 'Azure Central India (Pune)'
      }
    };
  }
}

/**
 * GCP Pricing Provider Adapter
 * Calculates Google Cloud Run, Cloud SQL for PostgreSQL, Cloud Storage
 */
export class GcpPricingAdapter implements PricingAdapter {
  readonly providerId = 'gcp';
  readonly displayName = 'Google Cloud Platform (GCP)';
  readonly region = 'asia-south1 (Mumbai)';

  calculateCost(req: RequirementProfile, isRecommended: boolean): DeploymentProfileOption {
    const isHighScale = req.total_registered_users > 1000 || req.concurrent_users > 100;
    const isMissionCritical = req.criticality === 'mission_critical' || req.availability === 'near_zero_downtime';

    const computeVCpu = isHighScale ? 4 : 2;
    const computeRamGb = isHighScale ? 8 : 4;
    const dbRamGb = isHighScale ? 16 : 8;
    const storageGb = Math.max(50, Math.ceil(req.total_registered_users * 0.4));

    const computeCostInr = isHighScale ? 3600 : 1800;
    const dbCostInr = isMissionCritical ? (isHighScale ? 4900 : 3300) : (isHighScale ? 2500 : 1300);
    const storageCostInr = Math.ceil(storageGb * 3.0);
    const loadBalancerCostInr = 1600;
    const cloudLoggingCostInr = 350;

    const nominalCost = computeCostInr + dbCostInr + storageCostInr + loadBalancerCostInr + cloudLoggingCostInr;
    const tcoCost = Math.round(nominalCost * 1.3);

    const breakdown: ComponentCostBreakdown[] = [
      {
        component: 'Serverless Compute',
        name: 'Google Cloud Run (Fully Managed)',
        spec: `${computeVCpu} vCPU, ${computeRamGb} GB RAM, fast scale-to-zero`,
        monthly_cost_inr: computeCostInr
      },
      {
        component: 'Managed PostgreSQL',
        name: 'Cloud SQL for PostgreSQL 15 Enterprise',
        spec: `db-custom-${computeVCpu}-${dbRamGb}, High Availability Regional`,
        monthly_cost_inr: dbCostInr
      },
      {
        component: 'Cloud Storage',
        name: 'Google Cloud Storage (Standard Dual-Region)',
        spec: `${storageGb} GB bucket with object versioning`,
        monthly_cost_inr: storageCostInr
      },
      {
        component: 'Cloud Load Balancing',
        name: 'Global External HTTPS Cloud Load Balancer',
        spec: 'Google Cloud Armor DDoS and WAF protection',
        monthly_cost_inr: loadBalancerCostInr
      },
      {
        component: 'Cloud Logging & Trace',
        name: 'Google Cloud Operations Suite & Secret Manager',
        spec: 'Structured JSON log streaming and trace metrics',
        monthly_cost_inr: cloudLoggingCostInr
      }
    ];

    return {
      target_key: 'gcp',
      display_name: 'Google Cloud Platform (GCP)',
      subtitle: 'Google Cloud Run + Cloud SQL for PostgreSQL 15',
      badge: isRecommended ? '⭐ Recommended for Fast Serverless Scale' : 'Developer Favorite',
      is_recommended: isRecommended,
      why_recommended_bullet: 'Fastest container cold start times on Cloud Run with high developer velocity and Google global network.',
      why_not_bullet: 'Requires GCP project and service account permission provisioning.',
      estimated_monthly_cost_inr: {
        min: Math.round(nominalCost * 0.85),
        max: Math.round(nominalCost * 1.25),
        nominal: nominalCost
      },
      tco_monthly_inr: tcoCost,
      compute_spec: {
        vCpu: computeVCpu,
        ram_gb: computeRamGb,
        instances: isHighScale ? 2 : 1,
        description: 'Google Cloud Run in asia-south1 (Mumbai)'
      },
      database_spec: {
        engine: 'postgresql',
        tier: 'Cloud SQL for PostgreSQL 15 Enterprise Edition',
        ram_gb: dbRamGb,
        storage_gb: storageGb,
        high_availability: isMissionCritical,
        license_cost_inr: 0
      },
      storage_spec: {
        disk_gb: storageGb,
        backup_retention_days: 30
      },
      breakdown,
      benefits: [
        'Sub-second container startup and zero maintenance overhead',
        'Automatic SSL and custom domain mapping included',
        'Cloud SQL automatic backup and maintenance patching',
        'India Mumbai & Delhi region data sovereignty'
      ],
      limitations: [
        'Cloud SQL regional HA doubles database instance base rate'
      ],
      assumptions: {
        registered_users: req.total_registered_users,
        concurrent_users: req.concurrent_users,
        monthly_requests: `~${(req.concurrent_users * 50000).toLocaleString('en-IN')}`,
        storage_gb: storageGb,
        backup_frequency: 'Daily automated Cloud SQL backup',
        region: 'GCP asia-south1 (Mumbai)'
      }
    };
  }
}

/**
 * On-Premises Cost Model Adapter
 * Calculates hardware amortization, storage volume, and operational maintenance for self-hosted bare metal or private hypervisors
 */
export class OnPremPricingAdapter implements PricingAdapter {
  readonly providerId = 'on_prem';
  readonly displayName = 'Enterprise On-Premises Server';
  readonly region = 'Corporate Datacenter / Private LAN';

  calculateCost(req: RequirementProfile, isRecommended: boolean): DeploymentProfileOption {
    const breakdown: ComponentCostBreakdown[] = [
      { component: 'Compute', name: 'Existing Linux Bare-Metal/VM', spec: '4 vCPU, 16 GB RAM allocated', monthly_cost_inr: 0, is_free_included: true },
      { component: 'Database', name: 'PostgreSQL 15 Community Container', spec: 'Self-hosted with WAL archiving', monthly_cost_inr: 0, is_free_included: true },
      { component: 'Network & Proxy', name: 'Nginx Reverse Proxy / HAProxy', spec: 'SSL Termination & Rate limiting', monthly_cost_inr: 0, is_free_included: true },
      { component: 'Storage & NAS', name: 'SAN/NAS Mount for Backups', spec: '100 GB SSD volume', monthly_cost_inr: 500 },
      { component: 'Admin & Maintenance', name: 'Team Operational Overhead', spec: 'Estimated patch/backup admin time', monthly_cost_inr: 750 }
    ];

    return {
      target_key: 'on_prem',
      display_name: 'Enterprise On-Premises Server',
      subtitle: 'Dedicated internal server behind company firewall',
      badge: isRecommended ? '⭐ Recommended for Sensitive Data' : 'Internal Infrastructure',
      is_recommended: isRecommended,
      why_recommended_bullet: 'Full data residency compliance for confidential records, utilizing existing corporate compute.',
      why_not_bullet: 'Requires in-house DevOps maintenance and lacks managed cloud multi-AZ elasticity.',
      estimated_monthly_cost_inr: {
        min: 800,
        max: 1500,
        nominal: 1250
      },
      tco_monthly_inr: 3200,
      compute_spec: {
        vCpu: 4,
        ram_gb: 16,
        instances: 1,
        description: 'Dedicated Linux/VM Hypervisor host on internal LAN'
      },
      database_spec: {
        engine: 'postgresql',
        tier: 'Self-Hosted PostgreSQL 15 Cluster',
        ram_gb: 8,
        storage_gb: 100,
        high_availability: req.availability === 'near_zero_downtime',
        license_cost_inr: 0
      },
      storage_spec: {
        disk_gb: 100,
        backup_retention_days: 30
      },
      breakdown,
      benefits: [
        'Zero external cloud egress or public exposure',
        'No recurring per-core or license subscription fees',
        'Direct integration with internal LDAP/Active Directory',
        'Strict corporate data residency compliance'
      ],
      limitations: [
        'Internal hardware provisioning and network routing needed',
        'Team must monitor disk capacity and hardware wear'
      ],
      assumptions: {
        registered_users: req.total_registered_users,
        concurrent_users: req.concurrent_users,
        monthly_requests: `~${(req.concurrent_users * 50000).toLocaleString('en-IN')}`,
        storage_gb: 100,
        backup_frequency: 'Daily automated NAS backup',
        region: 'Corporate Datacenter / Mumbai'
      }
    };
  }
}

/**
 * CostEngine
 * Pluggable orchestrator that coordinates cloud pricing adapters for dynamic infrastructure estimation
 */
export class CostEngine {
  private static instance: CostEngine;
  private adapters: Map<string, PricingAdapter> = new Map();

  private constructor() {
    this.registerAdapter(new AwsPricingAdapter());
    this.registerAdapter(new AzurePricingAdapter());
    this.registerAdapter(new GcpPricingAdapter());
    this.registerAdapter(new OnPremPricingAdapter());
  }

  public static getInstance(): CostEngine {
    if (!CostEngine.instance) {
      CostEngine.instance = new CostEngine();
    }
    return CostEngine.instance;
  }

  public registerAdapter(adapter: PricingAdapter) {
    this.adapters.set(adapter.providerId, adapter);
  }

  public getAdapter(providerId: string): PricingAdapter | undefined {
    return this.adapters.get(providerId);
  }

  public getAllAdapters(): PricingAdapter[] {
    return Array.from(this.adapters.values());
  }

  public calculateProfile(providerId: string, req: RequirementProfile, isRecommended: boolean): DeploymentProfileOption {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`No pricing adapter registered for provider: ${providerId}`);
    }
    return adapter.calculateCost(req, isRecommended);
  }
}

export const costEngine = CostEngine.getInstance();
