import { Hono } from 'hono';
import { Context } from 'hono';
import { AuthUser } from '../middleware/auth';

export const uploadRouter = new Hono<{ Bindings: any; Variables: { user: AuthUser } }>();

// Generate presigned URL for image upload
uploadRouter.post('/presigned-url', async (c: Context) => {
  try {
    const user = c.get('user');
    const { fileName, contentType = 'image/jpeg' } = await c.req.json();

    if (!fileName) {
      return c.json({ error: 'File name is required' }, 400);
    }

    // Generate unique key for the image
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const imageKey = `images/${user.id}/${crypto.randomUUID()}.${fileExtension}`;

    // For R2, we'll use a simple upload approach
    // In production, you'd generate a presigned URL
    const uploadUrl = `${c.env.R2_ENDPOINT}/${c.env.R2_BUCKET_NAME}/${imageKey}`;

    return c.json({
      uploadUrl,
      imageKey,
      contentType,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// Upload image directly to R2
uploadRouter.post('/image', async (c: Context) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return c.json({ error: 'Image file is required' }, 400);
    }

    // Generate unique key for the image
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const imageKey = `images/${user.id}/${crypto.randomUUID()}.${fileExtension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2.put(imageKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return the public URL
    const imageUrl = `https://your-r2-domain.com/${imageKey}`;

    return c.json({
      imageUrl,
      imageKey,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});
