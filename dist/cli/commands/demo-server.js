import http from 'node:http';
import picocolors from 'picocolors';
import { MockAgentTarget } from '../../core/targets/mock-agent.js';
export function runDemoServerCommand(options) {
    const port = options.port ? parseInt(options.port, 10) : 4000;
    const hardened = Boolean(options.hardened);
    const agent = new MockAgentTarget({ hardened });
    const server = http.createServer(async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', async () => {
                try {
                    const json = body ? JSON.parse(body) : {};
                    let prompt = json.prompt || '';
                    if (!prompt && Array.isArray(json.messages)) {
                        const userMsg = json.messages.filter((m) => m.role === 'user').pop();
                        prompt = userMsg?.content || '';
                    }
                    const result = await agent.sendPrompt(prompt);
                    // Return both standard format and OpenAI format
                    const responseData = {
                        response: result.response,
                        output: result.response,
                        text: result.response,
                        choices: [
                            {
                                message: {
                                    role: 'assistant',
                                    content: result.response
                                },
                                finish_reason: 'stop'
                            }
                        ],
                        latencyMs: result.latencyMs
                    };
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(responseData));
                }
                catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'active',
            name: agent.name,
            mode: hardened ? 'hardened' : 'vulnerable',
            endpoints: ['POST /chat', 'POST /v1/chat/completions']
        }));
    });
    server.listen(port, () => {
        console.log(picocolors.bold(picocolors.cyan('\n🤖 RedTeamLens Standalone Demo Agent Server')));
        console.log(picocolors.yellow(`   Mode: ${hardened ? 'Hardened Enterprise Agent (Protected)' : 'Vulnerable Legacy Agent (Unprotected)'}`));
        console.log(picocolors.green(`   Listening on: http://localhost:${port}/chat`));
        console.log(picocolors.dim('   Compatible with generic HTTP & OpenAI chat formats.\n'));
    });
}
//# sourceMappingURL=demo-server.js.map