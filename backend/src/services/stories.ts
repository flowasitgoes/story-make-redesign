import { v4 as uuidv4 } from 'uuid';
import { Story } from '../types/models';
import { ensureDir, paths, readJson, writeJson } from './storage';
import { Page } from '../types/models';

export async function listStories(): Promise<Story[]> {
  const idxPath = paths.storiesIndex();
  const list = await readJson<Story[]>(idxPath, []);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getStory(storyId: string): Promise<Story | null> {
  const file = paths.storyFile(storyId);
  return await readJson<Story | null>(file, null);
}

export async function createStory(title: string, authors?: string[]): Promise<{ story: Story; pages: Page[] }> {
  const id = uuidv4();
  const createdAt = Date.now();
  const story: Story = {
    id,
    title,
    authors: authors && authors.length ? authors.slice(0, 3) : ['A', 'B', 'C'],
    pages: [1, 2, 3],
    status: 'active',
    createdAt
  };
  // ensure dirs
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
  await writeJson(paths.pageFile(id, 1), page1);
  await writeJson(paths.pageFile(id, 2), page2);
  await writeJson(paths.pageFile(id, 3), page3);
  // proposals.json empty array
  await writeJson(paths.proposalsFile(id), []);
  // write story.json
  await writeJson(paths.storyFile(id), story);
  // update index
  const idxPath = paths.storiesIndex();
  const list = await readJson<Story[]>(idxPath, []);
  list.push(story);
  await writeJson(idxPath, list);
  return { story, pages: [page1, page2, page3] };
}


