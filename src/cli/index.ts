import { Command } from 'commander';
import { runScanCommand } from './commands/scan.js';
import { runReportCommand } from './commands/report.js';
import { runStudioCommand } from './commands/studio.js';
import { runListProbesCommand } from './commands/list-probes.js';
import { runDemoServerCommand } from './commands/demo-server.js';

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
  .option('--demo', 'Scan against built-in simulated test agent')
  .option('--hardened', 'Use hardened defense mode for demo target')
  .option('--openai', 'Scan OpenAI chat completions API')
  .option('--api-key <key>', 'API key for OpenAI / Anthropic target')
  .option('--model <model>', 'Model name for direct LLM API (default: gpt-4o-mini)')
  .option('-c, --categories <list>', 'Comma-separated OWASP categories (e.g. LLM01,LLM02,LLM06)')
  .option('-s, --severities <list>', 'Comma-separated severity levels (CRITICAL,HIGH,MEDIUM,LOW)')
  .option('-l, --limit <number>', 'Maximum number of probes to execute')
  .option('--concurrency <number>', 'Number of concurrent requests (default: 5)', '5')
  .option('-o, --output <path>', 'Output file path (e.g. audit-report.html or audit-report.json)')
  .option('-f, --format <format>', 'Output report format (html, markdown, json)')
  .option('--fail-on-grade <grade>', 'Fail CI/CD build if grade is below threshold (A, B, C, D)')
  .option('--max-critical <number>', 'Fail CI/CD build if critical vulnerabilities exceed count')
  .action(async (options) => {
    await runScanCommand(options);
  });

// 2. report command
program
  .command('report <inputFile>')
  .description('Generate formatted HTML or Markdown report from a JSON scan result')
  .option('-f, --format <format>', 'Output format: html or markdown', 'html')
  .option('-o, --output <path>', 'Output destination file path')
  .action(async (inputFile, options) => {
    await runReportCommand(inputFile, options);
  });

// 3. studio command
program
  .command('studio')
  .description('Launch the embedded React 19 visual security dashboard')
  .option('-p, --port <port>', 'Port number to listen on', '50096')
  .option('-h, --host <host>', 'Host address to bind to', 'localhost')
  .option('--no-open', 'Do not automatically open the browser window')
  .action(async (options) => {
    await runStudioCommand(options);
  });

// 4. list-probes command
program
  .command('list-probes')
  .description('List available adversarial attack probes in the corpus')
  .option('-c, --category <cat>', 'Filter by category')
  .option('-s, --severity <sev>', 'Filter by severity')
  .option('-l, --limit <num>', 'Limit results displayed')
  .action((options) => {
    runListProbesCommand(options);
  });

// 5. demo-server command
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
