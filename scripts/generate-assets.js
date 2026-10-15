import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { Resvg } from '@resvg/resvg-js';
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
  // 1. Render official anti-slop developer-branding logo
  console.log('1. Rendering docs/images/logo.png via Resvg...');
  const svg = fs.readFileSync('assets/logo.svg', 'utf8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(path.join(docsDir, 'logo.png'), pngBuffer);
  console.log(`✓ Generated docs/images/logo.png (${pngBuffer.length} bytes)`);

  // 2. Start Local Studio Server
  console.log('2. Starting LocalServer on port 50096...');
  const server = new LocalServer({ port: 50096 });
  const port = await server.start();
  const studioUrl = `http://localhost:${port}`;
  console.log(`Server started at ${studioUrl}`);

  // 3. Launch headless Chrome via puppeteer-core
  console.log('3. Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 4. Navigate to RedTeamLens Studio & wait for automatic scan to finish
  console.log('4. Navigating to RedTeamLens Studio...');
  await page.goto(studioUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return document.querySelectorAll('table tbody tr').length > 5;
  }, { timeout: 35000 });
  await new Promise(r => setTimeout(r, 2000));

  // 5. Capture Live Studio Dashboard (Desktop 1440x900)
  console.log('5. Capturing docs/images/redteamlens-dashboard.png...');
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-dashboard.png') });

  // 6. Open Inspector Modal and capture screenshot
  console.log('6. Opening Inspector Modal...');
  const inspectBtn = await page.$('table tbody tr button');
  if (inspectBtn) {
    await inspectBtn.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('7. Capturing docs/images/redteamlens-inspector.png...');
    await page.screenshot({ path: path.join(docsDir, 'redteamlens-inspector.png') });

    // Close modal
    const closeBtn = await page.$('button svg[class*="lucide-x"]');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 7. Switch to Ad-Hoc Playground tab
  console.log('8. Capturing Playground View...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Playground'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click "Dispatch Adversarial Probe"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dispatchBtn = btns.find(b => b.textContent && b.textContent.includes('Dispatch'));
    if (dispatchBtn) dispatchBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('9. Capturing docs/images/redteamlens-playground.png...');
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-playground.png') });

  // 8. Switch to Audit Comparator tab
  console.log('10. Capturing Comparator View...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Comparator'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click "Run Before vs After Benchmark"
  const benchResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const benchBtn = btns.find(b => b.textContent && b.textContent.includes('Benchmark'));
    if (benchBtn) {
      benchBtn.click();
      return 'CLICKED';
    }
    return btns.map(b => b.textContent.trim());
  });
  // Wait for benchmark to run with diagnostic logging
  let benchmarkLoaded = false;
  for (let s = 0; s < 25; s++) {
    await new Promise(r => setTimeout(r, 500));
    const pageText = await page.evaluate(() => document.body ? document.body.innerText : '');
    if (pageText.includes('Score Delta')) {
      console.log(`✓ Comparator benchmark finished at ${(s + 1) * 0.5}s`);
      benchmarkLoaded = true;
      break;
    }
    if (s % 4 === 0) {
      console.log(`Waiting for comparator... (${(s + 1) * 0.5}s elapsed)`);
    }
  }
  if (!benchmarkLoaded) {
    console.log('Comparator benchmark still loading or completed without Score Delta text');
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('11. Capturing docs/images/redteamlens-comparator.png...');
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-comparator.png') });

  // 9. Mobile Responsiveness Screenshot (iPhone 14 Viewport 390x844)
  console.log('12. Capturing Mobile Responsive View (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // Switch back to Scanner tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header button, nav button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Scanner'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('13. Capturing docs/images/redteamlens-mobile.png...');
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-mobile.png') });

  // Reset desktop viewport for HTML report & GIF
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 10. Generate HTML report and capture screenshot
  console.log('14. Generating HTML Report screenshot...');
  const scanner = new ScannerEngine({ target: new MockAgentTarget({ hardened: false }), concurrency: 5 });
  const report = await scanner.runScan({ target: new MockAgentTarget({ hardened: false }), limit: 25 });
  const htmlContent = HtmlReportGenerator.generate(report);
  const reportPath = path.resolve('docs/images/temp-report.html');
  fs.writeFileSync(reportPath, htmlContent);

  await page.goto(`file://${reportPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  console.log('15. Capturing docs/images/redteamlens-report.png...');
  await page.screenshot({ path: path.join(docsDir, 'redteamlens-report.png') });
  fs.unlinkSync(reportPath);

  // 11. Build frames for animated demo GIF
  console.log('16. Recording frames for redteamlens_demo.gif...');
  const framesDir = path.resolve('docs/images/frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  await page.goto(studioUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return document.querySelectorAll('table tbody tr').length > 5;
  }, { timeout: 35000 });
  await new Promise(r => setTimeout(r, 1000));

  let frameIdx = 0;
  // Sequence 1: Scanner Dashboard (12 frames)
  for (let i = 0; i < 12; i++) {
    const frameFile = path.join(framesDir, `frame_${String(frameIdx++).padStart(3, '0')}.png`);
    await page.screenshot({ path: frameFile });
    await new Promise(r => setTimeout(r, 200));
  }

  // Sequence 2: Open Inspector (10 frames)
  const inspBtn = await page.$('table tbody tr button');
  if (inspBtn) {
    await inspBtn.click();
    await new Promise(r => setTimeout(r, 500));
    for (let i = 0; i < 10; i++) {
      const frameFile = path.join(framesDir, `frame_${String(frameIdx++).padStart(3, '0')}.png`);
      await page.screenshot({ path: frameFile });
      await new Promise(r => setTimeout(r, 200));
    }
    const cls = await page.$('button svg[class*="lucide-x"]');
    if (cls) await cls.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // Sequence 3: Switch to Playground & Dispatch (10 frames)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Playground'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Dispatch'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  for (let i = 0; i < 10; i++) {
    const frameFile = path.join(framesDir, `frame_${String(frameIdx++).padStart(3, '0')}.png`);
    await page.screenshot({ path: frameFile });
    await new Promise(r => setTimeout(r, 200));
  }

  // Sequence 4: Switch to Comparator (10 frames)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Comparator'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  for (let i = 0; i < 10; i++) {
    const frameFile = path.join(framesDir, `frame_${String(frameIdx++).padStart(3, '0')}.png`);
    await page.screenshot({ path: frameFile });
    await new Promise(r => setTimeout(r, 200));
  }

  await browser.close();
  await server.stop();

  // 12. Compile optimized demo GIF with ffmpeg
  console.log('17. Compiling GIF with ffmpeg...');
  const gifOutput = path.join(docsDir, 'redteamlens_demo.gif');
  const ffmpegCmd = `ffmpeg -y -framerate 4 -i "${framesDir.replace(/\\/g, '/')}/frame_%03d.png" -vf "fps=8,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer" "${gifOutput.replace(/\\/g, '/')}"`;

  try {
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log(`✓ Animated demo GIF created at ${gifOutput}`);
  } catch (err) {
    console.error('ffmpeg failed:', err);
  }

  // Cleanup frames directory
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('✓ All visual assets successfully generated in docs/images!');
}

run().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
