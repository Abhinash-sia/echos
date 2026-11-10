import net from 'net';
import mongoose from 'mongoose';

/**
 * Global interface for caching mongoose connection in development.
 * This prevents connections from accumulating across HMR (Hot Module Replacement) reloads.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface MongoMonitorState {
  started: boolean;
  lastUp: boolean | null;
  checking: boolean;
  timer: ReturnType<typeof setInterval> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
  var mongoMonitorState: MongoMonitorState | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const monitorState: MongoMonitorState = global.mongoMonitorState ?? {
  started: false,
  lastUp: null,
  checking: false,
  timer: null,
};

if (!global.mongoMonitorState) {
  global.mongoMonitorState = monitorState;
}

/**
 * Connects to MongoDB using Mongoose with connection pooling and caching.
 * @param uriOverride - Optional connection URI (e.g., provided during testing)
 * @returns Mongoose instance
 */
export async function connectToDatabase(uriOverride?: string): Promise<typeof mongoose> {
  const uri = uriOverride || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local or runtime environment.'
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Clear stale resolved connection so subsequent requests reconnect after an outage
  if (cached.conn && mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnects from MongoDB and clears the cached connection.
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cached.conn = null;
  cached.promise = null;
}

function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
}

async function pingActiveConnection(timeoutMs = 1500): Promise<boolean> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return false;
  }
  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB ping timeout')), timeoutMs)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

function probeTcp(uri: string, timeoutMs = 1000): Promise<boolean | null> {
  if (!uri.startsWith('mongodb://') || uri.includes(',')) {
    return Promise.resolve(null);
  }
  let host: string;
  let port: number;
  try {
    const parsed = new URL(uri);
    host = parsed.hostname || '127.0.0.1';
    port = parsed.port ? Number(parsed.port) : 27017;
  } catch {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(ok);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function probeMongo(uri: string): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    return pingActiveConnection();
  }

  const tcpReachable = await probeTcp(uri);
  if (tcpReachable === false) {
    return false;
  }

  let checkConn: mongoose.Connection | null = null;
  try {
    checkConn = await mongoose
      .createConnection(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      })
      .asPromise();
    await checkConn.db?.admin().ping();
    return true;
  } catch {
    return false;
  } finally {
    if (checkConn) {
      await checkConn.close().catch(() => {});
    }
  }
}

/**
 * Checks local MongoDB status at dev startup and monitors for start/stop transitions.
 * Logs once on startup and whenever MongoDB starts or stops while `npm run dev` is running.
 */
export async function startLocalMongoMonitor(intervalMs = 3000): Promise<void> {
  if (monitorState.started) {
    return;
  }
  monitorState.started = true;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn(' ⚠ [MongoDB] MONGODB_URI is not configured in .env.local');
    return;
  }

  const safeUri = maskMongoUri(uri);

  const reportTransition = (isUp: boolean, isInitial = false) => {
    if (!isInitial && monitorState.lastUp === isUp) {
      return;
    }
    monitorState.lastUp = isUp;

    if (isUp) {
      const label = isInitial ? 'Running locally' : 'Started running locally';
      console.log(` ✓ [MongoDB] ${label} (${safeUri})`);
      // Keep an active pooled connection so disconnect events fire immediately on stop
      connectToDatabase().catch(() => {});
    } else {
      const label = isInitial ? 'Not reachable at' : 'Stopped running locally';
      console.warn(` ⚠ [MongoDB] ${label} ${safeUri}`);
      console.warn('   Start local MongoDB with: docker start echoes-mongodb');
    }
  };

  const initialUp = await probeMongo(uri);
  reportTransition(initialUp, true);

  mongoose.connection.on('disconnected', () => {
    if (monitorState.lastUp === true) {
      reportTransition(false);
    }
  });

  mongoose.connection.on('connected', () => {
    if (monitorState.lastUp === false) {
      reportTransition(true);
    }
  });

  const timer = setInterval(async () => {
    if (monitorState.checking) {
      return;
    }
    monitorState.checking = true;
    try {
      if (mongoose.connection.readyState === 1) {
        const alive = await pingActiveConnection();
        if (!alive) {
          await disconnectFromDatabase().catch(() => {});
          reportTransition(false);
        }
      } else {
        const tcpUp = await probeTcp(uri);
        if (tcpUp === false) {
          if (monitorState.lastUp === true) {
            reportTransition(false);
          }
        } else {
          const mongoUp = await probeMongo(uri);
          reportTransition(mongoUp);
        }
      }
    } finally {
      monitorState.checking = false;
    }
  }, intervalMs);

  timer.unref();
  monitorState.timer = timer;
}

export default connectToDatabase;
