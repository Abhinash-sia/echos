import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/db';

let mongod: MongoMemoryServer | null = null;

/**
 * Start an in-memory MongoDB instance and connect Mongoose to it.
 * @returns In-memory connection URI
 */
export async function connectTestDb(): Promise<string> {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
  }
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await connectToDatabase(uri);
  return uri;
}

/**
 * Clear all collections in the in-memory test database.
 */
export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
}

/**
 * Disconnect Mongoose and stop the in-memory MongoDB server instance.
 */
export async function closeTestDb(): Promise<void> {
  await disconnectFromDatabase();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
