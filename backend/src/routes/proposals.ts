import { Router } from 'express';
import type { Namespace } from 'socket.io';
import { acceptProposal, rejectProposal } from '../services/proposals';

export default function proposalsRouterFactory(ns: Namespace) {
  const router = Router();

  // POST /proposals/:proposalId/accept
  router.post('/:proposalId/accept', async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { storyId } = req.body || {};
      if (!storyId) return res.status(400).json({ message: 'storyId is required' });
      const result = await acceptProposal(ns, storyId, proposalId);
      return res.json(result.proposal);
    } catch (e: any) {
      const msg = e.message || 'Accept error';
      const status = msg.includes('already') || msg.includes('exists') ? 409 : msg.includes('exceeds') ? 422 : 400;
      return res.status(status).json({ message: msg });
    }
  });

  // POST /proposals/:proposalId/reject
  router.post('/:proposalId/reject', async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { storyId } = req.body || {};
      if (!storyId) return res.status(400).json({ message: 'storyId is required' });
      const proposal = await rejectProposal(ns, storyId, proposalId);
      return res.json(proposal);
    } catch (e: any) {
      return res.status(400).json({ message: e.message || 'Reject error' });
    }
  });

  return router;
}


