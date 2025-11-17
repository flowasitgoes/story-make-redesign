import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, Page, Proposal, Story } from '../services/api.service';
import { AudioService } from '../services/audio.service';

@Component({
  standalone: true,
  selector: 'app-export',
  imports: [CommonModule],
  template: `
    <div class="export-wrap" *ngIf="story">
      <header class="toolbar no-print">
        <button (click)="goBack($event)" class="cute-button-back">
          <span class="emoji">←</span>
          返回
        </button>
        <button (click)="print($event)" class="cute-button-print">
          <span class="emoji">🖨️</span>
          列印 PDF
        </button>
      </header>
      <h2 class="title">
        <span class="emoji">📚</span>
        {{ story?.title || '作品' }}（成冊輸出）
      </h2>
      <section class="page" *ngFor="let pg of pages; let i = index">
        <h3 class="page-title">
          <span class="page-number">{{ i + 1 }}</span>
          第 {{ i + 1 }} 頁
        </h3>
        <div class="block" *ngFor="let b of pg.blocks" [ngClass]="authorBgClass(b.author)">
          <div class="block-meta" *ngIf="b.author">
            <span class="emoji">✍️</span>
            作者：{{ b.author }}
          </div>
          <pre class="text">{{ b.text }}</pre>
        </div>
        <div class="page-break"></div>
      </section>
    </div>
  `,
  styles: [`
    .export-wrap { 
      max-width: 900px; 
      margin: 32px auto; 
      padding: 0 20px;
      animation: slideIn 0.5s ease;
    }
    
    .toolbar { 
      display:flex; 
      gap:12px; 
      margin-bottom:24px;
      background: var(--color-white);
      padding: 16px 20px;
      border-radius: var(--radius-medium);
      box-shadow: var(--shadow-md);
    }
    
    .cute-button-back {
      background: var(--color-white);
      color: var(--color-pink-bright);
      border: 2px solid var(--color-pink-bright);
      border-radius: var(--radius-large);
      padding: 10px 20px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-normal);
      cursor: pointer;
    }
    
    .cute-button-back:hover {
      background: var(--color-pink-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .cute-button-print {
      background: linear-gradient(135deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 10px 20px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-normal);
      cursor: pointer;
    }
    
    .cute-button-print:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }
    
    .title { 
      text-align:center; 
      margin: 24px 0 32px;
      font-size: 32px;
      font-weight: 700;
      color: var(--color-text);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .title .emoji {
      font-size: 36px;
      animation: float 3s ease-in-out infinite;
    }
    
    .page { 
      margin: 24px 0 32px;
      background: var(--color-white);
      padding: 24px;
      border-radius: var(--radius-medium);
      box-shadow: var(--shadow-md);
    }
    
    .page-title { 
      margin: 0 0 20px;
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--color-gray);
    }
    
    .page-number {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      color: var(--color-white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      box-shadow: var(--shadow-sm);
    }
    
    .block { 
      border:2px solid var(--color-gray); 
      border-radius:var(--radius-small); 
      padding:0; 
      margin:16px 0;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    
    .block .text { 
      border:none; 
      background:transparent; 
      white-space:pre-wrap; 
      line-height:1.8; 
      padding:16px; 
      margin:0;
      font-size: 15px;
      font-family: inherit;
    }
    
    .block-meta { 
      font-size:13px; 
      color:var(--color-text-light); 
      padding:10px 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    /* 作者底色 - 使用更鲜艳的版本 */
    .by-A { 
      background:var(--color-author-a);
      border-color: #FFB3B3;
    }
    
    .by-B { 
      background:var(--color-author-b);
      border-color: #B3FFB3;
    }
    
    .by-C { 
      background:var(--color-author-c);
      border-color: #B3D9FF;
    }
    
    .page-break { 
      page-break-after: always; 
    }
    
    .emoji {
      display: inline-block;
    }
    
    @media print {
      .no-print { 
        display: none !important; 
      }
      
      .export-wrap { 
        max-width: 100%; 
        margin: 0; 
        padding: 0;
        background: white;
      }
      
      .page { 
        break-inside: avoid;
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
        page-break-after: always;
      }
      
      .page:last-child {
        page-break-after: auto;
      }
      
      .title .emoji,
      .page-title .page-number,
      .block-meta .emoji {
        display: none;
      }
      
      .title {
        font-size: 24px;
        margin: 0 0 20px;
      }
      
      .page-title {
        font-size: 18px;
        border-bottom: 1px solid #ddd;
        margin-bottom: 16px;
      }
      
      .block {
        border: 1px solid #ddd;
        margin: 12px 0;
        box-shadow: none;
      }
      
      .block-meta {
        font-size: 11px;
        padding: 6px 12px;
      }
      
      .block .text {
        padding: 12px;
        font-size: 14px;
      }
    }
  `]
})
export class ExportPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private audio = inject(AudioService);
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

  goBack(event?: MouseEvent) {
    if (event) {
      this.audio.playClose();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-back') as HTMLElement;
      if (btn) {
        btn.classList.add('click-bounce');
        setTimeout(() => btn.classList.remove('click-bounce'), 400);
      }
    }
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  
  print(event?: MouseEvent) {
    if (event) {
      this.audio.playOpen();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-print') as HTMLElement;
      if (btn) {
        btn.classList.add('click-animate');
        setTimeout(() => btn.classList.remove('click-animate'), 300);
      }
    }
    window.print();
  }
}
