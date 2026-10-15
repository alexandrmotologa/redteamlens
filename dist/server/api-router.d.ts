import { IncomingMessage, ServerResponse } from 'node:http';
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
export declare class ApiRouter {
    private activeScans;
    handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
    private broadcastSse;
    private sendJson;
    private readBodyJson;
}
//# sourceMappingURL=api-router.d.ts.map