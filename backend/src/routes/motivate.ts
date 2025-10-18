import { Hono } from 'hono';
import { Env } from '../types';

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

// Get motivational messages for a group
app.get('/group/:groupId', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('groupId');
  const limit = parseInt(c.req.query('limit') || '10');
  
  try {
    // Verify user is member of the group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get motivational messages
    const messages = await c.env?.DB.prepare(`
      SELECT * FROM motivational_messages
      WHERE group_id = ?
      ORDER BY generated_at DESC
      LIMIT ?
    `).bind(groupId, limit).all();
    
    return c.json({ messages: messages.results });
  } catch (error) {
    console.error('Error fetching motivational messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Generate a custom motivational message
app.post('/generate', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const { groupId, messageType = 'custom' } = await c.req.json();
  
  try {
    // Verify user is member of the group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get group info
    const group = await c.env?.DB.prepare(`
      SELECT g.*, COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = ?
      GROUP BY g.id
    `).bind(groupId).first();
    
    // Generate message using Gemini API
    const message = await generateCustomMessage(c.env, group, messageType);
    
    if (message) {
      // Store the message
      const messageResult = await c.env?.DB.prepare(`
        INSERT INTO motivational_messages (group_id, message, message_type)
        VALUES (?, ?, ?)
        RETURNING *
      `).bind(groupId, message, messageType).first();
      
      return c.json({ message: messageResult });
    } else {
      return c.json({ error: 'Failed to generate message' }, 500);
    }
  } catch (error) {
    console.error('Error generating motivational message:', error);
    return c.json({ error: 'Failed to generate message' }, 500);
  }
});

// Get group streak summary
app.get('/streaks/:groupId', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('groupId');
  
  try {
    // Verify user is member of the group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get all streaks for the group
    const streaks = await c.env?.DB.prepare(`
      SELECT s.*, u.display_name, u.avatar_url
      FROM streaks s
      JOIN users u ON s.user_id = u.id
      WHERE s.group_id = ?
      ORDER BY s.current_streak DESC, s.longest_streak DESC
    `).bind(groupId).all();
    
    // Calculate group statistics
    const totalStreaks = streaks.results.length;
    const activeStreaks = streaks.results.filter((s: any) => (s.current_streak as number) > 0).length;
    const avgStreak = totalStreaks > 0 
      ? streaks.results.reduce((sum: number, s: any) => sum + (s.current_streak as number), 0) / totalStreaks 
      : 0;
    const maxStreak = Math.max(...streaks.results.map((s: any) => s.longest_streak as number));
    
    return c.json({
      streaks: streaks.results,
      stats: {
        totalMembers: totalStreaks,
        activeStreaks,
        averageStreak: Math.round(avgStreak * 10) / 10,
        maxStreak
      }
    });
  } catch (error) {
    console.error('Error fetching streak summary:', error);
    return c.json({ error: 'Failed to fetch streak summary' }, 500);
  }
});

// Helper function to generate custom motivational message
async function generateCustomMessage(env: Env, group: any, messageType: string): Promise<string | null> {
  try {
    let prompt = '';
    
    switch (messageType) {
      case 'daily':
        prompt = `Generate a short, encouraging daily motivational message for a fitness group called "${group.name}" with ${group.member_count} members. Focus on consistency and daily progress. Keep it under 100 characters.`;
        break;
      case 'weekly':
        prompt = `Generate a weekly summary and encouragement message for a fitness group called "${group.name}" with ${group.member_count} members. Celebrate progress and motivate for the week ahead. Keep it under 150 characters.`;
        break;
      case 'milestone':
        prompt = `Generate a celebratory message for a fitness group reaching a milestone. Group name: "${group.name}" with ${group.member_count} members. Make it exciting and motivating. Keep it under 120 characters.`;
        break;
      default:
        prompt = `Generate a personalized motivational message for a fitness group called "${group.name}" with ${group.member_count} members. Make it inspiring and supportive. Keep it under 100 characters.`;
    }
    
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
    console.error('Error generating custom message:', error);
    return null;
  }
}

export default app;
