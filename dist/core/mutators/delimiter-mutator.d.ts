import { AttackProbe, MutatedProbe } from '../attacks/base.js';
export type DelimiterType = 'xml-system' | 'markdown-block' | 'json-wrapper' | 'chat-ml';
export declare class DelimiterMutator {
    static mutate(probe: AttackProbe, type: DelimiterType): MutatedProbe;
}
//# sourceMappingURL=delimiter-mutator.d.ts.map