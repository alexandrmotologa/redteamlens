import { TargetConnector, TargetResponse } from './base.js';
export interface AnthropicClientOptions {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
}
export declare class AnthropicClientTarget implements TargetConnector {
    id: string;
    name: string;
    targetUrl: string;
    private apiKey;
    private model;
    private systemPrompt?;
    private maxTokens;
    constructor(options: AnthropicClientOptions);
    sendPrompt(prompt: string): Promise<TargetResponse>;
}
//# sourceMappingURL=anthropic-client.d.ts.map