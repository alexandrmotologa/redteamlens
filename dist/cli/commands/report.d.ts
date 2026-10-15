export interface ReportCliOptions {
    format?: 'html' | 'markdown' | 'json';
    output?: string;
}
export declare function runReportCommand(inputFile: string, options: ReportCliOptions): Promise<void>;
//# sourceMappingURL=report.d.ts.map