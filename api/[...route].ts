import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listStories, createStory, getStory } from './lib/services/stories';
import { getPage, lockPage } from './lib/services/pages';
import { listProposals, createProposal, acceptProposal, rejectProposal } from './lib/services/proposals';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 从 query.route 解析路径（Vercel catch-all 路由会将路径段放在 query.route）
    let path: string[] = [];
    if (req.query.route) {
      if (Array.isArray(req.query.route)) {
        path = req.query.route;
      } else {
        path = [req.query.route];
      }
    } else if (req.url) {
      // 备用方案：从 URL 解析
      const urlPath = req.url.replace(/^\/api\/?/, '').split('/').filter(Boolean);
      path = urlPath;
    }
    const route = path.join('/');

    console.log('=== API Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Query:', JSON.stringify(req.query));
    console.log('Path:', path);
    console.log('Route:', route);

    // GET /api/stories
    if (req.method === 'GET' && route === 'stories') {
      console.log('Handling GET /api/stories');
      try {
        const stories = await listStories();
        console.log(`Successfully retrieved ${stories.length} stories`);
        return res.status(200).json(stories);
      } catch (error: any) {
        console.error('Error in listStories:', error);
        throw error;
      }
    }

    // POST /api/stories
    if (req.method === 'POST' && route === 'stories') {
      const { title, authors } = req.body || {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: 'title is required' });
      }
      const result = await createStory(title, authors);
      return res.status(201).json(result.story);
    }

    // GET /api/stories/[id]
    if (req.method === 'GET' && route.startsWith('stories/') && path.length === 2) {
      const storyId = path[1];
      const story = await getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      return res.status(200).json(story);
    }

    // GET /api/stories/[id]/proposals
    if (req.method === 'GET' && route.startsWith('stories/') && path.length === 3 && path[2] === 'proposals') {
      const storyId = path[1];
      const proposals = await listProposals(storyId);
      return res.status(200).json(proposals);
    }

    // GET /api/stories/[id]/pages/[pageNumber]
    if (req.method === 'GET' && route.startsWith('stories/') && path.length === 4 && path[2] === 'pages') {
      const storyId = path[1];
      const pageNumber = Number(path[3]);
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
        return res.status(400).json({ message: 'Invalid page number' });
      }
      const page = await getPage(storyId, pageNumber);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      return res.status(200).json(page);
    }

    // POST /api/stories/[id]/pages/[pageNumber]/lock
    if (req.method === 'POST' && route.startsWith('stories/') && path.length === 5 && path[2] === 'pages' && path[4] === 'lock') {
      const storyId = path[1];
      const pageNumber = Number(path[3]);
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
        return res.status(400).json({ message: 'Invalid page number' });
      }
      const story = await getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      const result = await lockPage(null, story, pageNumber);
      return res.status(200).json(result.page);
    }

    // POST /api/stories/[id]/pages/[pageNumber]/proposals
    if (req.method === 'POST' && route.startsWith('stories/') && path.length === 5 && path[2] === 'pages' && path[4] === 'proposals') {
      const storyId = path[1];
      const pageNumber = Number(path[3]);
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
        return res.status(400).json({ message: 'Invalid page number' });
      }
      const story = await getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      const { author, text } = req.body || {};
      if (!author || !text) {
        return res.status(400).json({ message: 'author and text are required' });
      }
      const proposal = await createProposal(null, storyId, pageNumber as 1 | 2 | 3, author, text);
      return res.status(201).json(proposal);
    }

    // POST /api/proposals/[proposalId]/accept
    if (req.method === 'POST' && route.startsWith('proposals/') && path.length === 3 && path[2] === 'accept') {
      const proposalId = path[1];
      const { storyId } = req.body || {};
      if (!storyId) {
        return res.status(400).json({ message: 'storyId is required' });
      }
      const result = await acceptProposal(null, storyId, proposalId);
      return res.status(200).json(result.proposal);
    }

    // POST /api/proposals/[proposalId]/reject
    if (req.method === 'POST' && route.startsWith('proposals/') && path.length === 3 && path[2] === 'reject') {
      const proposalId = path[1];
      const { storyId } = req.body || {};
      if (!storyId) {
        return res.status(400).json({ message: 'storyId is required' });
      }
      const proposal = await rejectProposal(null, storyId, proposalId);
      return res.status(200).json(proposal);
    }

    console.log('Route not matched:', route);
    return res.status(404).json({ message: 'Route not found', route });
  } catch (e: any) {
    console.error('=== API Error ===');
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);
    console.error('Error type:', e.constructor?.name);
    
    const status = e.message?.includes('not found') ? 404 : 
                   e.message?.includes('required') ? 400 :
                   e.message?.includes('locked') ? 409 :
                   e.message?.includes('at least') ? 422 : 500;
    
    return res.status(status).json({ 
      message: e.message || 'Internal error',
      error: e.stack,
      type: e.constructor?.name
    });
  }
}

