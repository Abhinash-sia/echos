import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/home/abhi/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const REPORT_DIR = path.resolve('public/images/report');

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
  console.log('--- Stage 9C Landing Page Verification & Screenshot Capture ---');

  // 1. Start In-Memory MongoDB on ephemeral port
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  console.log('MongoMemoryServer active at:', mongoUri);

  // 2. Start Next.js server
  console.log('2. Starting Next.js Production Server...');
  const nextProcess = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: '3000', MONGODB_URI: mongoUri },
    stdio: 'inherit',
  });

  await waitForServer('http://localhost:3000');
  console.log('Next.js server is live at http://localhost:3000');

  // 3. Launch Headless Chrome
  console.log('3. Launching Headless Chrome with CDP...');
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
  console.log('CDP WebSocket connected!');

  await sendCdp(ws, 'Page.enable');

  const captures = [
    // Desktop Viewport
    {
      name: 'stage9c_landing_desktop.png',
      w: 1600,
      h: 1000,
      scale: 1.5,
      fullPage: false,
    },
    // Desktop Full Page (All 8 Moments)
    {
      name: 'stage9c_landing_desktop_full.png',
      w: 1440,
      h: 900,
      scale: 1,
      fullPage: true,
    },
    // Tablet Viewport
    {
      name: 'stage9c_landing_tablet.png',
      w: 768,
      h: 1024,
      scale: 1.5,
      fullPage: false,
    },
    // Mobile Viewport
    {
      name: 'stage9c_landing_mobile.png',
      w: 375,
      h: 812,
      scale: 2,
      fullPage: false,
    },
  ];

  for (const cap of captures) {
    console.log(`Capturing ${cap.name} (${cap.w}x${cap.h}, fullPage: ${cap.fullPage})...`);
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: cap.w,
      height: cap.h,
      deviceScaleFactor: cap.scale,
      mobile: cap.w < 768,
    });

    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await wait(3500);

    const { data } = await sendCdp(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: cap.fullPage,
    });

    const filePath = path.join(REPORT_DIR, cap.name);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    const stats = fs.statSync(filePath);
    console.log(`Saved: ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // Teardown
  console.log('\nCleaning up processes...');
  ws.close();
  chromeProcess.kill('SIGTERM');
  nextProcess.kill('SIGTERM');
  await mongod.stop();

  console.log('✅ Stage 9C genuine screenshots captured successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
