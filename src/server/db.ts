import { Pool } from 'pg';

export interface DbStatus {
  connected: boolean;
  database: string;
  host: string;
  user: string;
  port: number;
  ssl: boolean;
  latencyMs: number;
  tables: { name: string; rowCount: number }[];
  totalRecords: number;
  lastChecked: string;
  error?: string;
}

const getDatabaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return 'postgresql://floe_f3rk_user:e0ONewONkgwy8m9MW0iTtpt1oMlmLoxT@dpg-da9r244s728c73eivetg-a.oregon-postgres.render.com/floe_f3rk';
};

const DATABASE_URL = getDatabaseUrl();

let pool: Pool | null = null;
let isInitialized = false;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected client error:', err.message);
    });
  }
  return pool;
}

/**
 * Initialize PostgreSQL tables for Floe Enterprise Platform
 */
export async function initDatabase(): Promise<boolean> {
  if (isInitialized) return true;

  const client = getPool();
  try {
    console.log('[PostgreSQL] Connecting to Render PostgreSQL database (floe_f3rk)...');
    
    // Create necessary tables for full persistence
    await client.query(`
      -- Applications table
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        ir_json JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Deployments table
      CREATE TABLE IF NOT EXISTS deployments (
        id VARCHAR(100) PRIMARY KEY,
        app_id VARCHAR(100) NOT NULL,
        app_name VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        provider_id VARCHAR(50) NOT NULL,
        stage VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        service_url TEXT,
        health_endpoint TEXT,
        health_status VARCHAR(50),
        status_code INT,
        latency_ms INT,
        git_repo_url TEXT,
        git_commit_sha TEXT,
        is_free_tier BOOLEAN DEFAULT TRUE,
        resource_limits JSONB,
        expires_at TIMESTAMPTZ,
        error_message TEXT,
        logs JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Deployment event history
      CREATE TABLE IF NOT EXISTS deployment_events (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR(100) REFERENCES deployments(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      -- Test environments registration
      CREATE TABLE IF NOT EXISTS test_environments (
        id VARCHAR(100) PRIMARY KEY,
        domain VARCHAR(100) UNIQUE NOT NULL,
        db_name VARCHAR(100) NOT NULL,
        service_url TEXT NOT NULL,
        health_url TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Pipeline runs
      CREATE TABLE IF NOT EXISTS pipeline_runs (
        id VARCHAR(100) PRIMARY KEY,
        app_id VARCHAR(100) NOT NULL,
        app_name VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        ir_version VARCHAR(50) DEFAULT '1.0.0',
        commit_sha VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        current_stage_id VARCHAR(50),
        policy_config JSONB,
        governance_decision JSONB,
        artifact JSONB,
        evidence_store JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Pipeline stages breakdown
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id SERIAL PRIMARY KEY,
        pipeline_id VARCHAR(100) REFERENCES pipeline_runs(id) ON DELETE CASCADE,
        stage_id VARCHAR(50) NOT NULL,
        stage_number INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        summary TEXT,
        duration_ms INT,
        logs JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Evaluation results & audit artifacts
      CREATE TABLE IF NOT EXISTS evaluation_results (
        id VARCHAR(100) PRIMARY KEY,
        pipeline_id VARCHAR(100) NOT NULL,
        stage_id VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        hash VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Multi-tenant App records for generated domain entities
      CREATE TABLE IF NOT EXISTS app_records (
        id VARCHAR(100) PRIMARY KEY,
        domain VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for rapid querying
      CREATE INDEX IF NOT EXISTS idx_deployments_app_id ON deployments(app_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_domain ON deployments(domain);
      CREATE INDEX IF NOT EXISTS idx_pipeline_runs_app_id ON pipeline_runs(app_id);
      CREATE INDEX IF NOT EXISTS idx_app_records_domain_entity ON app_records(domain, entity);
    `);

    isInitialized = true;
    console.log('[PostgreSQL] ✓ Schema migration complete. 8 persistence tables ready on Render PostgreSQL.');
    return true;
  } catch (err: any) {
    console.error('[PostgreSQL] ❌ Failed to initialize database:', err.message);
    return false;
  }
}

/**
 * Get live Database Health & Status
 */
export async function getDbStatus(): Promise<DbStatus> {
  const start = Date.now();
  const pool = getPool();

  try {
    const res = await pool.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        version() as version
    `);

    const latencyMs = Date.now() - start;
    const dbInfo = res.rows[0];

    // Check table counts
    const tablesRes = await pool.query(`
      SELECT 
        table_name,
        (xpath('/row/cnt/text()', xml_count))[1]::text::int as count
      FROM (
        SELECT 
          table_name, 
          query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ) t
      ORDER BY table_name;
    `).catch(async () => {
      // Fallback query if XML functions restricted
      const tablesList = ['applications', 'deployments', 'deployment_events', 'test_environments', 'pipeline_runs', 'pipeline_stages', 'evaluation_results', 'app_records'];
      const counts: { table_name: string; count: number }[] = [];
      for (const t of tablesList) {
        try {
          const r = await pool.query(`SELECT count(*)::int as count FROM ${t}`);
          counts.push({ table_name: t, count: r.rows[0]?.count || 0 });
        } catch {
          counts.push({ table_name: t, count: 0 });
        }
      }
      return { rows: counts };
    });

    const tables = (tablesRes.rows || []).map((r: any) => ({
      name: r.table_name,
      rowCount: Number(r.count) || 0
    }));

    const totalRecords = tables.reduce((acc, t) => acc + t.rowCount, 0);

    return {
      connected: true,
      database: dbInfo?.database || 'floe_f3rk',
      host: 'dpg-da9r244s728c73eivetg-a.oregon-postgres.render.com',
      user: dbInfo?.user || 'floe_f3rk_user',
      port: Number(dbInfo?.server_port) || 5432,
      ssl: true,
      latencyMs,
      tables,
      totalRecords,
      lastChecked: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      connected: false,
      database: 'floe_f3rk',
      host: 'dpg-da9r244s728c73eivetg-a.oregon-postgres.render.com',
      user: 'floe_f3rk_user',
      port: 5432,
      ssl: true,
      latencyMs: Date.now() - start,
      tables: [],
      totalRecords: 0,
      lastChecked: new Date().toISOString(),
      error: err.message
    };
  }
}

/**
 * Save deployment to PostgreSQL
 */
export async function saveDeploymentToDb(dep: any): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(
      `
      INSERT INTO deployments (
        id, app_id, app_name, domain, provider_id, stage, status,
        service_url, health_endpoint, health_status, status_code, latency_ms,
        git_repo_url, git_commit_sha, is_free_tier, resource_limits, expires_at,
        error_message, logs, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        stage = EXCLUDED.stage,
        status = EXCLUDED.status,
        service_url = EXCLUDED.service_url,
        health_endpoint = EXCLUDED.health_endpoint,
        health_status = EXCLUDED.health_status,
        status_code = EXCLUDED.status_code,
        latency_ms = EXCLUDED.latency_ms,
        error_message = EXCLUDED.error_message,
        logs = EXCLUDED.logs,
        updated_at = NOW()
      `,
      [
        dep.id,
        dep.appId || 'app-default',
        dep.appName || 'Business Application',
        dep.domain || 'app',
        dep.providerId || 'render',
        dep.stage || 'validating_ir',
        dep.status || 'building',
        dep.serviceUrl || '',
        dep.healthEndpoint || '',
        dep.healthStatus || 'checking',
        dep.statusCode || null,
        dep.latencyMs || null,
        dep.gitRepoUrl || '',
        dep.gitCommitSha || '',
        dep.isFreeTier !== false,
        JSON.stringify(dep.resourceLimits || {}),
        dep.expiresAt || null,
        dep.errorMessage || null,
        JSON.stringify(dep.logs || [])
      ]
    );
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not persist deployment to DB:', err.message);
  }
}

/**
 * Get all deployments from PostgreSQL
 */
export async function getDeploymentsFromDb(): Promise<any[]> {
  const pool = getPool();
  try {
    const res = await pool.query('SELECT * FROM deployments ORDER BY updated_at DESC LIMIT 50');
    return res.rows.map(r => ({
      id: r.id,
      appId: r.app_id,
      appName: r.app_name,
      domain: r.domain,
      providerId: r.provider_id,
      stage: r.stage,
      status: r.status,
      serviceUrl: r.service_url,
      healthEndpoint: r.health_endpoint,
      healthStatus: r.health_status,
      statusCode: r.status_code,
      latencyMs: r.latency_ms,
      gitRepoUrl: r.git_repo_url,
      gitCommitSha: r.git_commit_sha,
      isFreeTier: r.is_free_tier,
      resourceLimits: r.resource_limits,
      expiresAt: r.expires_at,
      errorMessage: r.error_message,
      logs: r.logs || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not read deployments from DB:', err.message);
    return [];
  }
}

/**
 * Save pipeline run to PostgreSQL
 */
export async function savePipelineRunToDb(run: any): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(
      `
      INSERT INTO pipeline_runs (
        id, app_id, app_name, domain, ir_version, commit_sha, status,
        current_stage_id, policy_config, governance_decision, artifact, evidence_store, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        current_stage_id = EXCLUDED.current_stage_id,
        governance_decision = EXCLUDED.governance_decision,
        artifact = EXCLUDED.artifact,
        evidence_store = EXCLUDED.evidence_store,
        updated_at = NOW()
      `,
      [
        run.id,
        run.appId || 'app-default',
        run.appName || 'Business Application',
        run.domain || 'enterprise',
        run.irVersion || '1.0.0',
        run.commitSha || '',
        run.status || 'running',
        run.currentStageId || 'stage_1_spec',
        JSON.stringify(run.policyConfig || {}),
        JSON.stringify(run.governanceDecision || {}),
        JSON.stringify(run.artifact || {}),
        JSON.stringify(run.evidenceStore || {})
      ]
    );
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not persist pipeline run to DB:', err.message);
  }
}

/**
 * Get pipeline runs from PostgreSQL
 */
export async function getPipelineRunsFromDb(): Promise<any[]> {
  const pool = getPool();
  try {
    const res = await pool.query('SELECT * FROM pipeline_runs ORDER BY updated_at DESC LIMIT 50');
    return res.rows.map(r => ({
      id: r.id,
      appId: r.app_id,
      appName: r.app_name,
      domain: r.domain,
      irVersion: r.ir_version,
      commitSha: r.commit_sha,
      status: r.status,
      currentStageId: r.current_stage_id,
      policyConfig: r.policy_config,
      governanceDecision: r.governance_decision,
      artifact: r.artifact,
      evidenceStore: r.evidence_store,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not read pipeline runs from DB:', err.message);
    return [];
  }
}

/**
 * Save app record to PostgreSQL
 */
export async function saveAppRecordToDb(domain: string, entity: string, record: any): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(
      `
      INSERT INTO app_records (id, domain, entity, data, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        status = EXCLUDED.status,
        updated_at = NOW()
      `,
      [
        record.id,
        domain.toLowerCase(),
        entity.toLowerCase(),
        JSON.stringify(record),
        record.status || 'SUBMITTED'
      ]
    );
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not persist app record to DB:', err.message);
  }
}

/**
 * Save application metadata and IR to PostgreSQL
 */
export async function saveAppToDb(app: { id: string; name: string; domain: string; ir: any }): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(
      `
      INSERT INTO applications (id, name, domain, ir_json, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        domain = EXCLUDED.domain,
        ir_json = EXCLUDED.ir_json,
        updated_at = NOW()
      `,
      [
        app.id,
        app.name,
        app.domain.toLowerCase(),
        JSON.stringify(app.ir)
      ]
    );
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not persist application to DB:', err.message);
  }
}

/**
 * Get application by domain or ID from PostgreSQL
 */
export async function getAppFromDb(domainOrId: string): Promise<any | null> {
  const pool = getPool();
  try {
    const res = await pool.query(
      'SELECT * FROM applications WHERE id = $1 OR LOWER(domain) = $2 LIMIT 1',
      [domainOrId, domainOrId.toLowerCase()]
    );
    if (res.rows.length > 0) {
      const r = res.rows[0];
      return {
        id: r.id,
        name: r.name,
        domain: r.domain,
        ir: r.ir_json,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    }
    return null;
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not read application from DB:', err.message);
    return null;
  }
}

/**
 * Get all applications from PostgreSQL
 */
export async function getAllAppsFromDb(): Promise<any[]> {
  const pool = getPool();
  try {
    const res = await pool.query('SELECT * FROM applications ORDER BY updated_at DESC LIMIT 50');
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      ir: r.ir_json,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not read applications from DB:', err.message);
    return [];
  }
}

/**
 * Get app records from PostgreSQL
 */
export async function getAppRecordsFromDb(domain: string, entity: string): Promise<any[]> {
  const pool = getPool();
  try {
    const res = await pool.query(
      'SELECT data FROM app_records WHERE domain = $1 AND entity = $2 ORDER BY created_at ASC',
      [domain.toLowerCase(), entity.toLowerCase()]
    );
    return res.rows.map(r => r.data);
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not read app records from DB:', err.message);
    return [];
  }
}
