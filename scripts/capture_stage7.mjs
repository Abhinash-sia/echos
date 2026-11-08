import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';

const JWT_SECRET = 'development_jwt_secret_key_minimum_32_characters_for_hs256_echoes';
const CHROME_PATH = '/home/abhi/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const REPORT_DIR = path.resolve('public/images/report');

// Schema definitions
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tokenVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const MemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    memoryDate: { type: Date, required: true },
    tags: [String],
    photos: [
      {
        url: String,
        signedUrl: String,
        caption: String,
      },
    ],
  },
  { timestamps: true }
);

const CapsuleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String },
    unlockDate: { type: Date, required: true },
    sealedAt: { type: Date, required: true },
    isOpened: { type: Boolean, default: false },
    openedAt: { type: Date },
    isLocked: { type: Boolean, default: true },
    photos: [String],
  },
  { timestamps: true }
);

async function signToken(userId, email, tokenVersion = 1) {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({
    userId,
    email,
    tokenVersion,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
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
  console.log('--- Stage 7 Verification & Genuine Screenshots ---');
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // 1. Start In-Memory MongoDB on 27017
  console.log('1. Starting MongoMemoryServer on port 27017...');
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: 'echoes' },
  });
  console.log('MongoMemoryServer active at:', mongod.getUri());

  // 2. Seed Data
  console.log('2. Connecting to MongoDB to seed test archivist data...');
  await mongoose.connect(mongod.getUri());
  const User = mongoose.model('User', UserSchema);
  const Memory = mongoose.model('Memory', MemorySchema);
  const Capsule = mongoose.model('TimeCapsule', CapsuleSchema);

  await User.deleteMany({});
  await Memory.deleteMany({});
  await Capsule.deleteMany({});

  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Eleanor Vance',
    email: 'eleanor@echoes.vault',
    password: hashedPassword,
    tokenVersion: 1,
  });

  const authToken = await signToken(user._id.toString(), user.email, 1);
  console.log('Created user:', user.email, 'with ID:', user._id.toString());

  // Seed memories
  await Memory.create({
    userId: user._id,
    title: 'The Silent Observatory at Dusk',
    content:
      'Standing at the balcony overlooking the misty cedar mountain ridges. The stillness in the air captured the exact feeling of timelessness.',
    memoryDate: new Date('2026-10-14'),
    tags: ['Sanctuary', 'Architecture', 'Solitude'],
    photos: [
      {
        url: '/images/architecture/arch_sunlight_interior.webp',
        signedUrl: '/images/architecture/arch_sunlight_interior.webp',
        caption: 'Morning sun beam cutting through window',
      },
    ],
  });

  await Memory.create({
    userId: user._id,
    title: 'Autumn Letters on Deckle Cotton Paper',
    content:
      'Every stroke of the fountain pen felt deliberate. Preserved words sealed in warm amber wax.',
    memoryDate: new Date('2026-10-18'),
    tags: ['Correspondence', 'Analogue', 'Reflections'],
    photos: [
      {
        url: '/images/photography/photo_hands_letter.webp',
        signedUrl: '/images/photography/photo_hands_letter.webp',
        caption: 'Fountain pen and deckle edge parchment',
      },
    ],
  });

  // Seed capsules
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);

  await Capsule.create({
    userId: user._id,
    title: 'Reflections for Epoch 2028',
    message:
      'To the one reading this two years hence: remember the sanctuary you built with patience.',
    unlockDate: futureDate,
    sealedAt: new Date(),
    isOpened: false,
    isLocked: true,
  });

  await Capsule.create({
    userId: user._id,
    title: 'Letter from Winter 2025',
    message: 'The journey was quiet. You are standing where you wished you would be.',
    unlockDate: pastDate,
    sealedAt: new Date(Date.now() - 30 * 86400000),
    isOpened: true,
    openedAt: new Date(),
    isLocked: false,
  });

  console.log('Seeded 2 memories and 2 capsules successfully.');

  // 3. Start Next.js server
  console.log('3. Starting Next.js Production Server with MONGODB_URI:', mongod.getUri());
  const nextProcess = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: '3000', MONGODB_URI: mongod.getUri() },
    stdio: 'inherit',
  });

  await waitForServer('http://localhost:3000');
  console.log('Next.js server is responding on http://localhost:3000');

  // 4. Start Chrome with remote debugging
  console.log('4. Launching Headless Chrome with CDP...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ]);

  await wait(1500);

  // Connect to Chrome DevTools Protocol
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
  await sendCdp(ws, 'Network.enable');

  // Set auth cookie
  await sendCdp(ws, 'Network.setCookie', {
    name: 'auth_token',
    value: authToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  const shots = [
    // Desktop (1920x1080)
    { name: 'stage7_landing_desktop.png', url: 'http://localhost:3000/', w: 1920, h: 1080 },
    {
      name: 'stage7_dashboard_desktop.png',
      url: 'http://localhost:3000/dashboard',
      w: 1920,
      h: 1080,
    },
    {
      name: 'stage7_memories_desktop.png',
      url: 'http://localhost:3000/memories',
      w: 1920,
      h: 1080,
    },
    {
      name: 'stage7_capsules_desktop.png',
      url: 'http://localhost:3000/capsules',
      w: 1920,
      h: 1080,
    },
    {
      name: 'stage7_timeline_desktop.png',
      url: 'http://localhost:3000/timeline',
      w: 1920,
      h: 1080,
    },
    { name: 'stage7_profile_desktop.png', url: 'http://localhost:3000/profile', w: 1920, h: 1080 },
    {
      name: 'stage7_settings_desktop.png',
      url: 'http://localhost:3000/settings',
      w: 1920,
      h: 1080,
    },

    // Tablet (768x1024)
    {
      name: 'stage7_dashboard_tablet.png',
      url: 'http://localhost:3000/dashboard',
      w: 768,
      h: 1024,
    },
    { name: 'stage7_timeline_tablet.png', url: 'http://localhost:3000/timeline', w: 768, h: 1024 },
    { name: 'stage7_profile_tablet.png', url: 'http://localhost:3000/profile', w: 768, h: 1024 },

    // Mobile (375x812)
    { name: 'stage7_landing_mobile.png', url: 'http://localhost:3000/', w: 375, h: 812 },
    { name: 'stage7_dashboard_mobile.png', url: 'http://localhost:3000/dashboard', w: 375, h: 812 },
    { name: 'stage7_timeline_mobile.png', url: 'http://localhost:3000/timeline', w: 375, h: 812 },
    { name: 'stage7_profile_mobile.png', url: 'http://localhost:3000/profile', w: 375, h: 812 },

    // Small Mobile (320x700)
    {
      name: 'stage7_dashboard_small_mobile.png',
      url: 'http://localhost:3000/dashboard',
      w: 320,
      h: 700,
    },
    {
      name: 'stage7_profile_small_mobile.png',
      url: 'http://localhost:3000/profile',
      w: 320,
      h: 700,
    },
  ];

  for (const shot of shots) {
    console.log(`Capturing ${shot.name} (${shot.w}x${shot.h}) at ${shot.url}...`);
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: shot.w,
      height: shot.h,
      deviceScaleFactor: 1,
      mobile: shot.w < 768,
    });

    await sendCdp(ws, 'Page.navigate', { url: shot.url });
    await wait(1800); // Wait for animations and data fetch

    const { data } = await sendCdp(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    const filePath = path.join(REPORT_DIR, shot.name);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`Saved: ${filePath}`);
  }

  // Also capture Mobile Navigation Drawer open
  console.log('Capturing Mobile Navigation Drawer open on 375x812...');
  await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await wait(1500);

  // Click hamburger menu
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('button[aria-label="Open mobile navigation drawer"]');
      if (btn) btn.click();
    `,
  });
  await wait(600);

  const drawerShot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(
    path.join(REPORT_DIR, 'stage7_mobile_drawer_open.png'),
    Buffer.from(drawerShot.data, 'base64')
  );
  console.log('Saved: stage7_mobile_drawer_open.png');

  // Cleanup
  console.log('Closing Chrome and servers...');
  ws.close();
  chromeProcess.kill('SIGTERM');
  nextProcess.kill('SIGTERM');
  await mongoose.disconnect();
  await mongod.stop();

  console.log('✅ Stage 7 genuine screenshots captured successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
