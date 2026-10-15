import { AttackProbe, OwaspCategory, SeverityLevel } from './base.js';
export declare function getCorpusDirectory(): string;
export declare function loadAllProbes(): AttackProbe[];
export interface ProbeFilterOptions {
    categories?: OwaspCategory[];
    severities?: SeverityLevel[];
    limit?: number;
    customProbes?: AttackProbe[];
}
export declare function getFilteredProbes(options?: ProbeFilterOptions): AttackProbe[];
//# sourceMappingURL=corpus-loader.d.ts.map