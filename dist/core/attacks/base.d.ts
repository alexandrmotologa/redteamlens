export type OwaspCategory = 'LLM01_PROMPT_INJECTION' | 'LLM02_SENSITIVE_DISCLOSURE' | 'LLM06_EXCESSIVE_AGENCY' | 'LLM07_SYSTEM_PROMPT_LEAK' | 'LLM08_INDIRECT_INJECTION';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export interface AttackProbe {
    id: string;
    name: string;
    category: OwaspCategory;
    severity: SeverityLevel;
    promptPayload: string;
    expectedRefusalMarkers: string[];
    vulnerabilitySignatures: string[];
    description: string;
    remediationAdvice: string;
}
export interface MutatedProbe extends AttackProbe {
    originalProbeId: string;
    mutationType: string;
}
export interface MultiTurnTurn {
    role: 'user' | 'assistant';
    content: string;
}
export interface MultiTurnChain {
    id: string;
    name: string;
    category: OwaspCategory;
    severity: SeverityLevel;
    turns: MultiTurnTurn[];
    expectedRefusalMarkers: string[];
    vulnerabilitySignatures: string[];
    description: string;
    remediationAdvice: string;
}
//# sourceMappingURL=base.d.ts.map