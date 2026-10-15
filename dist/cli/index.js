import { Command } from 'commander';
import { runScanCommand } from './commands/scan.js';
import { runReportCommand } from './commands/report.js';
import { runStudioCommand } from './commands/studio.js';
import { runListProbesCommand } from './commands/list-probes.js';
import { runDemoServerCommand } from './commands/demo-server.js';
import { runPatchCommand } from './commands/patch.js';
import { runCompareCommand } from './commands/compare.js';
import { runBadgeCommand } from './commands/badge.js';
const program = new Command();
program
    .name('redteamlens')
    .description('Automated OWASP LLM Top 10 Red-Teaming, Adversarial Fuzzer & Security Compliance Auditor')
    .version('1.0.0');
// 1. scan command
program
    .command('scan')
    .description('Execute automated adversarial attack scan against target LLM or agent')
    .option('-t, --target <url>', 'Target endpoint URL (e.g. http://localhost:4000/chat)')
    .option('--config <path>', 'Path to redteamlens.config.json configuration file')
    .option('--demo', 'Scan against built-in simulated test agent')
    .option('--hardened', 'Use hardened defense mode for demo target')
    .option('--openai', 'Scan OpenAI chat completions API')
    .option('--api-key <key>', 'API key for OpenAI / Anthropic target')
    .option('--model <model>', 'Model name for direct LLM API (default: gpt-4o-mini)')
    .option('-c, --categories <list>', 'Comma-separated OWASP categories (e.g. LLM01,LLM02,LLM06)')
    .option('-s, --severities <list>', 'Comma-separated severity levels (CRITICAL,HIGH,MEDIUM,LOW)')
    .option('-l, --limit <number>', 'Maximum number of probes to execute')
    .option('--concurrency <number>', 'Number of concurrent requests (default: 5)', '5')
    .option('--multi-turn', 'Execute multi-turn conversational attack scenarios (Crescendo attacks)')
    .option('-o, --output <path>', 'Output file path (e.g. audit-report.html or audit-report.sarif)')
    .option('-f, --format <format>', 'Output report format (html, markdown, json, sarif)')
    .option('--badge <path>', 'Generate SVG status badge from scan results (e.g. badge.svg)')
    .option('--fail-on-grade <grade>', 'Fail CI/CD build if grade is below threshold (A, B, C, D)')
    .option('--max-critical <number>', 'Fail CI/CD build if critical vulnerabilities exceed count')
    .action(async (options) => {
    await runScanCommand(options);
});
// 2. report command
program
    .command('report <inputFile>')
    .description('Generate formatted HTML, Markdown, or SARIF report from a JSON scan result')
    .option('-f, --format <format>', 'Output format: html, markdown, or sarif', 'html')
    .option('-o, --output <path>', 'Output destination file path')
    .action(async (inputFile, options) => {
    await runReportCommand(inputFile, options);
});
// 3. patch command (Prompt Auto-Patcher)
program
    .command('patch')
    .description('Automatically harden a system prompt with XML isolation, canary tokens, and guardrails')
    .requiredOption('-i, --input <file>', 'Input system prompt text file path')
    .option('-o, --output <file>', 'Output hardened prompt file destination')
    .option('-c, --canary <token>', 'Custom verification canary token')
    .action((options) => {
    runPatchCommand(options);
});
// 4. compare command (Regression & Diff Tracker)
program
    .command('compare <baselineFile> <comparisonFile>')
    .description('Compare two audit reports to detect security regressions and remediated vulnerabilities')
    .option('-o, --output <path>', 'Save comparison diff report to file')
    .option('-f, --format <format>', 'Output format: markdown or json', 'markdown')
    .action((baselineFile, comparisonFile, options) => {
    runCompareCommand(baselineFile, comparisonFile, options);
});
// 5. badge command
program
    .command('badge')
    .description('Generate an SVG status badge for GitHub READMEs or documentation')
    .option('-s, --score <number>', 'Compliance score (0-100)')
    .option('-g, --grade <grade>', 'Letter grade (A, B, C, D, F)', 'A')
    .option('-l, --label <label>', 'Badge label text', 'OWASP LLM')
    .option('-o, --output <path>', 'Output SVG file destination', 'redteamlens-badge.svg')
    .action((options) => {
    runBadgeCommand(options);
});
// 6. studio command
program
    .command('studio')
    .description('Launch the embedded React 19 visual security dashboard')
    .option('-p, --port <port>', 'Port number to listen on', '50096')
    .option('-h, --host <host>', 'Host address to bind to', 'localhost')
    .option('--no-open', 'Do not automatically open the browser window')
    .action(async (options) => {
    await runStudioCommand(options);
});
// 7. list-probes command
program
    .command('list-probes')
    .description('List available adversarial attack probes in the corpus')
    .option('-c, --category <cat>', 'Filter by category')
    .option('-s, --severity <sev>', 'Filter by severity')
    .option('-l, --limit <num>', 'Limit results displayed')
    .action((options) => {
    runListProbesCommand(options);
});
// 8. demo-server command
program
    .command('demo-server')
    .description('Start a local standalone agent simulator server for testing')
    .option('-p, --port <port>', 'Port to bind server to', '4000')
    .option('--hardened', 'Enable hardened defensive prompt guardrails')
    .action((options) => {
    runDemoServerCommand(options);
});
// Default to scan --demo if no arguments provided
if (process.argv.length <= 2) {
    process.argv.push('scan', '--demo');
}
program.parse(process.argv);
//# sourceMappingURL=index.js.map