import path from 'path';

// 在 Serverless Functions 中，__dirname 可能不可用，使用 process.cwd() 作为后备
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

