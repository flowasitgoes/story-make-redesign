import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`\n=== [${requestId}] API Request Started ===`);
  console.log(`[${requestId}] Timestamp:`, new Date().toISOString());
  console.log(`[${requestId}] Method:`, req.method);
  console.log(`[${requestId}] URL:`, req.url);
  console.log(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
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

    // 测试 1: 最简单的响应
    if (req.method === 'GET') {
      console.log(`[${requestId}] Handling GET request`);
      console.log(`[${requestId}] Returning test response`);
      const response = { message: 'API is working', timestamp: Date.now() };
      console.log(`[${requestId}] Response:`, JSON.stringify(response, null, 2));
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Request completed in ${duration}ms`);
      return res.status(200).json(response);
    }

    // 测试 2: POST 请求
    if (req.method === 'POST') {
      console.log(`[${requestId}] Handling POST request`);
      const { title } = req.body || {};
      console.log(`[${requestId}] Received title:`, title);
      const response = { message: 'POST received', title: title || 'no title' };
      console.log(`[${requestId}] Response:`, JSON.stringify(response, null, 2));
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Request completed in ${duration}ms`);
      return res.status(200).json(response);
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

