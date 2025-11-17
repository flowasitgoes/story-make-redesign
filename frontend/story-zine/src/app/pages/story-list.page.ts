import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Story } from '../services/api.service';
import { AudioService } from '../services/audio.service';

@Component({
  standalone: true,
  selector: 'app-story-list',
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container">
      <h1 class="page-title">
        <span class="emoji">📚</span>
        作品列表
      </h1>
      <form (ngSubmit)="create()" class="create-form">
        <input [(ngModel)]="title" name="title" placeholder="✨ 輸入標題" required class="cute-input" />
        <button type="submit" class="cute-button-primary" [class.click-animate]="isCreating" (click)="onCreateClick($event)">
          <span class="emoji">✨</span>
          建立新作品
        </button>
      </form>
      <div class="list">
        <a class="item" *ngFor="let s of stories; let i = index" [routerLink]="['/stories', s.id]" (click)="onItemClick($event)">
          <div class="item-number">{{ i + 1 }}</div>
          <div class="item-content">
            <div class="title">{{ s.title || '未命名作品' }}</div>
            <div class="meta">
              <span class="status-badge" [ngClass]="'status-' + s.status">
                {{ s.status === 'active' ? '進行中' : s.status === 'completed' ? '已完成' : s.status }}
              </span>
              <span class="date">📅 {{ s.createdAt | date:'short' }}</span>
            </div>
          </div>
          <div class="item-arrow">→</div>
        </a>
        <div class="empty-state" *ngIf="stories.length === 0">
          <div class="empty-emoji">📖</div>
          <div class="empty-text">還沒有作品，快來建立第一個吧！</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { 
      max-width: 900px; 
      margin: 40px auto; 
      padding: 0 20px; 
      animation: slideIn 0.5s ease;
    }
    
    .page-title {
      font-size: 36px;
      font-weight: 700;
      color: var(--color-text);
      margin: 0 0 30px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: center;
      justify-content: center;
    }
    
    .page-title .emoji {
      font-size: 40px;
      animation: float 3s ease-in-out infinite;
    }
    
    .create-form { 
      display: flex; 
      gap: 12px; 
      margin: 0 0 30px;
      background: var(--color-white);
      padding: 20px;
      border-radius: var(--radius-medium);
      box-shadow: var(--shadow-md);
    }
    
    .cute-input {
      flex: 1;
      padding: 14px 18px;
      border: 2px solid var(--color-gray);
      border-radius: var(--radius-small);
      font-size: 16px;
      background: var(--color-white);
      transition: all var(--transition-normal);
    }
    
    .cute-input:focus {
      border-color: var(--color-pink-bright);
      box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.15);
    }
    
    .cute-button-primary {
      background: linear-gradient(135deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      color: var(--color-white);
      border-radius: var(--radius-large);
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all var(--transition-normal);
    }
    
    .cute-button-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
      background: linear-gradient(135deg, #FF5A8A 0%, #3EB8B0 100%);
    }
    
    .list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .item { 
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: var(--color-white);
      border: 2px solid var(--color-gray);
      border-radius: var(--radius-medium);
      text-decoration: none;
      color: inherit;
      transition: all var(--transition-normal);
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }
    
    .item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      opacity: 0;
      transition: opacity var(--transition-normal);
    }
    
    .item:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-pink-bright);
    }
    
    .item:hover::before {
      opacity: 1;
    }
    
    .item-number {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--color-pink-bright) 0%, var(--color-blue) 100%);
      color: var(--color-white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }
    
    .item-content {
      flex: 1;
      min-width: 0;
    }
    
    .title { 
      font-weight: 700;
      font-size: 20px;
      color: var(--color-text);
      margin-bottom: 8px;
    }
    
    .meta { 
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--color-text-light);
      font-size: 14px;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
    
    .status-badge.status-active {
      background: var(--color-yellow-light);
      color: #B8860B;
      border: 1px solid var(--color-yellow);
    }
    
    .status-badge.status-completed {
      background: var(--color-blue-light);
      color: #00695C;
      border: 1px solid var(--color-blue);
    }
    
    .date {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .item-arrow {
      font-size: 24px;
      color: var(--color-pink-bright);
      transition: transform var(--transition-normal);
      flex-shrink: 0;
    }
    
    .item:hover .item-arrow {
      transform: translateX(4px);
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: var(--color-white);
      border-radius: var(--radius-medium);
      box-shadow: var(--shadow-sm);
    }
    
    .empty-emoji {
      font-size: 64px;
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }
    
    .empty-text {
      font-size: 18px;
      color: var(--color-text-light);
    }
    
    .emoji {
      display: inline-block;
    }
  `]
})
export class StoryListPage {
  private api = inject(ApiService);
  private audio = inject(AudioService);
  stories: Story[] = [];
  title = '';
  isCreating = false;

  constructor() {
    this.load();
  }

  load() {
    this.api.listStories().subscribe(list => this.stories = list);
  }

  onCreateClick(event: MouseEvent) {
    this.audio.playChoose();
    const button = event.target as HTMLElement;
    button.classList.add('click-animate');
    setTimeout(() => button.classList.remove('click-animate'), 300);
  }

  onItemClick(event: MouseEvent) {
    this.audio.playClick();
    const item = event.currentTarget as HTMLElement;
    item.classList.add('click-bounce');
    setTimeout(() => item.classList.remove('click-bounce'), 400);
  }

  create() {
    if (!this.title.trim()) return;
    this.isCreating = true;
    this.audio.playSuccess();
    this.api.createStory(this.title.trim()).subscribe(() => {
      this.title = '';
      this.isCreating = false;
      this.load();
    });
  }
}


