import { MongoMemoryServer } from 'mongodb-memory-server';
import { Keypair } from '@solana/web3.js';

let mongod;

export const getMemoryServerMongoUri = async () => {
  mongod = await MongoMemoryServer.create({
    instance: { dbName: Keypair.generate().publicKey.toBase58() },
  });
  return mongod.getUri();
};
