export type StoryStatus = 'active' | 'completed';

export interface Story {
  id: string;
  title: string;
  authors: string[];
  pages: [1, 2, 3];
  status: StoryStatus;
  createdAt: number;
}

export interface Page {
  pageNumber: 1 | 2 | 3;
  content: string;
  proposals: string[]; // proposal ids
  locked: boolean;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposal {
  id: string;
  storyId: string;
  pageNumber: 1 | 2 | 3;
  author: string;
  text: string;
  status: ProposalStatus;
  createdAt: number;
}


