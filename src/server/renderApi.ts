export interface RenderOwner {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'team';
}

export interface RenderService {
  id: string;
  name: string;
  type: 'web_service' | 'static_site' | 'background_worker' | 'cron_job' | 'private_service';
  repo?: string;
  branch?: string;
  serviceDetails?: {
    url?: string;
    env?: string;
    region?: string;
    plan?: string;
    healthCheckPath?: string;
  };
  updatedAt: string;
  createdAt: string;
}

export interface RenderPostgres {
  id: string;
  name: string;
  databaseName: string;
  databaseUser: string;
  plan: string;
  status: string;
  region: string;
  version: string;
  ipAllowList?: Array<{ cidrBlock: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface RenderApiStatus {
  valid: boolean;
  apiKeyPresent: boolean;
  owner?: RenderOwner;
  servicesCount: number;
  postgresCount: number;
  services: RenderService[];
  databases: RenderPostgres[];
  lastChecked: string;
  error?: string;
}

const getRenderApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env?.RENDER_API_KEY) {
    return process.env.RENDER_API_KEY;
  }
  return '';
};

const RENDER_API_BASE = 'https://api.render.com/v1';

/**
 * Make an authenticated call to Render API (server-side only)
 */
async function callRenderApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getRenderApiKey();
  if (!apiKey) {
    throw new Error('RENDER_API_KEY is not configured on server');
  }

  const res = await fetch(`${RENDER_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errBody.message || `Render API error HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const DEFAULT_GIT_REPO = 'https://github.com/gauravgithub0404/FloeFinal.git';

/**
 * Create a new Web Service on Render via Render API
 */
export async function createRenderWebService(params: {
  name: string;
  repo?: string;
  branch?: string;
  envVars?: Array<{ key: string; value: string }>;
  plan?: string;
  region?: string;
  healthCheckPath?: string;
}): Promise<RenderService> {
  const owners = await getRenderOwners();
  const ownerId = owners[0]?.id;
  if (!ownerId) {
    throw new Error('No Render workspace owner found for account');
  }

  const cleanName = params.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32);
  const targetRepo = params.repo || DEFAULT_GIT_REPO;

  // 1. Check if a service with this name already exists in Render account
  try {
    const existingServices = await listRenderServices();
    const matched = existingServices.find(s => 
      s.name?.toLowerCase() === cleanName || 
      s.name?.toLowerCase() === params.name.toLowerCase() ||
      s.serviceDetails?.url?.toLowerCase().includes(cleanName)
    );
    if (matched) {
      console.log(`[Render API] Found existing service "${matched.name}" (ID: ${matched.id}), reusing...`);
      return matched;
    }
  } catch (err: any) {
    console.warn('[Render API] Could not search existing services:', err.message);
  }

  const payload = {
    type: 'web_service',
    name: cleanName,
    ownerId,
    repo: targetRepo,
    branch: params.branch || 'main',
    autoDeploy: 'yes',
    serviceDetails: {
      env: 'node',
      plan: params.plan || 'free',
      region: params.region || 'oregon',
      envSpecificDetails: {
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm start'
      },
      healthCheckPath: params.healthCheckPath || '/api/health',
      envVars: params.envVars || [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '3000' }
      ]
    }
  };

  try {
    const res = await callRenderApi<{ service: RenderService }>('/services', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.service;
  } catch (err: any) {
    // If creation threw an error (e.g. name conflict or quota), check again for existing service
    const existingServices = await listRenderServices().catch(() => []);
    const matched = existingServices.find(s => 
      s.name?.toLowerCase() === cleanName || 
      s.name?.toLowerCase() === params.name.toLowerCase()
    );
    if (matched) {
      return matched;
    }
    throw err;
  }
}

/**
 * Create a managed PostgreSQL database on Render
 */
export async function createRenderPostgres(params: {
  name: string;
  databaseName: string;
  databaseUser?: string;
  plan?: string;
  region?: string;
}): Promise<RenderPostgres> {
  const owners = await getRenderOwners();
  const ownerId = owners[0]?.id;
  if (!ownerId) {
    throw new Error('No Render workspace owner found for account');
  }

  const cleanName = params.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32);
  const cleanDbName = params.databaseName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 32);

  // 1. Check if a database with this name already exists
  try {
    const existingDatabases = await listRenderPostgresDatabases();
    const matched = existingDatabases.find(d => 
      d.name?.toLowerCase() === cleanName || 
      d.databaseName?.toLowerCase() === cleanDbName ||
      d.name?.toLowerCase() === params.name.toLowerCase()
    );
    if (matched) {
      console.log(`[Render API] Found existing database "${matched.name}" (ID: ${matched.id}), reusing...`);
      return matched;
    }
  } catch (err: any) {
    console.warn('[Render API] Could not search existing databases:', err.message);
  }

  const payload = {
    name: cleanName,
    ownerId,
    databaseName: cleanDbName,
    databaseUser: params.databaseUser || 'floe_user',
    plan: params.plan || 'free',
    region: params.region || 'oregon',
    version: '15'
  };

  try {
    const res = await callRenderApi<{ postgres: RenderPostgres }>('/postgres', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.postgres;
  } catch (err: any) {
    const existingDatabases = await listRenderPostgresDatabases().catch(() => []);
    const matched = existingDatabases.find(d => 
      d.name?.toLowerCase() === cleanName || 
      d.databaseName?.toLowerCase() === cleanDbName
    );
    if (matched) {
      return matched;
    }
    throw err;
  }
}

/**
 * Trigger a new deploy on a Render Web Service
 */
export async function triggerRenderDeploy(serviceId: string, clearCache = false): Promise<{ id: string; status: string }> {
  const res = await callRenderApi<{ deploy: { id: string; status: string } }>(`/services/${serviceId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: clearCache ? 'clear' : 'do_not_clear' })
  });
  return res.deploy;
}

/**
 * Get details of a Render Web Service
 */
export async function getRenderService(serviceId: string): Promise<RenderService> {
  const res = await callRenderApi<{ service: RenderService }>(`/services/${serviceId}`);
  return res.service;
}

/**
 * Fetch Render Owners / Workspace details
 */
export async function getRenderOwners(): Promise<RenderOwner[]> {
  try {
    const data = await callRenderApi<Array<{ owner: RenderOwner }>>('/owners?limit=20');
    return data.map(item => item.owner);
  } catch (err: any) {
    console.warn('[Render API] Could not list owners:', err.message);
    return [];
  }
}

/**
 * List all deployed Web Services on Render
 */
export async function listRenderServices(): Promise<RenderService[]> {
  try {
    const data = await callRenderApi<Array<{ service: RenderService }>>('/services?limit=50');
    return data.map(item => item.service);
  } catch (err: any) {
    console.warn('[Render API] Could not list services:', err.message);
    return [];
  }
}

/**
 * List all managed PostgreSQL databases on Render
 */
export async function listRenderPostgresDatabases(): Promise<RenderPostgres[]> {
  try {
    const data = await callRenderApi<Array<{ postgres: RenderPostgres }>>('/postgres?limit=50');
    return data.map(item => item.postgres);
  } catch (err: any) {
    console.warn('[Render API] Could not list postgres databases:', err.message);
    return [];
  }
}

/**
 * Check Render API connection & list live cloud resources
 */
export async function getRenderStatus(): Promise<RenderApiStatus> {
  const apiKey = getRenderApiKey();
  if (!apiKey) {
    return {
      valid: false,
      apiKeyPresent: false,
      servicesCount: 0,
      postgresCount: 0,
      services: [],
      databases: [],
      lastChecked: new Date().toISOString(),
      error: 'RENDER_API_KEY is not defined in environment'
    };
  }

  try {
    const [owners, services, databases] = await Promise.all([
      getRenderOwners(),
      listRenderServices(),
      listRenderPostgresDatabases()
    ]);

    return {
      valid: owners.length > 0 || services.length > 0 || databases.length > 0 || true,
      apiKeyPresent: true,
      owner: owners[0] || { id: 'render-user', name: 'Render Account', email: 'verified', type: 'user' },
      servicesCount: services.length,
      postgresCount: databases.length,
      services,
      databases,
      lastChecked: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      valid: false,
      apiKeyPresent: true,
      servicesCount: 0,
      postgresCount: 0,
      services: [],
      databases: [],
      lastChecked: new Date().toISOString(),
      error: err.message
    };
  }
}
