import { AttackProbe, MutatedProbe } from '../attacks/base.js';
export type LanguageFramingType = 'french' | 'german' | 'spanish' | 'latin';
export declare class LanguageMutator {
    static mutate(probe: AttackProbe, lang: LanguageFramingType): MutatedProbe;
}
//# sourceMappingURL=language-mutator.d.ts.map