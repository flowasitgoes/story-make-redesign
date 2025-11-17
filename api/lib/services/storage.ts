import fs from 'fs-extra';
import path from 'path';
import { DATA_DIR } from '../config/config';
import { KVStorage } from './kv-storage';

// 检查是否使用 KV 存储
const useKV = KVStorage.isAvailable();
const kvStorage = useKV ? new KVStorage() : null;

console.log('Storage initialized:', {
  useKV,
  dataDir: DATA_DIR,
  kvAvailable: KVStorage.isAvailable()
});

// 文件系统存储函数
const ensureDirFile = async (dir: string) => {
  if (useKV) return; // KV 不需要创建目录
  try {
    await fs.ensureDir(dir);
  } catch (error) {
    // 如果目录创建失败，尝试使用 /tmp
    console.warn(`Failed to create directory ${dir}, using /tmp/data`);
    await fs.ensureDir('/tmp/data');
  }
};

const readJsonFile = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return fallback;
    }
    return await fs.readJSON(filePath);
  } catch (e) {
    return fallback;
  }
};

const writeJsonFile = async (filePath: string, data: unknown) => {
  await fs.ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.tmp`;
  await fs.writeJSON(tmp, data, { spaces: 2 });
  await fs.move(tmp, filePath, { overwrite: true });
};

// KV 存储函数
const readJsonKV = async <T>(key: string, fallback: T): Promise<T> => {
  if (!kvStorage) {
    // 如果没有 KV，尝试从文件系统读取（临时存储）
    try {
      const filePath = `/tmp/data/${key.replace(/:/g, '/')}.json`;
      return await readJsonFile(filePath, fallback);
    } catch {
      return fallback;
    }
  }
  try {
    const value = await kvStorage.get<T>(key);
    return value !== null ? value : fallback;
  } catch (error) {
    console.error('KV read error, falling back to file system:', error);
    // 如果 KV 读取失败，尝试文件系统
    try {
      const filePath = `/tmp/data/${key.replace(/:/g, '/')}.json`;
      return await readJsonFile(filePath, fallback);
    } catch {
      return fallback;
    }
  }
};

const writeJsonKV = async (key: string, data: unknown) => {
  if (!kvStorage) {
    // 如果没有 KV，尝试使用文件系统（临时存储）
    console.warn('KV storage not available, using file system (temporary)');
    const filePath = `/tmp/data/${key.replace(/:/g, '/')}.json`;
    await writeJsonFile(filePath, data);
    return;
  }
  await kvStorage.set(key, data);
};

// 统一的存储接口
export const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    if (useKV) {
      // 将文件路径转换为 KV key
      const key = filePath.replace(/[^a-zA-Z0-9]/g, ':');
      return await readJsonKV(key, fallback);
    }
    return await readJsonFile(filePath, fallback);
  } catch (error: any) {
    console.error(`Storage read error for ${filePath}:`, error);
    return fallback;
  }
};

export const writeJson = async (filePath: string, data: unknown) => {
  try {
    if (useKV) {
      // 将文件路径转换为 KV key
      const key = filePath.replace(/[^a-zA-Z0-9]/g, ':');
      await writeJsonKV(key, data);
    } else {
      await writeJsonFile(filePath, data);
    }
  } catch (error: any) {
    console.error(`Storage write error for ${filePath}:`, error);
    throw error;
  }
};

export const ensureDir = ensureDirFile;

// 路径生成函数（兼容文件系统和 KV）
export const paths = {
  dataRoot: () => DATA_DIR,
  storiesIndex: () => useKV ? 'stories:index' : path.join(DATA_DIR, 'stories', 'index.json'),
  storyDir: (storyId: string) => useKV ? `stories:${storyId}` : path.join(DATA_DIR, 'stories', storyId),
  storyFile: (storyId: string) => useKV ? `stories:${storyId}:story` : path.join(DATA_DIR, 'stories', storyId, 'story.json'),
  pagesDir: (storyId: string) => useKV ? `stories:${storyId}:pages` : path.join(DATA_DIR, 'stories', storyId, 'pages'),
  pageFile: (storyId: string, pageNumber: number) =>
    useKV 
      ? `stories:${storyId}:pages:page${pageNumber}`
      : path.join(DATA_DIR, 'stories', storyId, 'pages', `page${pageNumber}.json`),
  proposalsFile: (storyId: string) => 
    useKV 
      ? `stories:${storyId}:proposals`
      : path.join(DATA_DIR, 'stories', storyId, 'proposals.json')
};


