import fs from 'node:fs';
import path from 'node:path';
import picocolors from 'picocolors';
import { PromptPatcher } from '../../core/hardening/patcher.js';

export interface PatchCliOptions {
  input: string;
  output?: string;
  canary?: string;
}

export function runPatchCommand(options: PatchCliOptions): void {
  const inputPath = path.resolve(options.input);
  if (!fs.existsSync(inputPath)) {
    console.error(picocolors.red(`Error: Input file does not exist: ${inputPath}`));
    process.exit(1);
  }

  const rawPrompt = fs.readFileSync(inputPath, 'utf8');
  const result = PromptPatcher.patch(rawPrompt, {
    canaryToken: options.canary
  });

  console.log(picocolors.bold(picocolors.cyan('\n🛡️  RedTeamLens Automated Prompt Hardening')));
  console.log(picocolors.green(`✓ Synthesized defensive guardrails with canary: ${picocolors.bold(result.canaryToken)}`));
  console.log(picocolors.dim(`   Patches applied: ${result.patchesApplied.join(', ')}\n`));

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, result.hardenedPrompt, 'utf8');
    console.log(picocolors.green(`✓ Hardened system prompt exported to: ${outPath}\n`));
  } else {
    console.log(result.hardenedPrompt);
  }
}
