import { Hono } from 'hono';
import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';

export const authRouter = new Hono<{ Bindings: any }>();

// Link user account (for push notifications)
authRouter.post('/link', async (c: Context) => {
  try {
    const { pushToken } = await c.req.json();

    if (!pushToken) {
      return c.json({ error: 'Push token is required' }, 400);
    }

    // Get user from context (set by auth middleware)
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Update user's push token
    await c.env.DB
      .prepare('UPDATE users SET push_token = ? WHERE id = ?')
      .bind(pushToken, user.id)
      .run();

    return c.json({ message: 'Push token linked successfully' });
  } catch (error) {
    console.error('Error linking push token:', error);
    return c.json({ error: 'Failed to link push token' }, 500);
  }
});

// Get user profile
authRouter.get('/profile', async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseServiceKey = c.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ error: 'Supabase configuration missing' }, 500);
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Get user from our database
    const dbUser = await c.env.DB
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(user.id)
      .first();

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatar_url,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});
