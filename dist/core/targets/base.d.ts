export interface TargetResponse {
    response: string;
    latencyMs: number;
    statusCode?: number;
    error?: string;
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface TargetConnector {
    id: string;
    name: string;
    targetUrl: string;
    sendPrompt(prompt: string): Promise<TargetResponse>;
    sendConversation?(messages: ChatMessage[]): Promise<TargetResponse>;
}
//# sourceMappingURL=base.d.ts.map