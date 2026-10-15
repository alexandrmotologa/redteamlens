import fs from 'node:fs';
import path from 'node:path';
import picocolors from 'picocolors';
import { HtmlReportGenerator } from '../../reports/html-generator.js';
import { MarkdownReportGenerator } from '../../reports/markdown-generator.js';
import { SecurityAuditReport } from '../../core/evaluation/scoring.js';

export interface ReportCliOptions {
  format?: 'html' | 'markdown' | 'json';
  output?: string;
}

export async function runReportCommand(inputFile: string, options: ReportCliOptions): Promise<void> {
  const inputPath = path.resolve(inputFile);
  if (!fs.existsSync(inputPath)) {
    console.error(picocolors.red(`Error: Input file does not exist: ${inputPath}`));
    process.exit(1);
  }

  let report: SecurityAuditReport;
  try {
    const raw = fs.readFileSync(inputPath, 'utf-8');
    report = JSON.parse(raw);
  } catch (err: any) {
    console.error(picocolors.red(`Error parsing JSON report: ${err.message}`));
    process.exit(1);
  }

  const format = options.format || 'html';
  let formattedContent = '';

  if (format === 'html') {
    formattedContent = HtmlReportGenerator.generate(report);
  } else if (format === 'markdown') {
    formattedContent = MarkdownReportGenerator.generate(report);
  } else {
    formattedContent = JSON.stringify(report, null, 2);
  }

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, formattedContent, 'utf-8');
    console.log(picocolors.green(`✓ Converted and exported report to: ${outPath}`));
  } else {
    console.log(formattedContent);
  }
}
