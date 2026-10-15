import { loadAllProbes } from '../core/attacks/corpus-loader.js';
import { ScannerEngine } from '../core/scanner.js';
import { GenericHttpTarget } from '../core/targets/generic-http.js';
import { MockAgentTarget } from '../core/targets/mock-agent.js';
import { OpenAiClientTarget } from '../core/targets/open-ai-client.js';
import { HtmlReportGenerator } from '../reports/html-generator.js';
import { MarkdownReportGenerator } from '../reports/markdown-generator.js';
import { SarifReportGenerator } from '../reports/sarif-generator.js';
import { BadgeGenerator } from '../reports/badge-generator.js';
import { PromptPatcher } from '../core/hardening/patcher.js';
import { AuditComparator } from '../core/evaluation/comparator.js';
import { MultiTurnRunner } from '../core/multi-turn-runner.js';
import { HeuristicOracle } from '../core/evaluation/heuristic-oracle.js';
import { CipherMutator } from '../core/mutators/cipher-mutator.js';
import { LanguageMutator } from '../core/mutators/language-mutator.js';
import { DelimiterMutator } from '../core/mutators/delimiter-mutator.js';
import { compileAuditReport } from '../core/evaluation/scoring.js';
export class ApiRouter {
    activeScans = new Map();
    async handleRequest(req, res) {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method || 'GET';
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return true;
        }
        if (!pathname.startsWith('/api/')) {
            return false;
        }
        // 1. GET /api/probes
        if (pathname === '/api/probes' && method === 'GET') {
            const probes = loadAllProbes();
            const categories = {};
            const severities = {};
            for (const p of probes) {
                categories[p.category] = (categories[p.category] || 0) + 1;
                severities[p.severity] = (severities[p.severity] || 0) + 1;
            }
            this.sendJson(res, 200, {
                total: probes.length,
                categories,
                severities,
                probes: probes.slice(0, 50)
            });
            return true;
        }
        // 2. GET /api/probes/all
        if (pathname === '/api/probes/all' && method === 'GET') {
            const probes = loadAllProbes();
            this.sendJson(res, 200, { probes });
            return true;
        }
        // 3. POST /api/scan (Start a scan)
        if (pathname === '/api/scan' && method === 'POST') {
            const body = await this.readBodyJson(req);
            const scanId = `scan-${Date.now()}`;
            let target;
            if (body.targetType === 'demo' || body.demo) {
                target = new MockAgentTarget({ hardened: Boolean(body.hardened) });
            }
            else if (body.targetType === 'openai') {
                target = new OpenAiClientTarget({
                    apiKey: body.apiKey || process.env.OPENAI_API_KEY || '',
                    model: body.model,
                    baseUrl: body.baseUrl
                });
            }
            else {
                target = new GenericHttpTarget({
                    url: body.targetUrl || 'http://localhost:4000/chat',
                    method: body.method || 'POST',
                    headers: body.headers,
                    bodyTemplate: body.bodyTemplate,
                    responsePath: body.responsePath
                });
            }
            const scanState = {
                id: scanId,
                targetUrl: target.targetUrl,
                total: 0,
                completed: 0,
                findings: [],
                isDone: false,
                sseClients: []
            };
            this.activeScans.set(scanId, scanState);
            const scanner = new ScannerEngine({
                target,
                concurrency: body.concurrency || 5
            });
            // Run scan asynchronously
            (async () => {
                try {
                    let report;
                    const startTime = Date.now();
                    if (body.multiTurn) {
                        const runner = new MultiTurnRunner(target);
                        const findings = await runner.runChains({
                            onChainStart: (chain, index, total) => {
                                scanState.total = total;
                                this.broadcastSse(scanState, { type: 'probe_start', index, total, probe: chain });
                            },
                            onChainComplete: (finding, completed, total) => {
                                scanState.completed = completed;
                                scanState.findings.push(finding);
                                this.broadcastSse(scanState, { type: 'probe_complete', completed, total, finding });
                            }
                        });
                        report = compileAuditReport(target.targetUrl, target.name, findings, startTime);
                    }
                    else {
                        report = await scanner.runScan({
                            target,
                            categories: body.categories,
                            severities: body.severities,
                            limit: body.limit,
                            mutations: body.mutations,
                            onProbeStart: (probe, index, total) => {
                                scanState.total = total;
                                scanState.currentProbe = probe;
                                this.broadcastSse(scanState, {
                                    type: 'probe_start',
                                    index,
                                    total,
                                    probe
                                });
                            },
                            onProbeComplete: (finding, completed, total) => {
                                scanState.completed = completed;
                                scanState.findings.push(finding);
                                this.broadcastSse(scanState, {
                                    type: 'probe_complete',
                                    completed,
                                    total,
                                    finding
                                });
                            }
                        });
                    }
                    scanState.isDone = true;
                    scanState.report = report;
                    this.broadcastSse(scanState, {
                        type: 'scan_complete',
                        report
                    });
                }
                catch (err) {
                    scanState.isDone = true;
                    this.broadcastSse(scanState, {
                        type: 'scan_error',
                        error: err.message
                    });
                }
            })();
            this.sendJson(res, 202, {
                scanId,
                message: 'Scan initiated',
                targetUrl: target.targetUrl
            });
            return true;
        }
        // 4. GET /api/scan/:id/stream (SSE)
        if (pathname.startsWith('/api/scan/') && pathname.endsWith('/stream')) {
            const parts = pathname.split('/');
            const scanId = parts[3];
            const scan = this.activeScans.get(scanId);
            if (!scan) {
                this.sendJson(res, 404, { error: 'Scan not found' });
                return true;
            }
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            scan.sseClients.push(res);
            req.on('close', () => {
                scan.sseClients = scan.sseClients.filter(c => c !== res);
            });
            res.write(`data: ${JSON.stringify({ type: 'init', scanId, total: scan.total, completed: scan.completed, isDone: scan.isDone })}\n\n`);
            return true;
        }
        // 5. GET /api/scan/:id
        if (pathname.startsWith('/api/scan/') && method === 'GET') {
            const parts = pathname.split('/');
            const scanId = parts[3];
            const scan = this.activeScans.get(scanId);
            if (!scan) {
                this.sendJson(res, 404, { error: 'Scan not found' });
                return true;
            }
            this.sendJson(res, 200, {
                id: scan.id,
                isDone: scan.isDone,
                total: scan.total,
                completed: scan.completed,
                report: scan.report
            });
            return true;
        }
        // 6. POST /api/probe/adhoc (Ad-Hoc Interactive Playground Test)
        if (pathname === '/api/probe/adhoc' && method === 'POST') {
            const body = await this.readBodyJson(req);
            let payload = body.prompt || '';
            const mutation = body.mutation;
            // Apply mutation if selected
            const dummyProbe = {
                id: 'ADHOC-001',
                name: 'Ad-Hoc Probe',
                category: body.category || 'LLM01_PROMPT_INJECTION',
                severity: 'HIGH',
                promptPayload: payload,
                expectedRefusalMarkers: ['cannot', 'unauthorized', 'against my guidelines'],
                vulnerabilitySignatures: body.signatures || ['PWNED', 'BYPASS', 'SECRET_TOKEN'],
                description: 'Ad-hoc user tested payload',
                remediationAdvice: 'Harden input validation'
            };
            if (mutation) {
                if (['base64', 'rot13', 'hex', 'leetspeak'].includes(mutation)) {
                    payload = CipherMutator.mutate(dummyProbe, mutation).promptPayload;
                }
                else if (['french', 'german', 'spanish', 'latin'].includes(mutation)) {
                    payload = LanguageMutator.mutate(dummyProbe, mutation).promptPayload;
                }
                else if (['xml-system', 'markdown-block', 'chat-ml', 'json-wrapper'].includes(mutation)) {
                    payload = DelimiterMutator.mutate(dummyProbe, mutation).promptPayload;
                }
            }
            let target;
            if (body.targetType === 'hardened') {
                target = new MockAgentTarget({ hardened: true });
            }
            else if (body.targetType === 'custom' && body.targetUrl) {
                target = new GenericHttpTarget({ url: body.targetUrl });
            }
            else {
                target = new MockAgentTarget({ hardened: false });
            }
            const resObj = await target.sendPrompt(payload);
            const finding = HeuristicOracle.evaluate({ ...dummyProbe, promptPayload: payload }, resObj.response, resObj.latencyMs);
            this.sendJson(res, 200, {
                dispatchedPayload: payload,
                responseReceived: resObj.response,
                latencyMs: resObj.latencyMs,
                finding
            });
            return true;
        }
        // 7. POST /api/patch (Prompt Auto-Patcher)
        if (pathname === '/api/patch' && method === 'POST') {
            const body = await this.readBodyJson(req);
            const prompt = body.prompt || '';
            const result = PromptPatcher.patch(prompt, {
                canaryToken: body.canaryToken
            });
            this.sendJson(res, 200, result);
            return true;
        }
        // 8. POST /api/compare (Audit Compare)
        if (pathname === '/api/compare' && method === 'POST') {
            const body = await this.readBodyJson(req);
            if (!body.baseline || !body.comparison) {
                this.sendJson(res, 400, { error: 'Both baseline and comparison reports are required.' });
                return true;
            }
            const diff = AuditComparator.compare(body.baseline, body.comparison);
            this.sendJson(res, 200, diff);
            return true;
        }
        // 9. POST /api/report/sarif
        if (pathname === '/api/report/sarif' && method === 'POST') {
            const body = await this.readBodyJson(req);
            if (!body.report) {
                this.sendJson(res, 400, { error: 'Missing report in request body' });
                return true;
            }
            const sarif = SarifReportGenerator.generate(body.report);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(sarif);
            return true;
        }
        // 10. GET /api/badge
        if (pathname === '/api/badge' && method === 'GET') {
            const score = url.searchParams.get('score');
            const grade = url.searchParams.get('grade') || 'A';
            const label = url.searchParams.get('label') || 'OWASP LLM';
            const svg = BadgeGenerator.generate({
                score: score ? parseInt(score, 10) : undefined,
                grade,
                label
            });
            res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
            res.end(svg);
            return true;
        }
        // 11. POST /api/report/html
        if (pathname === '/api/report/html' && method === 'POST') {
            const body = await this.readBodyJson(req);
            if (!body.report) {
                this.sendJson(res, 400, { error: 'Missing report in request body' });
                return true;
            }
            const html = HtmlReportGenerator.generate(body.report);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return true;
        }
        // 12. POST /api/report/markdown
        if (pathname === '/api/report/markdown' && method === 'POST') {
            const body = await this.readBodyJson(req);
            if (!body.report) {
                this.sendJson(res, 400, { error: 'Missing report in request body' });
                return true;
            }
            const md = MarkdownReportGenerator.generate(body.report);
            res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
            res.end(md);
            return true;
        }
        this.sendJson(res, 404, { error: `Endpoint not found: ${pathname}` });
        return true;
    }
    broadcastSse(scanState, event) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        for (const client of scanState.sseClients) {
            try {
                client.write(data);
            }
            catch {
                // client disconnected
            }
        }
    }
    sendJson(res, status, data) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    async readBodyJson(req) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => (data += chunk));
            req.on('end', () => {
                try {
                    resolve(data ? JSON.parse(data) : {});
                }
                catch (err) {
                    reject(err);
                }
            });
            req.on('error', reject);
        });
    }
}
//# sourceMappingURL=api-router.js.map