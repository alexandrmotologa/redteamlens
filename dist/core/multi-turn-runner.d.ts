import { MultiTurnChain } from './attacks/base.js';
import { TargetConnector } from './targets/base.js';
import { ScanFinding } from './evaluation/scoring.js';
export interface MultiTurnRunnerOptions {
    chains?: MultiTurnChain[];
    onChainStart?: (chain: MultiTurnChain, index: number, total: number) => void;
    onChainComplete?: (finding: ScanFinding, index: number, total: number) => void;
}
export declare class MultiTurnRunner {
    private target;
    private chains;
    constructor(target: TargetConnector, chains?: MultiTurnChain[]);
    runChains(options?: MultiTurnRunnerOptions): Promise<ScanFinding[]>;
    private executeChain;
}
//# sourceMappingURL=multi-turn-runner.d.ts.map