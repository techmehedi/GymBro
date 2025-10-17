import { Hono } from 'hono';
import { Context } from 'hono';
import { AuthUser } from '../middleware/auth';

export const motivateRouter = new Hono<{ Bindings: any; Variables: { user: AuthUser } }>();

// Generate motivational message for group
motivateRouter.post('/generate', async (c: Context) => {
  try {
    const user = c.get('user');
    const { groupId } = await c.req.json();

    if (!groupId) {
      return c.json({ error: 'Group ID is required' }, 400);
    }

    // Check if user is member of group
    const membership = await c.env.DB
      .prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?')
      .bind(groupId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get group info and recent activity
    const group = await c.env.DB
      .prepare('SELECT * FROM groups WHERE id = ?')
      .bind(groupId)
      .first();

    const streaks = await c.env.DB
      .prepare(`
        SELECT s.*, u.name as user_name
        FROM streaks s
        JOIN users u ON s.user_id = u.id
        WHERE s.group_id = ?
        ORDER BY s.current_streak DESC
      `)
      .bind(groupId)
      .all();

    // Generate motivational message using Gemini
    const motivationalMessage = await generateMotivationalMessage(group, streaks, c.env);

    // Save message to database
    const messageId = crypto.randomUUID();
    await c.env.DB
      .prepare(`
        INSERT INTO motivational_messages (id, group_id, message)
        VALUES (?, ?, ?)
      `)
      .bind(messageId, groupId, motivationalMessage)
      .run();

    return c.json({
      id: messageId,
      message: motivationalMessage,
      groupId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating motivational message:', error);
    return c.json({ error: 'Failed to generate motivational message' }, 500);
  }
});

// Get recent motivational messages for group
motivateRouter.get('/:groupId', async (c: Context) => {
  try {
    const user = c.get('user');
    const groupId = c.req.param('groupId');

    // Check if user is member of group
    const membership = await c.env.DB
      .prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?')
      .bind(groupId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const messages = await c.env.DB
      .prepare(`
        SELECT * FROM motivational_messages
        WHERE group_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `)
      .bind(groupId)
      .all();

    return c.json({ messages });
  } catch (error) {
    console.error('Error fetching motivational messages:', error);
    return c.json({ error: 'Failed to fetch motivational messages' }, 500);
  }
});

async function generateMotivationalMessage(group: any, streaks: any[], env: any): Promise<string> {
  try {
    const geminiApiKey = env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return "Keep pushing forward! Every workout counts towards your fitness goals. You've got this! 💪";
    }

    const streakInfo = streaks.map(s => `${s.user_name}: ${s.current_streak} day streak`).join(', ');
    
    const prompt = `Generate a short, motivational message (max 100 characters) for a fitness group called "${group.name}". 
    Current streaks: ${streakInfo}. 
    Make it encouraging, positive, and fitness-focused. Include an emoji.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return generatedText.trim() || "Keep pushing forward! Every workout counts towards your fitness goals. You've got this! 💪";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Keep pushing forward! Every workout counts towards your fitness goals. You've got this! 💪";
  }
}
