import { SecurityAuditReport, ScanFinding } from './scoring.js';
export interface AuditComparisonResult {
    baselineUrl: string;
    comparisonUrl: string;
    baselineScore: number;
    comparisonScore: number;
    scoreDelta: number;
    baselineGrade: string;
    comparisonGrade: string;
    gradeImproved: boolean;
    gradeRegressed: boolean;
    resolvedVulnerabilities: ScanFinding[];
    newRegressions: ScanFinding[];
    persistingVulnerabilities: ScanFinding[];
    latencyDeltaMs: number;
    isRegressed: boolean;
}
export declare class AuditComparator {
    static compare(baseline: SecurityAuditReport, comparison: SecurityAuditReport): AuditComparisonResult;
    static toMarkdown(result: AuditComparisonResult): string;
}
//# sourceMappingURL=comparator.d.ts.map