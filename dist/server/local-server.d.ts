export interface LocalServerOptions {
    port?: number;
    host?: string;
    staticDir?: string;
}
export declare class LocalServer {
    private server;
    private apiRouter;
    private port;
    private host;
    private staticDir;
    constructor(options?: LocalServerOptions);
    start(): Promise<number>;
    stop(): Promise<void>;
    private serveStatic;
}
//# sourceMappingURL=local-server.d.ts.map