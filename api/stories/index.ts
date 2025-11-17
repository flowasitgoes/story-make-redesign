import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';

// 动态导入函数，在运行时加载模块
async function loadStoriesModule() {
  try {
    // 尝试多种路径
    const modulePaths: string[] = [
      '../../../backend/src/services/stories',
      path.join(process.cwd(), 'backend', 'src', 'services', 'stories')
    ];
    
    // 如果 __dirname 可用，也尝试使用它
    try {
      if (typeof __dirname !== 'undefined') {
        modulePaths.push(path.join(__dirname, '..', '..', '..', 'backend', 'src', 'services', 'stories'));
      }
    } catch {
      // __dirname 不可用，跳过
    }
    
    for (const modulePath of modulePaths) {
      try {
        const module = require(modulePath);
        if (module.listStories && module.createStory) {
          console.log(`Successfully loaded stories module from: ${modulePath}`);
          return module;
        }
      } catch (e: any) {
        console.log(`Failed to load from ${modulePath}:`, e.message);
        // 继续尝试下一个路径
        continue;
      }
    }
    throw new Error('Could not load stories module from any path');
  } catch (error: any) {
    console.error('Failed to load stories module:', error);
    console.error('Current working directory:', process.cwd());
    throw error;
  }
}

let storiesModule: any = null;

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
      // 延迟加载模块
      if (!storiesModule) {
        storiesModule = await loadStoriesModule();
      }
      console.log('Fetching stories...');
      const stories = await storiesModule.listStories();
      console.log(`Found ${stories.length} stories`);
      return res.status(200).json(stories);
    } catch (e: any) {
      console.error('Error listing stories:', e);
      console.error('Error stack:', e.stack);
      return res.status(500).json({ 
        message: e.message || 'Internal error',
        error: e.stack,
        type: e.constructor?.name
      });
    }
  }

  if (req.method === 'POST') {
    try {
      // 延迟加载模块
      if (!storiesModule) {
        storiesModule = await loadStoriesModule();
      }
      const { title, authors } = req.body || {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: 'title is required' });
      }
      const result = await storiesModule.createStory(title, authors);
      // Note: Socket.IO events are not available in Serverless Functions
      // You may need to use Vercel's Server-Sent Events or external WebSocket service
      return res.status(201).json(result.story);
    } catch (e: any) {
      console.error('Error creating story:', e);
      console.error('Error stack:', e.stack);
      return res.status(500).json({ 
        message: e.message || 'Internal error',
        error: e.stack,
        type: e.constructor?.name
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

