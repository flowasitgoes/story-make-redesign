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

    // 步骤 1: 测试导入 listStories
    if (req.method === 'GET') {
      console.log(`[${requestId}] Handling GET request`);
      console.log(`[${requestId}] Step 1: Attempting to import listStories...`);
      
      try {
        // 尝试导入模块
        console.log(`[${requestId}] Loading module from: ../lib/services/stories`);
        const storiesModule = require('../lib/services/stories');
        console.log(`[${requestId}] ✅ Module imported successfully`);
        console.log(`[${requestId}] Module exports:`, Object.keys(storiesModule));
        
        const listStories = storiesModule.listStories;
        console.log(`[${requestId}] listStories type:`, typeof listStories);
        
        if (!listStories) {
          console.error(`[${requestId}] ❌ listStories function not found`);
          console.error(`[${requestId}] Available exports:`, Object.keys(storiesModule));
          // 返回空数组而不是抛出错误
          return res.status(200).json([]);
        }
        
        console.log(`[${requestId}] Step 2: Calling listStories()...`);
        const stories = await listStories();
        console.log(`[${requestId}] ✅ listStories() completed`);
        console.log(`[${requestId}] Stories type:`, Array.isArray(stories) ? 'array' : typeof stories);
        console.log(`[${requestId}] Stories count:`, Array.isArray(stories) ? stories.length : 'not an array');
        
        // 确保返回的是数组
        const result = Array.isArray(stories) ? stories : [];
        console.log(`[${requestId}] Final result count:`, result.length);
        if (result.length > 0) {
          console.log(`[${requestId}] First story:`, JSON.stringify(result[0], null, 2));
        }
        
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ✅ Request completed successfully in ${duration}ms`);
        return res.status(200).json(result);
      } catch (importError: any) {
        console.error(`[${requestId}] ❌ Error in GET handler:`, importError);
        console.error(`[${requestId}] Error type:`, importError?.constructor?.name);
        console.error(`[${requestId}] Error message:`, importError?.message);
        console.error(`[${requestId}] Error stack:`, importError?.stack);
        console.error(`[${requestId}] Error code:`, importError?.code);
        console.error(`[${requestId}] Error name:`, importError?.name);
        
        // 即使出错也返回空数组，避免前端报错
        console.log(`[${requestId}] Returning empty array due to error`);
        return res.status(200).json([]);
      }
    }

    // 步骤 2: 实现 POST /api/stories（创建故事）
    if (req.method === 'POST') {
      console.log(`[${requestId}] Handling POST request`);
      console.log(`[${requestId}] Step 1: Parsing request body...`);
      
      const { title, authors } = req.body || {};
      console.log(`[${requestId}] Received:`, { title, authors });
      
      if (!title || typeof title !== 'string') {
        console.error(`[${requestId}] ❌ Invalid title:`, title);
        return res.status(400).json({ message: 'title is required' });
      }
      
      try {
        console.log(`[${requestId}] Step 2: Importing createStory...`);
        const storiesModule = require('../lib/services/stories');
        console.log(`[${requestId}] ✅ Module imported successfully`);
        
        const createStory = storiesModule.createStory;
        console.log(`[${requestId}] createStory type:`, typeof createStory);
        
        if (!createStory) {
          console.error(`[${requestId}] ❌ createStory function not found`);
          return res.status(500).json({ message: 'createStory function not available' });
        }
        
        console.log(`[${requestId}] Step 3: Calling createStory(${title}, ${JSON.stringify(authors)})...`);
        const result = await createStory(title, authors);
        console.log(`[${requestId}] ✅ createStory() completed`);
        console.log(`[${requestId}] Created story ID:`, result.story.id);
        console.log(`[${requestId}] Story:`, JSON.stringify(result.story, null, 2));
        
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ✅ Request completed successfully in ${duration}ms`);
        return res.status(201).json(result.story);
      } catch (createError: any) {
        console.error(`[${requestId}] ❌ Error in POST handler:`, createError);
        console.error(`[${requestId}] Error type:`, createError?.constructor?.name);
        console.error(`[${requestId}] Error message:`, createError?.message);
        console.error(`[${requestId}] Error stack:`, createError?.stack);
        console.error(`[${requestId}] Error code:`, createError?.code);
        
        const status = createError?.message?.includes('required') ? 400 : 500;
        return res.status(status).json({
          message: createError?.message || 'Failed to create story',
          error: createError?.stack,
          type: createError?.constructor?.name,
          requestId
        });
      }
    }

    console.log(`[${requestId}] Method not allowed:`, req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`\n=== [${requestId}] ERROR ===`);
    console.error(`[${requestId}] Error after ${duration}ms`);
    console.error(`[${requestId}] Error type:`, e?.constructor?.name);
    console.error(`[${requestId}] Error message:`, e?.message);
    console.error(`[${requestId}] Error stack:`, e?.stack);
    console.error(`[${requestId}] Full error object:`, JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    
    return res.status(500).json({
      message: e?.message || 'Internal error',
      error: e?.stack,
      type: e?.constructor?.name,
      requestId
    });
  }
}

