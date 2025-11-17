import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const storyId = req.query.id as string;

  console.log(`\n=== [${requestId}] GET /api/stories/${storyId}/proposals ===`);
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

    console.log(`[${requestId}] Importing listProposals...`);
    const proposalsModule = require('../../lib/services/proposals');
    const listProposals = proposalsModule.listProposals;
    
    console.log(`[${requestId}] Calling listProposals(${storyId})...`);
    const proposals = await listProposals(storyId);
    
    console.log(`[${requestId}] ✅ Found ${proposals.length} proposals`);
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Request completed in ${duration}ms`);
    return res.status(200).json(proposals);
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

