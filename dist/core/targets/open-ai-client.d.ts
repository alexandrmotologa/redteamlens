import { TargetConnector, TargetResponse } from './base.js';
export interface OpenAiClientOptions {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
}
export declare class OpenAiClientTarget implements TargetConnector {
    id: string;
    name: string;
    targetUrl: string;
    private apiKey;
    private model;
    private systemPrompt?;
    private temperature;
    constructor(options: OpenAiClientOptions);
    sendConversation(messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>): Promise<TargetResponse>;
    sendPrompt(prompt: string): Promise<TargetResponse>;
}
//# sourceMappingURL=open-ai-client.d.ts.map