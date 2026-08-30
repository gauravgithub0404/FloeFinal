import { 
  RequirementProfile, 
  ArchitecturePlan, 
  DeploymentTargetKey, 
  DeploymentProfileOption,
  ComponentCostBreakdown 
} from '../types/architecture';
import { IntermediateRepresentation } from '../types/floe';

export const DEFAULT_REQUIREMENT_PROFILE: RequirementProfile = {
  user_count_bracket: '51-250',
  total_registered_users: 250,
  concurrent_users: 30,
  growth_12_months_users: 500,
  growth_multiple: 2,
  criticality: 'internal_business',
  data_sensitivity: 'confidential',
  geographic_reach: 'india',
  availability: 'under_4_hours',
  internal_vs_external: 'internal_only'
};

// Provider Cost Adapters
export function calculateOnPremProfile(
  req: RequirementProfile,
  isRec: boolean
): DeploymentProfileOption {
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
    badge: isRec ? '⭐ Recommended for Sensitive Data' : 'Internal Infrastructure',
    is_recommended: isRec,
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

export function calculateAwsProfile(
  req: RequirementProfile,
  isRec: boolean
): DeploymentProfileOption {
  // Real deterministic AWS resource calculator based on user count & concurrency
  const isHighScale = req.total_registered_users > 1000 || req.concurrent_users > 100;
  const isMissionCritical = req.criticality === 'mission_critical' || req.availability === 'near_zero_downtime';

  let computeCost = isHighScale ? 4200 : 2100;
  let dbCost = isMissionCritical ? (isHighScale ? 5400 : 3600) : (isHighScale ? 2800 : 1400);
  let storageCost = 350;
  let backupCost = 250;
  let networkCost = 300;
  let monitoringCost = 200;

  const nominalTotal = computeCost + dbCost + storageCost + backupCost + networkCost + monitoringCost;
  const minCost = Math.round(nominalTotal * 0.88);
  const maxCost = Math.round(nominalTotal * 1.25);

  const breakdown: ComponentCostBreakdown[] = [
    { component: 'Compute (ECS/Fargate)', name: isHighScale ? 'AWS ECS Fargate (2 Tasks: 1vCPU, 2GB)' : 'AWS ECS Fargate (1 Task: 0.5vCPU, 1GB)', spec: isHighScale ? '2x Fargate Tasks auto-scaled' : '1x Container instance', monthly_cost_inr: computeCost },
    { component: 'Database (RDS)', name: isMissionCritical ? 'Amazon RDS for PostgreSQL (Multi-AZ db.t4g.medium)' : 'Amazon RDS for PostgreSQL (Single-AZ db.t4g.small)', spec: isMissionCritical ? 'Multi-AZ replication + Automated Backups' : 'Single-AZ managed instance', monthly_cost_inr: dbCost },
    { component: 'Storage (EFS/S3)', name: 'Amazon S3 & EBS GP3 Volumes', spec: `${isHighScale ? 150 : 50} GB encrypted storage`, monthly_cost_inr: storageCost },
    { component: 'Backups', name: 'AWS Backup automated snapshot policy', spec: '30-day point-in-time recovery (PITR)', monthly_cost_inr: backupCost },
    { component: 'Network & ALB', name: 'Application Load Balancer & Data Transfer', spec: 'HTTPS SSL termination + Egress', monthly_cost_inr: networkCost },
    { component: 'Monitoring', name: 'Amazon CloudWatch & Alarms', spec: 'Health metrics, logs & error alerts', monthly_cost_inr: monitoringCost }
  ];

  return {
    target_key: 'aws',
    display_name: 'Amazon Web Services (AWS)',
    subtitle: 'Fully managed cloud infrastructure with multi-AZ failover',
    badge: isRec ? '⭐ Recommended Cloud Solution' : 'Managed Cloud',
    is_recommended: isRec,
    why_recommended_bullet: 'Elastic scaling for expected 12-month growth, 99.95% SLA, and zero server maintenance.',
    why_not_bullet: 'Requires monthly cloud subscription and external network configuration.',
    estimated_monthly_cost_inr: {
      min: minCost,
      max: maxCost,
      nominal: nominalTotal
    },
    tco_monthly_inr: nominalTotal + 600, // minor devops maintenance
    compute_spec: {
      vCpu: isHighScale ? 2 : 1,
      ram_gb: isHighScale ? 4 : 2,
      instances: isHighScale ? 2 : 1,
      description: isHighScale ? '2x ECS Fargate Tasks (Load Balanced)' : '1x ECS Fargate Task (Container)'
    },
    database_spec: {
      engine: 'postgresql',
      tier: isMissionCritical ? 'Amazon RDS PostgreSQL db.t4g.medium (Multi-AZ)' : 'Amazon RDS PostgreSQL db.t4g.small (Single-AZ)',
      ram_gb: isHighScale ? 8 : 4,
      storage_gb: isHighScale ? 100 : 50,
      high_availability: isMissionCritical,
      license_cost_inr: 0 // Open source community license on RDS
    },
    storage_spec: {
      disk_gb: isHighScale ? 100 : 50,
      backup_retention_days: 30
    },
    breakdown,
    benefits: [
      'Automated point-in-time recovery & managed OS patches',
      'Built-in Application Load Balancer with free SSL certificates',
      'Effortlessly handles sudden concurrency spikes',
      '99.95% cloud service level agreement'
    ],
    limitations: [
      'Monthly recurring billing based on active compute/transfer',
      'Data resides in AWS Asia Pacific (Mumbai) region'
    ],
    assumptions: {
      registered_users: req.total_registered_users,
      concurrent_users: req.concurrent_users,
      monthly_requests: `~${(req.concurrent_users * 60000).toLocaleString('en-IN')}`,
      storage_gb: isHighScale ? 100 : 50,
      backup_frequency: 'Daily automated snapshot + 7-day PITR',
      region: 'ap-south-1 (Mumbai)'
    }
  };
}

export function calculateGcpProfile(
  req: RequirementProfile,
  isRec: boolean
): DeploymentProfileOption {
  const isHighScale = req.total_registered_users > 1000 || req.concurrent_users > 100;
  const isMissionCritical = req.criticality === 'mission_critical' || req.availability === 'near_zero_downtime';

  let computeCost = isHighScale ? 4200 : 2100;
  let dbCost = isMissionCritical ? (isHighScale ? 5400 : 3600) : (isHighScale ? 2900 : 1400);
  let storageCost = 350;
  let backupCost = 250;
  let networkCost = 300;
  let monitoringCost = 200;

  const nominalTotal = computeCost + dbCost + storageCost + backupCost + networkCost + monitoringCost;
  const minCost = Math.round(nominalTotal * 0.9);
  const maxCost = Math.round(nominalTotal * 1.25);

  const breakdown: ComponentCostBreakdown[] = [
    { component: 'Compute (Google Cloud Run)', name: isHighScale ? 'Cloud Run (2 Min Instances, 1vCPU 2GB)' : 'Cloud Run Autoscaled (1vCPU 2GB)', spec: 'Scale-to-zero serverless container', monthly_cost_inr: computeCost },
    { component: 'Database (Cloud SQL for PostgreSQL)', name: isMissionCritical ? 'Cloud SQL PostgreSQL (HA Regional, db-custom-2-7680)' : 'Cloud SQL PostgreSQL (db-f1-micro / db-custom-1-3840)', spec: 'Managed PostgreSQL 15 with automated failover', monthly_cost_inr: dbCost },
    { component: 'Google Cloud Storage', name: 'Cloud Storage Standard (asia-south1)', spec: `${isHighScale ? 150 : 50} GB Bucket`, monthly_cost_inr: storageCost },
    { component: 'Automated Snapshots', name: 'Cloud SQL Daily Backups & PITR', spec: 'Automated 30-day retention', monthly_cost_inr: backupCost },
    { component: 'Cloud Load Balancing', name: 'Global External HTTPS Load Balancer', spec: 'Managed SSL & DDoS protection', monthly_cost_inr: networkCost },
    { component: 'Google Cloud Operations', name: 'Cloud Logging & Cloud Monitoring', spec: 'Latency tracing, uptime checks & alerts', monthly_cost_inr: monitoringCost }
  ];

  return {
    target_key: 'gcp',
    display_name: 'Google Cloud Platform (GCP)',
    subtitle: 'High performance container hosting with Google Cloud Run & Cloud SQL',
    badge: isRec ? '⭐ Recommended Cloud Stack' : 'Serverless Cloud',
    is_recommended: isRec,
    why_recommended_bullet: 'Fast cold-starts on Cloud Run, low latency in Mumbai/Delhi regions, and high elasticity.',
    why_not_bullet: 'Cloud SQL entry baseline has a small fixed monthly compute reservation compared to self-hosted.',
    estimated_monthly_cost_inr: {
      min: minCost,
      max: maxCost,
      nominal: nominalTotal
    },
    tco_monthly_inr: nominalTotal + 600,
    compute_spec: {
      vCpu: isHighScale ? 2 : 1,
      ram_gb: isHighScale ? 4 : 2,
      instances: isHighScale ? 2 : 1,
      description: 'Google Cloud Run (Managed Containers in asia-south1)'
    },
    database_spec: {
      engine: 'postgresql',
      tier: isMissionCritical ? 'Cloud SQL PostgreSQL (db-custom-2-7680 Regional HA)' : 'Cloud SQL PostgreSQL 15 (Standard)',
      ram_gb: isHighScale ? 8 : 4,
      storage_gb: isHighScale ? 100 : 50,
      high_availability: isMissionCritical,
      license_cost_inr: 0
    },
    storage_spec: {
      disk_gb: isHighScale ? 100 : 50,
      backup_retention_days: 30
    },
    breakdown,
    benefits: [
      'Scale-to-zero compute with Google Cloud Run saves cost during idle hours',
      'Managed Cloud SQL with automated snapshots and zero OS maintenance',
      'Ultra-low latency across India (Mumbai asia-south1 & Delhi asia-south2)'
    ],
    limitations: [
      'Requires monthly cloud subscription and Google Cloud project setup'
    ],
    assumptions: {
      registered_users: req.total_registered_users,
      concurrent_users: req.concurrent_users,
      monthly_requests: `~${(req.concurrent_users * 55000).toLocaleString('en-IN')}`,
      storage_gb: isHighScale ? 100 : 50,
      backup_frequency: 'Daily automated snapshot + 7-day PITR',
      region: 'asia-south1 (Mumbai)'
    }
  };
}

export function calculateAzureProfile(
  req: RequirementProfile,
  isRec: boolean
): DeploymentProfileOption {
  const isHighScale = req.total_registered_users > 1000 || req.concurrent_users > 100;
  const isMissionCritical = req.criticality === 'mission_critical' || req.availability === 'near_zero_downtime';

  let computeCost = isHighScale ? 4500 : 2300;
  let dbCost = isMissionCritical ? (isHighScale ? 5800 : 3900) : (isHighScale ? 3100 : 1600);
  let storageCost = 380;
  let backupCost = 280;
  let networkCost = 320;
  let monitoringCost = 220;

  const nominalTotal = computeCost + dbCost + storageCost + backupCost + networkCost + monitoringCost;
  const minCost = Math.round(nominalTotal * 0.9);
  const maxCost = Math.round(nominalTotal * 1.28);

  const breakdown: ComponentCostBreakdown[] = [
    { component: 'Compute (App Service / ACA)', name: isHighScale ? 'Azure Container Apps (2 Replicas, 1vCPU 2GB)' : 'Azure Container Apps (B1 Standard Tier)', spec: 'Managed container compute', monthly_cost_inr: computeCost },
    { component: 'Database (Azure PostgreSQL)', name: isMissionCritical ? 'Azure Database for PostgreSQL Flexible Server (Zone-Redundant)' : 'Azure Database for PostgreSQL Flexible Server (Burstable B1ms)', spec: 'Managed PostgreSQL Flexible Server', monthly_cost_inr: dbCost },
    { component: 'Blob Storage', name: 'Azure Blob Storage (Hot Tier)', spec: `${isHighScale ? 150 : 50} GB LRS Storage`, monthly_cost_inr: storageCost },
    { component: 'Backup Vault', name: 'Azure Backup Recovery Services Vault', spec: 'Automated 30-day retention', monthly_cost_inr: backupCost },
    { component: 'Networking & Front Door', name: 'Azure App Gateway / Traffic Manager', spec: 'SSL & DDoS Protection', monthly_cost_inr: networkCost },
    { component: 'Application Insights', name: 'Azure Monitor & Log Analytics', spec: 'Telemetry, health & alert tracing', monthly_cost_inr: monitoringCost }
  ];

  return {
    target_key: 'azure',
    display_name: 'Microsoft Azure',
    subtitle: 'Enterprise Microsoft cloud with native Entra ID (Azure AD) synergy',
    badge: isRec ? '⭐ Recommended Microsoft Stack' : 'Enterprise Cloud',
    is_recommended: isRec,
    why_recommended_bullet: 'Seamless integration with Microsoft 365, Teams, and corporate Entra ID authentication.',
    why_not_bullet: 'Slightly higher nominal cost in Central India region than AWS for comparable baseline compute.',
    estimated_monthly_cost_inr: {
      min: minCost,
      max: maxCost,
      nominal: nominalTotal
    },
    tco_monthly_inr: nominalTotal + 650,
    compute_spec: {
      vCpu: isHighScale ? 2 : 1,
      ram_gb: isHighScale ? 4 : 2,
      instances: isHighScale ? 2 : 1,
      description: 'Azure Container Apps (Linux Node.js/Express Runtime)'
    },
    database_spec: {
      engine: 'postgresql',
      tier: isMissionCritical ? 'Azure PostgreSQL Flexible Server (Zone-Redundant D2s_v3)' : 'Azure PostgreSQL Flexible Server (Burstable B1ms)',
      ram_gb: isHighScale ? 8 : 4,
      storage_gb: isHighScale ? 100 : 50,
      high_availability: isMissionCritical,
      license_cost_inr: 0
    },
    storage_spec: {
      disk_gb: isHighScale ? 100 : 50,
      backup_retention_days: 30
    },
    breakdown,
    benefits: [
      'Native Single-Sign-On (SSO) with corporate Microsoft Entra ID',
      'Flexible Server with configurable maintenance windows',
      'Direct integration with Azure Monitor and Log Analytics'
    ],
    limitations: [
      'Slightly higher entry baseline pricing for Flexible Server tiers'
    ],
    assumptions: {
      registered_users: req.total_registered_users,
      concurrent_users: req.concurrent_users,
      monthly_requests: `~${(req.concurrent_users * 55000).toLocaleString('en-IN')}`,
      storage_gb: isHighScale ? 100 : 50,
      backup_frequency: 'Geo-redundant automated daily backup',
      region: 'Central India (Pune)'
    }
  };
}

// ----------------------------------------------------------------------------
// FLOE ARCHITECTURE PLANNER ENGINE
// ----------------------------------------------------------------------------
export function generateArchitecturePlan(
  ir: IntermediateRepresentation,
  userProfile?: Partial<RequirementProfile>
): ArchitecturePlan {
  const profile: RequirementProfile = {
    ...DEFAULT_REQUIREMENT_PROFILE,
    ...userProfile
  };

  // Determine recommendation logic
  // If development/demo OR internal data < 250 users with available laptop host: Recommend Laptop Private
  // If sensitive/regulated data + internal + existing server: Recommend On-Prem
  // If growth > 500 OR external users OR mission critical: Recommend AWS Cloud
  let recommendedTarget: DeploymentTargetKey = 'aws';
  let headline = '';
  let summary = '';
  let reasons: string[] = [];
  let tradeOff = '';

  if (profile.data_sensitivity === 'highly_sensitive' || profile.data_sensitivity === 'regulated' || profile.internal_vs_external === 'internal_only') {
    recommendedTarget = 'on_prem';
    headline = 'Recommended: Enterprise On-Premises Server';
    summary = `Your application stores ${profile.data_sensitivity} records for ${profile.total_registered_users} internal users and requires strict network containment behind your corporate firewall.`;
    reasons = [
      'Complete data sovereignty with zero external internet or cloud egress exposure',
      'Leverages internal bare-metal/VM compute with no per-user cloud license tax',
      'Direct integration with internal LDAP and corporate syslog monitoring'
    ];
    tradeOff = 'Requires internal IT maintenance and manual storage expansion monitoring.';
  } else if (profile.cloud_provider_preference === 'gcp' || (profile.geographic_reach === 'asia' && profile.availability === 'near_zero_downtime')) {
    recommendedTarget = 'gcp';
    headline = 'Recommended: Google Cloud Platform (GCP)';
    summary = `Your application is planned for ${profile.total_registered_users} to ${profile.growth_12_months_users} users with high elasticity requirements via Cloud Run and Cloud SQL.`;
    reasons = [
      `Scales from zero to your 12-month target of ${profile.growth_12_months_users} users with instant container spin-up`,
      'Fully managed Google Cloud SQL PostgreSQL 15 with automated daily snapshots & high availability',
      'Integrated Google Cloud Armor security & global CDN edge routing'
    ];
    tradeOff = 'Requires monthly cloud subscription expenditure starting around ₹3,800–₹5,200/month.';
  } else if (profile.geographic_reach === 'europe') {
    recommendedTarget = 'azure';
    headline = 'Recommended: Microsoft Azure Cloud';
    summary = `Your application is planned for ${profile.total_registered_users} to ${profile.growth_12_months_users} users with European regional compliance preferences.`;
    reasons = [
      'Scales to your 12-month target of ' + profile.growth_12_months_users + ' users seamlessly',
      'Azure Container Apps + Azure Database for PostgreSQL Flexible Server',
      'Enterprise Active Directory and regional compliance integration'
    ];
    tradeOff = 'Requires monthly cloud subscription expenditure.';
  } else {
    recommendedTarget = 'aws';
    headline = 'Recommended: Amazon Web Services (AWS)';
    summary = `Your application is expected to scale from ${profile.total_registered_users} to ${profile.growth_12_months_users} users with ${profile.availability === 'near_zero_downtime' ? 'high-availability (99.95%)' : 'standard business'} uptime requirements.`;
    reasons = [
      `Effortlessly scales to your 12-month target of ${profile.growth_12_months_users} users without architecture redesign`,
      'Fully managed Amazon RDS PostgreSQL with automated snapshots, daily backups, and point-in-time recovery',
      'Zero server maintenance or OS patching overhead for your team'
    ];
    tradeOff = 'Requires monthly cloud subscription expenditure starting around ₹4,000–₹5,500/month.';
  }

  // Why not alternatives
  const whyNot: Record<string, string> = {
    on_prem: recommendedTarget === 'on_prem'
      ? 'Currently selected as primary recommendation.'
      : 'Requires existing corporate server hardware and internal DevOps maintenance overhead.',
    aws: recommendedTarget === 'aws'
      ? 'Currently selected as primary recommendation.'
      : 'Incurs monthly cloud subscription fees when your internal host satisfies data residency requirements.',
    azure: recommendedTarget === 'azure'
      ? 'Currently selected as primary recommendation.'
      : 'AWS provides slightly lower baseline cost in India region, though Azure remains a viable enterprise alternative.',
    gcp: recommendedTarget === 'gcp'
      ? 'Currently selected as primary recommendation.'
      : 'GCP Cloud Run is highly elastic, though AWS RDS offers broader managed ecosystem alignment for your team.'
  };

  const profiles: Record<DeploymentTargetKey, DeploymentProfileOption> = {
    on_prem: calculateOnPremProfile(profile, recommendedTarget === 'on_prem'),
    aws: calculateAwsProfile(profile, recommendedTarget === 'aws'),
    azure: calculateAzureProfile(profile, recommendedTarget === 'azure'),
    gcp: calculateGcpProfile(profile, recommendedTarget === 'gcp')
  };

  return {
    domain: ir.domain,
    app_name: ir.name,
    requirement_profile: profile,
    recommended_database: {
      engine: 'postgresql',
      version: '15-alpine',
      reason: [
        'Transactional business data with relational entity integrity',
        'Strong ACID consistency for state machine transitions',
        'Rich JSONB support for unstructured notes & metadata',
        'Zero license cost (PostgreSQL Community Open-Source)'
      ]
    },
    recommended_target: recommendedTarget,
    recommendation_rationale: {
      headline,
      summary,
      reasons,
      trade_off: tradeOff,
      why_not_alternatives: whyNot
    },
    profiles,
    selected_target: recommendedTarget
  };
}
