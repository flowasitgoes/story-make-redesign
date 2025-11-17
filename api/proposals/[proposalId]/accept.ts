import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const proposalId = req.query.proposalId as string;

  console.log(`\n=== [${requestId}] POST /api/proposals/${proposalId}/accept ===`);
  console.log(`[${requestId}] Proposal ID:`, proposalId);
  console.log(`[${requestId}] Body:`, JSON.stringify(req.body, null, 2));

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

    if (!proposalId) {
      return res.status(400).json({ message: 'Proposal ID is required' });
    }

    const { storyId } = req.body || {};
    if (!storyId) {
      return res.status(400).json({ message: 'storyId is required' });
    }

    console.log(`[${requestId}] Importing acceptProposal...`);
    const proposalsModule = require('../../lib/services/proposals');
    const acceptProposal = proposalsModule.acceptProposal;
    
    console.log(`[${requestId}] Calling acceptProposal(${storyId}, ${proposalId})...`);
    const result = await acceptProposal(null, storyId, proposalId);
    
    console.log(`[${requestId}] ✅ Proposal accepted`);
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Request completed in ${duration}ms`);
    return res.status(200).json(result.proposal);
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error after ${duration}ms:`, e);
    const msg = e?.message || 'Accept error';
    const status = msg.includes('already') || msg.includes('exists') ? 409 : msg.includes('exceeds') ? 422 : 400;
    return res.status(status).json({
      message: msg,
      error: e?.stack,
      requestId
    });
  }
}

