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
    // Check if IMAGES binding exists
    if (!c.env?.IMAGES) {
      console.error('IMAGES R2 binding not found');
      return c.json({ error: 'Image storage not configured' }, 500);
    }
    
    // Generate unique file name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `workout-photos/${user.id}/${timestamp}-${randomId}.${fileExtension}`;
    
    console.log('Creating presigned URL for:', uniqueFileName);
    
    // Create presigned URL for direct upload to R2
    const uploadUrl = await c.env.IMAGES.createPresignedUrl('PUT', uniqueFileName, {
      httpMetadata: {
        contentType: contentType || 'image/jpeg',
      },
    });
    
    console.log('Upload URL created successfully');
    
    return c.json({
      uploadUrl: uploadUrl.url,
      fileName: uniqueFileName,
      key: uniqueFileName,
      expires: uploadUrl.expires
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return c.json({ 
      error: 'Failed to create upload URL', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Direct upload endpoint (multipart/form-data)
app.post('/direct', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;

  const { user } = authResult;

  try {
    if (!c.env?.IMAGES) {
      console.error('IMAGES R2 binding not found');
      return c.json({ error: 'Image storage not configured' }, 500);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const providedName = (formData.get('fileName') as string) || '';

    if (!file || typeof file === 'string') {
      return c.json({ error: 'No file provided' }, 400);
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = providedName.split('.').pop() || 'jpg';
    const uniqueFileName = `workout-photos/${user.id}/${timestamp}-${randomId}.${extension}`;

    await c.env.IMAGES.put(uniqueFileName, file.stream(), {
      httpMetadata: { contentType: (file as any).type || 'image/jpeg' },
    });

    const publicUrl = `https://peer-fitness-images.gymbro.workers.dev/${uniqueFileName}`;
    return c.json({ success: true, url: publicUrl, fileName: uniqueFileName });
  } catch (error) {
    console.error('Error in direct upload:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Complete upload (for direct uploads)
app.post('/complete', async (c) => {
  const authResult = await verifyAuth(c);
  if ('error' in authResult) return authResult;
  
  const { fileName } = await c.req.json();
  
  try {
    // For direct uploads, we just need to verify the file exists
    // and return the public URL
    const publicUrl = `https://peer-fitness-images.gymbro.workers.dev/${fileName}`;
    
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
      url: `https://peer-fitness-images.gymbro.workers.dev/${obj.key}`,
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
