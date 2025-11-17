import fs from 'fs-extra';
import path from 'path';
import { DATA_DIR } from '../server';
import { KVStorage } from './kv-storage';

// 检查是否使用 KV 存储
const useKV = KVStorage.isAvailable();
const kvStorage = useKV ? new KVStorage() : null;

// 文件系统存储函数
const ensureDirFile = async (dir: string) => {
  if (useKV) return; // KV 不需要创建目录
  await fs.ensureDir(dir);
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
  if (!kvStorage) return fallback;
  const value = await kvStorage.get<T>(key);
  return value !== null ? value : fallback;
};

const writeJsonKV = async (key: string, data: unknown) => {
  if (!kvStorage) {
    throw new Error('KV storage not available');
  }
  await kvStorage.set(key, data);
};

// 统一的存储接口
export const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  if (useKV) {
    // 将文件路径转换为 KV key
    const key = filePath.replace(/[^a-zA-Z0-9]/g, ':');
    return readJsonKV(key, fallback);
  }
  return readJsonFile(filePath, fallback);
};

export const writeJson = async (filePath: string, data: unknown) => {
  if (useKV) {
    // 将文件路径转换为 KV key
    const key = filePath.replace(/[^a-zA-Z0-9]/g, ':');
    await writeJsonKV(key, data);
  } else {
    await writeJsonFile(filePath, data);
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


