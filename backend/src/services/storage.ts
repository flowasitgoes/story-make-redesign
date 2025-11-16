import fs from 'fs-extra';
import path from 'path';
import { DATA_DIR } from '../server';

export const ensureDir = async (dir: string) => {
  await fs.ensureDir(dir);
};

export const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
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

export const writeJson = async (filePath: string, data: unknown) => {
  await fs.ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.tmp`;
  await fs.writeJSON(tmp, data, { spaces: 2 });
  await fs.move(tmp, filePath, { overwrite: true });
};

export const paths = {
  dataRoot: () => DATA_DIR,
  storiesIndex: () => path.join(DATA_DIR, 'stories', 'index.json'),
  storyDir: (storyId: string) => path.join(DATA_DIR, 'stories', storyId),
  storyFile: (storyId: string) => path.join(DATA_DIR, 'stories', storyId, 'story.json'),
  pagesDir: (storyId: string) => path.join(DATA_DIR, 'stories', storyId, 'pages'),
  pageFile: (storyId: string, pageNumber: number) =>
    path.join(DATA_DIR, 'stories', storyId, 'pages', `page${pageNumber}.json`),
  proposalsFile: (storyId: string) => path.join(DATA_DIR, 'stories', storyId, 'proposals.json')
};


