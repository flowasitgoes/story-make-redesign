import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Story } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-story-list',
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container">
      <h1>作品列表</h1>
      <form (ngSubmit)="create()" class="create-form">
        <input [(ngModel)]="title" name="title" placeholder="輸入標題" required />
        <button type="submit">建立新作品</button>
      </form>
      <div class="list">
        <a class="item" *ngFor="let s of stories" [routerLink]="['/stories', s.id]">
          <div class="title">{{ s.title }}</div>
          <div class="meta">狀態：{{ s.status }}　建立：{{ s.createdAt | date:'short' }}</div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 800px; margin: 24px auto; padding: 0 12px; }
    .create-form { display: flex; gap: 8px; margin: 12px 0 20px; }
    .create-form input { flex: 1; padding: 8px; }
    .item { display:block; padding:12px; border:1px solid #ddd; border-radius:8px; margin-bottom:10px; text-decoration:none; color:inherit; }
    .title { font-weight:700; }
    .meta { color:#666; font-size:12px; margin-top:4px; }
  `]
})
export class StoryListPage {
  private api = inject(ApiService);
  stories: Story[] = [];
  title = '';

  constructor() {
    this.load();
  }

  load() {
    this.api.listStories().subscribe(list => this.stories = list);
  }

  create() {
    if (!this.title.trim()) return;
    this.api.createStory(this.title.trim()).subscribe(() => {
      this.title = '';
      this.load();
    });
  }
}


