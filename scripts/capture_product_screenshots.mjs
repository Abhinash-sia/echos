import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';

const JWT_SECRET = 'development_jwt_secret_key_minimum_32_characters_for_hs256_echoes';
const CHROME_PATH = '/home/abhi/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const PRODUCT_DIR = path.resolve('public/images/product');
const RAW_DIR = path.resolve('public/images/raw');

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

const PhotoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Memory' },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String, default: 'webp' },
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 900 },
    bytes: { type: Number, default: 150000 },
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
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
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
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
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
  console.log('--- Stage 9B.4 Genuine Product Screenshots Capture ---');

  if (!fs.existsSync(PRODUCT_DIR)) {
    fs.mkdirSync(PRODUCT_DIR, { recursive: true });
  }
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  // 1. Start In-Memory MongoDB on ephemeral port
  console.log('1. Starting isolated MongoMemoryServer...');
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  console.log('MongoMemoryServer active at:', mongoUri);

  // 2. Connect & Seed realistic editorial archivist data
  console.log('2. Connecting to MongoDB to seed test archivist data...');
  await mongoose.connect(mongoUri);
  const User = mongoose.model('User', UserSchema);
  const Photo = mongoose.model('Photo', PhotoSchema);
  const Memory = mongoose.model('Memory', MemorySchema);
  const Capsule = mongoose.model('TimeCapsule', CapsuleSchema);

  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Eleanor Vance',
    email: 'eleanor@echoes.vault',
    password: hashedPassword,
    tokenVersion: 1,
  });

  const authToken = await signToken(user._id.toString(), user.email, 1);
  console.log('Created user:', user.email, 'with ID:', user._id.toString());

  // Create authentic photographic assets in MongoDB
  const photo1 = await Photo.create({
    userId: user._id,
    url: '/images/architecture/arch_sunlight_interior.webp',
    publicId: 'arch_sunlight_interior',
    format: 'webp',
    width: 1200,
    height: 900,
    bytes: 85000,
  });

  const photo2 = await Photo.create({
    userId: user._id,
    url: '/images/photography/photo_hands_letter.webp',
    publicId: 'photo_hands_letter',
    format: 'webp',
    width: 1200,
    height: 900,
    bytes: 92000,
  });

  const photo3 = await Photo.create({
    userId: user._id,
    url: '/images/landscapes/landscape_golden_lake.webp',
    publicId: 'landscape_golden_lake',
    format: 'webp',
    width: 1200,
    height: 900,
    bytes: 110000,
  });

  const photo4 = await Photo.create({
    userId: user._id,
    url: '/images/photography/photo_vintage_camera.webp',
    publicId: 'photo_vintage_camera',
    format: 'webp',
    width: 1200,
    height: 900,
    bytes: 98000,
  });

  // Seed authentic memories with editorial photography
  const mem1 = await Memory.create({
    userId: user._id,
    title: 'The Silent Observatory at Dusk',
    content:
      'Standing at the balcony overlooking the misty cedar mountain ridges. The stillness in the raking morning sunlight captured the exact feeling of timelessness.',
    memoryDate: new Date('2026-10-14'),
    tags: ['sanctuary', 'architecture', 'solitude'],
    photos: [photo1._id],
  });
  photo1.memoryId = mem1._id;
  await photo1.save();

  const mem2 = await Memory.create({
    userId: user._id,
    title: 'Autumn Letters on Deckle Cotton Paper',
    content:
      'Every stroke of the fountain pen felt deliberate. Preserved words sealed in warm amber wax on heavy handmade parchment.',
    memoryDate: new Date('2026-10-18'),
    tags: ['correspondence', 'analogue', 'reflections'],
    photos: [photo2._id],
  });
  photo2.memoryId = mem2._id;
  await photo2.save();

  const mem3 = await Memory.create({
    userId: user._id,
    title: 'First Daylight on the Golden Lake',
    content:
      'The morning light touched the ripples in amber tones. We gathered stones along the shore, marking the anniversary of our quiet pledge.',
    memoryDate: new Date('2026-10-25'),
    tags: ['dawn', 'journey', 'nature'],
    photos: [photo3._id],
  });
  photo3.memoryId = mem3._id;
  await photo3.save();

  const mem4 = await Memory.create({
    userId: user._id,
    title: 'Mechanical Rangefinder & Spare Canisters',
    content:
      'Loading the last roll of 400 ISO negative film. The tactile mechanical click of the shutter advance wheel ground into memory.',
    memoryDate: new Date('2026-10-29'),
    tags: ['photography', '35mm', 'mechanical'],
    photos: [photo4._id],
  });
  photo4.memoryId = mem4._id;
  await photo4.save();

  // Seed locked and unlocked capsules
  const futureLockedDate = new Date();
  futureLockedDate.setFullYear(futureLockedDate.getFullYear() + 4);

  const lockedCapsule = await Capsule.create({
    userId: user._id,
    title: 'Reflections for Epoch 2030',
    message:
      'To the archivist reading this four years hence: you kept your promise to remember. The vault has held your quiet aspirations intact.',
    unlockDate: futureLockedDate,
    sealedAt: new Date('2026-10-14'),
    isOpened: false,
    isLocked: true,
  });

  await Capsule.create({
    userId: user._id,
    title: 'Solitary Expedition Notes',
    message: 'Field notes from the northern ridge trail.',
    unlockDate: new Date('2027-06-01'),
    sealedAt: new Date('2026-10-01'),
    isOpened: false,
    isLocked: true,
  });

  await Capsule.create({
    userId: user._id,
    title: 'Letter from Winter 2025',
    message: 'The journey was quiet. You are standing where you wished you would be.',
    unlockDate: new Date('2026-09-01'),
    sealedAt: new Date('2025-09-01'),
    isOpened: true,
    openedAt: new Date('2026-09-02'),
    isLocked: false,
  });

  console.log(
    `Seeded 4 memories with photos & 3 capsules. Locked capsule ID for PRD-02: ${lockedCapsule._id.toString()}`
  );

  // 3. Start Next.js production server
  console.log('3. Starting Next.js Production Server with MONGODB_URI...');
  const nextProcess = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: '3000', MONGODB_URI: mongoUri },
    stdio: 'inherit',
  });

  await waitForServer('http://localhost:3000');
  console.log('Next.js server is live at http://localhost:3000');

  // 4. Launch Headless Chrome
  console.log('4. Launching Headless Chrome with CDP...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ]);

  await wait(1500);

  // Connect to CDP WebSocket
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

  // Set authentication cookie
  await sendCdp(ws, 'Network.setCookie', {
    name: 'echoes_token',
    value: authToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  // Capture Targets: PRD-01, PRD-02, PRD-03
  const targetsToCapture = [
    {
      id: 'PRD-01',
      baseName: 'product_memory_journal',
      url: 'http://localhost:3000/memories',
      w: 1600,
      h: 1000,
      scale: 1.5,
    },
    {
      id: 'PRD-02',
      baseName: 'product_sealed_capsule',
      url: `http://localhost:3000/capsules/${lockedCapsule._id.toString()}`,
      w: 1600,
      h: 1000,
      scale: 1.5,
    },
    {
      id: 'PRD-03',
      baseName: 'product_timeline',
      url: 'http://localhost:3000/timeline',
      w: 1600,
      h: 1000,
      scale: 1.5,
    },
  ];

  for (const item of targetsToCapture) {
    console.log(`\nCapturing ${item.id} [${item.baseName}] from ${item.url}...`);

    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: item.w,
      height: item.h,
      deviceScaleFactor: item.scale,
      mobile: false,
    });

    await sendCdp(ws, 'Page.navigate', { url: item.url });
    // Allow page to load, animations to complete, images to hydrate
    await wait(3500);

    const locResult = await sendCdp(ws, 'Runtime.evaluate', {
      expression: 'window.location.href',
    });
    console.log(`Current URL: ${locResult.result.value}`);

    const { data } = await sendCdp(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    const rawPngPath = path.join(RAW_DIR, `${item.baseName}.png`);
    fs.writeFileSync(rawPngPath, Buffer.from(data, 'base64'));
    console.log(`Saved raw capture: ${rawPngPath}`);

    // Convert to optimized WebP in public/images/product/ using python PIL
    const webpPath = path.join(PRODUCT_DIR, `${item.baseName}.webp`);
    execSync(
      `python3 -c "from PIL import Image; img = Image.open('${rawPngPath}'); img.convert('RGB').save('${webpPath}', 'WEBP', quality=88, method=6)"`
    );

    const stats = fs.statSync(webpPath);
    console.log(`Saved optimized WebP: ${webpPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // Teardown
  console.log('\nCleaning up processes...');
  ws.close();
  chromeProcess.kill('SIGTERM');
  nextProcess.kill('SIGTERM');
  await mongoose.disconnect();
  await mongod.stop();

  console.log('✅ Stage 9B.4 product screenshots successfully captured & optimized!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during product capture:', err);
  process.exit(1);
});
