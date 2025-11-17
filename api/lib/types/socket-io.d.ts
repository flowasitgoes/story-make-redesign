// Socket.IO 类型定义（用于 Serverless Functions，实际不会使用）
export interface Namespace {
  to(room: string): {
    emit(event: string, data: any): void;
  };
  emit(event: string, data: any): void;
}

