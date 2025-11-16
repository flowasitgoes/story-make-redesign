import { Router } from 'express';
import type { Namespace } from 'socket.io';
import { createStory, listStories, getStory } from '../services/stories';
import { listProposals } from '../services/proposals';

export default function storiesRouterFactory(ns: Namespace) {
  const router = Router();

  // POST /stories
  router.post('/', async (req, res) => {
    try {
      const { title, authors } = req.body || {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: 'title is required' });
      }
      const result = await createStory(title, authors);
      ns.emit('story:created', { story: result.story });
      ns.to(`story:${result.story.id}`).emit('page:opened', { storyId: result.story.id, pageNumber: 1 });
      return res.status(201).json(result.story);
    } catch (e: any) {
      return res.status(500).json({ message: e.message || 'Internal error' });
    }
  });

  // GET /stories
  router.get('/', async (_req, res) => {
    const list = await listStories();
    return res.json(list);
  });

  // GET /stories/:id
  router.get('/:id', async (req, res) => {
    const story = await getStory(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    return res.json(story);
  });

  // GET /stories/:id/proposals
  router.get('/:id/proposals', async (req, res) => {
    const story = await getStory(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    const items = await listProposals(req.params.id);
    return res.json(items);
  });

  return router;
}


