import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listStories, createStory } from '../lib/services/stories';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== API Handler 被调用 ===');
  console.log('请求方法:', req.method);
  console.log('请求 URL:', req.url);
  console.log('请求路径:', req.query);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('处理 OPTIONS 请求');
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    console.log('处理 GET 请求');
    try {
      console.log('调用 listStories...');
      const stories = await listStories();
      console.log(`✅ listStories 成功，找到 ${stories.length} 个故事`);
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
    console.log('处理 POST 请求');
    console.log('请求体:', req.body);
    try {
      const { title, authors } = req.body || {};
      console.log('解析的参数:', { title, authors });
      if (!title || typeof title !== 'string') {
        console.log('验证失败: title 无效');
        return res.status(400).json({ message: 'title is required' });
      }
      console.log('调用 createStory...');
      const result = await createStory(title, authors);
      console.log('createStory 成功，返回结果');
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

