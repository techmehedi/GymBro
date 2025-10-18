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
      SELECT 
        g.id, g.name, g.description, g.invite_code, g.max_members,
        g.created_by, g.created_at, g.updated_at,
        gm.is_admin, gm.joined_at,
        (
          SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id
        ) AS member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY gm.joined_at DESC
    `).bind(user.id).all();
    
    return c.json({ groups: groups?.results || [] });
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

// Invite users to group
app.post('/:id/invite', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('id');
  const { user_ids } = await c.req.json();
  
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return c.json({ error: 'Invalid user IDs' }, 400);
  }
  
  try {
    // Check if user is admin of group
    const membership = await c.env?.DB.prepare(`
      SELECT is_admin FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();
    
    if (!membership || !membership.is_admin) {
      return c.json({ error: 'Only group admins can invite users' }, 403);
    }
    
    // Check if group exists and get max members
    const group = await c.env?.DB.prepare(`
      SELECT max_members FROM groups WHERE id = ?
    `).bind(groupId).first();
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check current member count
    const memberCount = await c.env?.DB.prepare(`
      SELECT COUNT(*) as count FROM group_members WHERE group_id = ?
    `).bind(groupId).first();
    
    if (!memberCount || (memberCount.count as number) + user_ids.length > (group.max_members as number)) {
      return c.json({ error: 'Group would exceed maximum member limit' }, 400);
    }
    
    const results = [];
    
    for (const userId of user_ids) {
      // Check if user exists
      const targetUser = await c.env?.DB.prepare(`
        SELECT id FROM users WHERE id = ?
      `).bind(userId).first();
      
      if (!targetUser) {
        results.push({ user_id: userId, status: 'error', message: 'User not found' });
        continue;
      }
      
      // Check if user is already a member
      const existingMember = await c.env?.DB.prepare(`
        SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
      `).bind(groupId, userId).first();
      
      if (existingMember) {
        results.push({ user_id: userId, status: 'error', message: 'User is already a member' });
        continue;
      }
      
      // Check if invitation already exists
      const existingInvitation = await c.env?.DB.prepare(`
        SELECT id FROM group_invitations 
        WHERE group_id = ? AND invitee_id = ? AND status = 'pending'
      `).bind(groupId, userId).first();
      
      if (existingInvitation) {
        results.push({ user_id: userId, status: 'error', message: 'Invitation already sent' });
        continue;
      }
      
      // Create invitation
      await c.env?.DB.prepare(`
        INSERT INTO group_invitations (group_id, inviter_id, invitee_id)
        VALUES (?, ?, ?)
      `).bind(groupId, user.id, userId).run();
      
      results.push({ user_id: userId, status: 'success', message: 'Invitation sent' });
    }
    
    return c.json({ results });
  } catch (error) {
    console.error('Error inviting users:', error);
    return c.json({ error: 'Failed to invite users' }, 500);
  }
});

// Get group invitations for user
app.get('/invitations', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  
  try {
    const invitations = await c.env?.DB.prepare(`
      SELECT gi.*, g.name as group_name, g.description as group_description,
             u.display_name as inviter_name, u.avatar_url as inviter_avatar
      FROM group_invitations gi
      JOIN groups g ON gi.group_id = g.id
      JOIN users u ON gi.inviter_id = u.id
      WHERE gi.invitee_id = ? AND gi.status = 'pending'
      ORDER BY gi.created_at DESC
    `).bind(user.id).all();
    
    return c.json({ invitations: invitations.results });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return c.json({ error: 'Failed to fetch invitations' }, 500);
  }
});

// Accept group invitation
app.post('/invitations/:id/accept', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const invitationId = c.req.param('id');
  
  try {
    // Get invitation details
    const invitation = await c.env?.DB.prepare(`
      SELECT gi.*, g.max_members
      FROM group_invitations gi
      JOIN groups g ON gi.group_id = g.id
      WHERE gi.id = ? AND gi.invitee_id = ? AND gi.status = 'pending'
    `).bind(invitationId, user.id).first();
    
    if (!invitation) {
      return c.json({ error: 'Invitation not found or already processed' }, 404);
    }
    
    // Check if group is full
    const memberCount = await c.env?.DB.prepare(`
      SELECT COUNT(*) as count FROM group_members WHERE group_id = ?
    `).bind(invitation.group_id).first();
    
    if (!memberCount || (memberCount.count as number) >= (invitation.max_members as number)) {
      return c.json({ error: 'Group is full' }, 400);
    }
    
    // Add user to group
    await c.env?.DB.prepare(`
      INSERT INTO group_members (group_id, user_id)
      VALUES (?, ?)
    `).bind(invitation.group_id, user.id).run();
    
    // Initialize streak for new member
    await c.env?.DB.prepare(`
      INSERT INTO streaks (user_id, group_id)
      VALUES (?, ?)
    `).bind(user.id, invitation.group_id).run();
    
    // Update invitation status
    await c.env?.DB.prepare(`
      UPDATE group_invitations 
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(invitationId).run();
    
    return c.json({ message: 'Successfully joined group' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return c.json({ error: 'Failed to accept invitation' }, 500);
  }
});

// Decline group invitation
app.post('/invitations/:id/decline', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const invitationId = c.req.param('id');
  
  try {
    // Update invitation status
    const result: any = await c.env?.DB.prepare(`
      UPDATE group_invitations 
      SET status = 'declined', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND invitee_id = ? AND status = 'pending'
    `).bind(invitationId, user.id).run();
    
    if (result.changes === 0) {
      return c.json({ error: 'Invitation not found or already processed' }, 404);
    }
    
    return c.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return c.json({ error: 'Failed to decline invitation' }, 500);
  }
});

// Delete group (only by creator/admin)
app.delete('/:id', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const groupId = c.req.param('id');
  
  try {
    // Check if user is admin of group or the creator
    const membership = await c.env?.DB.prepare(`
      SELECT is_admin FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.id).first();

    // Also fetch created_by to allow creator to delete even if admin flag wasn't set
    const group = await c.env?.DB.prepare(`
      SELECT id, created_by FROM groups WHERE id = ?
    `).bind(groupId).first();
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    const isAdmin = !!membership?.is_admin;
    const isCreator = group.created_by === user.id;
    if (!isAdmin && !isCreator) {
      return c.json({ error: 'Only group admins can delete groups' }, 403);
    }
    
    // Delete all related data in order
    // 1. Delete group invitations
    try { await c.env?.DB.prepare(`DELETE FROM group_invitations WHERE group_id = ?`).bind(groupId).run(); } catch {}
    
    // 2. Delete motivational messages (avoid FK constraint issues if cascades disabled)
    try { await c.env?.DB.prepare(`DELETE FROM motivational_messages WHERE group_id = ?`).bind(groupId).run(); } catch {}
    
    // 3. Delete posts
    try { await c.env?.DB.prepare(`DELETE FROM posts WHERE group_id = ?`).bind(groupId).run(); } catch {}
    
    // 4. Delete streaks
    try { await c.env?.DB.prepare(`DELETE FROM streaks WHERE group_id = ?`).bind(groupId).run(); } catch {}
    
    // 5. Delete group members
    try { await c.env?.DB.prepare(`DELETE FROM group_members WHERE group_id = ?`).bind(groupId).run(); } catch {}
    
    // 6. Delete group
    await c.env?.DB.prepare(`
      DELETE FROM groups WHERE id = ?
    `).bind(groupId).run();
    
    return c.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return c.json({ 
      error: 'Failed to delete group', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export default app;
