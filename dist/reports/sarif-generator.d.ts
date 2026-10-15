import { SecurityAuditReport } from '../core/evaluation/scoring.js';
export interface SarifRule {
    id: string;
    name: string;
    shortDescription: {
        text: string;
    };
    fullDescription: {
        text: string;
    };
    helpUri: string;
    properties: {
        category: string;
        precision: string;
        problem: {
            severity: string;
        };
    };
}
export interface SarifResult {
    ruleId: string;
    level: 'error' | 'warning' | 'note';
    message: {
        text: string;
    };
    locations: Array<{
        physicalLocation: {
            artifactLocation: {
                uri: string;
            };
            region: {
                startLine: number;
            };
        };
    }>;
    properties: {
        matchedSignatures: string[];
        remediationAdvice: string;
        promptSent: string;
        responseReceived: string;
    };
}
export declare class SarifReportGenerator {
    static generate(report: SecurityAuditReport): string;
}
//# sourceMappingURL=sarif-generator.d.ts.map