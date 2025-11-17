import { Story, Page } from '../types/models';
import { ensureDir, paths, readJson, writeJson } from './storage';

// 动态导入 uuid（因为它是 ES Module）
async function generateUUID(): Promise<string> {
  const { v4: uuidv4 } = await import('uuid');
  return uuidv4();
}

export async function listStories(): Promise<Story[]> {
  const idxPath = paths.storiesIndex();
  console.log('[listStories] Reading from:', idxPath);
  const list = await readJson<Story[]>(idxPath, []);
  console.log('[listStories] Found stories:', list.length);
  if (list.length > 0) {
    console.log('[listStories] First story:', JSON.stringify(list[0], null, 2));
  }
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getStory(storyId: string): Promise<Story | null> {
  const file = paths.storyFile(storyId);
  return await readJson<Story | null>(file, null);
}

export async function createStory(title: string, authors?: string[]): Promise<{ story: Story; pages: Page[] }> {
  console.log('[createStory] Starting with title:', title);
  const id = await generateUUID();
  const createdAt = Date.now();
  const story: Story = {
    id,
    title,
    authors: authors && authors.length ? authors.slice(0, 3) : ['A', 'B', 'C'],
    pages: [1, 2, 3],
    status: 'active',
    createdAt
  };
  console.log('[createStory] Created story object:', JSON.stringify(story, null, 2));
  
  // ensure dirs
  console.log('[createStory] Ensuring directories...');
  await ensureDir(paths.storyDir(id));
  await ensureDir(paths.pagesDir(id));
  
  // page1 without auto-opening, unlocked
  const page1: Page = {
    pageNumber: 1,
    content: '',
    proposals: [],
    locked: false
  };
  // page2,page3 placeholders locked=true
  const page2: Page = { pageNumber: 2, content: '', proposals: [], locked: true };
  const page3: Page = { pageNumber: 3, content: '', proposals: [], locked: true };
  
  console.log('[createStory] Writing pages...');
  await writeJson(paths.pageFile(id, 1), page1);
  await writeJson(paths.pageFile(id, 2), page2);
  await writeJson(paths.pageFile(id, 3), page3);
  
  // proposals.json empty array
  console.log('[createStory] Writing proposals file...');
  await writeJson(paths.proposalsFile(id), []);
  
  // write story.json
  console.log('[createStory] Writing story file:', paths.storyFile(id));
  await writeJson(paths.storyFile(id), story);
  
  // update index
  const idxPath = paths.storiesIndex();
  console.log('[createStory] Reading index from:', idxPath);
  const list = await readJson<Story[]>(idxPath, []);
  console.log('[createStory] Current index has', list.length, 'stories');
  list.push(story);
  console.log('[createStory] Writing updated index with', list.length, 'stories');
  await writeJson(idxPath, list);
  console.log('[createStory] ✅ Story created successfully:', id);
  return { story, pages: [page1, page2, page3] };
}


