import { Context } from 'hono';

export async function cronHandler(c: Context) {
  try {
    console.log('Running daily cron job...');
    
    // Reset streaks for users who haven't posted in 2+ days
    await resetBrokenStreaks(c.env.DB);
    
    // Send daily reminders to groups
    await sendDailyReminders(c.env.DB, c.env.KV);
    
    // Generate motivational messages for active groups
    await generateDailyMotivationalMessages(c.env.DB);
    
    return c.json({ 
      message: 'Cron job completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return c.json({ error: 'Cron job failed' }, 500);
  }
}

async function resetBrokenStreaks(db: D1Database) {
  try {
    // Find streaks where last_post_date is more than 1 day ago
    const brokenStreaks = await db
      .prepare(`
        SELECT * FROM streaks 
        WHERE last_post_date IS NOT NULL 
        AND DATE(last_post_date) < DATE('now', '-1 day')
        AND current_streak > 0
      `)
      .all();

    for (const streak of brokenStreaks) {
      await db
        .prepare(`
          UPDATE streaks 
          SET current_streak = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(streak.id)
        .run();
    }

    console.log(`Reset ${brokenStreaks.length} broken streaks`);
  } catch (error) {
    console.error('Error resetting broken streaks:', error);
  }
}

async function sendDailyReminders(db: D1Database, kv: KVNamespace) {
  try {
    // Get all groups with daily reminders enabled
    const groups = await db
      .prepare(`
        SELECT g.*, gm.user_id, u.push_token, u.name as user_name
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        JOIN users u ON gm.user_id = u.id
        WHERE u.push_token IS NOT NULL
      `)
      .all();

    for (const group of groups) {
      // Check if user has posted today
      const today = new Date().toISOString().split('T')[0];
      const todayPost = await db
        .prepare(`
          SELECT * FROM posts 
          WHERE group_id = ? AND user_id = ? 
          AND DATE(created_at) = ?
        `)
        .bind(group.id, group.user_id, today)
        .first();

      if (!todayPost) {
        // Send reminder notification
        await sendPushNotification(group.push_token, {
          title: `Daily Check-in Reminder`,
          body: `Don't forget to share your workout with ${group.name}!`,
          data: {
            groupId: group.id,
            type: 'daily_reminder',
          },
        });
      }
    }

    console.log(`Sent daily reminders for ${groups.length} users`);
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
}

async function generateDailyMotivationalMessages(db: D1Database) {
  try {
    // Get active groups (with recent posts)
    const activeGroups = await db
      .prepare(`
        SELECT DISTINCT g.*
        FROM groups g
        JOIN posts p ON g.id = p.group_id
        WHERE DATE(p.created_at) >= DATE('now', '-7 days')
      `)
      .all();

    for (const group of activeGroups) {
      // Check if we already generated a message today
      const today = new Date().toISOString().split('T')[0];
      const existingMessage = await db
        .prepare(`
          SELECT * FROM motivational_messages 
          WHERE group_id = ? AND DATE(created_at) = ?
        `)
        .bind(group.id, today)
        .first();

      if (!existingMessage) {
        // Generate motivational message
        const streaks = await db
          .prepare(`
            SELECT s.*, u.name as user_name
            FROM streaks s
            JOIN users u ON s.user_id = u.id
            WHERE s.group_id = ?
            ORDER BY s.current_streak DESC
          `)
          .bind(group.id)
          .all();

        const motivationalMessage = await generateMotivationalMessage(group, streaks, db);
        
        // Save message
        await db
          .prepare(`
            INSERT INTO motivational_messages (id, group_id, message)
            VALUES (?, ?, ?)
          `)
          .bind(crypto.randomUUID(), group.id, motivationalMessage)
          .run();
      }
    }

    console.log(`Generated motivational messages for ${activeGroups.length} groups`);
  } catch (error) {
    console.error('Error generating motivational messages:', error);
  }
}

async function sendPushNotification(pushToken: string, notification: any) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title: notification.title,
        body: notification.body,
        data: notification.data,
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

async function generateMotivationalMessage(group: any, streaks: any[], db: D1Database): Promise<string> {
  // Simplified version for cron job
  const streakInfo = streaks.map(s => `${s.user_name}: ${s.current_streak} day streak`).join(', ');
  
  if (streaks.length === 0) {
    return "Ready to start your fitness journey? Every step counts! 💪";
  }
  
  const topStreak = streaks[0];
  return `Amazing work ${topStreak.user_name}! Your ${topStreak.current_streak}-day streak is inspiring the whole group! Keep it up! 🔥`;
}
