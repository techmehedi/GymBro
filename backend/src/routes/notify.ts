import { Hono } from 'hono';
import { Env, RegisterPushTokenRequest } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Middleware to verify Supabase JWT token
async function verifyAuth(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const response = await fetch(`${c.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': c.env.SUPABASE_ANON_KEY,
      },
    });
    
    if (!response.ok) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const user = await response.json();
    return { user, token };
  } catch (error) {
    return c.json({ error: 'Token verification failed' }, 401);
  }
}

// Register push notification token
app.post('/register-token', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const body = await c.req.json() as RegisterPushTokenRequest;
  
  try {
    // Check if token already exists
    const existingToken = await c.env?.DB.prepare(`
      SELECT * FROM push_tokens WHERE user_id = ? AND token = ?
    `).bind(user.id, body.token).first();
    
    if (existingToken) {
      // Update existing token
      await c.env?.DB.prepare(`
        UPDATE push_tokens 
        SET platform = ?, is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND token = ?
      `).bind(body.platform, user.id, body.token).run();
    } else {
      // Insert new token
      await c.env?.DB.prepare(`
        INSERT INTO push_tokens (user_id, token, platform)
        VALUES (?, ?, ?)
      `).bind(user.id, body.token, body.platform).run();
    }
    
    return c.json({ message: 'Push token registered successfully' });
  } catch (error) {
    console.error('Error registering push token:', error);
    return c.json({ error: 'Failed to register push token' }, 500);
  }
});

// Unregister push notification token
app.delete('/unregister-token', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const { token } = await c.req.json();
  
  try {
    await c.env?.DB.prepare(`
      UPDATE push_tokens 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND token = ?
    `).bind(user.id, token).run();
    
    return c.json({ message: 'Push token unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return c.json({ error: 'Failed to unregister push token' }, 500);
  }
});

// Send test notification
app.post('/test', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const { groupId, message } = await c.req.json();
  
  try {
    // Verify user is member of the group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Send notification to all group members
    await sendGroupNotification(c.env, groupId, message || 'Test notification from GymBro!');
    
    return c.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return c.json({ error: 'Failed to send test notification' }, 500);
  }
});

// Get notification settings
app.get('/settings', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
  try {
    const tokens = await c.env?.DB.prepare(`
      SELECT * FROM push_tokens WHERE user_id = ? AND is_active = true
    `).bind(user.id).all();
    
    return c.json({ 
      tokens: tokens.results,
      hasActiveTokens: tokens.results.length > 0
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return c.json({ error: 'Failed to fetch notification settings' }, 500);
  }
});

// Helper function to send group notification
async function sendGroupNotification(env: Env, groupId: string, message: string) {
  try {
    // Get all push tokens for group members
    const tokens = await env.DB.prepare(`
      SELECT pt.token, pt.platform, u.display_name
      FROM push_tokens pt
      JOIN group_members gm ON pt.user_id = gm.user_id
      JOIN users u ON pt.user_id = u.id
      WHERE gm.group_id = ? AND pt.is_active = true
    `).bind(groupId).all();
    
    // Send notifications to each token
    for (const token of tokens.results) {
      await sendPushNotification(env, token.token as string, token.platform as string, message);
    }
    
    console.log(`Sent notification to ${tokens.results.length} members of group ${groupId}`);
  } catch (error) {
    console.error('Error sending group notification:', error);
  }
}

// Helper function to send individual push notification
async function sendPushNotification(env: Env, token: string, platform: string, message: string) {
  try {
    // This is a simplified implementation
    // In production, you would use proper push notification services like:
    // - Apple Push Notification Service (APNs) for iOS
    // - Firebase Cloud Messaging (FCM) for Android
    
    console.log(`Sending ${platform} notification to ${token}: ${message}`);
    
    // Store notification in KV for debugging
    await env.PUSH_TOKENS.put(`notification_${Date.now()}`, JSON.stringify({
      token,
      platform,
      message,
      timestamp: new Date().toISOString()
    }));
    
    // TODO: Implement actual push notification sending
    // For now, just log the notification
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export default app;
