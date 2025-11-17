import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStory } from '../../../../lib/services/stories';
import { lockPage } from '../../../../lib/services/pages';

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
      const result = await lockPage(null, story, pageNum);
      return res.status(200).json(result.page);
    } catch (e: any) {
      const msg = e.message || 'Lock error';
      const status = msg.includes('at least') ? 422 : 400;
      return res.status(status).json({ message: msg });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

