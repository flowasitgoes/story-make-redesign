import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStory } from '../../../../backend/src/services/stories';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Story ID is required' });
      }
      const story = await getStory(id);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      return res.status(200).json(story);
    } catch (e: any) {
      return res.status(500).json({ message: e.message || 'Internal error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

