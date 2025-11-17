import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const storyId = req.query.id as string;
  const pageNumber = Number(req.query.pageNumber);

  console.log(`\n=== [${requestId}] POST /api/stories/${storyId}/pages/${pageNumber}/lock ===`);
  console.log(`[${requestId}] Story ID:`, storyId);
  console.log(`[${requestId}] Page Number:`, pageNumber);

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!storyId || isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
      return res.status(400).json({ message: 'Invalid story ID or page number' });
    }

    console.log(`[${requestId}] Importing services...`);
    const pagesModule = require('../../../../lib/services/pages');
    const storiesModule = require('../../../../lib/services/stories');
    
    const getStory = storiesModule.getStory;
    const lockPage = pagesModule.lockPage;
    
    console.log(`[${requestId}] Getting story...`);
    const story = await getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    console.log(`[${requestId}] Locking page ${pageNumber}...`);
    const result = await lockPage(null, story, pageNumber as 1 | 2 | 3);
    
    console.log(`[${requestId}] ✅ Page locked`);
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Request completed in ${duration}ms`);
    return res.status(200).json(result.page);
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error after ${duration}ms:`, e);
    const msg = e?.message || 'Lock error';
    const status = msg.includes('at least') ? 422 : msg.includes('locked') ? 409 : 400;
    return res.status(status).json({
      message: msg,
      error: e?.stack,
      requestId
    });
  }
}

