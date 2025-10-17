import { Hono } from 'hono';
import { Context } from 'hono';
import { AuthUser } from '../middleware/auth';

export const groupsRouter = new Hono<{ Bindings: any; Variables: { user: AuthUser } }>();

// Create a new group
groupsRouter.post('/', async (c: Context) => {
  try {
    const user = c.get('user');
    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Group name is required' }, 400);
    }

    const groupId = crypto.randomUUID();
    const inviteCode = generateInviteCode();

    await c.env.DB
      .prepare(`
        INSERT INTO groups (id, name, description, invite_code, created_by)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(groupId, name, description || '', inviteCode, user.id)
      .run();

    // Add creator as member
    await c.env.DB
      .prepare(`
        INSERT INTO group_members (id, group_id, user_id)
        VALUES (?, ?, ?)
      `)
      .bind(crypto.randomUUID(), groupId, user.id)
      .run();

    // Initialize streak for creator
    await c.env.DB
      .prepare(`
        INSERT INTO streaks (id, user_id, group_id)
        VALUES (?, ?, ?)
      `)
      .bind(crypto.randomUUID(), user.id, groupId)
      .run();

    return c.json({
      id: groupId,
      name,
      description: description || '',
      inviteCode,
      createdBy: user.id,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Join a group by invite code
groupsRouter.post('/join', async (c: Context) => {
  try {
    const user = c.get('user');
    const { inviteCode } = await c.req.json();

    if (!inviteCode) {
      return c.json({ error: 'Invite code is required' }, 400);
    }

    // Find group by invite code
    const group = await c.env.DB
      .prepare('SELECT * FROM groups WHERE invite_code = ?')
      .bind(inviteCode)
      .first();

    if (!group) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    // Check if user is already a member
    const existingMember = await c.env.DB
      .prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?')
      .bind(group.id, user.id)
      .first();

    if (existingMember) {
      return c.json({ error: 'Already a member of this group' }, 400);
    }

    // Add user to group
    await c.env.DB
      .prepare(`
        INSERT INTO group_members (id, group_id, user_id)
        VALUES (?, ?, ?)
      `)
      .bind(crypto.randomUUID(), group.id, user.id)
      .run();

    // Initialize streak for user
    await c.env.DB
      .prepare(`
        INSERT INTO streaks (id, user_id, group_id)
        VALUES (?, ?, ?)
      `)
      .bind(crypto.randomUUID(), user.id, group.id)
      .run();

    return c.json({
      message: 'Successfully joined group',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Get user's groups
groupsRouter.get('/', async (c: Context) => {
  try {
    const user = c.get('user');

    const groups = await c.env.DB
      .prepare(`
        SELECT g.*, gm.joined_at
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
        ORDER BY gm.joined_at DESC
      `)
      .bind(user.id)
      .all();

    return c.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// Get group details with members
groupsRouter.get('/:id', async (c: Context) => {
  try {
    const user = c.get('user');
    const groupId = c.req.param('id');

    // Check if user is member of group
    const membership = await c.env.DB
      .prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?')
      .bind(groupId, user.id)
      .first();

    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get group details
    const group = await c.env.DB
      .prepare('SELECT * FROM groups WHERE id = ?')
      .bind(groupId)
      .first();

    // Get group members
    const members = await c.env.DB
      .prepare(`
        SELECT u.id, u.name, u.email, u.avatar_url, gm.joined_at
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at ASC
      `)
      .bind(groupId)
      .all();

    return c.json({
      group,
      members,
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    return c.json({ error: 'Failed to fetch group details' }, 500);
  }
});

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
