import { TargetConnector, TargetResponse } from './base.js';
export interface MockAgentOptions {
    hardened?: boolean;
    canaryToken?: string;
    systemPrompt?: string;
    latencyMin?: number;
    latencyMax?: number;
}
export declare class MockAgentTarget implements TargetConnector {
    id: string;
    name: string;
    targetUrl: string;
    private hardened;
    private canaryToken;
    private systemPrompt;
    private latencyMin;
    private latencyMax;
    constructor(options?: MockAgentOptions);
    sendPrompt(prompt: string): Promise<TargetResponse>;
}
//# sourceMappingURL=mock-agent.d.ts.map