/**
 * Vercel KV 存储适配器
 * 用于在 Vercel Serverless Functions 中持久化数据
 */
export class KVStorage {
  private prefix: string;
  private kv: any;

  constructor(prefix: string = 'story-maker:') {
    this.prefix = prefix;
    // 动态导入 @vercel/kv，避免在非 Vercel 环境中出错
    try {
      // @vercel/kv 导出的是默认的 kv 对象
      const kvModule = require('@vercel/kv');
      this.kv = kvModule.kv || kvModule.default || kvModule;
    } catch (error) {
      this.kv = null;
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.kv) {
      return null;
    }
    try {
      const value = await this.kv.get<T>(this.getKey(key));
      return value;
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.kv) {
      throw new Error('KV storage not initialized');
    }
    try {
      await this.kv.set(this.getKey(key), value);
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.kv) {
      return;
    }
    try {
      await this.kv.del(this.getKey(key));
    } catch (error) {
      console.error(`KV delete error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.kv) {
      return false;
    }
    try {
      const value = await this.kv.get(this.getKey(key));
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查 KV 是否可用
   */
  static isAvailable(): boolean {
    try {
      // 检查环境变量 KV_REST_API_URL 或 KV_URL 是否存在
      const hasEnv = !!(process.env.KV_REST_API_URL || process.env.KV_URL);
      if (!hasEnv) {
        return false;
      }
      // 尝试导入 @vercel/kv
      require('@vercel/kv');
      return true;
    } catch {
      return false;
    }
  }
}

