import fs from 'node:fs';
import path from 'node:path';
import picocolors from 'picocolors';
import Table from 'cli-table3';
import { AuditComparator } from '../../core/evaluation/comparator.js';
export function runCompareCommand(baselineFile, comparisonFile, options) {
    const basePath = path.resolve(baselineFile);
    const compPath = path.resolve(comparisonFile);
    if (!fs.existsSync(basePath) || !fs.existsSync(compPath)) {
        console.error(picocolors.red('Error: One or both audit report files do not exist.'));
        process.exit(1);
    }
    const baseline = JSON.parse(fs.readFileSync(basePath, 'utf8'));
    const comparison = JSON.parse(fs.readFileSync(compPath, 'utf8'));
    const diff = AuditComparator.compare(baseline, comparison);
    console.log(picocolors.bold(picocolors.cyan('\n🛡️  RedTeamLens Security Audit Comparison & Regression Analysis')));
    const table = new Table({
        head: [picocolors.white('Metric'), picocolors.white('Baseline'), picocolors.white('Comparison'), picocolors.white('Delta')]
    });
    const deltaColor = diff.scoreDelta > 0 ? picocolors.green : diff.scoreDelta < 0 ? picocolors.red : picocolors.dim;
    table.push(['Compliance Score', `${diff.baselineScore}%`, `${diff.comparisonScore}%`, deltaColor(`${diff.scoreDelta >= 0 ? '+' : ''}${diff.scoreDelta}%`)], ['Letter Grade', diff.baselineGrade, diff.comparisonGrade, diff.gradeImproved ? picocolors.green('Improved') : diff.gradeRegressed ? picocolors.red('Regressed') : picocolors.dim('Unchanged')], ['Resolved Vulnerabilities', '-', '-', picocolors.green(`${diff.resolvedVulnerabilities.length} fixed`)], ['New Regressions', '-', '-', diff.newRegressions.length > 0 ? picocolors.red(`+${diff.newRegressions.length} NEW FAILURES`) : picocolors.green('0 (Clean)')], ['Persisting Failures', '-', '-', String(diff.persistingVulnerabilities.length)], ['Latency Delta', '-', '-', `${diff.latencyDeltaMs >= 0 ? '+' : ''}${diff.latencyDeltaMs}ms`]);
    console.log(table.toString());
    if (diff.newRegressions.length > 0) {
        console.log('\n' + picocolors.bold(picocolors.red('⚠️  Security Regressions Detected:')));
        for (const r of diff.newRegressions) {
            console.log(`   ${picocolors.red('●')} [${r.severity}] ${r.probeId}: ${r.probeName}`);
        }
    }
    if (options.output) {
        const outPath = path.resolve(options.output);
        const content = options.format === 'json' ? JSON.stringify(diff, null, 2) : AuditComparator.toMarkdown(diff);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, content, 'utf8');
        console.log(picocolors.green(`\n✓ Comparison analysis exported to: ${outPath}`));
    }
}
//# sourceMappingURL=compare.js.map