import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`\n=== [${requestId}] API Request Started ===`);
  console.log(`[${requestId}] Timestamp:`, new Date().toISOString());
  console.log(`[${requestId}] Method:`, req.method);
  console.log(`[${requestId}] URL:`, req.url);
  console.log(`[${requestId}] Query:`, JSON.stringify(req.query, null, 2));
  console.log(`[${requestId}] Body:`, JSON.stringify(req.body, null, 2));

  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      console.log(`[${requestId}] Handling OPTIONS request`);
      return res.status(200).end();
    }

    // 解析路由路径
    // Vercel catch-all 路由会把路径段放在 req.query.route，但我们也从 URL 解析作为备用
    let path: string[] = [];
    
    console.log(`[${requestId}] Raw query.route:`, req.query.route);
    console.log(`[${requestId}] Raw req.url:`, req.url);
    
    // 方法 1: 从 URL 解析（最可靠）
    if (req.url) {
      // 移除查询字符串和 /api 前缀
      const cleanUrl = req.url.split('?')[0];
      const urlPath = cleanUrl.replace(/^\/api\/?/, '').split('/').filter(Boolean);
      if (urlPath.length > 0) {
        path = urlPath;
      }
    }
    
    // 方法 2: 从 req.query.route 获取（Vercel catch-all 路由的标准方式）
    if (path.length === 0 && req.query.route) {
      if (Array.isArray(req.query.route)) {
        // 如果是数组，直接使用
        path = req.query.route as string[];
      } else {
        // 如果是字符串，需要处理
        const routeStr = String(req.query.route);
        // 移除查询字符串部分（如果有）
        const cleanRoute = routeStr.split('?')[0].split('&')[0];
        // 按 '/' 分割路径
        path = cleanRoute ? cleanRoute.split('/').filter(Boolean) : [];
      }
    }
    
    const route = path.join('/');

    console.log(`[${requestId}] Parsed path array:`, path);
    console.log(`[${requestId}] Final route string:`, route);

    // GET /api/stories
    if (req.method === 'GET' && route === 'stories') {
      console.log(`[${requestId}] Handling GET /api/stories`);
      try {
        const storiesModule = require('./lib/services/stories');
        const listStories = storiesModule.listStories;
        const stories = await listStories();
        const result = Array.isArray(stories) ? stories : [];
        console.log(`[${requestId}] ✅ Returning ${result.length} stories`);
        return res.status(200).json(result);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return res.status(200).json([]); // 返回空数组避免前端错误
      }
    }

    // POST /api/stories
    if (req.method === 'POST' && route === 'stories') {
      console.log(`[${requestId}] Handling POST /api/stories`);
      console.log(`[${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
      try {
        const { title, authors } = req.body || {};
        console.log(`[${requestId}] Parsed: title=${title}, authors=${JSON.stringify(authors)}`);
        
        if (!title || typeof title !== 'string') {
          console.error(`[${requestId}] ❌ Invalid title:`, title);
          return res.status(400).json({ message: 'title is required' });
        }
        
        console.log(`[${requestId}] Importing createStory...`);
        const storiesModule = require('./lib/services/stories');
        const createStory = storiesModule.createStory;
        
        if (!createStory) {
          console.error(`[${requestId}] ❌ createStory function not found`);
          return res.status(500).json({ message: 'createStory function not available' });
        }
        
        console.log(`[${requestId}] Calling createStory(${title}, ${JSON.stringify(authors)})...`);
        const result = await createStory(title, authors);
        console.log(`[${requestId}] ✅ Created story:`, result.story.id);
        console.log(`[${requestId}] Story data:`, JSON.stringify(result.story, null, 2));
        
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ✅ Request completed successfully in ${duration}ms`);
        return res.status(201).json(result.story);
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] ❌ Error after ${duration}ms:`, error);
        console.error(`[${requestId}] Error type:`, error?.constructor?.name);
        console.error(`[${requestId}] Error message:`, error?.message);
        console.error(`[${requestId}] Error stack:`, error?.stack);
        console.error(`[${requestId}] Error code:`, error?.code);
        console.error(`[${requestId}] Error name:`, error?.name);
        console.error(`[${requestId}] Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        const status = error?.message?.includes('required') ? 400 : 500;
        return res.status(status).json({ 
          message: error?.message || 'Failed to create story',
          error: error?.stack,
          errorType: error?.constructor?.name,
          errorCode: error?.code,
          requestId
        });
      }
    }

    // GET /api/stories/[id]
    if (req.method === 'GET' && path.length === 2 && path[0] === 'stories') {
      console.log(`[${requestId}] Handling GET /api/stories/${path[1]}`);
      try {
        const storyId = path[1];
        const storiesModule = require('./lib/services/stories');
        const getStory = storiesModule.getStory;
        const story = await getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: 'Story not found' });
        }
        console.log(`[${requestId}] ✅ Story found`);
        return res.status(200).json(story);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return res.status(500).json({ message: error?.message || 'Internal error' });
      }
    }

    // GET /api/stories/[id]/proposals
    if (req.method === 'GET' && path.length === 3 && path[0] === 'stories' && path[2] === 'proposals') {
      console.log(`[${requestId}] Handling GET /api/stories/${path[1]}/proposals`);
      try {
        const storyId = path[1];
        const proposalsModule = require('./lib/services/proposals');
        const listProposals = proposalsModule.listProposals;
        const proposals = await listProposals(storyId);
        console.log(`[${requestId}] ✅ Found ${proposals.length} proposals`);
        return res.status(200).json(proposals);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return res.status(500).json({ message: error?.message || 'Internal error' });
      }
    }

    // GET /api/stories/[id]/pages/[pageNumber]
    if (req.method === 'GET' && path.length === 4 && path[0] === 'stories' && path[2] === 'pages') {
      console.log(`[${requestId}] Handling GET /api/stories/${path[1]}/pages/${path[3]}`);
      try {
        const storyId = path[1];
        const pageNumber = Number(path[3]);
        if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
          return res.status(400).json({ message: 'Invalid page number' });
        }
        const pagesModule = require('./lib/services/pages');
        const storiesModule = require('./lib/services/stories');
        const getStory = storiesModule.getStory;
        const getPage = pagesModule.getPage;
        const story = await getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: 'Story not found' });
        }
        const page = await getPage(storyId, pageNumber as 1 | 2 | 3);
        if (!page) {
          return res.status(404).json({ message: 'Page not found' });
        }
        console.log(`[${requestId}] ✅ Page found`);
        return res.status(200).json(page);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return res.status(500).json({ message: error?.message || 'Internal error' });
      }
    }

    // POST /api/stories/[id]/pages/[pageNumber]/lock
    if (req.method === 'POST' && path.length === 5 && path[0] === 'stories' && path[2] === 'pages' && path[4] === 'lock') {
      console.log(`[${requestId}] Handling POST /api/stories/${path[1]}/pages/${path[3]}/lock`);
      try {
        const storyId = path[1];
        const pageNumber = Number(path[3]);
        if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
          return res.status(400).json({ message: 'Invalid page number' });
        }
        const pagesModule = require('./lib/services/pages');
        const storiesModule = require('./lib/services/stories');
        const getStory = storiesModule.getStory;
        const lockPage = pagesModule.lockPage;
        const story = await getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: 'Story not found' });
        }
        const result = await lockPage(null, story, pageNumber as 1 | 2 | 3);
        console.log(`[${requestId}] ✅ Page locked`);
        return res.status(200).json(result.page);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        const msg = error?.message || 'Lock error';
        const status = msg.includes('at least') ? 422 : msg.includes('locked') ? 409 : 400;
        return res.status(status).json({ message: msg });
      }
    }

    // POST /api/stories/[id]/pages/[pageNumber]/proposals
    if (req.method === 'POST' && path.length === 5 && path[0] === 'stories' && path[2] === 'pages' && path[4] === 'proposals') {
      console.log(`[${requestId}] Handling POST /api/stories/${path[1]}/pages/${path[3]}/proposals`);
      try {
        const storyId = path[1];
        const pageNumber = Number(path[3]);
        if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 3) {
          return res.status(400).json({ message: 'Invalid page number' });
        }
        const { author, text } = req.body || {};
        if (!author || !text) {
          return res.status(400).json({ message: 'author and text are required' });
        }
        const proposalsModule = require('./lib/services/proposals');
        const storiesModule = require('./lib/services/stories');
        const getStory = storiesModule.getStory;
        const createProposal = proposalsModule.createProposal;
        const story = await getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: 'Story not found' });
        }
        const proposal = await createProposal(null, storyId, pageNumber as 1 | 2 | 3, author, text);
        console.log(`[${requestId}] ✅ Proposal created:`, proposal.id);
        return res.status(201).json(proposal);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        const msg = error?.message || 'Create proposal error';
        const status = msg.includes('at least 50') ? 422 : msg.includes('locked') ? 409 : 400;
        return res.status(status).json({ message: msg });
      }
    }

    // POST /api/proposals/[proposalId]/accept
    if (req.method === 'POST' && path.length === 3 && path[0] === 'proposals' && path[2] === 'accept') {
      console.log(`[${requestId}] Handling POST /api/proposals/${path[1]}/accept`);
      try {
        const proposalId = path[1];
        const { storyId } = req.body || {};
        if (!storyId) {
          return res.status(400).json({ message: 'storyId is required' });
        }
        const proposalsModule = require('./lib/services/proposals');
        const acceptProposal = proposalsModule.acceptProposal;
        const result = await acceptProposal(null, storyId, proposalId);
        console.log(`[${requestId}] ✅ Proposal accepted`);
        return res.status(200).json(result.proposal);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        const msg = error?.message || 'Accept error';
        const status = msg.includes('already') || msg.includes('exists') ? 409 : msg.includes('exceeds') ? 422 : 400;
        return res.status(status).json({ message: msg });
      }
    }

    // POST /api/proposals/[proposalId]/reject
    if (req.method === 'POST' && path.length === 3 && path[0] === 'proposals' && path[2] === 'reject') {
      console.log(`[${requestId}] Handling POST /api/proposals/${path[1]}/reject`);
      try {
        const proposalId = path[1];
        const { storyId } = req.body || {};
        if (!storyId) {
          return res.status(400).json({ message: 'storyId is required' });
        }
        const proposalsModule = require('./lib/services/proposals');
        const rejectProposal = proposalsModule.rejectProposal;
        const proposal = await rejectProposal(null, storyId, proposalId);
        console.log(`[${requestId}] ✅ Proposal rejected`);
        return res.status(200).json(proposal);
      } catch (error: any) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return res.status(400).json({ message: error?.message || 'Reject error' });
      }
    }

    console.log(`[${requestId}] Route not matched:`, route);
    return res.status(404).json({ message: 'Route not found', route });
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`\n=== [${requestId}] ERROR ===`);
    console.error(`[${requestId}] Error after ${duration}ms`);
    console.error(`[${requestId}] Error type:`, e?.constructor?.name);
    console.error(`[${requestId}] Error message:`, e?.message);
    console.error(`[${requestId}] Error stack:`, e?.stack);
    
    const status = e?.message?.includes('not found') ? 404 :
                   e?.message?.includes('required') ? 400 :
                   e?.message?.includes('locked') ? 409 :
                   e?.message?.includes('at least') ? 422 : 500;

    return res.status(status).json({
      message: e?.message || 'Internal error',
      error: e?.stack,
      type: e?.constructor?.name,
      requestId
    });
  }
}

