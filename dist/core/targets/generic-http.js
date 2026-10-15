export class GenericHttpTarget {
    id;
    name;
    targetUrl;
    method;
    headers;
    bodyTemplate;
    responsePath;
    timeoutMs;
    constructor(options) {
        this.id = options.id || 'generic-http';
        this.name = options.name || 'Generic HTTP Endpoint';
        this.targetUrl = options.url;
        this.method = options.method || 'POST';
        this.headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        this.bodyTemplate = options.bodyTemplate || { prompt: '{{prompt}}' };
        this.responsePath = options.responsePath || 'response';
        this.timeoutMs = options.timeoutMs || 30000;
    }
    async sendPrompt(prompt) {
        const startTime = Date.now();
        let bodyString = '';
        if (typeof this.bodyTemplate === 'string') {
            bodyString = this.bodyTemplate.replace(/\{\{prompt\}\}/g, JSON.stringify(prompt).slice(1, -1));
        }
        else {
            const templateCopy = JSON.parse(JSON.stringify(this.bodyTemplate));
            const injectPrompt = (obj) => {
                for (const k in obj) {
                    if (typeof obj[k] === 'string' && obj[k].includes('{{prompt}}')) {
                        obj[k] = obj[k].replace('{{prompt}}', prompt);
                    }
                    else if (typeof obj[k] === 'object' && obj[k] !== null) {
                        injectPrompt(obj[k]);
                    }
                }
            };
            injectPrompt(templateCopy);
            bodyString = JSON.stringify(templateCopy);
        }
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            const res = await fetch(this.targetUrl, {
                method: this.method,
                headers: this.headers,
                body: this.method !== 'GET' ? bodyString : undefined,
                signal: controller.signal
            });
            clearTimeout(timer);
            const latencyMs = Date.now() - startTime;
            if (!res.ok) {
                const errorText = await res.text();
                return {
                    response: '',
                    latencyMs,
                    statusCode: res.status,
                    error: `HTTP ${res.status}: ${errorText.slice(0, 300)}`
                };
            }
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const json = await res.json();
                const extracted = this.extractValueByPath(json, this.responsePath);
                return {
                    response: typeof extracted === 'string' ? extracted : JSON.stringify(extracted),
                    latencyMs,
                    statusCode: res.status
                };
            }
            else {
                const text = await res.text();
                return {
                    response: text,
                    latencyMs,
                    statusCode: res.status
                };
            }
        }
        catch (err) {
            return {
                response: '',
                latencyMs: Date.now() - startTime,
                error: err.name === 'AbortError' ? `Timeout after ${this.timeoutMs}ms` : err.message
            };
        }
    }
    extractValueByPath(obj, pathStr) {
        if (!pathStr)
            return obj;
        // Check common fallbacks if exact path fails
        const parts = pathStr.split('.');
        let curr = obj;
        let found = true;
        for (const part of parts) {
            if (curr && typeof curr === 'object' && part in curr) {
                curr = curr[part];
            }
            else {
                found = false;
                break;
            }
        }
        if (found && curr !== undefined) {
            return curr;
        }
        // Common heuristics
        if (obj?.choices?.[0]?.message?.content)
            return obj.choices[0].message.content;
        if (obj?.choices?.[0]?.text)
            return obj.choices[0].text;
        if (obj?.content?.[0]?.text)
            return obj.content[0].text;
        if (obj?.response)
            return obj.response;
        if (obj?.output)
            return obj.output;
        if (obj?.text)
            return obj.text;
        if (obj?.message)
            return obj.message;
        return obj;
    }
}
//# sourceMappingURL=generic-http.js.map