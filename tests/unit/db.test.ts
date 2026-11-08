import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/db';

describe('Database Connection Module (db.ts)', () => {
  let mongod: MongoMemoryServer;
  let uri: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
    if (mongod) {
      await mongod.stop();
    }
  });

  it('should throw an error if MONGODB_URI is undefined', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    await expect(connectToDatabase('')).rejects.toThrowError(
      /Please define the MONGODB_URI environment variable/
    );

    if (originalUri) {
      process.env.MONGODB_URI = originalUri;
    }
  });

  it('should successfully establish a connection to in-memory MongoDB', async () => {
    const conn = await connectToDatabase(uri);
    expect(conn).toBeDefined();
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should reuse cached connection on subsequent calls', async () => {
    const conn1 = await connectToDatabase(uri);
    const conn2 = await connectToDatabase(uri);
    expect(conn1).toBe(conn2);
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('should properly disconnect and reset cached connection', async () => {
    await disconnectFromDatabase();
    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
  });
});
