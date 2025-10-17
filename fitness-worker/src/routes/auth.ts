import { Hono } from 'hono';
import { Context } from 'hono';

export const authRouter = new Hono<{ Bindings: any }>();

// Link user account (for push notifications)
authRouter.post('/link', async (c: Context) => {
  try {
    const { userId, pushToken } = await c.req.json();

    if (!userId || !pushToken) {
      return c.json({ error: 'User ID and push token are required' }, 400);
    }

    // Update user's push token
    await c.env.DB
      .prepare('UPDATE users SET push_token = ? WHERE id = ?')
      .bind(pushToken, userId)
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
    const clerkSecretKey = c.env.CLERK_SECRET_KEY;

    // Verify token and get user info
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const clerkId = payload.sub;
    const user = await c.env.DB
      .prepare('SELECT * FROM users WHERE clerk_id = ?')
      .bind(clerkId)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: user.id,
      clerkId: user.clerk_id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});
