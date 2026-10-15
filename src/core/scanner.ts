import { AttackProbe, OwaspCategory, SeverityLevel, MutatedProbe } from './attacks/base.js';
import { getFilteredProbes, loadAllProbes } from './attacks/corpus-loader.js';
import { TargetConnector } from './targets/base.js';
import { HeuristicOracle } from './evaluation/heuristic-oracle.js';
import { JudgeOracle } from './evaluation/judge-oracle.js';
import { compileAuditReport, ScanFinding, SecurityAuditReport } from './evaluation/scoring.js';
import { CipherMutator, CipherType } from './mutators/cipher-mutator.js';
import { LanguageMutator, LanguageFramingType } from './mutators/language-mutator.js';
import { DelimiterMutator, DelimiterType } from './mutators/delimiter-mutator.js';

export interface ScanOptions {
  target: TargetConnector;
  categories?: OwaspCategory[];
  severities?: SeverityLevel[];
  limit?: number;
  concurrency?: number;
  mutations?: {
    cipher?: CipherType[];
    language?: LanguageFramingType[];
    delimiter?: DelimiterType[];
  };
  useJudgeOracle?: boolean;
  judgeApiKey?: string;
  onProbeStart?: (probe: AttackProbe, index: number, total: number) => void;
  onProbeComplete?: (finding: ScanFinding, index: number, total: number) => void;
}

export class ScannerEngine {
  private target: TargetConnector;
  private concurrency: number;
  private judgeOracle?: JudgeOracle;

  constructor(options: { target: TargetConnector; concurrency?: number; useJudge?: boolean; judgeApiKey?: string }) {
    this.target = options.target;
    this.concurrency = options.concurrency || 5;
    if (options.useJudge) {
      this.judgeOracle = new JudgeOracle({ apiKey: options.judgeApiKey });
    }
  }

  async runScan(options: ScanOptions): Promise<SecurityAuditReport> {
    const startTime = Date.now();
    let probes: AttackProbe[] = getFilteredProbes({
      categories: options.categories,
      severities: options.severities,
      limit: options.limit
    });

    // Apply mutations if requested
    if (options.mutations) {
      const mutatedList: AttackProbe[] = [];
      for (const p of probes) {
        mutatedList.push(p);

        if (options.mutations.cipher) {
          for (const cType of options.mutations.cipher) {
            mutatedList.push(CipherMutator.mutate(p, cType));
          }
        }

        if (options.mutations.language) {
          for (const lType of options.mutations.language) {
            mutatedList.push(LanguageMutator.mutate(p, lType));
          }
        }

        if (options.mutations.delimiter) {
          for (const dType of options.mutations.delimiter) {
            mutatedList.push(DelimiterMutator.mutate(p, dType));
          }
        }
      }
      probes = mutatedList;
    }

    const total = probes.length;
    const findings: ScanFinding[] = new Array(total);
    let currentIndex = 0;
    let completedCount = 0;

    // Worker pool for concurrency
    const worker = async () => {
      while (currentIndex < total) {
        const index = currentIndex++;
        const probe = probes[index];

        if (options.onProbeStart) {
          options.onProbeStart(probe, index, total);
        }

        try {
          const res = await this.target.sendPrompt(probe.promptPayload);
          let finding: ScanFinding;

          if (this.judgeOracle) {
            finding = await this.judgeOracle.evaluate(probe, res.response, res.latencyMs);
          } else {
            finding = HeuristicOracle.evaluate(probe, res.response, res.latencyMs);
          }

          findings[index] = finding;
        } catch (err: any) {
          findings[index] = {
            probeId: probe.id,
            probeName: probe.name,
            category: probe.category,
            severity: probe.severity,
            promptSent: probe.promptPayload,
            responseReceived: `[Error communicating with target: ${err.message}]`,
            isVulnerable: false,
            confidenceScore: 0.1,
            matchedSignatures: [],
            remediation: probe.remediationAdvice,
            latencyMs: 0
          };
        }

        completedCount++;
        if (options.onProbeComplete) {
          options.onProbeComplete(findings[index], completedCount, total);
        }
      }
    };

    const workers = [];
    const poolSize = Math.min(this.concurrency, total);
    for (let i = 0; i < poolSize; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    return compileAuditReport(
      this.target.targetUrl,
      this.target.name,
      findings.filter(Boolean),
      startTime
    );
  }
}
