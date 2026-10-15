export interface TargetResponse {
  response: string;
  latencyMs: number;
  statusCode?: number;
  error?: string;
}

export interface TargetConnector {
  id: string;
  name: string;
  targetUrl: string;
  sendPrompt(prompt: string): Promise<TargetResponse>;
}
