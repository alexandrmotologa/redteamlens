export interface PromptHardeningOptions {
    canaryToken?: string;
    enforceXmlBoundaries?: boolean;
    enableAntiLeak?: boolean;
    enableToolValidation?: boolean;
    strictRoleplayDefense?: boolean;
}
export interface HardeningResult {
    originalPrompt: string;
    hardenedPrompt: string;
    canaryToken: string;
    patchesApplied: string[];
}
export declare class PromptPatcher {
    static patch(originalPrompt: string, options?: PromptHardeningOptions): HardeningResult;
}
//# sourceMappingURL=patcher.d.ts.map