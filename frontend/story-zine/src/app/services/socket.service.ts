import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('/stories', { path: '/socket.io' });
  }

  joinStoryRoom(storyId: string) {
    this.socket.emit('join', `story:${storyId}`);
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>(subscriber => {
      const handler = (data: T) => subscriber.next(data);
      this.socket.on(event, handler);
      return () => this.socket.off(event, handler);
    }).pipe(shareReplay(1));
  }
}


