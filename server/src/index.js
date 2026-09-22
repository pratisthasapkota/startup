import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { sanitizeInput, sanitizeXss, detectAttacks } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import apiRoutes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.disable('x-powered-by');

// ---- Security headers ----
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ---- Parse helpers ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression());

// ---- Access logs ----
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// ---- CORS ----
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---- Static uploads (local fallback storage) ----
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// ---- Global rate limit ----
app.use('/api', apiLimiter);

// ---- Input hardening: NoSQL/P() sanitisation + XSS sanitisation + IDS ----
app.use('/api', sanitizeInput);
app.use('/api', sanitizeXss);
app.use('/api', detectAttacks);

// ---- Health (before limiter-bound api routes) ----
app.get('/health', (_req, res) =>
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: Date.now() })
);

// ---- API routes ----
app.use('/api', apiRoutes);

// ---- 404 + error handler ----
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[api] failed to start:', err.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

if (process.env.NODE_ENV !== 'test') start();

export default app;