import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseServiceKey = c.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ error: 'Supabase configuration missing' }, 500);
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Get or create user in our database
    const dbUser = await getUserOrCreate(c.env.DB, user);
    
    // Add user to context
    c.set('user', dbUser);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

async function getUserOrCreate(db: D1Database, supabaseUser: any): Promise<AuthUser> {
  const userId = supabaseUser.id;
  
  // Try to get existing user
  const existingUser = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (existingUser) {
    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      avatarUrl: existingUser.avatar_url,
    };
  }

  // Create new user
  const email = supabaseUser.email || '';
  const name = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

  await db
    .prepare(`
      INSERT INTO users (id, email, name, avatar_url)
      VALUES (?, ?, ?, ?)
    `)
    .bind(userId, email, name, avatarUrl)
    .run();

  return {
    id: userId,
    email,
    name,
    avatarUrl,
  };
}
