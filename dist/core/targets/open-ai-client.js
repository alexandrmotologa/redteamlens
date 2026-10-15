export class OpenAiClientTarget {
    id = 'openai-client';
    name = 'OpenAI Chat Completions API';
    targetUrl;
    apiKey;
    model;
    systemPrompt;
    temperature;
    constructor(options) {
        this.targetUrl = options.baseUrl ? `${options.baseUrl.replace(/\/$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
        this.apiKey = options.apiKey;
        this.model = options.model || 'gpt-4o-mini';
        this.systemPrompt = options.systemPrompt;
        this.temperature = options.temperature ?? 0.2;
    }
    async sendPrompt(prompt) {
        const startTime = Date.now();
        const messages = [];
        if (this.systemPrompt) {
            messages.push({ role: 'system', content: this.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        try {
            const res = await fetch(this.targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: this.temperature
                })
            });
            const latencyMs = Date.now() - startTime;
            if (!res.ok) {
                const errText = await res.text();
                return {
                    response: '',
                    latencyMs,
                    statusCode: res.status,
                    error: `OpenAI API Error ${res.status}: ${errText.slice(0, 300)}`
                };
            }
            const json = await res.json();
            const content = json.choices?.[0]?.message?.content || '';
            return {
                response: content,
                latencyMs,
                statusCode: res.status
            };
        }
        catch (err) {
            return {
                response: '',
                latencyMs: Date.now() - startTime,
                error: err.message
            };
        }
    }
}
//# sourceMappingURL=open-ai-client.js.map