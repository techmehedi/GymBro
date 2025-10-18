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

// Get upload URL for images
app.post('/url', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const { fileName, contentType } = await c.req.json();
  
  try {
    // Generate unique file name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `workout-photos/${user.id}/${timestamp}-${randomId}.${fileExtension}`;
    
    // Create R2 upload URL
    const uploadUrl = await c.env?.IMAGES.createMultipartUpload(uniqueFileName, {
      httpMetadata: {
        contentType: contentType || 'image/jpeg',
      },
    });
    
    return c.json({
      uploadUrl: uploadUrl.uploadId,
      fileName: uniqueFileName,
      key: uniqueFileName
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return c.json({ error: 'Failed to create upload URL' }, 500);
  }
});

// Complete multipart upload
app.post('/complete', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { uploadId, fileName, parts } = await c.req.json();
  
  try {
    // Complete the multipart upload
    // TODO: Fix R2 multipart upload API - method may have changed
    // const result = await c.env?.IMAGES.completeMultipartUpload(fileName, uploadId, parts);
    
    // Generate public URL
    const publicUrl = `https://your-r2-domain.com/${fileName}`;
    
    return c.json({
      success: true,
      url: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('Error completing upload:', error);
    return c.json({ error: 'Failed to complete upload' }, 500);
  }
});

// Delete uploaded image
app.delete('/:fileName', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const fileName = c.req.param('fileName');
  
  try {
    // Verify the file belongs to the user
    if (!fileName.startsWith(`workout-photos/${user.id}/`)) {
      return c.json({ error: 'Unauthorized to delete this file' }, 403);
    }
    
    // Delete from R2
    await c.env?.IMAGES.delete(fileName);
    
    return c.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// Get user's uploaded images
app.get('/user', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { user } = authResult;
  const limit = parseInt(c.req.query('limit') || '20');
  
  try {
    // List user's images from R2
    const prefix = `workout-photos/${user.id}/`;
    const objects = await c.env?.IMAGES.list({
      prefix,
      limit
    });
    
    const images = objects.objects.map(obj => ({
      fileName: obj.key,
      url: `https://your-r2-domain.com/${obj.key}`,
      size: obj.size,
      uploaded: obj.uploaded
    }));
    
    return c.json({ images });
  } catch (error) {
    console.error('Error fetching user images:', error);
    return c.json({ error: 'Failed to fetch images' }, 500);
  }
});

export default app;
