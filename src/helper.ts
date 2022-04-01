import { MongoMemoryServer } from 'mongodb-memory-server';
import { Keypair } from '@solana/web3.js';

export const getMemoryServerMongoUri = async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: Keypair.generate().publicKey.toBase58() },
  });
  return mongod.getUri();
};