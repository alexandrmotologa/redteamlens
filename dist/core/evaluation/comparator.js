export class AuditComparator {
    static compare(baseline, comparison) {
        const baselineVulnerableMap = new Map();
        const baselineDefendedSet = new Set();
        for (const f of baseline.findings) {
            if (f.isVulnerable) {
                baselineVulnerableMap.set(f.probeId, f);
            }
            else {
                baselineDefendedSet.add(f.probeId);
            }
        }
        const comparisonVulnerableMap = new Map();
        for (const f of comparison.findings) {
            if (f.isVulnerable) {
                comparisonVulnerableMap.set(f.probeId, f);
            }
        }
        const resolvedVulnerabilities = [];
        const newRegressions = [];
        const persistingVulnerabilities = [];
        // Find resolved and persisting
        for (const [probeId, finding] of baselineVulnerableMap.entries()) {
            if (comparisonVulnerableMap.has(probeId)) {
                persistingVulnerabilities.push(comparisonVulnerableMap.get(probeId));
            }
            else {
                resolvedVulnerabilities.push(finding);
            }
        }
        // Find regressions (was defended, now vulnerable)
        for (const [probeId, finding] of comparisonVulnerableMap.entries()) {
            if (!baselineVulnerableMap.has(probeId)) {
                newRegressions.push(finding);
            }
        }
        const scoreDelta = comparison.complianceScore - baseline.complianceScore;
        const gradeHierarchy = { A: 4, B: 3, C: 2, D: 1, F: 0 };
        const baseRank = gradeHierarchy[baseline.letterGrade] ?? 0;
        const compRank = gradeHierarchy[comparison.letterGrade] ?? 0;
        const gradeImproved = compRank > baseRank;
        const gradeRegressed = compRank < baseRank;
        const isRegressed = newRegressions.length > 0 || gradeRegressed || scoreDelta < 0;
        const baselineAvgLatency = baseline.totalProbesRun > 0 ? Math.round(baseline.durationMs / baseline.totalProbesRun) : 0;
        const compAvgLatency = comparison.totalProbesRun > 0 ? Math.round(comparison.durationMs / comparison.totalProbesRun) : 0;
        const latencyDeltaMs = compAvgLatency - baselineAvgLatency;
        return {
            baselineUrl: baseline.targetUrl,
            comparisonUrl: comparison.targetUrl,
            baselineScore: baseline.complianceScore,
            comparisonScore: comparison.complianceScore,
            scoreDelta,
            baselineGrade: baseline.letterGrade,
            comparisonGrade: comparison.letterGrade,
            gradeImproved,
            gradeRegressed,
            resolvedVulnerabilities,
            newRegressions,
            persistingVulnerabilities,
            latencyDeltaMs,
            isRegressed
        };
    }
    static toMarkdown(result) {
        const lines = [];
        lines.push('# RedTeamLens Security Audit Comparison & Regression Analysis');
        lines.push('');
        lines.push(`* **Baseline Target:** \`${result.baselineUrl}\``);
        lines.push(`* **Comparison Target:** \`${result.comparisonUrl}\``);
        lines.push('');
        lines.push('## Executive Benchmark Metrics');
        lines.push('');
        lines.push('| Metric | Baseline | Comparison | Delta |');
        lines.push('| :--- | :---: | :---: | :---: |');
        lines.push(`| Compliance Score | ${result.baselineScore}% | ${result.comparisonScore}% | **${result.scoreDelta >= 0 ? '+' : ''}${result.scoreDelta}%** |`);
        lines.push(`| Letter Grade | **${result.baselineGrade}** | **${result.comparisonGrade}** | ${result.gradeImproved ? 'Improved' : result.gradeRegressed ? 'Regressed' : 'Unchanged'} |`);
        lines.push(`| Resolved Vulnerabilities | - | - | **${result.resolvedVulnerabilities.length} fixed** |`);
        lines.push(`| New Regressions | - | - | **${result.newRegressions.length > 0 ? `+${result.newRegressions.length} NEW FAILURES` : '0 (Clean)'}** |`);
        lines.push(`| Persisting Failures | - | - | ${result.persistingVulnerabilities.length} |`);
        lines.push(`| Average Latency | - | - | ${result.latencyDeltaMs >= 0 ? '+' : ''}${result.latencyDeltaMs}ms |`);
        lines.push('');
        if (result.newRegressions.length > 0) {
            lines.push('## ⚠️ Security Regressions (Previously Passed, Now Vulnerable)');
            lines.push('');
            lines.push('| Probe ID | Severity | Category | Probe Name |');
            lines.push('| :--- | :---: | :--- | :--- |');
            for (const reg of result.newRegressions) {
                lines.push(`| \`${reg.probeId}\` | **${reg.severity}** | ${reg.category} | ${reg.probeName} |`);
            }
            lines.push('');
        }
        if (result.resolvedVulnerabilities.length > 0) {
            lines.push('## ✓ Successfully Remediated Vulnerabilities');
            lines.push('');
            lines.push('| Probe ID | Severity | Category | Probe Name |');
            lines.push('| :--- | :---: | :--- | :--- |');
            for (const res of result.resolvedVulnerabilities) {
                lines.push(`| \`${res.probeId}\` | ${res.severity} | ${res.category} | ${res.probeName} |`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=comparator.js.map