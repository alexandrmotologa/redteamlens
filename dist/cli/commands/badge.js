import fs from 'node:fs';
import path from 'node:path';
import picocolors from 'picocolors';
import { BadgeGenerator } from '../../reports/badge-generator.js';
export function runBadgeCommand(options) {
    const score = options.score ? parseInt(options.score, 10) : undefined;
    const grade = (options.grade ? options.grade.toUpperCase() : 'A');
    const svg = BadgeGenerator.generate({
        score,
        grade,
        label: options.label
    });
    const outPath = path.resolve(options.output || 'redteamlens-badge.svg');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, svg, 'utf8');
    console.log(picocolors.green(`✓ Generated SVG badge at: ${outPath}`));
}
//# sourceMappingURL=badge.js.map