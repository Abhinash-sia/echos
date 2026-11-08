import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/home/abhi/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const SCREENSHOTS_DIR = path.resolve('screenshots');

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
  console.log('--- STAGE 9F: Comprehensive Browser Verification & Screenshots ---');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

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
  console.log('CDP Connected.');

  await sendCdp(ws, 'Page.enable');

  async function capture(name, options = {}) {
    const {
      w = 1440,
      h = 900,
      scale = 1.5,
      scrollY = 0,
      fullPage = false,
      isDark = false,
      reducedMotion = false,
      mobile = false,
    } = options;

    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: scale,
      mobile,
    });

    if (reducedMotion) {
      await sendCdp(ws, 'Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    } else {
      await sendCdp(ws, 'Emulation.setEmulatedMedia', { features: [] });
    }

    // Set Theme
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        if (${isDark}) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      `,
    });
    await wait(300);

    if (scrollY > 0) {
      await sendCdp(ws, 'Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
      });
      await wait(600);
    }

    let shot;
    if (fullPage) {
      const heightRes = await sendCdp(ws, 'Runtime.evaluate', {
        expression: 'document.body.scrollHeight',
      });
      const totalH = heightRes.result.value || 7000;

      // Scroll through to trigger all reveals
      for (let y = 0; y < totalH; y += 700) {
        await sendCdp(ws, 'Runtime.evaluate', {
          expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`,
        });
        await wait(60);
      }
      await sendCdp(ws, 'Runtime.evaluate', {
        expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
      });
      await wait(600);

      await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
        width: w,
        height: totalH,
        deviceScaleFactor: 1.0,
        mobile,
      });
      await wait(800);

      shot = await sendCdp(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
      });
    } else {
      shot = await sendCdp(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
    }

    const filePath = path.join(SCREENSHOTS_DIR, name);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(
      `Saved: ${name} (${(Buffer.from(shot.data, 'base64').length / 1024).toFixed(1)} KB)`
    );
  }

  // Navigate to Home
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000' });
  await wait(3000);

  // 1. DESKTOP LIGHT THEME (All sections)
  console.log('Capturing Desktop Light Theme...');
  await capture('stage9f_desktop_hero_light.png', { w: 1440, h: 900, scrollY: 0, isDark: false });
  await capture('stage9f_desktop_manifesto_light.png', {
    w: 1440,
    h: 900,
    scrollY: 920,
    isDark: false,
  });
  await capture('stage9f_desktop_contact_sheet_light.png', {
    w: 1440,
    h: 900,
    scrollY: 2100,
    isDark: false,
  });
  await capture('stage9f_desktop_archive_light.png', {
    w: 1440,
    h: 900,
    scrollY: 3100,
    isDark: false,
  });
  await capture('stage9f_desktop_chamber_light.png', {
    w: 1440,
    h: 900,
    scrollY: 4100,
    isDark: false,
  });
  await capture('stage9f_desktop_chronology_light.png', {
    w: 1440,
    h: 900,
    scrollY: 5100,
    isDark: false,
  });
  await capture('stage9f_desktop_showcase_light.png', {
    w: 1440,
    h: 900,
    scrollY: 6300,
    isDark: false,
  });
  await capture('stage9f_desktop_epilogue_light.png', {
    w: 1440,
    h: 900,
    scrollY: 7500,
    isDark: false,
  });
  await capture('stage9f_desktop_fullpage_light.png', {
    w: 1440,
    h: 900,
    fullPage: true,
    isDark: false,
  });

  // 2. DESKTOP DARK THEME (All sections)
  console.log('Capturing Desktop Dark Theme...');
  await capture('stage9f_desktop_hero_dark.png', { w: 1440, h: 900, scrollY: 0, isDark: true });
  await capture('stage9f_desktop_manifesto_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 920,
    isDark: true,
  });
  await capture('stage9f_desktop_contact_sheet_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 2100,
    isDark: true,
  });
  await capture('stage9f_desktop_archive_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 3100,
    isDark: true,
  });
  await capture('stage9f_desktop_chamber_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 4100,
    isDark: true,
  });
  await capture('stage9f_desktop_chronology_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 5100,
    isDark: true,
  });
  await capture('stage9f_desktop_showcase_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 6300,
    isDark: true,
  });
  await capture('stage9f_desktop_epilogue_dark.png', {
    w: 1440,
    h: 900,
    scrollY: 7500,
    isDark: true,
  });
  await capture('stage9f_desktop_fullpage_dark.png', {
    w: 1440,
    h: 900,
    fullPage: true,
    isDark: true,
  });

  // 3. MOBILE VIEWPORTS (375px & 390px)
  console.log('Capturing Mobile Viewports...');
  await capture('stage9f_mobile_hero_375.png', {
    w: 375,
    h: 812,
    scale: 2.0,
    scrollY: 0,
    mobile: true,
    isDark: false,
  });
  await capture('stage9f_mobile_contact_sheet_375.png', {
    w: 375,
    h: 812,
    scale: 2.0,
    scrollY: 1800,
    mobile: true,
    isDark: false,
  });
  await capture('stage9f_mobile_chamber_375.png', {
    w: 375,
    h: 812,
    scale: 2.0,
    scrollY: 3700,
    mobile: true,
    isDark: false,
  });
  await capture('stage9f_mobile_chronology_375.png', {
    w: 375,
    h: 812,
    scale: 2.0,
    scrollY: 4800,
    mobile: true,
    isDark: false,
  });
  await capture('stage9f_mobile_footer_375.png', {
    w: 375,
    h: 812,
    scale: 2.0,
    scrollY: 7200,
    mobile: true,
    isDark: false,
  });
  await capture('stage9f_mobile_fullpage_375.png', {
    w: 375,
    h: 812,
    scale: 1.0,
    fullPage: true,
    mobile: true,
    isDark: false,
  });

  // 4. ACCESSIBILITY & MOTION
  console.log('Capturing Reduced-Motion & Responsive Checks...');
  await capture('stage9f_reduced_motion.png', {
    w: 1440,
    h: 900,
    scrollY: 0,
    reducedMotion: true,
    isDark: false,
  });
  await capture('stage9f_viewport_320.png', {
    w: 320,
    h: 700,
    scale: 1.5,
    scrollY: 0,
    mobile: true,
    isDark: false,
  });
  await capture('stage9f_viewport_768_tablet.png', {
    w: 768,
    h: 1024,
    scale: 1.5,
    scrollY: 0,
    mobile: false,
    isDark: false,
  });
  await capture('stage9f_viewport_1920_large.png', {
    w: 1920,
    h: 1080,
    scale: 1.0,
    scrollY: 0,
    mobile: false,
    isDark: false,
  });

  console.log('Verification captures completed successfully!');

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
