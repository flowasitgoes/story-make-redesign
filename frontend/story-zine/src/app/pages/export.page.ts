import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, Page, Proposal, Story } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-export',
  imports: [CommonModule],
  template: `
    <div class="export-wrap" *ngIf="story">
      <header class="toolbar no-print">
        <button (click)="goBack()">返回</button>
        <button (click)="print()">列印 PDF</button>
      </header>
      <h2 class="title">{{ story?.title || '作品' }}（成冊輸出）</h2>
      <section class="page" *ngFor="let pg of pages; let i = index">
        <h3 class="page-title">第 {{ i + 1 }} 頁</h3>
        <div class="block" *ngFor="let b of pg.blocks" [ngClass]="authorBgClass(b.author)">
          <div class="block-meta" *ngIf="b.author">作者：{{ b.author }}</div>
          <pre class="text">{{ b.text }}</pre>
        </div>
        <div class="page-break"></div>
      </section>
    </div>
  `,
  styles: [`
    .export-wrap { max-width: 900px; margin: 24px auto; padding: 0 12px; }
    .toolbar { display:flex; gap:8px; margin-bottom:12px; }
    .title { text-align:center; margin: 12px 0 20px; }
    .page { margin: 16px 0 24px; }
    .page-title { margin: 0 0 10px; }
    .block { border:1px solid #eee; border-radius:8px; padding:0; margin:10px 0; }
    .block .text { border:none; background:transparent; white-space:pre-wrap; line-height:1.8; padding:12px; margin:0; }
    .block-meta { font-size:12px; color:#555; padding:6px 10px; }
    /* 作者底色 */
    .by-A { background:#fdeaea; }
    .by-B { background:#eaf7ea; }
    .by-C { background:#eaf1ff; }
    .page-break { page-break-after: always; }
    @media print {
      .no-print { display: none !important; }
      .export-wrap { max-width: 100%; margin: 0; padding: 0; }
      .page { break-inside: avoid; }
    }
  `]
})
export class ExportPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  story: Story | null = null;
  pages: { page: Page; blocks: { author: string | null; text: string }[] }[] = [];
  allProposals: Proposal[] = [];

  constructor() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadAll(id);
    });
  }

  async loadAll(id: string) {
    // 簡單串流：先載提案，再載三頁資料
    this.api.listProposals(id).subscribe(list => {
      this.allProposals = list;
      const loadPage = (n: number) => new Promise<Page>(resolve => this.api.getPage(id, n).subscribe(p => resolve(p)));
      Promise.all([loadPage(1), loadPage(2), loadPage(3)]).then(res => {
        this.story = { id, title: '', authors: ['A','B','C'], pages: [1,2,3], status: 'active', createdAt: Date.now() };
        this.pages = res.map(p => ({ page: p, blocks: this.buildBlocks(p) }));
      });
    });
  }

  buildBlocks(page: Page) {
    const ids = page.proposals || [];
    const accepted = ids
      .map(id => this.allProposals.find(p => p.id === id))
      .filter((p): p is Proposal => !!p && p.status === 'accepted' && p.pageNumber === page.pageNumber);
    const sumAcceptedLen = accepted.reduce((acc, p) => acc + (p.text?.length || 0), 0);
    const total = page.content || '';
    const openingLen = Math.max(0, total.length - sumAcceptedLen);
    const opening = total.slice(0, openingLen);
    const blocks: { author: string | null; text: string }[] = [];
    if (opening) blocks.push({ author: 'A', text: opening });
    for (const p of accepted) blocks.push({ author: (p.author || '').toUpperCase(), text: p.text });
    return blocks;
  }

  authorBgClass(author: string | null): string {
    if (!author) return '';
    const raw = (author || '').trim();
    const normalized = raw
      .replace(/[\s\u00A0]/g, '')
      .replace(/[Ａａ]/g, 'A')
      .replace(/[Ｂｂ]/g, 'B')
      .replace(/[Ｃｃ]/g, 'C')
      .toUpperCase();
    if (normalized === 'A') return 'by-A';
    if (normalized === 'B') return 'by-B';
    if (normalized === 'C') return 'by-C';
    return '';
  }

  goBack() { this.router.navigate(['../'], { relativeTo: this.route }); }
  print() { window.print(); }
}
