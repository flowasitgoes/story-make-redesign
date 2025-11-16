import { Namespace } from 'socket.io';
import { Page, Story } from '../types/models';
import { paths, readJson, writeJson } from './storage';
import { listProposals } from './proposals';
import { PAGE_TOTAL_MIN } from './content';

export async function getPage(storyId: string, pageNumber: number): Promise<Page | null> {
  const file = paths.pageFile(storyId, pageNumber);
  return await readJson<Page | null>(file, null);
}

export async function lockPage(ns: Namespace, story: Story, pageNumber: number): Promise<{ page: Page; openedNext?: Page; story?: Story }> {
  const page = await getPage(story.id, pageNumber);
  if (!page) throw new Error('Page not found');
  if (page.locked) return { page };
  // 鎖定需求：所有頁面均需 3 則已接受提案
  const proposals = await listProposals(story.id);
  const acceptedCount = proposals.filter(p => p.pageNumber === pageNumber && p.status === 'accepted').length;
  const required = 3;
  if (acceptedCount < required) {
    throw new Error(`At least ${required} accepted proposals required to lock this page`);
  }
  // 檢查頁面總字數下限
  if ((page.content?.length ?? 0) < PAGE_TOTAL_MIN) {
    throw new Error(`Page content must be at least ${PAGE_TOTAL_MIN} chars to lock`);
  }
  page.locked = true;
  await writeJson(paths.pageFile(story.id, pageNumber), page);
  ns.to(`story:${story.id}`).emit('page:locked', { storyId: story.id, pageNumber });
  let openedNext: Page | undefined;
  if (pageNumber < 3) {
    const next = await getPage(story.id, pageNumber + 1);
    if (next && next.locked) {
      next.locked = false;
      await writeJson(paths.pageFile(story.id, pageNumber + 1), next);
      ns.to(`story:${story.id}`).emit('page:opened', { storyId: story.id, pageNumber: pageNumber + 1 });
      openedNext = next;
    }
  } else {
    // final page locked -> story completed
    const storyFile = paths.storyFile(story.id);
    const updated: Story = { ...story, status: 'completed' };
    await writeJson(storyFile, updated);
    ns.emit('story:completed', { storyId: story.id });
    return { page, story: updated };
  }
  return { page, openedNext };
}


