import { LetterGrade } from '../core/evaluation/scoring.js';
export interface BadgeOptions {
    score?: number;
    grade?: LetterGrade;
    label?: string;
}
export declare class BadgeGenerator {
    static generate(options?: BadgeOptions): string;
}
//# sourceMappingURL=badge-generator.d.ts.map