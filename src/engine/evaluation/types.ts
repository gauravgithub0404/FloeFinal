export interface EvaluationExecutionResult {
  tool: string;
  version: string;
  category: 'SAST' | 'Secrets' | 'Dependencies' | 'Container' | 'SBOM' | 'DAST' | 'Functional';
  command: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  exitCode: number;
  status: 'passed' | 'failed' | 'warning';
  summary: string;
  findings: EvaluationFinding[];
  rawArtifact: any;
  artifactHash: string;
}

export interface EvaluationFinding {
  id: string;
  tool: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  ruleId: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  column?: number;
  snippet?: string;
  url?: string;
  remediation?: string;
}
