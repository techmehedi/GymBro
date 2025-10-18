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
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const user = await response.json();
    return { user, token };
  } catch (error) {
    return c.json({ error: 'Token verification failed' }, 401);
  }
}

// Link Supabase user to GymBro database
app.post('/link', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
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
    return c.json({ error: 'Failed to link user' }, 500);
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
