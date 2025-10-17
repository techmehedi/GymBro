import { Context, Next } from 'hono';
import { verifyToken } from '@clerk/backend';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    const clerkSecretKey = c.env.CLERK_SECRET_KEY;

    // Verify the JWT token with Clerk
    const payload = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Get or create user in our database
    const user = await getUserOrCreate(c.env.DB, payload);
    
    // Add user to context
    c.set('user', user);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

async function getUserOrCreate(db: D1Database, clerkPayload: any): Promise<AuthUser> {
  const clerkId = clerkPayload.sub;
  
  // Try to get existing user
  const existingUser = await db
    .prepare('SELECT * FROM users WHERE clerk_id = ?')
    .bind(clerkId)
    .first();

  if (existingUser) {
    return {
      id: existingUser.id,
      clerkId: existingUser.clerk_id,
      email: existingUser.email,
      name: existingUser.name,
      avatarUrl: existingUser.avatar_url,
    };
  }

  // Create new user
  const userId = crypto.randomUUID();
  const email = clerkPayload.email || '';
  const name = clerkPayload.name || clerkPayload.email || 'User';
  const avatarUrl = clerkPayload.picture || null;

  await db
    .prepare(`
      INSERT INTO users (id, clerk_id, email, name, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(userId, clerkId, email, name, avatarUrl)
    .run();

  return {
    id: userId,
    clerkId,
    email,
    name,
    avatarUrl,
  };
}
