import picocolors from 'picocolors';
import open from 'open';
import { LocalServer } from '../../server/local-server.js';

export interface StudioCliOptions {
  port?: string;
  host?: string;
  open?: boolean;
}

export async function runStudioCommand(options: StudioCliOptions): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 50096;
  const host = options.host || 'localhost';
  const shouldOpen = options.open !== false;

  console.log(picocolors.bold(picocolors.cyan('\n🛡️  RedTeamLens Security Studio')));
  console.log(picocolors.dim('   Launching visual red-teaming & compliance interface...\n'));

  const server = new LocalServer({ port, host });

  try {
    const activePort = await server.start();
    const url = `http://${host}:${activePort}`;

    console.log(picocolors.green(`✓ Web Studio running at: ${picocolors.bold(url)}`));
    console.log(picocolors.dim('   Press Ctrl+C to terminate the server.\n'));

    if (shouldOpen) {
      try {
        await open(url);
      } catch {
        // Ignore browser open errors in headless/CI environments
      }
    }

    // Keep process active
    process.on('SIGINT', async () => {
      console.log(picocolors.yellow('\nShutting down RedTeamLens Studio...'));
      await server.stop();
      process.exit(0);
    });
  } catch (err: any) {
    console.error(picocolors.red(`Failed to start Studio server: ${err.message}`));
    process.exit(1);
  }
}
