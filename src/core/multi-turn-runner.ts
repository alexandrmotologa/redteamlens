import { MultiTurnChain, AttackProbe } from './attacks/base.js';
import { TargetConnector } from './targets/base.js';
import { HeuristicOracle } from './evaluation/heuristic-oracle.js';
import { ScanFinding } from './evaluation/scoring.js';
import { MULTI_TURN_CHAINS } from './attacks/multi-turn-corpus.js';

export interface MultiTurnRunnerOptions {
  chains?: MultiTurnChain[];
  onChainStart?: (chain: MultiTurnChain, index: number, total: number) => void;
  onChainComplete?: (finding: ScanFinding, index: number, total: number) => void;
}

export class MultiTurnRunner {
  private target: TargetConnector;
  private chains: MultiTurnChain[];

  constructor(target: TargetConnector, chains?: MultiTurnChain[]) {
    this.target = target;
    this.chains = chains || MULTI_TURN_CHAINS;
  }

  async runChains(options: MultiTurnRunnerOptions = {}): Promise<ScanFinding[]> {
    const chainsToRun = options.chains || this.chains;
    const findings: ScanFinding[] = [];
    const total = chainsToRun.length;

    for (let i = 0; i < total; i++) {
      const chain = chainsToRun[i];
      if (options.onChainStart) {
        options.onChainStart(chain, i, total);
      }

      const finding = await this.executeChain(chain);
      findings.push(finding);

      if (options.onChainComplete) {
        options.onChainComplete(finding, i + 1, total);
      }
    }

    return findings;
  }

  private async executeChain(chain: MultiTurnChain): Promise<ScanFinding> {
    const startTime = Date.now();
    let lastResponse = '';
    let totalLatency = 0;

    // Convert MultiTurnChain into an AttackProbe for evaluation compatibility
    const syntheticProbe: AttackProbe = {
      id: chain.id,
      name: chain.name,
      category: chain.category,
      severity: chain.severity,
      promptPayload: chain.turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n'),
      expectedRefusalMarkers: chain.expectedRefusalMarkers,
      vulnerabilitySignatures: chain.vulnerabilitySignatures,
      description: chain.description,
      remediationAdvice: chain.remediationAdvice
    };

    try {
      if (this.target.sendConversation) {
        // Send stateful messages array
        const res = await this.target.sendConversation(chain.turns);
        lastResponse = res.response;
        totalLatency = res.latencyMs;
      } else {
        // Fallback: send cumulative conversation transcript as single prompt
        const combined = chain.turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
        const res = await this.target.sendPrompt(combined);
        lastResponse = res.response;
        totalLatency = res.latencyMs;
      }

      const finding = HeuristicOracle.evaluate(syntheticProbe, lastResponse, totalLatency || (Date.now() - startTime));
      return finding;
    } catch (err: any) {
      return {
        probeId: chain.id,
        probeName: chain.name,
        category: chain.category,
        severity: chain.severity,
        promptSent: syntheticProbe.promptPayload,
        responseReceived: `[Multi-Turn Error: ${err.message}]`,
        isVulnerable: false,
        confidenceScore: 0.1,
        matchedSignatures: [],
        remediation: chain.remediationAdvice,
        latencyMs: Date.now() - startTime
      };
    }
  }
}
