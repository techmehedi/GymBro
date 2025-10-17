import { Hono } from 'hono';
import { Context } from 'hono';
import { AuthUser } from '../middleware/auth';

export const postsRouter = new Hono<{ Bindings: any; Variables: { user: AuthUser } }>();

// Create a new post (daily check-in)
postsRouter.post('/', async (c: Context) => {
  try {
    const user = c.get('user');
    const { groupId, content, imageUrl } = await c.req.json();

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

    // Check if user already posted today
    const today = new Date().toISOString().split('T')[0];
    const existingPost = await c.env.DB
      .prepare(`
        SELECT * FROM posts 
        WHERE group_id = ? AND user_id = ? 
        AND DATE(created_at) = ?
      `)
      .bind(groupId, user.id, today)
      .first();

    if (existingPost) {
      return c.json({ error: 'Already posted today' }, 400);
    }

    const postId = crypto.randomUUID();

    // Create post
    await c.env.DB
      .prepare(`
        INSERT INTO posts (id, group_id, user_id, content, image_url)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(postId, groupId, user.id, content || '', imageUrl || null)
      .run();

    // Update streak
    await updateStreak(c.env.DB, user.id, groupId);

    return c.json({
      id: postId,
      groupId,
      userId: user.id,
      content: content || '',
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Get posts for a group
postsRouter.get('/group/:groupId', async (c: Context) => {
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

    const posts = await c.env.DB
      .prepare(`
        SELECT p.*, u.name as user_name, u.avatar_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.group_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `)
      .bind(groupId)
      .all();

    return c.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Get user's streak for a group
postsRouter.get('/streak/:groupId', async (c: Context) => {
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

    const streak = await c.env.DB
      .prepare('SELECT * FROM streaks WHERE user_id = ? AND group_id = ?')
      .bind(user.id, groupId)
      .first();

    return c.json({ streak });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return c.json({ error: 'Failed to fetch streak' }, 500);
  }
});

// Get all streaks for a group
postsRouter.get('/streaks/:groupId', async (c: Context) => {
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

    const streaks = await c.env.DB
      .prepare(`
        SELECT s.*, u.name as user_name, u.avatar_url
        FROM streaks s
        JOIN users u ON s.user_id = u.id
        WHERE s.group_id = ?
        ORDER BY s.current_streak DESC, s.longest_streak DESC
      `)
      .bind(groupId)
      .all();

    return c.json({ streaks });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return c.json({ error: 'Failed to fetch streaks' }, 500);
  }
});

async function updateStreak(db: D1Database, userId: string, groupId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const streak = await db
    .prepare('SELECT * FROM streaks WHERE user_id = ? AND group_id = ?')
    .bind(userId, groupId)
    .first();

  if (!streak) {
    // Create new streak
    await db
      .prepare(`
        INSERT INTO streaks (id, user_id, group_id, current_streak, longest_streak, last_post_date)
        VALUES (?, ?, ?, 1, 1, ?)
      `)
      .bind(crypto.randomUUID(), userId, groupId, today)
      .run();
    return;
  }

  const lastPostDate = streak.last_post_date;
  let newCurrentStreak = streak.current_streak;
  let newLongestStreak = streak.longest_streak;

  if (lastPostDate) {
    const lastDate = new Date(lastPostDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      newCurrentStreak = streak.current_streak + 1;
    } else if (diffDays > 1) {
      // Streak broken
      newCurrentStreak = 1;
    }
    // If diffDays === 0, already posted today (handled above)
  } else {
    // First post
    newCurrentStreak = 1;
  }

  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }

  await db
    .prepare(`
      UPDATE streaks 
      SET current_streak = ?, longest_streak = ?, last_post_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND group_id = ?
    `)
    .bind(newCurrentStreak, newLongestStreak, today, userId, groupId)
    .run();
}
