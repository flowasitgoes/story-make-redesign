# Vercel 部署指南

## 重要限制说明

### 1. Socket.IO 实时通信限制
⚠️ **重要**：Vercel Serverless Functions 不支持 Socket.IO 的长连接。当前实现中，所有 Socket.IO 事件通知功能已被禁用。

**影响**：
- 创建故事、提案、接受/拒绝提案等操作不会触发实时更新
- 前端需要实现轮询（polling）来获取最新数据

**解决方案**：
- 方案 A：使用 Vercel 的 Server-Sent Events (SSE) 替代 Socket.IO
- 方案 B：使用外部 WebSocket 服务（如 Pusher、Ably）
- 方案 C：将 Socket.IO 服务单独部署到支持 WebSocket 的平台（如 Railway、Render）

### 2. 数据存储限制
⚠️ **重要**：Vercel Serverless Functions 使用临时文件系统（`/tmp`），数据不会持久化。

**当前解决方案**：
✅ **已实现自动 KV 存储适配**：代码会自动检测 Vercel KV 环境变量，如果可用则使用 KV 存储，否则回退到文件系统（仅用于本地开发）。

**配置 Vercel KV**：
1. 在 Vercel Dashboard 中，进入你的项目
2. 点击 "Storage" 标签
3. 创建或连接一个 KV 数据库
4. 环境变量会自动配置（`KV_REST_API_URL` 和 `KV_REST_API_TOKEN`）

**如果没有 KV**：
- 数据将存储在临时文件系统中，每次函数调用后可能丢失
- 建议使用 Vercel KV 或外部数据库（MongoDB、PostgreSQL 等）进行持久化

## 部署步骤

### 方法一：使用 Vercel CLI

#### 1. 安装 Vercel CLI（如果还没有）
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 在项目根目录部署
```bash
vercel
```

首次部署会询问一些问题，按提示回答即可。

#### 4. 生产环境部署
```bash
vercel --prod
```

### 方法二：通过 GitHub 连接（推荐）

1. 将代码推送到 GitHub 仓库
2. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库
5. Vercel 会自动检测 `vercel.json` 配置
6. 点击 "Deploy" 开始部署

**注意**：如果自动检测失败，请手动设置：
- Framework Preset: Other
- Root Directory: `./` (项目根目录)
- Build Command: `cd frontend/story-zine && npm install && npm run build`
- Output Directory: `frontend/story-zine/dist/story-zine/browser`

### 4. 环境变量配置

#### 必需的环境变量（KV 存储）
如果使用 Vercel KV 存储（推荐），Vercel 会自动配置：
- `KV_REST_API_URL`: KV REST API URL（自动配置）
- `KV_REST_API_TOKEN`: KV REST API Token（自动配置）

#### 可选的环境变量
在 Vercel Dashboard 中设置以下环境变量（如果需要）：
- `DATA_DIR`: 数据存储目录（默认：`/tmp/data`，仅在不使用 KV 时有效）
- `PROPOSAL_LENGTH_MIN`: 提案最小长度（默认：50）
- `PROPOSAL_LENGTH_MAX`: 提案最大长度（默认：250）
- `PAGE_TOTAL_MIN`: 页面最小总长度（默认：150）
- `PAGE_TOTAL_MAX`: 页面最大总长度（默认：750）

## 项目结构

```
story-maker-redesign/
├── api/                    # Vercel Serverless Functions
│   ├── stories/
│   ├── proposals/
│   └── ...
├── backend/                # 后端服务代码（被 API 函数引用）
├── frontend/story-zine/    # Angular 前端应用
├── vercel.json            # Vercel 配置文件
└── package.json           # 根目录依赖
```

## 构建配置

- **前端构建**：Angular 应用构建到 `frontend/story-zine/dist/story-zine/browser`
- **API 路由**：所有 `/api/*` 请求路由到 `api/` 目录下的 Serverless Functions
- **静态文件**：所有其他请求路由到 Angular 应用的 `index.html`（支持 SPA 路由）

## 已完成的改进

1. ✅ **数据持久化**：已实现 Vercel KV 存储适配器，自动检测并使用 KV 存储
2. ✅ **Socket.IO 兼容**：前端已实现轮询后备方案，当 Socket.IO 不可用时自动切换
3. ✅ **错误处理**：已添加错误处理和日志记录
4. ✅ **类型安全**：所有 API 函数类型正确

## 可选改进

1. **实时通信优化**：可以考虑实现 SSE（Server-Sent Events）替代 Socket.IO
2. **性能优化**：可以优化轮询间隔和策略
3. **缓存策略**：可以添加客户端缓存减少 API 调用

## 测试部署

部署后，访问以下端点测试：
- `GET /api/stories` - 获取故事列表
- `POST /api/stories` - 创建新故事
- `GET /api/stories/:id` - 获取单个故事

## 故障排除

### 构建失败
- 检查 Node.js 版本（需要 20.x）
- 确保所有依赖都已安装
- 检查 `vercel.json` 中的路径是否正确

### API 函数返回 500 错误
- 检查 Vercel 函数日志
- 确认数据目录权限
- 验证环境变量设置

### 前端路由不工作
- 确保 `vercel.json` 中的 rewrites 配置正确
- 检查 Angular 构建输出目录

