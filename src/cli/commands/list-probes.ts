import picocolors from 'picocolors';
import Table from 'cli-table3';
import { getFilteredProbes, loadAllProbes } from '../../core/attacks/corpus-loader.js';
import { OwaspCategory, SeverityLevel } from '../../core/attacks/base.js';

export interface ListProbesCliOptions {
  category?: string;
  severity?: string;
  limit?: string;
}

export function runListProbesCommand(options: ListProbesCliOptions): void {
  const categories = options.category
    ? [options.category.toUpperCase() as OwaspCategory]
    : undefined;
  const severities = options.severity
    ? [options.severity.toUpperCase() as SeverityLevel]
    : undefined;
  const limit = options.limit ? parseInt(options.limit, 10) : undefined;

  const probes = getFilteredProbes({ categories, severities, limit });

  console.log(picocolors.bold(picocolors.cyan(`\n🛡️  RedTeamLens Attack Vector Corpus (${probes.length} probes)`)));

  const table = new Table({
    head: [
      picocolors.white('ID'),
      picocolors.white('Severity'),
      picocolors.white('Category'),
      picocolors.white('Probe Name')
    ]
  });

  for (const p of probes.slice(0, 50)) {
    const sevColor =
      p.severity === 'CRITICAL' ? picocolors.red :
      p.severity === 'HIGH' ? picocolors.yellow :
      p.severity === 'MEDIUM' ? picocolors.cyan :
      picocolors.green;

    table.push([
      p.id,
      sevColor(p.severity),
      p.category.replace('LLM', ''),
      p.name.slice(0, 45)
    ]);
  }

  console.log(table.toString());

  if (probes.length > 50) {
    console.log(picocolors.dim(`\nShowing first 50 probes. Use --limit or filters to narrow down.`));
  }
}
