import { Hono } from 'hono';
import { Context } from 'hono';
import { AuthUser } from '../middleware/auth';

export const voiceRouter = new Hono<{ Bindings: any; Variables: { user: AuthUser } }>();

// Convert text to speech using ElevenLabs
voiceRouter.post('/generate', async (c: Context) => {
  try {
    const user = c.get('user');
    const { text, messageId } = await c.req.json();

    if (!text) {
      return c.json({ error: 'Text is required' }, 400);
    }

    const audioUrl = await generateVoiceClip(text, c.env);

    // Update message with audio URL if messageId provided
    if (messageId) {
      await c.env.DB
        .prepare('UPDATE motivational_messages SET audio_url = ? WHERE id = ?')
        .bind(audioUrl, messageId)
        .run();
    }

    return c.json({
      audioUrl,
      text,
      messageId,
    });
  } catch (error) {
    console.error('Error generating voice clip:', error);
    return c.json({ error: 'Failed to generate voice clip' }, 500);
  }
});

async function generateVoiceClip(text: string, env: any): Promise<string> {
  try {
    const elevenLabsApiKey = env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      // Return a placeholder URL for demo purposes
      return 'https://example.com/placeholder-audio.mp3';
    }

    // Use a default voice ID (you can make this configurable)
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Upload to R2 storage
    const audioKey = `audio/${crypto.randomUUID()}.mp3`;
    await env.R2.put(audioKey, audioBuffer, {
      httpMetadata: {
        contentType: 'audio/mpeg',
      },
    });

    // Return the R2 URL
    return `https://your-r2-domain.com/${audioKey}`;
  } catch (error) {
    console.error('Error generating voice clip:', error);
    // Return placeholder for demo
    return 'https://example.com/placeholder-audio.mp3';
  }
}
