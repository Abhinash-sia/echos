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
  console.log('--- Stage 9D Motion & Interaction Verification Capture ---');

  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  console.log('MongoMemoryServer active at:', mongoUri);

  console.log('Starting Next.js Production Server...');
  const nextProcess = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: '3000', MONGODB_URI: mongoUri },
    stdio: 'inherit',
  });

  await waitForServer('http://localhost:3000');
  console.log('Next.js server is responding at http://localhost:3000');

  console.log('Launching Headless Chrome with CDP...');
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

  // Helper to capture a screenshot
  async function captureShot(name, scrollY = 0, options = {}) {
    const { w = 1600, h = 1000, scale = 1.5, mobile = false, mediaFeatures = [] } = options;

    if (mediaFeatures.length > 0) {
      await sendCdp(ws, 'Emulation.setEmulatedMedia', { media: '', features: mediaFeatures });
    } else {
      await sendCdp(ws, 'Emulation.setEmulatedMedia', { media: '', features: [] });
    }

    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: scale,
      mobile,
    });

    if (scrollY > 0) {
      await sendCdp(ws, 'Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
      });
      await wait(1000);
    }

    const { data } = await sendCdp(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    const filePath = path.join(REPORT_DIR, name);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    const stats = fs.statSync(filePath);
    console.log(`Saved: ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // 1. Initial Page Load - Hero Entrance Sequence
  console.log('\n1. Capturing Hero Entrance Sequence...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await wait(2200); // Wait for GSAP entrance timeline to execute
  await captureShot('stage9d_hero_entrance.png', 0);

  // 2. Hero-to-Manifesto Transition (Scroll Y = 500)
  console.log('\n2. Capturing Hero-to-Manifesto Scroll Transition...');
  await captureShot('stage9d_hero_exit_manifesto.png', 550);

  // 3. Contact Sheet Pinned Frame Inspection (Scroll Y = 1600)
  console.log('\n3. Capturing 35mm Contact Sheet Animation...');
  await captureShot('stage9d_contact_sheet_pinned.png', 1650);

  // 4. Sealing Chamber & Astrolabe Interaction (Scroll Y = 3200)
  console.log('\n4. Capturing Sealing Chamber with Astrolabe...');
  // Click the 2030 milestone button in the browser
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: `
      window.scrollTo({ top: 3250, behavior: 'instant' });
      const btns = Array.from(document.querySelectorAll('button'));
      const yr2035 = btns.find(b => b.textContent && b.textContent.includes('2035'));
      if (yr2035) yr2035.click();
    `,
  });
  await wait(1400); // Wait for needle rotation
  await captureShot('stage9d_sealing_chamber_astrolabe.png', 3250);

  // 5. Timeline Reveal (Scroll Y = 4300)
  console.log('\n5. Capturing Progressive Chronology Timeline...');
  await captureShot('stage9d_timeline_progressive_spine.png', 4300);

  // 6. Product Showcase 3D Frame (Scroll Y = 5500)
  console.log('\n6. Capturing Product Showcase Interface...');
  await captureShot('stage9d_product_showcase_3d.png', 5500);

  // 7. Mobile Viewport Experience (375x812)
  console.log('\n7. Capturing Mobile Touch-Friendly Viewport...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await wait(2000);
  await captureShot('stage9d_mobile_motion.png', 0, { w: 375, h: 812, scale: 2, mobile: true });

  // 8. Reduced-Motion Experience (Prefers-reduced-motion: reduce)
  console.log('\n8. Capturing Reduced-Motion Fallback...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await captureShot('stage9d_reduced_motion.png', 0, {
    w: 1600,
    h: 1000,
    scale: 1.5,
    mobile: false,
    mediaFeatures: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });

  // Teardown
  console.log('\nCleaning up processes...');
  ws.close();
  chromeProcess.kill('SIGTERM');
  nextProcess.kill('SIGTERM');
  await mongod.stop();

  console.log('✅ Stage 9D motion verification captures completed successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during motion capture:', err);
  process.exit(1);
});
