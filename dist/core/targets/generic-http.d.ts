import { TargetConnector, TargetResponse } from './base.js';
export interface GenericHttpTargetOptions {
    id?: string;
    name?: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
    bodyTemplate?: string | Record<string, any>;
    responsePath?: string;
    timeoutMs?: number;
}
export declare class GenericHttpTarget implements TargetConnector {
    id: string;
    name: string;
    targetUrl: string;
    private method;
    private headers;
    private bodyTemplate;
    private responsePath;
    private timeoutMs;
    constructor(options: GenericHttpTargetOptions);
    sendPrompt(prompt: string): Promise<TargetResponse>;
    private extractValueByPath;
}
//# sourceMappingURL=generic-http.d.ts.map