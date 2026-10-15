import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { LocalServer } from '../dist/server/local-server.js';
import { HtmlReportGenerator } from '../dist/reports/html-generator.js';
import { ScannerEngine } from '../dist/core/scanner.js';
import { MockAgentTarget } from '../dist/core/targets/mock-agent.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const docsDir = path.resolve('docs/images');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

async function run() {
  console.log('1. Starting LocalServer on port 50096...');
  const server = new LocalServer({ port: 50096 });
  const port = await server.start();
  const studioUrl = `http://localhost:${port}`;
  console.log(`Server started at ${studioUrl}`);

  console.log('2. Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // A. Convert logo.svg to logo.png
  console.log('3. Rendering docs/images/logo.png from assets/logo.svg...');
  const logoSvgPath = path.resolve('assets/logo.svg');
  const logoHtml = `<html><body style="margin:0;background:transparent;"><img src="file://${logoSvgPath.replace(/\\/g, '/')}" width="512" height="512"/></body></html>`;
  await page.setContent(logoHtml);
  const logoImg = await page.$('img');
  if (logoImg) {
    await logoImg.screenshot({ path: path.join(docsDir, 'logo.png'), omitBackground: true });
  }

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // B. Capture Web Studio Dashboard
  console.log('4. Navigating to RedTeamLens Studio...');
  await page.goto(studioUrl, { waitUntil: 'networkidle0' });
  // Wait for scan to complete and table rows to appear
  await page.waitForFunction(() => {
    return document.querySelectorAll('table tbody tr').length > 5;
  }, { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log('5. Capturing docs/images/redteamlens-dashboard.png...');
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-dashboard.png') });

  // C. Open Inspector Modal and capture screenshot
  console.log('6. Opening Inspector Modal...');
  const inspectBtn = await page.$('table tbody tr button');
  if (inspectBtn) {
    await inspectBtn.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('7. Capturing docs/images/redteamlens-inspector.png...');
    await page.screenshot({ path: path.join(docsDir, 'redteamlens-inspector.png') });

    // Close modal
    const closeBtn = await page.$('button svg[class*="lucide-x"]');
    if (closeBtn) await closeBtn.click();
  }

  // D. Generate HTML report and capture screenshot
  console.log('8. Generating HTML Report screenshot...');
  const scanner = new ScannerEngine({ target: new MockAgentTarget({ hardened: false }), concurrency: 5 });
  const report = await scanner.runScan({ target: new MockAgentTarget({ hardened: false }), limit: 25 });
  const htmlContent = HtmlReportGenerator.generate(report);
  const reportPath = path.resolve('docs/images/temp-report.html');
  fs.writeFileSync(reportPath, htmlContent);

  await page.goto(`file://${reportPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-report.png') });
  fs.unlinkSync(reportPath);

  // E. Build frames for animated demo GIF
  console.log('9. Recording frames for redteamlens_demo.gif...');
  const framesDir = path.resolve('docs/images/frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  await page.goto(studioUrl, { waitUntil: 'networkidle0' });

  // Reset or run a fresh scan
  let frameIdx = 0;
  for (let i = 0; i < 24; i++) {
    const frameFile = path.join(framesDir, `frame_${String(frameIdx++).padStart(3, '0')}.png`);
    await page.screenshot({ path: frameFile });
    await new Promise(r => setTimeout(r, 250));
  }

  // If inspect button exists, click it in the middle of GIF
  const inspectBtnGif = await page.$('table tbody tr button');
  if (inspectBtnGif) {
    await inspectBtnGif.click();
    for (let i = 0; i < 16; i++) {
      const frameFile = path.join(framesDir, `frame_${String(frameIdx++).padStart(3, '0')}.png`);
      await page.screenshot({ path: frameFile });
      await new Promise(r => setTimeout(r, 250));
    }
  }

  await browser.close();
  await server.stop();

  // F. Use ffmpeg to compile GIF
  console.log('10. Compiling GIF with ffmpeg...');
  const gifOutput = path.join(docsDir, 'redteamlens_demo.gif');
  const ffmpegCmd = `ffmpeg -y -framerate 4 -i "${framesDir.replace(/\\/g, '/')}/frame_%03d.png" -vf "fps=10,scale=1000:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${gifOutput.replace(/\\/g, '/')}"`;

  try {
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log(`✓ Animated demo GIF created at ${gifOutput}`);
  } catch (err) {
    console.error('ffmpeg failed:', err);
  }

  // Cleanup frames
  fs.rmSync(framesDir, { recursive: true, force: true });

  console.log('✓ All visual assets successfully generated in docs/images!');
}

run().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
