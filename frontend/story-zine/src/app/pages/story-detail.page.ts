import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Page, Story, Proposal } from '../services/api.service';
import { SocketService } from '../services/socket.service';
import { AudioService } from '../services/audio.service';

@Component({
  standalone: true,
  selector: 'app-story-detail',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap" *ngIf="story">
      <aside>
        <h3 class="story-title">
          <span class="emoji">📖</span>
          {{ story?.title }}
        </h3>
        <nav>
          <button [class.active]="currentPage===1" (click)="switchPage(1, $event)" class="page-btn">
            <span class="page-icon">📄</span>
            Page 1
          </button>
          <button [class.active]="currentPage===2" (click)="switchPage(2, $event)" class="page-btn">
            <span class="page-icon">📄</span>
            Page 2
          </button>
          <button [class.active]="currentPage===3" (click)="switchPage(3, $event)" class="page-btn">
            <span class="page-icon">📄</span>
            Page 3
          </button>
        </nav>
        <div class="status">
          <span class="status-icon">📊</span>
          狀態：<span class="status-value">{{ story?.status === 'active' ? '進行中' : story?.status === 'completed' ? '已完成' : story?.status }}</span>
        </div>
        <div class="row" style="margin-top:16px">
          <button (click)="goExport($event)" class="cute-button-export">
            <span class="emoji">📚</span>
            輸出成冊
          </button>
        </div>
      </aside>
      <main>
        <div class="content">
          <h4 class="section-title">
            <span class="emoji">{{ page?.locked ? '🔒' : '📝' }}</span>
            第 {{ currentPage }} 頁（{{ page?.locked ? '鎖定' : '開放' }}）
          </h4>
          <ng-container *ngIf="contentBlocks.length; else emptyContent">
            <div class="block" *ngFor="let b of contentBlocks" [ngClass]="authorBgClass(b.author)">
              <div class="block-meta" *ngIf="b.author">
                <span class="author-icon">✍️</span>
                作者：{{ b.author }}
              </div>
              <pre class="text">{{ b.text }}</pre>
            </div>
          </ng-container>
          <ng-template #emptyContent>
            <pre class="text">{{ page?.content }}</pre>
          </ng-template>
        </div>
        <div class="actions">
          <button (click)="lock($event)" [disabled]="page?.locked" class="cute-button-lock">
            <span class="emoji">🔒</span>
            鎖定此頁
          </button>
        </div>
        <div class="proposal">
          <h4 class="section-title">
            <span class="emoji">💡</span>
            提交提案（50–250 字）
          </h4>
          <div class="muted">
            <span class="emoji">📊</span>
            本頁剩餘可用字數（上限 750）：<strong>{{ remainingChars() }}</strong>
          </div>
          <textarea [(ngModel)]="proposalText" rows="6" placeholder="✨ 在這裡撰寫你的接續內容..." class="cute-textarea"></textarea>
          <div class="row">
            <input [(ngModel)]="author" placeholder="你的名字（A/B/C）" class="cute-input-small"/>
            <button (click)="submitProposal($event)" [disabled]="!canSubmitProposal()" class="cute-button-submit">
              <span class="emoji">🚀</span>
              提交提案
            </button>
          </div>
          <div class="error" *ngIf="errorMsg">
            <span class="emoji">⚠️</span>
            {{ errorMsg }}
          </div>
        </div>
        <div class="review">
          <h4 class="section-title">
            <span class="emoji">👀</span>
            待審提案（即時）
          </h4>
          <div *ngIf="acceptedCount >= requiredAcceptedCount" class="notice">
            <span class="emoji">🎉</span>
            本頁已接受 {{ acceptedCount }}/{{ requiredAcceptedCount }} 則提案。若要繼續創作，請按「鎖定此頁」開啟下一頁。
          </div>
          <div *ngIf="pendingProposals.length === 0" class="muted empty-proposals">
            <span class="emoji">📭</span>
            目前沒有提案
          </div>
          <div class="card" [ngClass]="authorBgClass(p.author)" *ngFor="let p of pendingProposals">
            <div class="meta">
              <span class="emoji">📝</span>
              P{{ p.pageNumber }} by {{ p.author }} ｜ {{ p.createdAt | date:'shortTime' }}
            </div>
            <pre class="text">{{ p.text }}</pre>
            <div class="row">
              <button (click)="accept(p, $event)" [disabled]="(page?.locked ?? true) || acceptedCount >= requiredAcceptedCount" class="cute-button-accept">
                <span class="emoji">✅</span>
                Accept
              </button>
              <button (click)="reject(p, $event)" [disabled]="(page?.locked ?? true) || acceptedCount >= requiredAcceptedCount" class="cute-button-reject">
                <span class="emoji">❌</span>
                Reject
              </button>
            </div>
          </div>
        </div>
        <div class="live">
          <h4 class="section-title">
            <span class="emoji">⚡</span>
            即時事件
          </h4>
          <div class="event" *ngFor="let e of events" [ngClass]="authorBgClass(e.author || '')">
            <span class="event-icon">💬</span>
            {{ e.text }}
          </div>
          <div *ngIf="events.length === 0" class="muted empty-events">
            <span class="emoji">🔇</span>
            目前沒有事件
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .wrap { 
      display:flex; 
      gap:24px; 
      max-width:1200px; 
      margin:32px auto; 
      padding:0 20px; 
      animation: slideIn 0.5s ease;
    }
    
    aside { 
      width:240px; 
      border-right:2px solid var(--color-gray); 
      padding-right:20px; 
      background: var(--color-white);
      padding: 20px;
      border-radius: var(--radius-medium);
      box-shadow: var(--shadow-sm);
      height: fit-content;
    }
    
    .story-title {
      margin:0 0 20px;
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--color-gray);
    }
    
    .story-title .emoji {
      font-size: 24px;
      animation: float 3s ease-in-out infinite;
    }
    
    nav { 
      display:flex; 
      flex-direction:column; 
      gap:10px; 
      margin-bottom:20px; 
    }
    
    .page-btn { 
      text-align:left; 
      width:100%; 
      padding:12px 16px; 
      border:2px solid var(--color-gray); 
      border-radius:var(--radius-small); 
      background:var(--color-white); 
      box-sizing:border-box;
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition-normal);
      cursor: pointer;
    }
    
    .page-btn:hover:not(.active) {
      border-color: var(--color-pink-bright);
      background: var(--color-pink-light);
      transform: translateX(4px);
    }
    
    .page-btn.active { 
      font-weight:700; 
      background:linear-gradient(135deg, var(--color-pink-light) 0%, var(--color-blue-light) 100%); 
      border-color:var(--color-pink-bright);
      box-shadow: var(--shadow-sm);
    }
    
    .page-icon {
      font-size: 18px;
    }
    
    .status {
      padding: 12px;
      background: var(--color-yellow-light);
      border-radius: var(--radius-small);
      border: 2px solid var(--color-yellow);
      font-size: 14px;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .status-icon {
      font-size: 18px;
    }
    
    .status-value {
      font-weight: 700;
      color: #B8860B;
    }
    
    .cute-button-export {
      width: 100%;
      background: linear-gradient(135deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all var(--transition-normal);
    }
    
    .cute-button-export:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }
    
    main { 
      flex:1; 
      background: var(--color-white);
      padding: 24px;
      border-radius: var(--radius-medium);
      box-shadow: var(--shadow-md);
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text);
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--color-gray);
    }
    
    .section-title .emoji {
      font-size: 22px;
    }
    
    .content { 
      margin-bottom: 24px;
    }
    
    .content .text { 
      white-space:pre-wrap; 
      background:var(--color-gray-light); 
      border:2px solid var(--color-gray); 
      padding:16px; 
      border-radius:var(--radius-small); 
      min-height:160px; 
      line-height:1.8; 
      font-size:15px;
      font-family: inherit;
      transition: all var(--transition-normal);
    }
    
    .content .text:focus {
      border-color: var(--color-pink-bright);
      box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.15);
    }
    
    .block { 
      border:2px solid var(--color-gray); 
      border-radius:var(--radius-small); 
      padding:0; 
      margin:12px 0;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-normal);
      overflow: hidden;
    }
    
    .block:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .block .text { 
      border:none; 
      background:transparent; 
      min-height:auto; 
      margin:0;
      padding: 16px;
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
    
    .author-icon {
      font-size: 16px;
    }
    
    .actions { 
      margin:16px 0 24px; 
    }
    
    .cute-button-lock {
      background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-purple) 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition-normal);
    }
    
    .cute-button-lock:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }
    
    .cute-button-lock:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .proposal { 
      margin: 24px 0;
      padding: 20px;
      background: var(--color-yellow-light);
      border-radius: var(--radius-medium);
      border: 2px solid var(--color-yellow);
    }
    
    .cute-textarea { 
      width:100%; 
      resize:vertical; 
      margin:12px 0;
      padding: 14px 18px;
      border: 2px solid var(--color-gray);
      border-radius: var(--radius-small);
      font-size: 15px;
      font-family: inherit;
      line-height: 1.6;
      background: var(--color-white);
      transition: all var(--transition-normal);
    }
    
    .cute-textarea:focus {
      border-color: var(--color-pink-bright);
      box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.15);
    }
    
    .cute-input-small {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid var(--color-gray);
      border-radius: var(--radius-small);
      font-size: 15px;
      background: var(--color-white);
      transition: all var(--transition-normal);
    }
    
    .cute-input-small:focus {
      border-color: var(--color-pink-bright);
      box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.15);
    }
    
    .cute-button-submit {
      background: linear-gradient(135deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all var(--transition-normal);
    }
    
    .cute-button-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }
    
    .cute-button-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .row { 
      display:flex; 
      gap:12px; 
      align-items:center; 
    }
    
    .muted { 
      color:var(--color-text-light);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    
    .muted strong {
      color: var(--color-pink-bright);
      font-weight: 700;
    }
    
    .error {
      background: #FFE5E5;
      border: 2px solid #FF6B6B;
      color: #C92A2A;
      padding: 12px 16px;
      border-radius: var(--radius-small);
      margin-top: 12px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .review {
      margin: 24px 0;
      padding: 20px;
      background: var(--color-blue-light);
      border-radius: var(--radius-medium);
      border: 2px solid var(--color-blue);
    }
    
    .review .card { 
      border:2px solid var(--color-gray); 
      border-radius:var(--radius-small); 
      padding:16px; 
      margin:12px 0; 
      background:var(--color-white);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-normal);
    }
    
    .review .card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .review .text { 
      white-space:pre-wrap;
      margin: 12px 0;
      line-height: 1.8;
      font-size: 15px;
    }
    
    .review .meta {
      font-size: 13px;
      color: var(--color-text-light);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    
    .cute-button-accept {
      background: linear-gradient(135deg, #51CF66 0%, #40C057 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-normal);
    }
    
    .cute-button-accept:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .cute-button-reject {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-normal);
    }
    
    .cute-button-reject:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .notice { 
      color:#B8860B; 
      background:var(--color-yellow-light); 
      border:2px solid var(--color-yellow); 
      padding:12px 16px; 
      border-radius:var(--radius-small); 
      margin:12px 0;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .empty-proposals, .empty-events {
      text-align: center;
      padding: 24px;
      background: var(--color-white);
      border-radius: var(--radius-small);
      border: 2px dashed var(--color-gray);
    }
    
    .empty-proposals .emoji, .empty-events .emoji {
      font-size: 32px;
      display: block;
      margin-bottom: 8px;
    }
    
    .live {
      margin: 24px 0;
      padding: 20px;
      background: var(--color-purple-light);
      border-radius: var(--radius-medium);
      border: 2px solid var(--color-purple);
    }
    
    .event { 
      font-size:14px; 
      color:var(--color-text); 
      border-left:4px solid var(--color-purple); 
      padding:10px 12px; 
      margin:8px 0;
      background: var(--color-white);
      border-radius: 0 var(--radius-small) var(--radius-small) 0;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition-normal);
    }
    
    .event:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow-sm);
    }
    
    .event-icon {
      font-size: 16px;
    }
    
    /* 作者配色：更鲜艳的版本 */
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
    
    /* 提升 specificity 以覆蓋 .review .card 的白底 */
    .review .card.by-A { 
      background:var(--color-author-a);
      border-color: #FFB3B3;
    }
    
    .review .card.by-B { 
      background:var(--color-author-b);
      border-color: #B3FFB3;
    }
    
    .review .card.by-C { 
      background:var(--color-author-c);
      border-color: #B3D9FF;
    }
    
    .emoji {
      display: inline-block;
    }
  `]
})
export class StoryDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private socket = inject(SocketService);
  private audio = inject(AudioService);
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

  switchPage(n: number, event?: MouseEvent) {
    if (event) {
      this.audio.playClick();
      const button = event.target as HTMLElement;
      const btn = button.closest('.page-btn') as HTMLElement;
      if (btn) {
        btn.classList.add('click-bounce');
        setTimeout(() => btn.classList.remove('click-bounce'), 400);
      }
    }
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

  submitProposal(event?: MouseEvent) {
    if (!this.story) return;
    if (event) {
      this.audio.playChoose();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-submit') as HTMLElement;
      if (btn) {
        btn.classList.add('click-animate');
        setTimeout(() => btn.classList.remove('click-animate'), 300);
      }
    }
    this.api.createProposal(this.story.id, this.currentPage, this.author || 'B', this.proposalText.trim())
      .subscribe({
        next: () => {
          this.audio.playSuccess();
          this.proposalText = '';
          this.errorMsg = '';
        },
        error: (err) => {
          this.audio.playFailure();
          this.errorMsg = err?.error?.message || '提交提案失敗';
        }
      });
  }

  lock(event?: MouseEvent) {
    if (!this.story) return;
    if (event) {
      this.audio.playChoose();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-lock') as HTMLElement;
      if (btn) {
        btn.classList.add('click-wiggle');
        setTimeout(() => btn.classList.remove('click-wiggle'), 500);
      }
    }
    this.api.lockPage(this.story.id, this.currentPage).subscribe(p => {
      this.audio.playSuccessStrong();
      this.page = p;
      // 鎖定成功即嘗試切到下一頁（若存在），以伺服器回傳頁碼為準，避免競態再次+1
      if (p.pageNumber < 3) {
        this.switchPage(p.pageNumber + 1);
      }
    });
  }

  goExport(event?: MouseEvent) {
    if (!this.story) return;
    if (event) {
      this.audio.playOpen();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-export') as HTMLElement;
      if (btn) {
        btn.classList.add('click-animate');
        setTimeout(() => btn.classList.remove('click-animate'), 300);
      }
    }
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

  accept(p: Proposal, event?: MouseEvent) {
    if (!this.story) return;
    if (event) {
      this.audio.playSuccessStrong();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-accept') as HTMLElement;
      if (btn) {
        btn.classList.add('click-sparkle');
        setTimeout(() => btn.classList.remove('click-sparkle'), 600);
      }
    }
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

  reject(p: Proposal, event?: MouseEvent) {
    if (!this.story) return;
    if (event) {
      this.audio.playFailure();
      const button = event.target as HTMLElement;
      const btn = button.closest('.cute-button-reject') as HTMLElement;
      if (btn) {
        btn.classList.add('click-bounce');
        setTimeout(() => btn.classList.remove('click-bounce'), 400);
      }
    }
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


