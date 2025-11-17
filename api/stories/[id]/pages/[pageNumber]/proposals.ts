import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStory } from '../../../../lib/services/stories';
import { createProposal } from '../../../../lib/services/proposals';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { id, pageNumber } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Story ID is required' });
      }
      const pageNum = Number(pageNumber);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > 3) {
        return res.status(400).json({ message: 'Invalid page number' });
      }
      const story = await getStory(id);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      const { author, text } = req.body || {};
      if (!author || !text) {
        return res.status(400).json({ message: 'author and text are required' });
      }
      const proposal = await createProposal(null, id, pageNum as 1 | 2 | 3, author, text);
      return res.status(201).json(proposal);
    } catch (e: any) {
      const msg = e.message || 'Create proposal error';
      const status = msg.includes('at least 50') ? 422 : msg.includes('locked') ? 409 : 400;
      return res.status(status).json({ message: msg });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

