import { AttackProbe } from '../attacks/base.js';
import { ScanFinding } from './scoring.js';
export interface JudgeOracleOptions {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}
export declare class JudgeOracle {
    private apiKey?;
    private baseUrl;
    private model;
    constructor(options?: JudgeOracleOptions);
    evaluate(probe: AttackProbe, responseReceived: string, latencyMs: number): Promise<ScanFinding>;
}
//# sourceMappingURL=judge-oracle.d.ts.map