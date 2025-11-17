import type { Namespace } from '../types/socket-io';
import { paths, readJson, writeJson } from './storage';
import { Proposal, Page } from '../types/models';
import { canAppend, PROPOSAL_MIN, PROPOSAL_MAX } from './content';
import { getPage } from './pages';

// 动态导入 uuid（因为它是 ES Module）
async function generateUUID(): Promise<string> {
  const { v4: uuidv4 } = await import('uuid');
  return uuidv4();
}

const MAX_ACCEPTED_PER_PAGE = parseInt(process.env.MAX_ACCEPTED_PER_PAGE || '2', 10);

export async function listProposals(storyId: string): Promise<Proposal[]> {
  return await readJson<Proposal[]>(paths.proposalsFile(storyId), []);
}

export async function createProposal(
  ns: Namespace | null,
  storyId: string,
  pageNumber: 1 | 2 | 3,
  author: string,
  text: string
): Promise<Proposal> {
  const page = await getPage(storyId, pageNumber);
  if (!page) throw new Error('Page not found');
  if (page.locked) throw new Error('Page locked');
  const len = text.trim().length;
  if (len < PROPOSAL_MIN) throw new Error(`Proposal text must be at least ${PROPOSAL_MIN} chars`);
  if (len > PROPOSAL_MAX) throw new Error(`Proposal text must be at most ${PROPOSAL_MAX} chars`);
  // 若加上後會超過頁面上限，直接在提交階段拒絕，避免到接受階段才報錯
  if (!canAppend(page.content, text)) {
    throw new Error('Content exceeds max length');
  }
  const proposal: Proposal = {
    id: await generateUUID(),
    storyId,
    pageNumber,
    author,
    text,
    status: 'pending',
    createdAt: Date.now()
  };
  const all = await listProposals(storyId);
  all.push(proposal);
  await writeJson(paths.proposalsFile(storyId), all);
  if (ns) {
    ns.to(`story:${storyId}`).emit('proposal:created', { proposal });
  }
  return proposal;
}

export async function acceptProposal(ns: Namespace | null, storyId: string, proposalId: string): Promise<{ page: Page; proposal: Proposal }> {
  const all = await listProposals(storyId);
  const idx = all.findIndex(p => p.id === proposalId);
  if (idx < 0) throw new Error('Proposal not found');
  const proposal = all[idx];
  if (proposal.status === 'accepted') throw new Error('Already accepted');
  // ensure accepted proposals per page do not exceed limit (all pages = 3)
  const acceptedCount = all.filter(p => p.pageNumber === proposal.pageNumber && p.status === 'accepted').length;
  const limit = 3;
  if (acceptedCount >= limit) throw new Error('Page already reached accepted limit');
  const page = await getPage(storyId, proposal.pageNumber);
  if (!page) throw new Error('Page not found');
  if (page.locked) throw new Error('Page locked');
  if (!canAppend(page.content, proposal.text)) {
    throw new Error('Content exceeds max length');
  }
  // merge
  page.content = page.content + proposal.text;
  page.proposals = page.proposals.concat(proposal.id);
  await writeJson(paths.pageFile(storyId, proposal.pageNumber), page);
  proposal.status = 'accepted';
  all[idx] = proposal;
  await writeJson(paths.proposalsFile(storyId), all);
  if (ns) {
    ns.to(`story:${storyId}`).emit('proposal:accepted', { proposalId });
    ns.to(`story:${storyId}`).emit('page:updated', { storyId, pageNumber: proposal.pageNumber, content: page.content });
  }
  return { page, proposal };
}

export async function rejectProposal(ns: Namespace | null, storyId: string, proposalId: string): Promise<Proposal> {
  const all = await listProposals(storyId);
  const idx = all.findIndex(p => p.id === proposalId);
  if (idx < 0) throw new Error('Proposal not found');
  const proposal = all[idx];
  proposal.status = 'rejected';
  all[idx] = proposal;
  await writeJson(paths.proposalsFile(storyId), all);
  if (ns) {
    ns.to(`story:${storyId}`).emit('proposal:rejected', { proposalId });
  }
  return proposal;
}


