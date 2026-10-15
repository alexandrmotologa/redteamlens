import { AttackProbe, OwaspCategory, SeverityLevel } from '../attacks/base.js';
export interface RedTeamLensConfig {
    target?: {
        url?: string;
        type?: 'demo' | 'generic' | 'openai' | 'anthropic';
        headers?: Record<string, string>;
        responsePath?: string;
        apiKey?: string;
        model?: string;
        hardened?: boolean;
    };
    customProbesDir?: string;
    customProbes?: AttackProbe[];
    canaries?: string[];
    categories?: OwaspCategory[];
    severities?: SeverityLevel[];
    concurrency?: number;
    thresholds?: {
        failOnGrade?: string;
        maxCritical?: number;
    };
    output?: {
        path?: string;
        format?: 'html' | 'markdown' | 'json' | 'sarif';
    };
}
export declare class ConfigLoader {
    static findConfigFile(customPath?: string): string | null;
    static loadConfig(customPath?: string): RedTeamLensConfig;
}
//# sourceMappingURL=config-loader.d.ts.map