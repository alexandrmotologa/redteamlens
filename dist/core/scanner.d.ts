import { AttackProbe, OwaspCategory, SeverityLevel } from './attacks/base.js';
import { TargetConnector } from './targets/base.js';
import { ScanFinding, SecurityAuditReport } from './evaluation/scoring.js';
import { CipherType } from './mutators/cipher-mutator.js';
import { LanguageFramingType } from './mutators/language-mutator.js';
import { DelimiterType } from './mutators/delimiter-mutator.js';
export interface ScanOptions {
    target: TargetConnector;
    categories?: OwaspCategory[];
    severities?: SeverityLevel[];
    limit?: number;
    customProbes?: AttackProbe[];
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
export declare class ScannerEngine {
    private target;
    private concurrency;
    private judgeOracle?;
    constructor(options: {
        target: TargetConnector;
        concurrency?: number;
        useJudge?: boolean;
        judgeApiKey?: string;
    });
    runScan(options: ScanOptions): Promise<SecurityAuditReport>;
}
//# sourceMappingURL=scanner.d.ts.map