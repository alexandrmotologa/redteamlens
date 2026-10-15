import http, { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiRouter } from './api-router.js';

export interface LocalServerOptions {
  port?: number;
  host?: string;
  staticDir?: string;
}

export class LocalServer {
  private server: http.Server | null = null;
  private apiRouter: ApiRouter;
  private port: number;
  private host: string;
  private staticDir: string;

  constructor(options: LocalServerOptions = {}) {
    this.port = options.port || 50096;
    this.host = options.host || 'localhost';
    this.apiRouter = new ApiRouter();

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const candidateDirs = [
      options.staticDir,
      path.resolve(currentDir, '../../dist/studio'),
      path.resolve(currentDir, '../studio/dist'),
      path.resolve(process.cwd(), 'dist/studio'),
      path.resolve(process.cwd(), 'src/studio/dist')
    ].filter(Boolean) as string[];

    let foundDir = candidateDirs[0];
    for (const d of candidateDirs) {
      if (fs.existsSync(d)) {
        foundDir = d;
        break;
      }
    }
    this.staticDir = foundDir;
  }

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
        try {
          // 1. Check API routes
          const handled = await this.apiRouter.handleRequest(req, res);
          if (handled) return;

          // 2. Serve static files
          this.serveStatic(req, res);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`Internal Server Error: ${err.message}`);
        }
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${this.port} is in use, trying ${this.port + 1}...`);
          this.port += 1;
          this.server?.listen(this.port, this.host);
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, this.host, () => {
        resolve(this.port);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.server) {
        if (typeof (this.server as any).closeAllConnections === 'function') {
          (this.server as any).closeAllConnections();
        }
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private serveStatic(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }

    let filePath = path.join(this.staticDir, safePath);

    // If file doesn't exist, SPA fallback to index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(this.staticDir, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>RedTeamLens Studio</title><style>body{background:#090d16;color:#f3f4f6;font-family:sans-serif;padding:40px;text-align:center;}</style></head>
        <body>
          <h2>RedTeamLens Studio Web Assets Not Built Yet</h2>
          <p>Please run <code>npm run build:studio</code> or connect to the development server.</p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  }
}
