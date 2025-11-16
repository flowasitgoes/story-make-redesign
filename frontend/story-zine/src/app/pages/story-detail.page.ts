import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Page, Story, Proposal } from '../services/api.service';
import { SocketService } from '../services/socket.service';

@Component({
  standalone: true,
  selector: 'app-story-detail',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap" *ngIf="story">
      <aside>
        <h3>{{ story?.title }}</h3>
        <nav>
          <button [class.active]="currentPage===1" (click)="switchPage(1)">Page 1</button>
          <button [class.active]="currentPage===2" (click)="switchPage(2)">Page 2</button>
          <button [class.active]="currentPage===3" (click)="switchPage(3)">Page 3</button>
        </nav>
        <div class="status">狀態：{{ story?.status }}</div>
        <div class="row" style="margin-top:10px">
          <button (click)="goExport()">輸出成冊</button>
        </div>
      </aside>
      <main>
        <div class="content">
          <h4>第 {{ currentPage }} 頁（{{ page?.locked ? '鎖定' : '開放' }}）</h4>
          <ng-container *ngIf="contentBlocks.length; else emptyContent">
            <div class="block" *ngFor="let b of contentBlocks" [ngClass]="authorBgClass(b.author)">
              <div class="block-meta" *ngIf="b.author">作者：{{ b.author }}</div>
              <pre class="text">{{ b.text }}</pre>
            </div>
          </ng-container>
          <ng-template #emptyContent>
            <pre class="text">{{ page?.content }}</pre>
          </ng-template>
        </div>
        <div class="actions">
          <button (click)="lock()" [disabled]="page?.locked">鎖定此頁</button>
        </div>
        <div class="proposal">
          <h4>提交提案（50–250 字）</h4>
          <div class="muted">本頁剩餘可用字數（上限 750）：{{ remainingChars() }}</div>
          <textarea [(ngModel)]="proposalText" rows="6" placeholder="在這裡撰寫你的接續內容"></textarea>
          <div class="row">
            <input [(ngModel)]="author" placeholder="你的名字（A/B/C）"/>
            <button (click)="submitProposal()" [disabled]="!canSubmitProposal()">提交提案</button>
          </div>
          <div class="error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>
        <div class="review">
          <h4>待審提案（即時）</h4>
          <div *ngIf="acceptedCount >= requiredAcceptedCount" class="notice">
            本頁已接受 {{ acceptedCount }}/{{ requiredAcceptedCount }} 則提案。若要繼續創作，請按「鎖定此頁」開啟下一頁。
          </div>
          <div *ngIf="pendingProposals.length === 0" class="muted">目前沒有提案</div>
          <div class="card" [ngClass]="authorBgClass(p.author)" *ngFor="let p of pendingProposals">
            <div class="meta">P{{ p.pageNumber }} by {{ p.author }} ｜ {{ p.createdAt | date:'shortTime' }}</div>
            <pre class="text">{{ p.text }}</pre>
            <div class="row">
              <button (click)="accept(p)" [disabled]="(page?.locked ?? true) || acceptedCount >= requiredAcceptedCount">Accept</button>
              <button (click)="reject(p)" [disabled]="(page?.locked ?? true) || acceptedCount >= requiredAcceptedCount">Reject</button>
            </div>
          </div>
        </div>
        <div class="live">
          <h4>即時事件</h4>
          <div class="event" *ngFor="let e of events" [ngClass]="authorBgClass(e.author || '')">{{ e.text }}</div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .wrap { display:flex; gap:20px; max-width:1100px; margin:24px auto; padding:0 12px; }
    aside { width:220px; border-right:1px solid #eee; padding-right:12px; }
    aside h3 { margin:0 0 12px; }
    nav { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
    nav button { text-align:left; width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:6px; background:#fff; box-sizing:border-box; }
    nav button.active { font-weight:700; background:#f5f7ff; border-color:#c9d4ff; }
    main { flex:1; }
    .content .text { white-space:pre-wrap; background:#fafafa; border:1px solid #eee; padding:12px; border-radius:8px; min-height:160px; line-height:1.8; font-size:14px; }
    .block { border:1px solid #eee; border-radius:8px; padding:0; margin:10px 0; }
    .block .text { border:none; background:transparent; min-height:auto; margin:0; }
    .block-meta { font-size:12px; color:#555; padding:6px 10px; }
    .actions { margin:8px 0 16px; }
    .proposal textarea { width:100%; resize:vertical; margin:8px 0; }
    .row { display:flex; gap:8px; align-items:center; }
    .event { font-size:12px; color:#555; border-left:3px solid #ddd; padding-left:8px; margin:4px 0; }
    .review .card { border:1px solid #eee; border-radius:8px; padding:10px; margin:10px 0; background:#fff; }
    .review .text { white-space:pre-wrap; }
    .muted { color:#777; }
    .notice { color:#b26b00; background:#fff6e6; border:1px solid #ffebb5; padding:8px 10px; border-radius:8px; margin:8px 0; }
    /* 作者配色：A=淺紅、B=淺綠、C=淺藍 */
    .by-A { background:#fdeaea; }
    .by-B { background:#eaf7ea; }
    .by-C { background:#eaf1ff; }
    /* 提升 specificity 以覆蓋 .review .card 的白底 */
    .review .card.by-A { background:#fdeaea; }
    .review .card.by-B { background:#eaf7ea; }
    .review .card.by-C { background:#eaf1ff; }
  `]
})
export class StoryDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private socket = inject(SocketService);
  story: Story | null = null;
  page: Page | null = null;
  currentPage = 1;
  proposalText = '';
  author = 'B';
  events: { text: string; author?: string }[] = [];
  pendingProposals: Proposal[] = [];
  allProposals: Proposal[] = [];
  acceptedCount = 0;
  errorMsg = '';
  contentBlocks: { author: string | null; text: string }[] = [];
  requiredAcceptedCount = 3;

  constructor() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadStory(id);
        this.socket.joinStoryRoom(id);
        this.bindSocket();
      }
    });
  }

  bindSocket() {
    this.socket.on<any>('proposal:created').subscribe(({ proposal }) => {
      this.events.unshift({ text: `新提案：P${proposal.pageNumber} by ${proposal.author} (${proposal.text.slice(0, 10)}...)`, author: proposal.author });
      if (proposal.pageNumber === this.currentPage && this.story && proposal.storyId === this.story.id) {
        this.pendingProposals.unshift(proposal);
      }
    });
    this.socket.on<any>('proposal:accepted').subscribe(() => {
      this.events.unshift({ text: '有提案被接受' });
      this.refreshPage();
      this.pendingProposals = [];
    });
    this.socket.on<any>('proposal:rejected').subscribe(() => {
      this.events.unshift({ text: '有提案被拒絕' });
    });
    this.socket.on<any>('page:updated').subscribe((p) => {
      if (p.pageNumber === this.currentPage) {
        this.refreshPage();
      }
    });
    this.socket.on<any>('page:locked').subscribe((p) => {
      if (p.pageNumber === this.currentPage) this.refreshPage();
      this.events.unshift({ text: `頁面 ${p.pageNumber} 已鎖定` });
    });
    this.socket.on<any>('page:opened').subscribe((p) => {
      this.events.unshift({ text: `頁面 ${p.pageNumber} 已開啟` });
      // 如果剛鎖定的是上一頁，且下一頁已開啟，則自動切換到下一頁
      if (p.pageNumber === this.currentPage + 1) {
        this.switchPage(this.currentPage + 1);
      } else if (p.pageNumber === this.currentPage) {
        this.refreshPage();
      }
    });
  }

  loadStory(id: string) {
    // 後端沒有單獨 /stories/:id 的 UI 需求，但我們只需持有 id
    this.story = { id, title: '', authors: [], pages: [1,2,3], status: 'active', createdAt: Date.now() };
    this.switchPage(1);
  }

  switchPage(n: number) {
    this.currentPage = n;
    // 切頁時若作者欄位為空，預設填入 B，並清空上一頁草稿
    if (!this.author) this.author = 'B';
    this.proposalText = '';
    this.requiredAcceptedCount = 3;
    this.refreshPage();
  }

  refreshPage() {
    if (!this.story) return;
    this.api.getPage(this.story.id, this.currentPage).subscribe(p => {
      this.page = p;
      this.acceptedCount = (p.proposals?.length ?? 0);
      this.errorMsg = '';
      this.requiredAcceptedCount = 3;
      // 取得所有提案以計算分段
      this.api.listProposals(this.story!.id).subscribe({
        next: (list) => {
          this.allProposals = list;
          this.buildContentBlocks();
        },
        error: () => {
          // 即使提案列表失敗，也至少顯示開頭段
          this.allProposals = [];
          this.buildContentBlocks();
        }
      });
    });
  }

  submitProposal() {
    if (!this.story) return;
    this.api.createProposal(this.story.id, this.currentPage, this.author || 'B', this.proposalText.trim())
      .subscribe({
        next: () => {
          this.proposalText = '';
          this.errorMsg = '';
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || '提交提案失敗';
        }
      });
  }

  lock() {
    if (!this.story) return;
    this.api.lockPage(this.story.id, this.currentPage).subscribe(p => {
      this.page = p;
      // 鎖定成功即嘗試切到下一頁（若存在），以伺服器回傳頁碼為準，避免競態再次+1
      if (p.pageNumber < 3) {
        this.switchPage(p.pageNumber + 1);
      }
    });
  }

  goExport() {
    if (!this.story) return;
    this.router.navigate(['/stories', this.story.id, 'export']);
  }

  remainingChars() {
    const max = 750;
    const used = this.page?.content?.length ?? 0;
    const left = max - used;
    return left > 0 ? left : 0;
  }

  canSubmitProposal() {
    if (!this.page || this.page.locked) return false;
    const text = (this.proposalText || '').trim();
    const len = text.length;
    if (len < 50 || len > 250) return false;
    return len <= this.remainingChars();
  }

  accept(p: Proposal) {
    if (!this.story) return;
    this.api.acceptProposal(this.story.id, p.id).subscribe(() => {
      // 後端會推播更新；此處先行樂觀更新
      this.pendingProposals = this.pendingProposals.filter(x => x.id !== p.id);
      // 樂觀加入分段顯示，等待後端回傳再 refresh
      this.allProposals = [...this.allProposals.filter(x => x.id !== p.id), { ...p, status: 'accepted' } as Proposal];
      if (this.page && !this.page.proposals.includes(p.id)) {
        this.page.proposals = [...this.page.proposals, p.id];
      }
      this.acceptedCount = (this.page?.proposals?.length ?? 0);
      this.buildContentBlocks();
      this.refreshPage();
    });
  }

  reject(p: Proposal) {
    if (!this.story) return;
    this.api.rejectProposal(this.story.id, p.id).subscribe(() => {
      this.pendingProposals = this.pendingProposals.filter(x => x.id !== p.id);
    });
  }

  private buildContentBlocks() {
    this.contentBlocks = [];
    if (!this.page) return;
    const ids = this.page.proposals || [];
    const accepted = ids
      .map(id => this.allProposals.find(p => p.id === id))
      .filter((p): p is Proposal => !!p && p.status === 'accepted' && p.pageNumber === this.page!.pageNumber);
    const sumAcceptedLen = accepted.reduce((acc, p) => acc + (p.text?.length || 0), 0);
    const total = this.page.content || '';
    const openingLen = Math.max(0, total.length - sumAcceptedLen);
    const opening = total.slice(0, openingLen);
    if (opening) {
      // 預設開頭視為 A（或 story.authors[0]）
      const author = (this.story?.authors?.[0] || 'A') as string;
      this.contentBlocks.push({ author, text: opening });
    }
    for (const p of accepted) {
      this.contentBlocks.push({ author: (p.author || '').toUpperCase(), text: p.text });
    }
  }

  authorBgClass(author: string | null): string {
    // 正規化作者字元：移除空白、轉大寫、將全形ＡＢＣ轉半形
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
}


