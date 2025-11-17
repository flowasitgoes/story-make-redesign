import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';
import fs from 'fs';

// 动态导入函数，在运行时加载模块
async function loadStoriesModule() {
  console.log('=== 开始加载 stories 模块 ===');
  console.log('1. 环境信息:');
  console.log('   - process.cwd():', process.cwd());
  console.log('   - __dirname:', typeof __dirname !== 'undefined' ? __dirname : 'undefined');
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  console.log('   - VERCEL:', process.env.VERCEL);
  
  try {
    // 尝试多种路径
    const modulePaths: string[] = [
      '../../../backend/src/services/stories',
      path.join(process.cwd(), 'backend', 'src', 'services', 'stories'),
      path.join(process.cwd(), 'backend', 'src', 'services', 'stories.ts'),
      './backend/src/services/stories',
      '../backend/src/services/stories',
      '../../backend/src/services/stories'
    ];
    
    // 如果 __dirname 可用，也尝试使用它
    if (typeof __dirname !== 'undefined') {
      modulePaths.push(
        path.join(__dirname, '..', '..', '..', 'backend', 'src', 'services', 'stories'),
        path.join(__dirname, '..', '..', '..', 'backend', 'src', 'services', 'stories.ts')
      );
    }
    
    console.log('2. 尝试的模块路径列表:');
    modulePaths.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
      // 检查文件是否存在
      try {
        const exists = fs.existsSync(p) || fs.existsSync(p + '.ts') || fs.existsSync(p + '.js');
        console.log(`      文件存在: ${exists}`);
      } catch {
        console.log(`      无法检查文件存在性`);
      }
    });
    
    console.log('3. 开始尝试加载模块...');
    for (let i = 0; i < modulePaths.length; i++) {
      const modulePath = modulePaths[i];
      console.log(`   尝试路径 ${i + 1}/${modulePaths.length}: ${modulePath}`);
      try {
        console.log(`   - 使用 require('${modulePath}')`);
        const module = require(modulePath);
        console.log(`   - require 成功，检查导出...`);
        console.log(`   - module 类型:`, typeof module);
        console.log(`   - module 键:`, Object.keys(module || {}));
        
        if (module && (module.listStories || module.createStory)) {
          console.log(`   ✅ 成功加载！找到的函数:`, {
            listStories: typeof module.listStories,
            createStory: typeof module.createStory
          });
          return module;
        } else {
          console.log(`   ⚠️ 模块已加载但缺少必要函数`);
        }
      } catch (e: any) {
        console.log(`   ❌ 加载失败:`, {
          message: e.message,
          code: e.code,
          stack: e.stack?.split('\n').slice(0, 3).join('\n')
        });
        // 继续尝试下一个路径
        continue;
      }
    }
    
    // 如果所有路径都失败，尝试列出目录结构
    console.log('4. 所有路径都失败，检查目录结构...');
    const cwd = process.cwd();
    console.log(`   当前工作目录: ${cwd}`);
    try {
      const backendDir = path.join(cwd, 'backend');
      const backendExists = fs.existsSync(backendDir);
      console.log(`   backend 目录存在: ${backendExists}`);
      if (backendExists) {
        const backendContents = fs.readdirSync(backendDir);
        console.log(`   backend 目录内容:`, backendContents);
        
        const srcDir = path.join(backendDir, 'src');
        const srcExists = fs.existsSync(srcDir);
        console.log(`   backend/src 目录存在: ${srcExists}`);
        if (srcExists) {
          const srcContents = fs.readdirSync(srcDir);
          console.log(`   backend/src 目录内容:`, srcContents);
          
          const servicesDir = path.join(srcDir, 'services');
          const servicesExists = fs.existsSync(servicesDir);
          console.log(`   backend/src/services 目录存在: ${servicesExists}`);
          if (servicesExists) {
            const servicesContents = fs.readdirSync(servicesDir);
            console.log(`   backend/src/services 目录内容:`, servicesContents);
          }
        }
      }
    } catch (dirError: any) {
      console.log(`   无法检查目录结构:`, dirError.message);
    }
    
    throw new Error('Could not load stories module from any path');
  } catch (error: any) {
    console.error('5. 最终错误:');
    console.error('   - 错误消息:', error.message);
    console.error('   - 错误堆栈:', error.stack);
    throw error;
  }
}

let storiesModule: any = null;

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
      // 延迟加载模块
      if (!storiesModule) {
        console.log('模块未加载，开始加载...');
        storiesModule = await loadStoriesModule();
      } else {
        console.log('使用已缓存的模块');
      }
      console.log('调用 listStories...');
      const stories = await storiesModule.listStories();
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
      // 延迟加载模块
      if (!storiesModule) {
        console.log('模块未加载，开始加载...');
        storiesModule = await loadStoriesModule();
      } else {
        console.log('使用已缓存的模块');
      }
      const { title, authors } = req.body || {};
      console.log('解析的参数:', { title, authors });
      if (!title || typeof title !== 'string') {
        console.log('验证失败: title 无效');
        return res.status(400).json({ message: 'title is required' });
      }
      console.log('调用 createStory...');
      const result = await storiesModule.createStory(title, authors);
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

