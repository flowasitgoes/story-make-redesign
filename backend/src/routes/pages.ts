import { Router } from 'express';
import type { Namespace } from 'socket.io';
import { getStory } from '../services/stories';
import { getPage, lockPage } from '../services/pages';
import { createProposal } from '../services/proposals';

export default function pagesRouterFactory(ns: Namespace) {
  const router = Router({ mergeParams: true });

  // GET /stories/:id/pages/:pageNumber
  router.get('/:id/pages/:pageNumber', async (req, res) => {
    const { id, pageNumber } = req.params;
    const story = await getStory(id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    const page = await getPage(id, Number(pageNumber));
    if (!page) return res.status(404).json({ message: 'Page not found' });
    return res.json(page);
  });

  // POST /stories/:id/pages/:pageNumber/lock
  router.post('/:id/pages/:pageNumber/lock', async (req, res) => {
    try {
      const { id, pageNumber } = req.params;
      const story = await getStory(id);
      if (!story) return res.status(404).json({ message: 'Story not found' });
      const result = await lockPage(ns, story, Number(pageNumber));
      return res.json(result.page);
    } catch (e: any) {
      return res.status(400).json({ message: e.message || 'Lock error' });
    }
  });

  // POST /stories/:id/pages/:pageNumber/proposals
  router.post('/:id/pages/:pageNumber/proposals', async (req, res) => {
    try {
      const { id, pageNumber } = req.params;
      const story = await getStory(id);
      if (!story) return res.status(404).json({ message: 'Story not found' });
      const { author, text } = req.body || {};
      if (!author || !text) return res.status(400).json({ message: 'author and text are required' });
      const proposal = await createProposal(ns, id, Number(pageNumber) as 1 | 2 | 3, author, text);
      return res.status(201).json(proposal);
    } catch (e: any) {
      const msg = e.message || 'Create proposal error';
      const status = msg.includes('at least 50') ? 422 : msg.includes('locked') ? 409 : 400;
      return res.status(status).json({ message: msg });
    }
  });

  return router;
}


