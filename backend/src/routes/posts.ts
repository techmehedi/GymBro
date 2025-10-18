import { Hono } from 'hono';
import { Env, CreatePostRequest } from '../types';

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

// Create a new post
app.post('/', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const body = await c.req.json() as CreatePostRequest;
  
  try {
    // Verify user is member of the group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(body.group_id, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Create post
    const postResult = await c.env?.DB.prepare(`
      INSERT INTO posts (user_id, group_id, content, image_url, post_type)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      user.id,
      body.group_id,
      body.content || null,
      body.image_url || null,
      body.post_type || 'checkin'
    ).first();
    
    // Update streak if it's a check-in
    if (body.post_type === 'checkin' || !body.post_type) {
      await updateStreak(c.env?.DB, user.id, body.group_id);
    }
    
    return c.json({ post: postResult });
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Get posts for a group
app.get('/group/:groupId', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('groupId');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  
  try {
    // Verify user is member of the group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get posts with user info
    const posts = await c.env?.DB.prepare(`
      SELECT p.*, u.display_name, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.group_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(groupId, limit, offset).all();
    
    return c.json({ posts: posts.results });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Get user's posts across all groups
app.get('/user', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  
  try {
    const posts = await c.env?.DB.prepare(`
      SELECT p.*, g.name as group_name
      FROM posts p
      JOIN groups g ON p.group_id = g.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();
    
    return c.json({ posts: posts.results });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Delete a post
app.delete('/:id', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const postId = c.req.param('id');
  
  try {
    // Check if user owns the post
    const post = await c.env?.DB.prepare(`
      SELECT * FROM posts WHERE id = ? AND user_id = ?
    `).bind(postId, user.id).first();
    
    if (!post) {
      return c.json({ error: 'Post not found or not authorized' }, 404);
    }
    
    // Delete post
    await c.env?.DB.prepare(`
      DELETE FROM posts WHERE id = ?
    `).bind(postId).run();
    
    return c.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Helper function to update streak
async function updateStreak(db: D1Database, userId: string, groupId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current streak
    const streak = await db.prepare(`
      SELECT * FROM streaks WHERE user_id = ? AND group_id = ?
    `).bind(userId, groupId).first();
    
    if (!streak) {
      // Create new streak
      await db.prepare(`
        INSERT INTO streaks (user_id, group_id, current_streak, longest_streak, last_checkin_date, streak_start_date)
        VALUES (?, ?, 1, 1, ?, ?)
      `).bind(userId, groupId, today, today).run();
    } else {
      const lastCheckin = streak.last_checkin_date;
      const currentStreak = streak.current_streak || 0;
      
      if (lastCheckin === today) {
        // Already checked in today, no update needed
        return;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (lastCheckin === yesterdayStr) {
        // Consecutive day, increment streak
        newStreak = (currentStreak as number) + 1;
      }
      
      const longestStreak = Math.max(newStreak, (streak.longest_streak as number) || 0);
      
      await db.prepare(`
        UPDATE streaks 
        SET current_streak = ?, 
            longest_streak = ?, 
            last_checkin_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND group_id = ?
      `).bind(newStreak, longestStreak, today, userId, groupId).run();
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

export default app;
