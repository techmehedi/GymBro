import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './types';

// Import route handlers
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import postRoutes from './routes/posts';
import motivateRoutes from './routes/motivate';
import notifyRoutes from './routes/notify';
import uploadRoutes from './routes/upload';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:8081', 'exp://localhost:8081', 'http://localhost:19000', 'http://localhost:19001', 'http://localhost:19002'], // Expo dev server ports
  credentials: true,
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'GymBro API is running!',
    version: '1.0.0',
    environment: c.env?.ENVIRONMENT || 'unknown'
  });
});

// API routes
app.route('/auth', authRoutes);
app.route('/groups', groupRoutes);
app.route('/posts', postRoutes);
app.route('/motivate', motivateRoutes);
app.route('/notify', notifyRoutes);
app.route('/upload', uploadRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: c.env?.ENVIRONMENT === 'development' ? err.message : undefined
  }, 500);
});

// Cron trigger handler for daily tasks
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  console.log('Running scheduled task:', event.cron);
  
  if (event.cron === '0 9 * * *') {
    // Daily streak reset and notification task
    await handleDailyStreakReset(env);
    await sendDailyMotivationalMessages(env);
  }
}

async function handleDailyStreakReset(env: Env) {
  try {
    // Reset streaks for users who haven't checked in today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await env.DB.prepare(`
      UPDATE streaks 
      SET current_streak = 0, 
          last_checkin_date = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE last_checkin_date < ?
    `).bind(yesterdayStr).run();
    
    console.log('Daily streak reset completed');
  } catch (error) {
    console.error('Error in daily streak reset:', error);
  }
}

async function sendDailyMotivationalMessages(env: Env) {
  try {
    // Get all active groups
    const groups = await env.DB.prepare(`
      SELECT g.*, COUNT(gm.user_id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id
    `).all();
    
    for (const group of groups.results) {
      // Generate motivational message using Gemini API
      const message = await generateMotivationalMessage(env, group);
      
      if (message) {
        // Store the message
        await env.DB.prepare(`
          INSERT INTO motivational_messages (group_id, message, message_type)
          VALUES (?, ?, 'daily')
        `).bind(group.id, message).run();
        
        // Send push notifications to group members
        await sendGroupNotification(env, group.id as string, message);
      }
    }
    
    console.log('Daily motivational messages sent');
  } catch (error) {
    console.error('Error sending daily motivational messages:', error);
  }
}

async function generateMotivationalMessage(env: Env, group: any): Promise<string | null> {
  try {
    const prompt = `Generate a short, encouraging motivational message for a fitness group called "${group.name}" with ${group.member_count} members. Keep it under 100 characters and make it inspiring for daily workouts.`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Error generating motivational message:', error);
    return null;
  }
}

async function sendGroupNotification(env: Env, groupId: string, message: string) {
  try {
    // Get all push tokens for group members
    const tokens = await env.DB.prepare(`
      SELECT pt.token, pt.platform
      FROM push_tokens pt
      JOIN group_members gm ON pt.user_id = gm.user_id
      WHERE gm.group_id = ? AND pt.is_active = true
    `).bind(groupId).all();
    
    // Send notifications (simplified - in production, use proper push service)
    for (const token of tokens.results) {
      console.log(`Sending notification to ${token.platform} token: ${message}`);
      // TODO: Implement actual push notification sending
    }
  } catch (error) {
    console.error('Error sending group notification:', error);
  }
}

export default app;
