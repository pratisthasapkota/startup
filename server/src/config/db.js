import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log(`[db] connected -> ${mongoose.connection.host}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });

  await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProd,
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};
