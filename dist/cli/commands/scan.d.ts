export interface ScanCliOptions {
    config?: string;
    target?: string;
    demo?: boolean;
    hardened?: boolean;
    openai?: boolean;
    apiKey?: string;
    model?: string;
    categories?: string;
    severities?: string;
    limit?: string;
    concurrency?: string;
    output?: string;
    format?: 'html' | 'markdown' | 'json' | 'sarif';
    badge?: string;
    multiTurn?: boolean;
    failOnGrade?: string;
    maxCritical?: string;
}
export declare function runScanCommand(options: ScanCliOptions): Promise<void>;
//# sourceMappingURL=scan.d.ts.map