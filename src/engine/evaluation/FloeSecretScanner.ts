import { GeneratedFile } from '../codegenEngine';
import { EvaluationExecutionResult, EvaluationFinding } from './types';
import { computeSha256 } from '../../utils/cryptoHelper';

/**
 * Floe Secret & High-Entropy Scanner
 * Scans generated source files for leaked API keys, credentials, tokens, and private keys.
 */
export class FloeSecretScanner {
  readonly version = '1.0.0';
  readonly toolName = 'Floe Secret & High-Entropy Scanner';

  public async scan(files: GeneratedFile[]): Promise<EvaluationExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const findings: EvaluationFinding[] = [];

    const secretRules = [
      {
        id: 'floe.secret.private-key',
        pattern: /-----BEGIN (RSA|OPENSSH|EC|DSA|PGP|PRIVATE) KEY-----/g,
        severity: 'critical' as const,
        title: 'Unencrypted Private Key in Code',
        description: 'Hardcoded private key detected in repository files.',
        remediation: 'Remove private key immediately and rotate credentials.'
      },
      {
        id: 'floe.secret.render-api-key',
        pattern: /\brnd_[a-zA-Z0-9]{24,}\b/g,
        severity: 'critical' as const,
        title: 'Hardcoded Render API Key',
        description: 'Plaintext Render API token detected in source code.',
        remediation: 'Load RENDER_API_KEY from environment variable only.'
      },
      {
        id: 'floe.secret.aws-access-key',
        pattern: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
        severity: 'critical' as const,
        title: 'AWS Access Key ID',
        description: 'Hardcoded AWS cloud credential detected.',
        remediation: 'Use IAM roles or AWS_ACCESS_KEY_ID environment variable.'
      },
      {
        id: 'floe.secret.github-pat',
        pattern: /\bghp_[a-zA-Z0-9]{36}\b/g,
        severity: 'critical' as const,
        title: 'GitHub Personal Access Token',
        description: 'Leaked GitHub PAT found in repository.',
        remediation: 'Revoke token on GitHub and configure GitHub Actions secret.'
      },
      {
        id: 'floe.secret.postgres-connection-string',
        pattern: /postgres(ql)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_#@!%^&*()-]+@[a-zA-Z0-9.-]+:\d+\/[a-zA-Z0-9_-]+/g,
        severity: 'high' as const,
        title: 'Database Password in Connection URI',
        description: 'Plaintext PostgreSQL credential found embedded in source code.',
        remediation: 'Pass DATABASE_URL dynamically via environment variables.'
      },
      {
        id: 'floe.secret.jwt-secret-hardcoded',
        pattern: /(jwt\.sign|jwt\.verify)\s*\([^,]+,\s*['"][a-zA-Z0-9_-]{4,30}['"]\s*\)/g,
        severity: 'high' as const,
        title: 'Hardcoded JWT Signing Secret',
        description: 'Predictable or hardcoded string literal used as JWT signing secret.',
        remediation: 'Use process.env.JWT_SECRET.'
      }
    ];

    for (const file of files) {
      const lines = file.content.split('\n');

      for (const rule of secretRules) {
        rule.pattern.lastIndex = 0;

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const lineText = lines[lineIdx];
          
          // Allow environment template files like .env.example with placeholder or empty values
          if (file.path.endsWith('.env.example') && (lineText.includes('=""') || lineText.includes('="MY_') || lineText.includes('USER:PASSWORD') || lineText.includes('change_me') || lineText.includes('your-'))) {
            continue;
          }

          if (rule.pattern.test(lineText)) {
            findings.push({
              id: `floe-secret-${findings.length + 1}`,
              tool: this.toolName,
              category: 'Secret',
              severity: rule.severity,
              ruleId: rule.id,
              title: rule.title,
              description: rule.description,
              file: file.path,
              line: lineIdx + 1,
              snippet: lineText.trim().substring(0, 100).replace(/[a-zA-Z0-9_]{12,}/g, '***REDACTED***'),
              remediation: rule.remediation
            });
          }
          rule.pattern.lastIndex = 0;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();
    const hasCritical = findings.some(f => f.severity === 'critical' || f.severity === 'high');

    const artifact = {
      tool: 'FloeSecretScanner',
      version: this.version,
      scannedFilesCount: files.length,
      leaksDetected: findings.length,
      findings
    };

    const artifactHash = computeSha256(JSON.stringify(artifact));

    return {
      tool: `${this.toolName} v${this.version}`,
      version: this.version,
      category: 'Secrets',
      command: `floe-secret-detect --source=. --format=json`,
      startedAt,
      completedAt,
      durationMs,
      exitCode: hasCritical ? 1 : 0,
      status: hasCritical ? 'failed' : 'passed',
      summary: `Scanned ${files.length} source files: ${findings.length} secrets detected (${hasCritical ? 'BLOCKING LEAK' : 'Clean'})`,
      findings,
      rawArtifact: artifact,
      artifactHash
    };
  }
}

// Backward-compatible alias
export const GitleaksScanner = FloeSecretScanner;
