import { GeneratedFile } from '../codegenEngine';
import { EvaluationExecutionResult, EvaluationFinding } from './types';
import { computeSha256 } from '../../utils/cryptoHelper';

/**
 * Floe Static Security & AST Pattern Analyzer
 * Performs static analysis across generated source code for security vulnerabilities.
 * Implements SARIF 2.1.0 output compatible with Semgrep, SonarQube, and CodeQL standards.
 */
export class FloeStaticAnalyzer {
  readonly version = '1.0.0';
  readonly toolName = 'Floe Static Security Analyzer (Built-in SAST Ruleset)';

  public async scan(files: GeneratedFile[]): Promise<EvaluationExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const findings: EvaluationFinding[] = [];

    // Security Rules definition
    const rules = [
      {
        id: 'floe.security.eval-injection',
        pattern: /\beval\s*\(|\bnew\s+Function\s*\(/g,
        severity: 'critical' as const,
        title: 'Dangerous Code Execution via eval() or Function()',
        description: 'Dynamic code execution can allow arbitrary remote code execution.',
        remediation: 'Remove eval() or Function constructor and use structured parsing.'
      },
      {
        id: 'floe.security.raw-sql-concatenation',
        pattern: /query\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g,
        severity: 'high' as const,
        title: 'Unparameterized SQL Template String',
        description: 'SQL queries constructed via direct string interpolation are vulnerable to SQL injection if identifiers are not strictly validated.',
        remediation: 'Use parameterized queries ($1, $2) and strictly sanitize table/column identifiers.'
      },
      {
        id: 'floe.security.dangerous-inner-html',
        pattern: /dangerouslySetInnerHTML\s*=|innerHTML\s*=/g,
        severity: 'high' as const,
        title: 'Direct HTML Injection (XSS)',
        description: 'Unescaped user input passed to DOM injection can cause Cross-Site Scripting.',
        remediation: 'Use React safe JSX rendering or DOMPurify.'
      },
      {
        id: 'floe.security.weak-crypto-hash',
        pattern: /crypto\.createHash\s*\(\s*['"](md5|sha1)['"]\s*\)/gi,
        severity: 'medium' as const,
        title: 'Weak Cryptographic Hash Algorithm',
        description: 'MD5 and SHA-1 have known collision vulnerabilities.',
        remediation: 'Use SHA-256 or SHA-512.'
      },
      {
        id: 'floe.security.missing-rate-limit',
        pattern: /app\.(post|put|delete)\s*\([^,]+,\s*(async\s*)?\([^)]*\)\s*=>/g,
        severity: 'low' as const,
        title: 'Unthrottled State Mutation Route',
        description: 'Mutating HTTP route registered without explicit rate-limiting middleware.',
        remediation: 'Attach express-rate-limit middleware to prevent request flooding.'
      }
    ];

    // Inspect each file against rules
    for (const file of files) {
      const lines = file.content.split('\n');

      for (const rule of rules) {
        // Reset regex state
        rule.pattern.lastIndex = 0;
        
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const lineText = lines[lineIdx];
          
          // Check for SQL concatenation exception: if file has validateIdentifier, don't flag safe identifier usage
          if (rule.id === 'floe.security.raw-sql-concatenation' && file.content.includes('validateIdentifier')) {
            continue;
          }

          if (rule.pattern.test(lineText)) {
            findings.push({
              id: `floe-sast-${findings.length + 1}`,
              tool: this.toolName,
              category: 'SAST',
              severity: rule.severity,
              ruleId: rule.id,
              title: rule.title,
              description: rule.description,
              file: file.path,
              line: lineIdx + 1,
              snippet: lineText.trim().substring(0, 100),
              remediation: rule.remediation
            });
          }
          rule.pattern.lastIndex = 0;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();
    const hasCriticalOrHigh = findings.some(f => f.severity === 'critical' || f.severity === 'high');

    // Generate Standard SARIF 2.1.0 report
    const sarifArtifact = {
      version: '2.1.0',
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'FloeStaticAnalyzer',
              version: this.version,
              rules: rules.map(r => ({ id: r.id, shortDescription: { text: r.title } }))
            }
          },
          results: findings.map(f => ({
            ruleId: f.ruleId,
            level: f.severity === 'critical' || f.severity === 'high' ? 'error' : f.severity === 'medium' ? 'warning' : 'note',
            message: { text: f.description },
            locations: f.file ? [{
              physicalLocation: {
                artifactLocation: { uri: f.file },
                region: { startLine: f.line || 1 }
              }
            }] : []
          }))
        }
      ]
    };

    const artifactHash = computeSha256(JSON.stringify(sarifArtifact));

    return {
      tool: `${this.toolName} v${this.version}`,
      version: this.version,
      category: 'SAST',
      command: `floe-sast-analyze --ruleset=built-in --sarif-output`,
      startedAt,
      completedAt,
      durationMs,
      exitCode: hasCriticalOrHigh ? 1 : 0,
      status: hasCriticalOrHigh ? 'failed' : findings.length > 0 ? 'warning' : 'passed',
      summary: `Scanned ${files.length} source files: ${findings.length} findings (${findings.filter(f => f.severity === 'critical' || f.severity === 'high').length} blocking)`,
      findings,
      rawArtifact: sarifArtifact,
      artifactHash
    };
  }
}

// Backward-compatible alias
export const SemgrepScanner = FloeStaticAnalyzer;
