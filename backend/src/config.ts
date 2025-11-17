import path from 'path';

// 在 Serverless Functions 中，__dirname 可能不可用，使用 /tmp 作为后备
// Vercel Serverless Functions 的工作目录可能不同，直接使用 /tmp/data
export const DATA_DIR = process.env.DATA_DIR || '/tmp/data';

