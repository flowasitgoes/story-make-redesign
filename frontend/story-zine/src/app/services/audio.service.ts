import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5; // 默认音量 50%

  constructor() {
    // 预加载常用音效
    this.preloadSounds();
  }

  private preloadSounds() {
    const sounds = [
      { name: 'ui_click_01', folder: 'ui' },
      { name: 'ui_choose_and_click', folder: 'ui' },
      { name: 'bell-count-single-soft', folder: 'ui' },
      { name: 'check_success_layers', folder: 'gameplay' },
      { name: 'check_failure_01', folder: 'gameplay' },
      { name: 'ui_popup_open', folder: 'ui' },
      { name: 'ui_popup_close', folder: 'ui' }
    ];

    sounds.forEach(sound => {
      this.loadSound(sound.name, sound.folder);
    });
  }

  private loadSound(soundName: string, folder: string = 'ui'): HTMLAudioElement {
    const cacheKey = `${folder}/${soundName}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const audio = new Audio();
    audio.volume = this.volume;
    audio.preload = 'auto';
    
    // 使用正确的路径（根据 angular.json 配置，音频文件会被复制到 /audio 目录）
    const paths = [
      `/audio/${folder}/${soundName}.mp3`,
      `audio/${folder}/${soundName}.mp3`,
      `./audio/${folder}/${soundName}.mp3`
    ];

    let pathIndex = 0;
    const tryLoad = () => {
      if (pathIndex < paths.length) {
        audio.src = paths[pathIndex];
        audio.load();
        pathIndex++;
      }
    };

    audio.addEventListener('error', () => {
      if (pathIndex < paths.length) {
        tryLoad();
      } else {
        console.warn(`Failed to load audio: ${soundName} from ${folder} folder`);
      }
    });

    tryLoad();
    this.audioCache.set(cacheKey, audio);
    return audio;
  }

  private playSound(soundName: string, volume?: number, folder: string = 'ui'): void {
    try {
      const audio = this.loadSound(soundName, folder);
      if (volume !== undefined) {
        audio.volume = volume;
      }
      // 重置到开始位置并播放
      audio.currentTime = 0;
      audio.play().catch(err => {
        // 静默处理播放错误（可能是用户未交互）
        console.debug('Audio play failed:', err);
      });
    } catch (error) {
      console.debug('Sound play error:', error);
    }
  }

  // 点击音效
  playClick(): void {
    this.playSound('ui_click_01', 0.4);
  }

  // 选择/提交音效
  playChoose(): void {
    this.playSound('ui_choose_and_click', 0.5);
  }

  // 成功音效
  playSuccess(): void {
    this.playSound('bell-count-single-soft', 0.6);
  }

  // 成功（更强烈）
  playSuccessStrong(): void {
    this.playSound('check_success_layers', 0.5, 'gameplay');
  }

  // 失败音效
  playFailure(): void {
    this.playSound('check_failure_01', 0.4, 'gameplay');
  }

  // 打开音效
  playOpen(): void {
    this.playSound('ui_popup_open', 0.5);
  }

  // 关闭音效
  playClose(): void {
    this.playSound('ui_popup_close', 0.5);
  }

  // 设置音量
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  // 获取音量
  getVolume(): number {
    return this.volume;
  }
}

