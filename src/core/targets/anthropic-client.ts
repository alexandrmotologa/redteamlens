import { TargetConnector, TargetResponse } from './base.js';

export interface AnthropicClientOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export class AnthropicClientTarget implements TargetConnector {
  public id = 'anthropic-client';
  public name = 'Anthropic Claude Messages API';
  public targetUrl: string;
  private apiKey: string;
  private model: string;
  private systemPrompt?: string;
  private maxTokens: number;

  constructor(options: AnthropicClientOptions) {
    this.targetUrl = options.baseUrl ? `${options.baseUrl.replace(/\/$/, '')}/messages` : 'https://api.anthropic.com/v1/messages';
    this.apiKey = options.apiKey;
    this.model = options.model || 'claude-3-5-haiku-20241022';
    this.systemPrompt = options.systemPrompt;
    this.maxTokens = options.maxTokens || 1024;
  }

  async sendPrompt(prompt: string): Promise<TargetResponse> {
    const startTime = Date.now();
    const payload: any = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [{ role: 'user', content: prompt }]
    };

    if (this.systemPrompt) {
      payload.system = this.systemPrompt;
    }

    try {
      const res = await fetch(this.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errText = await res.text();
        return {
          response: '',
          latencyMs,
          statusCode: res.status,
          error: `Anthropic API Error ${res.status}: ${errText.slice(0, 300)}`
        };
      }

      const json = await res.json();
      const content = json.content?.[0]?.text || '';
      return {
        response: content,
        latencyMs,
        statusCode: res.status
      };
    } catch (err: any) {
      return {
        response: '',
        latencyMs: Date.now() - startTime,
        error: err.message
      };
    }
  }
}
