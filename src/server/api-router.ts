import { IncomingMessage, ServerResponse } from 'node:http';
import { loadAllProbes, getFilteredProbes } from '../core/attacks/corpus-loader.js';
import { ScannerEngine, ScanOptions } from '../core/scanner.js';
import { GenericHttpTarget } from '../core/targets/generic-http.js';
import { MockAgentTarget } from '../core/targets/mock-agent.js';
import { OpenAiClientTarget } from '../core/targets/open-ai-client.js';
import { HtmlReportGenerator } from '../reports/html-generator.js';
import { MarkdownReportGenerator } from '../reports/markdown-generator.js';
import { SecurityAuditReport, ScanFinding } from '../core/evaluation/scoring.js';
import { AttackProbe } from '../core/attacks/base.js';

export interface ActiveScanState {
  id: string;
  targetUrl: string;
  total: number;
  completed: number;
  currentProbe?: AttackProbe;
  findings: ScanFinding[];
  isDone: boolean;
  report?: SecurityAuditReport;
  sseClients: ServerResponse[];
}

export class ApiRouter {
  private activeScans = new Map<string, ActiveScanState>();

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
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
      const categories: Record<string, number> = {};
      const severities: Record<string, number> = {};

      for (const p of probes) {
        categories[p.category] = (categories[p.category] || 0) + 1;
        severities[p.severity] = (severities[p.severity] || 0) + 1;
      }

      this.sendJson(res, 200, {
        total: probes.length,
        categories,
        severities,
        probes: probes.slice(0, 50) // sample for overview
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
      } else if (body.targetType === 'openai') {
        target = new OpenAiClientTarget({
          apiKey: body.apiKey || process.env.OPENAI_API_KEY || '',
          model: body.model,
          baseUrl: body.baseUrl
        });
      } else {
        target = new GenericHttpTarget({
          url: body.targetUrl || 'http://localhost:4000/chat',
          method: body.method || 'POST',
          headers: body.headers,
          bodyTemplate: body.bodyTemplate,
          responsePath: body.responsePath
        });
      }

      const scanState: ActiveScanState = {
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

      // Run asynchronously in background
      (async () => {
        try {
          const report = await scanner.runScan({
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

          scanState.isDone = true;
          scanState.report = report;
          this.broadcastSse(scanState, {
            type: 'scan_complete',
            report
          });
        } catch (err: any) {
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

      // Send initial state
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

    // 6. POST /api/report/html
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

    // 7. POST /api/report/markdown
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

  private broadcastSse(scanState: ActiveScanState, event: any) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of scanState.sseClients) {
      try {
        client.write(data);
      } catch {
        // client disconnected
      }
    }
  }

  private sendJson(res: ServerResponse, status: number, data: any) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private async readBodyJson(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', reject);
    });
  }
}
