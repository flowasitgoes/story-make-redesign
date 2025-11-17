import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, shareReplay, interval, EMPTY, merge } from 'rxjs';
import { catchError, switchMap, startWith } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private usePolling = false;
  private pollingInterval = 3000; // 3秒轮询一次
  private connected = false;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io('/stories', { 
        path: '/socket.io',
        timeout: 5000,
        reconnection: false // 禁用自动重连，失败后使用轮询
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.usePolling = false;
        console.log('Socket.IO connected');
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Socket.IO connection failed, falling back to polling:', error);
        this.connected = false;
        this.usePolling = true;
        // 不关闭 socket，但标记为使用轮询
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        if (!this.usePolling) {
          this.usePolling = true;
          console.warn('Socket.IO disconnected, using polling');
        }
      });
    } catch (error) {
      console.warn('Socket.IO initialization failed, using polling:', error);
      this.usePolling = true;
      this.connected = false;
    }
  }

  joinStoryRoom(storyId: string) {
    if (this.socket && this.connected) {
    this.socket.emit('join', `story:${storyId}`);
    }
    // 轮询模式下不需要 join，因为会通过 API 获取数据
  }

  on<T>(event: string): Observable<T> {
    // 如果使用轮询，返回空 Observable（事件通过 API 轮询获取）
    if (this.usePolling || !this.connected) {
      return EMPTY;
    }

    // Socket.IO 模式
    if (this.socket) {
    return new Observable<T>(subscriber => {
      const handler = (data: T) => subscriber.next(data);
        this.socket!.on(event, handler);
        return () => {
          if (this.socket) {
            this.socket.off(event, handler);
          }
        };
      }).pipe(
        shareReplay(1),
        catchError(() => {
          // 如果 Socket.IO 失败，切换到轮询
          this.usePolling = true;
          return EMPTY;
        })
      );
    }

    return EMPTY;
  }

  /**
   * 检查是否使用轮询模式
   */
  isPollingMode(): boolean {
    return this.usePolling || !this.connected;
  }
}


