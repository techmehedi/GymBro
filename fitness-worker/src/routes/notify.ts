import { Hono } from 'hono';
import { Context } from 'hono';
import { AuthUser } from '../middleware/auth';

export const notifyRouter = new Hono<{ Bindings: any; Variables: { user: AuthUser } }>();

// Send push notification to group members
notifyRouter.post('/send', async (c: Context) => {
  try {
    const user = c.get('user');
    const { groupId, title, body, type = 'reminder' } = await c.req.json();

    if (!groupId || !title || !body) {
      return c.json({ error: 'Group ID, title, and body are required' }, 400);
    }

    // Check if user is member of group
    const membership = await c.env.DB
      .prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?')
      .bind(groupId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get all group members with push tokens
    const members = await c.env.DB
      .prepare(`
        SELECT u.id, u.name, u.push_token
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ? AND u.push_token IS NOT NULL
      `)
      .bind(groupId)
      .all();

    // Send notifications to all members
    const notificationPromises = members.map(member => 
      sendPushNotification(member.push_token, title, body, {
        groupId,
        type,
        senderId: user.id,
        senderName: user.name,
      })
    );

    await Promise.all(notificationPromises);

    return c.json({
      message: 'Notifications sent successfully',
      recipients: members.length,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return c.json({ error: 'Failed to send notifications' }, 500);
  }
});

// Schedule daily reminder for group
notifyRouter.post('/schedule-daily', async (c: Context) => {
  try {
    const user = c.get('user');
    const { groupId, time = '09:00' } = await c.req.json();

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

    // Store reminder schedule in KV
    const reminderKey = `daily_reminder:${groupId}`;
    await c.env.KV.put(reminderKey, JSON.stringify({
      groupId,
      time,
      enabled: true,
      lastSent: null,
    }));

    return c.json({
      message: 'Daily reminder scheduled successfully',
      groupId,
      time,
    });
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return c.json({ error: 'Failed to schedule daily reminder' }, 500);
  }
});

async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: any
): Promise<void> {
  try {
    // This would integrate with Expo's push notification service
    // For now, we'll simulate the API call
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', response.status);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
