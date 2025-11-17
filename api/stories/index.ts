import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listStories, createStory } from '../../../backend/src/services/stories';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const stories = await listStories();
      return res.status(200).json(stories);
    } catch (e: any) {
      return res.status(500).json({ message: e.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, authors } = req.body || {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: 'title is required' });
      }
      const result = await createStory(title, authors);
      // Note: Socket.IO events are not available in Serverless Functions
      // You may need to use Vercel's Server-Sent Events or external WebSocket service
      return res.status(201).json(result.story);
    } catch (e: any) {
      return res.status(500).json({ message: e.message || 'Internal error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

