import { OwaspCategory, SeverityLevel } from '../attacks/base.js';
export interface ScanFinding {
    probeId: string;
    probeName: string;
    category: OwaspCategory;
    severity: SeverityLevel;
    promptSent: string;
    responseReceived: string;
    isVulnerable: boolean;
    confidenceScore: number;
    matchedSignatures: string[];
    remediation: string;
    latencyMs: number;
}
export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export interface CategorySummary {
    category: OwaspCategory;
    name: string;
    total: number;
    passed: number;
    failed: number;
    complianceRate: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
}
export interface SecurityAuditReport {
    targetUrl: string;
    targetType: string;
    scannedAt: number;
    durationMs: number;
    totalProbesRun: number;
    passedProbes: number;
    vulnerabilitiesFound: number;
    complianceScore: number;
    letterGrade: LetterGrade;
    severityBreakdown: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    categoryBreakdown: Record<OwaspCategory, CategorySummary>;
    findings: ScanFinding[];
    recommendedHardening: string[];
}
export declare const CATEGORY_METADATA: Record<OwaspCategory, {
    label: string;
    description: string;
}>;
export declare function calculateGrade(score: number): LetterGrade;
export declare function compileAuditReport(targetUrl: string, targetType: string, findings: ScanFinding[], startTime: number): SecurityAuditReport;
export declare function generateHardeningRecommendations(findings: ScanFinding[]): string[];
//# sourceMappingURL=scoring.d.ts.map