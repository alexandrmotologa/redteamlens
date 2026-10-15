import { SecurityAuditReport } from '../core/evaluation/scoring.js';

export class MarkdownReportGenerator {
  static generate(report: SecurityAuditReport): string {
    const lines: string[] = [];

    lines.push('# RedTeamLens Security Audit Report');
    lines.push('');
    lines.push(`Target: \`${report.targetUrl}\` (${report.targetType})`);
    lines.push(`Audit Date: ${new Date(report.scannedAt).toISOString()}`);
    lines.push(`Duration: ${(report.durationMs / 1000).toFixed(2)} seconds`);
    lines.push('');
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(`* **Compliance Score:** ${report.complianceScore}% (Grade: **${report.letterGrade}**)`);
    lines.push(`* **Total Probes Executed:** ${report.totalProbesRun}`);
    lines.push(`* **Passed Probes:** ${report.passedProbes}`);
    lines.push(`* **Vulnerabilities Detected:** ${report.vulnerabilitiesFound}`);
    lines.push(`* **Critical Severity:** ${report.severityBreakdown.critical}`);
    lines.push(`* **High Severity:** ${report.severityBreakdown.high}`);
    lines.push(`* **Medium Severity:** ${report.severityBreakdown.medium}`);
    lines.push(`* **Low Severity:** ${report.severityBreakdown.low}`);
    lines.push('');

    lines.push('## OWASP LLM Top 10 Category Breakdown');
    lines.push('');
    lines.push('| Category | Tested | Passed | Failed | Compliance Rate | Critical Issues |');
    lines.push('| :--- | :---: | :---: | :---: | :---: | :---: |');

    for (const cat of Object.values(report.categoryBreakdown)) {
      lines.push(
        `| ${cat.name} | ${cat.total} | ${cat.passed} | ${cat.failed} | ${cat.complianceRate}% | ${cat.criticalCount} |`
      );
    }
    lines.push('');

    if (report.recommendedHardening.length > 0) {
      lines.push('## Recommended Hardening Actions');
      lines.push('');
      report.recommendedHardening.forEach((rec, idx) => {
        lines.push(`${idx + 1}. ${rec}`);
      });
      lines.push('');
    }

    const failedFindings = report.findings.filter(f => f.isVulnerable);
    if (failedFindings.length > 0) {
      lines.push('## Vulnerability Findings Detail');
      lines.push('');
      lines.push('| ID | Severity | Category | Probe Name | Latency |');
      lines.push('| :--- | :---: | :--- | :--- | :---: |');
      for (const finding of failedFindings) {
        lines.push(
          `| \`${finding.probeId}\` | **${finding.severity}** | ${finding.category} | ${finding.probeName} | ${finding.latencyMs}ms |`
        );
      }
      lines.push('');
    } else {
      lines.push('## Vulnerability Findings Detail');
      lines.push('');
      lines.push('No vulnerabilities were detected across the executed test corpus.');
      lines.push('');
    }

    return lines.join('\n');
  }
}
