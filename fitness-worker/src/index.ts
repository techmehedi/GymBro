import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth';
import { groupsRouter } from './routes/groups';
import { postsRouter } from './routes/posts';
import { authRouter } from './routes/auth';
import { motivateRouter } from './routes/motivate';
import { voiceRouter } from './routes/voice';
import { notifyRouter } from './routes/notify';
import { uploadRouter } from './routes/upload';
import { cronHandler } from './cron';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  CLERK_SECRET_KEY: string;
  GEMINI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:8081', 'exp://192.168.1.100:8081'], // Expo dev server
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('*', logger());

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Peer Fitness Network API', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.route('/api/auth', authRouter);
app.route('/api/groups', authMiddleware, groupsRouter);
app.route('/api/posts', authMiddleware, postsRouter);
app.route('/api/motivate', authMiddleware, motivateRouter);
app.route('/api/voice', authMiddleware, voiceRouter);
app.route('/api/notify', authMiddleware, notifyRouter);
app.route('/api/upload', authMiddleware, uploadRouter);

// Cron trigger handler
app.get('/cron', cronHandler);

export default app;
