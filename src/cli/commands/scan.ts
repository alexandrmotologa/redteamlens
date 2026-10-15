import fs from 'node:fs';
import path from 'node:path';
import picocolors from 'picocolors';
import ora from 'ora';
import Table from 'cli-table3';
import { ScannerEngine } from '../../core/scanner.js';
import { GenericHttpTarget } from '../../core/targets/generic-http.js';
import { MockAgentTarget } from '../../core/targets/mock-agent.js';
import { OpenAiClientTarget } from '../../core/targets/open-ai-client.js';
import { TargetConnector } from '../../core/targets/base.js';
import { OwaspCategory, SeverityLevel } from '../../core/attacks/base.js';
import { HtmlReportGenerator } from '../../reports/html-generator.js';
import { MarkdownReportGenerator } from '../../reports/markdown-generator.js';
import { SecurityAuditReport } from '../../core/evaluation/scoring.js';

export interface ScanCliOptions {
  target?: string;
  demo?: boolean;
  hardened?: boolean;
  openai?: boolean;
  apiKey?: string;
  model?: string;
  categories?: string;
  severities?: string;
  limit?: string;
  concurrency?: string;
  output?: string;
  format?: 'html' | 'markdown' | 'json';
  failOnGrade?: string;
  maxCritical?: string;
}

export async function runScanCommand(options: ScanCliOptions): Promise<void> {
  console.log(picocolors.bold(picocolors.cyan('\n🛡️  RedTeamLens Automated Adversarial Scanner')));
  console.log(picocolors.dim('   OWASP Top 10 for Large Language Model Applications\n'));

  let target: TargetConnector;

  if (options.demo || (!options.target && !options.openai)) {
    const isHardened = Boolean(options.hardened);
    target = new MockAgentTarget({ hardened: isHardened });
    console.log(picocolors.yellow(`Target Mode: Built-in Demo Simulator (${isHardened ? 'Hardened/Protected' : 'Vulnerable/Unprotected'})`));
  } else if (options.openai) {
    const key = options.apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      console.error(picocolors.red('Error: --api-key or OPENAI_API_KEY environment variable required for OpenAI target.'));
      process.exit(1);
    }
    target = new OpenAiClientTarget({
      apiKey: key,
      model: options.model || 'gpt-4o-mini'
    });
    console.log(picocolors.blue(`Target Mode: OpenAI Chat Completions API (${options.model || 'gpt-4o-mini'})`));
  } else {
    target = new GenericHttpTarget({
      url: options.target!,
      method: 'POST'
    });
    console.log(picocolors.green(`Target Mode: Generic HTTP (${options.target})`));
  }

  // Parse filters
  let categories: OwaspCategory[] | undefined;
  if (options.categories) {
    categories = options.categories.split(',').map(c => {
      const trimmed = c.trim().toUpperCase();
      if (!trimmed.startsWith('LLM')) return `LLM${trimmed}` as OwaspCategory;
      return trimmed as OwaspCategory;
    });
  }

  let severities: SeverityLevel[] | undefined;
  if (options.severities) {
    severities = options.severities.split(',').map(s => s.trim().toUpperCase() as SeverityLevel);
  }

  const limit = options.limit ? parseInt(options.limit, 10) : undefined;
  const concurrency = options.concurrency ? parseInt(options.concurrency, 10) : 5;

  const spinner = ora({
    text: 'Preparing adversarial attack battery...',
    color: 'cyan'
  }).start();

  const scanner = new ScannerEngine({
    target,
    concurrency
  });

  let report: SecurityAuditReport;

  try {
    report = await scanner.runScan({
      target,
      categories,
      severities,
      limit,
      concurrency,
      onProbeStart: (probe, index, total) => {
        spinner.text = `Firing attack probes: [${index + 1}/${total}] ${picocolors.dim(probe.name.slice(0, 45))}`;
      }
    });
    spinner.succeed(`Completed ${report.totalProbesRun} adversarial probes in ${(report.durationMs / 1000).toFixed(2)}s`);
  } catch (err: any) {
    spinner.fail(`Scan aborted with error: ${err.message}`);
    process.exit(1);
  }

  // Print Executive Summary Table
  console.log('\n' + picocolors.bold('📊 Security Audit Executive Summary:'));

  const gradeColor =
    report.letterGrade === 'A' ? picocolors.green :
    report.letterGrade === 'B' ? picocolors.blue :
    report.letterGrade === 'C' ? picocolors.yellow :
    picocolors.red;

  const summaryTable = new Table({
    head: [
      picocolors.white('Metric'),
      picocolors.white('Result')
    ]
  });

  summaryTable.push(
    ['Target URL', report.targetUrl],
    ['Target Type', report.targetType],
    ['Compliance Score', `${report.complianceScore}%`],
    ['Compliance Grade', gradeColor(picocolors.bold(`Grade ${report.letterGrade}`))],
    ['Total Probes Run', String(report.totalProbesRun)],
    ['Defended / Passed', picocolors.green(String(report.passedProbes))],
    ['Vulnerabilities Detected', report.vulnerabilitiesFound > 0 ? picocolors.red(String(report.vulnerabilitiesFound)) : picocolors.green('0')],
    ['Critical Severities', report.severityBreakdown.critical > 0 ? picocolors.red(String(report.severityBreakdown.critical)) : picocolors.dim('0')],
    ['High Severities', report.severityBreakdown.high > 0 ? picocolors.yellow(String(report.severityBreakdown.high)) : picocolors.dim('0')]
  );

  console.log(summaryTable.toString());

  // Category Breakdown Table
  console.log('\n' + picocolors.bold('📌 OWASP LLM Top 10 Category Breakdown:'));
  const catTable = new Table({
    head: [
      picocolors.white('OWASP Category'),
      picocolors.white('Tested'),
      picocolors.white('Passed'),
      picocolors.white('Failed'),
      picocolors.white('Compliance Rate'),
      picocolors.white('Critical')
    ]
  });

  for (const cat of Object.values(report.categoryBreakdown)) {
    const rateColor = cat.complianceRate >= 90 ? picocolors.green : cat.complianceRate >= 70 ? picocolors.yellow : picocolors.red;
    catTable.push([
      cat.name,
      String(cat.total),
      picocolors.green(String(cat.passed)),
      cat.failed > 0 ? picocolors.red(String(cat.failed)) : picocolors.dim('0'),
      rateColor(`${cat.complianceRate}%`),
      cat.criticalCount > 0 ? picocolors.red(String(cat.criticalCount)) : picocolors.dim('0')
    ]);
  }
  console.log(catTable.toString());

  // If vulnerabilities found, list top findings
  const failed = report.findings.filter(f => f.isVulnerable);
  if (failed.length > 0) {
    console.log('\n' + picocolors.bold(picocolors.red(`⚠️  Vulnerabilities Identified (${failed.length}):`)));
    const findingsTable = new Table({
      head: [
        picocolors.white('Probe ID'),
        picocolors.white('Severity'),
        picocolors.white('Category'),
        picocolors.white('Probe Name')
      ]
    });
    for (const f of failed.slice(0, 10)) {
      const sevColor = f.severity === 'CRITICAL' ? picocolors.red : picocolors.yellow;
      findingsTable.push([
        f.probeId,
        sevColor(f.severity),
        f.category.replace('LLM', ''),
        f.probeName.slice(0, 50)
      ]);
    }
    console.log(findingsTable.toString());
    if (failed.length > 10) {
      console.log(picocolors.dim(`   ... and ${failed.length - 10} more findings. Export report to inspect all.`));
    }
  }

  // Export report if requested
  if (options.output) {
    const outPath = path.resolve(options.output);
    const ext = path.extname(outPath).toLowerCase();
    const format = options.format || (ext === '.md' ? 'markdown' : ext === '.json' ? 'json' : 'html');

    let outputContent = '';
    if (format === 'html') {
      outputContent = HtmlReportGenerator.generate(report);
    } else if (format === 'markdown') {
      outputContent = MarkdownReportGenerator.generate(report);
    } else {
      outputContent = JSON.stringify(report, null, 2);
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, outputContent, 'utf-8');
    console.log(picocolors.green(`\n✓ Exported ${format.toUpperCase()} audit report to: ${outPath}`));
  }

  // CI/CD Quality Gate assertions
  if (options.maxCritical !== undefined) {
    const maxCrit = parseInt(options.maxCritical, 10);
    if (report.severityBreakdown.critical > maxCrit) {
      console.error(picocolors.red(`\n❌ CI/CD Quality Gate Failed: Found ${report.severityBreakdown.critical} critical vulnerabilities (max allowed: ${maxCrit})`));
      process.exit(1);
    }
  }

  if (options.failOnGrade) {
    const gradeHierarchy: Record<string, number> = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const requiredRank = gradeHierarchy[options.failOnGrade.toUpperCase()] ?? 3;
    const actualRank = gradeHierarchy[report.letterGrade] ?? 0;
    if (actualRank < requiredRank) {
      console.error(picocolors.red(`\n❌ CI/CD Quality Gate Failed: Audit grade ${report.letterGrade} is below required threshold ${options.failOnGrade}`));
      process.exit(1);
    }
  }
}
