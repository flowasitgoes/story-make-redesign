import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Story {
  id: string;
  title: string;
  authors: string[];
  pages: [1, 2, 3];
  status: 'active' | 'completed';
  createdAt: number;
}

export interface Page {
  pageNumber: 1 | 2 | 3;
  content: string;
  proposals: string[];
  locked: boolean;
}

export interface Proposal {
  id: string;
  storyId: string;
  pageNumber: 1 | 2 | 3;
  author: string;
  text: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  listStories(): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.base}/stories`);
  }

  createStory(title: string, authors?: string[]): Observable<Story> {
    return this.http.post<Story>(`${this.base}/stories`, { title, authors });
  }

  getPage(storyId: string, pageNumber: number): Observable<Page> {
    return this.http.get<Page>(`${this.base}/stories/${storyId}/pages/${pageNumber}`);
  }

  lockPage(storyId: string, pageNumber: number): Observable<Page> {
    return this.http.post<Page>(`${this.base}/stories/${storyId}/pages/${pageNumber}/lock`, {});
  }

  createProposal(storyId: string, pageNumber: number, author: string, text: string): Observable<Proposal> {
    return this.http.post<Proposal>(`${this.base}/stories/${storyId}/pages/${pageNumber}/proposals`, { author, text });
  }

  acceptProposal(storyId: string, proposalId: string) {
    return this.http.post(`${this.base}/proposals/${proposalId}/accept`, { storyId });
  }

  rejectProposal(storyId: string, proposalId: string) {
    return this.http.post(`${this.base}/proposals/${proposalId}/reject`, { storyId });
  }

  listProposals(storyId: string): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.base}/stories/${storyId}/proposals`);
  }
}


