import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rejectProposal } from '../../lib/services/proposals';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { proposalId } = req.query;
      if (!proposalId || typeof proposalId !== 'string') {
        return res.status(400).json({ message: 'Proposal ID is required' });
      }
      const { storyId } = req.body || {};
      if (!storyId) {
        return res.status(400).json({ message: 'storyId is required' });
      }
      // Note: Socket.IO namespace is not available in Serverless Functions
      const proposal = await rejectProposal(null, storyId, proposalId);
      return res.status(200).json(proposal);
    } catch (e: any) {
      return res.status(400).json({ message: e.message || 'Reject error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

