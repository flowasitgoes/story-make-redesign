import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStory } from '../../../../lib/services/stories';
import { getPage } from '../../../../lib/services/pages';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
      const page = await getPage(id, pageNum);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      return res.status(200).json(page);
    } catch (e: any) {
      return res.status(500).json({ message: e.message || 'Internal error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

