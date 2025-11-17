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
        <span class="emoji">🖋️</span>
        共創小說
      </h1>
      <form (ngSubmit)="create()" class="create-form glass-container glass-container--rounded">
        <div class="glass-filter"></div>
        <div class="glass-overlay"></div>
        <div class="glass-specular"></div>
        <div class="glass-content">
          <input [(ngModel)]="title" name="title" placeholder="✨ 輸入標題" required class="cute-input" />
          <button type="submit" class="cute-button-primary" [class.click-animate]="isCreating" (click)="onCreateClick($event)">
            <span class="emoji">✨</span>
            建立新作品
          </button>
        </div>
      </form>
      <div class="list">
        <a class="item liquid-glass-wrapper" *ngFor="let s of stories; let i = index" [routerLink]="['/stories', s.id]" (click)="onItemClick($event)">
          <div class="liquidGlass-effect"></div>
          <div class="liquidGlass-tint"></div>
          <div class="liquidGlass-shine"></div>
          <div class="liquidGlass-text">
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
          </div>
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
    
    /* Glass Container Styles */
    .glass-container {
      position: relative;
      display: flex;
      align-items: center;
      background: transparent;
      border-radius: 2rem;
      overflow: hidden;
      box-shadow: 0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2);
    }
    
    .glass-container--rounded {
      border-radius: 3rem;
    }
    
    .glass-filter,
    .glass-overlay,
    .glass-specular {
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
    
    .glass-filter {
      z-index: 0;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      filter: url(#lensFilter) saturate(120%) brightness(1.15);
    }
    
    .glass-overlay {
      z-index: 1;
      background: rgba(255, 255, 255, 0.25);
    }
    
    .glass-specular {
      z-index: 2;
      box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.75),
        inset 0 0 5px rgba(255, 255, 255, 0.75);
      pointer-events: none;
    }
    
    .glass-content {
      position: relative;
      z-index: 3;
      display: flex;
      flex: 1 1 auto;
      align-items: center;
      gap: 12px;
      padding: 20px;
      width: 100%;
    }
    
    .create-form { 
      margin: 0 0 30px;
    }
    
    .cute-input {
      flex: 1;
      padding: 14px 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: var(--radius-small);
      font-size: 16px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: var(--color-text);
      transition: all var(--transition-normal);
    }
    
    .cute-input::placeholder {
      color: rgba(0, 0, 0, 0.6);
    }
    
    .cute-input:focus {
      border-color: rgba(255, 255, 255, 0.6);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.3);
      outline: none;
    }
    
    .cute-button-primary {
      background: linear-gradient(to right, rgb(119, 161, 211) 0%, rgb(73, 174, 173) 51%, rgb(119, 161, 211) 100%);
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
      /* 移除毛玻璃效果，使用实色背景 */
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      opacity: 1;
      position: relative;
      z-index: 10;
    }
    
    .cute-button-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
      background: linear-gradient(to right, rgb(119, 161, 211) 0%, rgb(73, 174, 173) 51%, rgb(119, 161, 211) 100%);
      filter: brightness(1.1);
      opacity: 1;
    }
    
    .list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Liquid Glass 效果 */
    .liquid-glass-wrapper {
      position: relative;
      display: flex;
      font-weight: 600;
      overflow: hidden;
      color: var(--color-text);
      cursor: pointer;
      box-shadow: 0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2);
      border: none;
      padding: 20px 24px;
      border-radius: var(--radius-medium);
      text-decoration: none;
    }
    
    .liquid-glass-wrapper:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.25), 0 0 30px rgba(0, 0, 0, 0.15);
      border-radius: var(--radius-large);
      padding: 22px 26px;
    }
    
    .liquidGlass-effect {
      position: absolute;
      z-index: 0;
      inset: 0;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      filter: url(#glass-distortion);
      overflow: hidden;
      isolation: isolate;
      border-radius: inherit;
    }
    
    .liquidGlass-tint {
      z-index: 1;
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.1);
      border-radius: inherit;
      border: 2px solid transparent;
      transition: all 0.35s;
    }
    
    .liquid-glass-wrapper:hover .liquidGlass-tint {
      background: rgba(255, 255, 255, 0.4);
      border-color: rgba(113, 110, 239, 0.8);
      box-shadow: 0 0 0.5em 0em rgba(113, 110, 239, 0.6);
    }
    
    .liquidGlass-shine {
      position: absolute;
      inset: 0;
      z-index: 2;
      overflow: hidden;
      box-shadow: inset 2px 2px 1px 0 rgba(255, 255, 255, 0.6),
        inset -1px -1px 1px 1px rgba(255, 255, 255, 0.4);
      border-radius: inherit;
      pointer-events: none;
    }
    
    .liquidGlass-text {
      z-index: 3;
      position: relative;
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      color: var(--color-text);
    }
    
    .item-number {
      width: 40px;
      height: 40px;
      background: conic-gradient(from 45deg, rgb(187, 197, 184) 0deg, rgb(187, 197, 184) 72deg, rgb(164, 146, 180) 72deg, rgb(164, 146, 180) 144deg, rgb(135, 101, 166) 144deg, rgb(135, 101, 166) 216deg, rgb(103, 80, 145) 216deg, rgb(103, 80, 145) 288deg, rgb(75, 91, 116) 288deg, rgb(75, 91, 116) 360deg);
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
    
    .liquid-glass-wrapper:hover .item-arrow {
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
    this.api.listStories().subscribe({
      next: (list) => {
        console.log('Stories loaded:', list.length);
        this.stories = list;
      },
      error: (error) => {
        console.error('Error loading stories:', error);
        this.stories = []; // 设置为空数组避免显示错误
      }
    });
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
    this.api.createStory(this.title.trim()).subscribe({
      next: (story) => {
        console.log('Story created:', story);
        this.title = '';
        this.isCreating = false;
        this.load();
      },
      error: (error) => {
        console.error('Error creating story:', error);
        this.isCreating = false;
        alert('創建故事失敗：' + (error?.error?.message || error?.message || '未知錯誤'));
      }
    });
  }
}


