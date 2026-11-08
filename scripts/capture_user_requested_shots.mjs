import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/home/abhi/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const REPORT_DIR = path.resolve('public/images/report');
const ARTIFACT_DIR = '/home/abhi/.gemini/antigravity/brain/f06dbf05-3f7b-41c6-9aad-3e769d393af2';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 307 || res.status === 401) {
        return true;
      }
    } catch {
      // wait
    }
    await wait(300);
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function sendCdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  const msg = JSON.stringify({ id, method, params });
  return new Promise((resolve, reject) => {
    function onMessage(event) {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.id === id) {
          ws.removeEventListener('message', onMessage);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.result);
        }
      } catch (e) {
        reject(e);
      }
    }
    ws.addEventListener('message', onMessage);
    ws.send(msg);
  });
}

async function run() {
  console.log('--- Capturing 4 Requested Visual Verification Screenshots ---');

  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  const nextProcess = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: '3000', MONGODB_URI: mongoUri },
    stdio: 'inherit',
  });

  await waitForServer('http://localhost:3000');

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ]);

  await wait(1500);

  const jsonRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await jsonRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new globalThis.WebSocket(wsUrl);
  await new Promise((resolve) => {
    ws.onopen = () => resolve();
  });
  console.log('CDP connected.');

  await sendCdp(ws, 'Page.enable');
  await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1.5,
    mobile: false,
  });

  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000' });
  await wait(3500); // Wait for entrance animations and canvas to settle

  // 1. Hero Section
  console.log('1. Capturing Hero Section...');
  const heroShot = await sendCdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    path.join(REPORT_DIR, 'echoes_hero_section.png'),
    Buffer.from(heroShot.data, 'base64')
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'echoes_hero_section.png'),
    Buffer.from(heroShot.data, 'base64')
  );

  // 2. Middle Section - Sealing Chamber
  console.log('2. Capturing Sealing Chamber Section...');
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: `
      const el = document.getElementById('chamber');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      else window.scrollTo({ top: 3800, behavior: 'instant' });
    `,
  });
  await wait(1500);
  const chamberShot = await sendCdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    path.join(REPORT_DIR, 'echoes_sealing_chamber.png'),
    Buffer.from(chamberShot.data, 'base64')
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'echoes_sealing_chamber.png'),
    Buffer.from(chamberShot.data, 'base64')
  );

  // 3. Final CTA & Footer Section (Epilogue)
  console.log('3. Capturing Final CTA / Footer Section...');
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: `
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    `,
  });
  await wait(1500);
  const footerShot = await sendCdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    path.join(REPORT_DIR, 'echoes_final_cta_footer.png'),
    Buffer.from(footerShot.data, 'base64')
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'echoes_final_cta_footer.png'),
    Buffer.from(footerShot.data, 'base64')
  );

  // 4. Full-page Desktop Landing Page
  console.log('4. Capturing Full-Page Desktop Landing Page...');
  // Scroll through to trigger all ScrollTriggers and populate images
  const totalHeightRes = await sendCdp(ws, 'Runtime.evaluate', {
    expression: 'document.body.scrollHeight',
  });
  const totalHeight = totalHeightRes.result.value || 8000;

  for (let y = 0; y < totalHeight; y += 800) {
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`,
    });
    await wait(100);
  }
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
  });
  await wait(1000);

  // Set device metrics to cover the entire page
  await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: totalHeight,
    deviceScaleFactor: 1.0,
    mobile: false,
  });
  await wait(1000);

  const fullShot = await sendCdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  fs.writeFileSync(
    path.join(REPORT_DIR, 'echoes_full_page_desktop.png'),
    Buffer.from(fullShot.data, 'base64')
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'echoes_full_page_desktop.png'),
    Buffer.from(fullShot.data, 'base64')
  );

  console.log('Screenshots captured successfully!');

  // Cleanup
  ws.close();
  chromeProcess.kill('SIGTERM');
  nextProcess.kill('SIGTERM');
  await mongod.stop();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
