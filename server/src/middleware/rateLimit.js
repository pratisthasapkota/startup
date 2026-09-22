import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
};

// Broad limiter for the whole API.
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 600 : 5000,
});

// Strict limiter for auth endpoints to slow credential stuffing / brute force.
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 10 : 200,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Limiter for write operations (orders, product creation, uploads).
export const writeLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  max: env.isProd ? 120 : 2000,
});
