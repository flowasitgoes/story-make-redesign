import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/story-list.page').then(m => m.StoryListPage) },
  { path: 'stories/:id', loadComponent: () => import('./pages/story-detail.page').then(m => m.StoryDetailPage) },
  { path: 'stories/:id/export', loadComponent: () => import('./pages/export.page').then(m => m.ExportPage) },
  { path: '**', redirectTo: '' }
];
