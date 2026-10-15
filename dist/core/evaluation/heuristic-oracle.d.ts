import { AttackProbe } from '../attacks/base.js';
import { ScanFinding } from './scoring.js';
export interface EvaluationResult {
    isVulnerable: boolean;
    confidenceScore: number;
    matchedSignatures: string[];
    refusalDetected: boolean;
}
export declare class HeuristicOracle {
    private static DEFAULT_REFUSAL_MARKERS;
    static evaluate(probe: AttackProbe, responseReceived: string, latencyMs: number): ScanFinding;
    private static isEchoRefusal;
    private static escapeRegex;
}
//# sourceMappingURL=heuristic-oracle.d.ts.map