import { AttackProbe, MutatedProbe } from '../attacks/base.js';
export declare function toRot13(str: string): string;
export declare function toBase64(str: string): string;
export declare function toHex(str: string): string;
export declare function toLeetSpeak(str: string): string;
export type CipherType = 'base64' | 'rot13' | 'hex' | 'leetspeak';
export declare class CipherMutator {
    static mutate(probe: AttackProbe, type: CipherType): MutatedProbe;
    static generateAllMutations(probe: AttackProbe): MutatedProbe[];
}
//# sourceMappingURL=cipher-mutator.d.ts.map