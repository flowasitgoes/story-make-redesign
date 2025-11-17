import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const storyId = req.query.id as string;
  
  console.log(`\n=== [${requestId}] GET /api/stories/${storyId} ===`);
  console.log(`[${requestId}] Timestamp:`, new Date().toISOString());
  console.log(`[${requestId}] Story ID:`, storyId);

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!storyId) {
      return res.status(400).json({ message: 'Story ID is required' });
    }

    console.log(`[${requestId}] Importing getStory...`);
    const storiesModule = require('../../lib/services/stories');
    const getStory = storiesModule.getStory;
    
    console.log(`[${requestId}] Calling getStory(${storyId})...`);
    const story = await getStory(storyId);
    
    if (!story) {
      console.log(`[${requestId}] Story not found`);
      return res.status(404).json({ message: 'Story not found' });
    }

    console.log(`[${requestId}] ✅ Story found:`, story.id);
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Request completed in ${duration}ms`);
    return res.status(200).json(story);
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error after ${duration}ms:`, e);
    return res.status(500).json({
      message: e?.message || 'Internal error',
      error: e?.stack,
      requestId
    });
  }
}

