import { Hono } from 'hono';
import { Env, AuthUser, CreateGroupRequest, JoinGroupRequest } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Middleware to verify Supabase JWT token
async function verifyAuth(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token with Supabase
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

// Create a new group
app.post('/', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const body = await c.req.json() as CreateGroupRequest;
  
  try {
    // Create group
    const groupResult = await c.env?.DB.prepare(`
      INSERT INTO groups (name, description, max_members, created_by)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(
      body.name,
      body.description || null,
      body.max_members || 5,
      user.id
    ).first();
    
    if (!groupResult) {
      return c.json({ error: 'Failed to create group' }, 500);
    }
    
    // Add creator as admin member
    await c.env?.DB.prepare(`
      INSERT INTO group_members (group_id, user_id, is_admin)
      VALUES (?, ?, true)
    `).bind(groupResult.id, user.id).run();
    
    // Initialize streak for creator
    await c.env?.DB.prepare(`
      INSERT INTO streaks (user_id, group_id)
      VALUES (?, ?)
    `).bind(user.id, groupResult.id).run();
    
    return c.json({ group: groupResult });
  } catch (error) {
    console.error('Error creating group:', error);
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Get user's groups
app.get('/', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
  try {
    const groups = await c.env?.DB.prepare(`
      SELECT g.*, gm.is_admin, gm.joined_at,
             COUNT(gm2.user_id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id
      WHERE gm.user_id = ?
      GROUP BY g.id
      ORDER BY gm.joined_at DESC
    `).bind(user.id).all();
    
    return c.json({ groups: groups.results });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// Get group details
app.get('/:id', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('id');
  
  try {
    // Check if user is member of group
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get group details with members
    const group = await c.env?.DB.prepare(`
      SELECT g.*, 
             COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = ?
      GROUP BY g.id
    `).bind(groupId).first();
    
    const members = await c.env?.DB.prepare(`
      SELECT u.id, u.display_name, u.avatar_url, 
             gm.is_admin, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at ASC
    `).bind(groupId).all();
    
    return c.json({ 
      group,
      members: members.results,
      userMembership: membership
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return c.json({ error: 'Failed to fetch group' }, 500);
  }
});

// Join group by invite code
app.post('/join', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const body = await c.req.json() as JoinGroupRequest;
  
  try {
    // Find group by invite code
    const group = await c.env?.DB.prepare(`
      SELECT * FROM groups WHERE invite_code = ?
    `).bind(body.invite_code).first();
    
    if (!group) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }
    
    // Check if group is full
    const memberCount = await c.env?.DB.prepare(`
      SELECT COUNT(*) as count FROM group_members WHERE group_id = ?
    `).bind(group.id).first();
    
    if (!memberCount || (memberCount.count as number) >= (group.max_members as number)) {
      return c.json({ error: 'Group is full' }, 400);
    }
    
    // Check if user is already a member
    const existingMember = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(group.id, user.id).first();
    
    if (existingMember) {
      return c.json({ error: 'Already a member of this group' }, 400);
    }
    
    // Add user to group
    await c.env?.DB.prepare(`
      INSERT INTO group_members (group_id, user_id)
      VALUES (?, ?)
    `).bind(group.id, user.id).run();
    
    // Initialize streak for new member
    await c.env?.DB.prepare(`
      INSERT INTO streaks (user_id, group_id)
      VALUES (?, ?)
    `).bind(user.id, group.id).run();
    
    return c.json({ group });
  } catch (error) {
    console.error('Error joining group:', error);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Leave group
app.delete('/:id/leave', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('id');
  
  try {
    // Check if user is member
    const membership = await c.env?.DB.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Check if user is the creator
    const group = await c.env?.DB.prepare(`
      SELECT created_by FROM groups WHERE id = ?
    `).bind(groupId).first();
    
    if (!group || group.created_by === user.id) {
      return c.json({ error: 'Group creator cannot leave group' }, 400);
    }
    
    // Remove user from group
    await c.env?.DB.prepare(`
      DELETE FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).run();
    
    // Remove user's streak
    await c.env?.DB.prepare(`
      DELETE FROM streaks WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).run();
    
    return c.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return c.json({ error: 'Failed to leave group' }, 500);
  }
});

export default app;
