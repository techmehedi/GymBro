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
    const response = await fetch(`${c.env?.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': c.env?.SUPABASE_ANON_KEY,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Supabase auth error:', errorData);
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const userData = await response.json();
    console.log('Supabase user data:', userData);
    return { user: userData, token };
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ error: 'Token verification failed' }, 401);
  }
}

// Link Supabase user to GymBro database
app.post('/link', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
  if (!user || !user.id) {
    console.error('Invalid user object:', user);
    return c.json({ error: 'Invalid user data' }, 400);
  }
  
  try {
    // Check if user already exists
    const existingUser = await c.env?.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(user.id).first();
    
    if (existingUser) {
      return c.json({ user: existingUser });
    }
    
    // Create new user
    const newUser = await c.env?.DB.prepare(`
      INSERT INTO users (id, email, display_name, avatar_url)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(
      user.id,
      user.email,
      user.user_metadata?.display_name || user.email.split('@')[0],
      user.user_metadata?.avatar_url || null
    ).first();
    
    return c.json({ user: newUser });
  } catch (error) {
    console.error('Error linking user:', error);
    return c.json({ error: `Failed to link user: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Get user profile
app.get('/profile', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
  try {
    const userProfile = await c.env?.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(user.id).first();
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put('/profile', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const { display_name, avatar_url } = await c.req.json();
  
  try {
    const updatedUser = await c.env?.DB.prepare(`
      UPDATE users 
      SET display_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(
      display_name || user.user_metadata?.display_name,
      avatar_url || user.user_metadata?.avatar_url,
      user.id
    ).first();
    
    return c.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Search users
app.get('/search', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const query = c.req.query('q');
  
  if (!query || query.length < 2) {
    return c.json({ users: [] });
  }
  
  try {
    const users = await c.env?.DB.prepare(`
      SELECT id, email, display_name, avatar_url, created_at
      FROM users 
      WHERE (display_name LIKE ? OR email LIKE ?)
      AND id != ?
      ORDER BY display_name ASC
      LIMIT 20
    `).bind(
      `%${query}%`,
      `%${query}%`,
      user.id
    ).all();
    
    return c.json({ users: users.results });
  } catch (error) {
    console.error('Error searching users:', error);
    return c.json({ error: 'Failed to search users' }, 500);
  }
});

// Follow/Unfollow user
app.post('/follow', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const { target_user_id } = await c.req.json();
  
  if (!target_user_id || target_user_id === user.id) {
    return c.json({ error: 'Invalid target user' }, 400);
  }
  
  try {
    // Check if target user exists
    const targetUser = await c.env?.DB.prepare(`
      SELECT id FROM users WHERE id = ?
    `).bind(target_user_id).first();
    
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if already following
    const existingFollow = await c.env?.DB.prepare(`
      SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?
    `).bind(user.id, target_user_id).first();
    
    if (existingFollow) {
      return c.json({ error: 'Already following this user' }, 400);
    }
    
    // Create follow relationship
    await c.env?.DB.prepare(`
      INSERT INTO user_follows (follower_id, following_id)
      VALUES (?, ?)
    `).bind(user.id, target_user_id).run();
    
    return c.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    return c.json({ error: 'Failed to follow user' }, 500);
  }
});

// Unfollow user
app.delete('/follow/:target_user_id', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const target_user_id = c.req.param('target_user_id');
  
  try {
    await c.env?.DB.prepare(`
      DELETE FROM user_follows 
      WHERE follower_id = ? AND following_id = ?
    `).bind(user.id, target_user_id).run();
    
    return c.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return c.json({ error: 'Failed to unfollow user' }, 500);
  }
});

// Get user's followers and following
app.get('/follows', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const type = c.req.query('type') || 'followers'; // 'followers' or 'following'
  
  try {
    let query;
    if (type === 'followers') {
      query = `
        SELECT u.id, u.email, u.display_name, u.avatar_url, uf.created_at
        FROM user_follows uf
        JOIN users u ON uf.follower_id = u.id
        WHERE uf.following_id = ?
        ORDER BY uf.created_at DESC
      `;
    } else {
      query = `
        SELECT u.id, u.email, u.display_name, u.avatar_url, uf.created_at
        FROM user_follows uf
        JOIN users u ON uf.following_id = u.id
        WHERE uf.follower_id = ?
        ORDER BY uf.created_at DESC
      `;
    }
    
    const results = await c.env?.DB.prepare(query).bind(user.id).all();
    
    return c.json({ users: results.results });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return c.json({ error: 'Failed to fetch follows' }, 500);
  }
});

// Delete user account
app.delete('/account', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
  try {
    // Delete user and all related data (cascade will handle related records)
    await c.env?.DB.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(user.id).run();
    
    return c.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export default app;
