import { 
  RequirementProfile, 
  ArchitecturePlan, 
  DeploymentTargetKey, 
  DeploymentProfileOption,
  ComponentCostBreakdown 
} from '../types/architecture';
import { IntermediateRepresentation } from '../types/floe';
import { costEngine } from './cost/CostEngine';

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

// Delegated Provider Cost Adapters via CostEngine
export function calculateOnPremProfile(req: RequirementProfile, isRec: boolean): DeploymentProfileOption {
  return costEngine.calculateProfile('on_prem', req, isRec);
}

export function calculateAwsProfile(req: RequirementProfile, isRec: boolean): DeploymentProfileOption {
  return costEngine.calculateProfile('aws', req, isRec);
}

export function calculateAzureProfile(req: RequirementProfile, isRec: boolean): DeploymentProfileOption {
  return costEngine.calculateProfile('azure', req, isRec);
}

export function calculateGcpProfile(req: RequirementProfile, isRec: boolean): DeploymentProfileOption {
  return costEngine.calculateProfile('gcp', req, isRec);
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
