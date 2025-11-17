# Vercel 部署检查清单

## ✅ 已完成的配置

- [x] 创建 `vercel.json` 配置文件
- [x] 创建所有 API Serverless Functions
- [x] 修改后端服务函数支持可选的 Socket.IO（兼容 Serverless）
- [x] 创建根目录 `package.json` 和 `tsconfig.json`
- [x] 创建 `.vercelignore` 文件
- [x] 创建部署文档 `VERCEL_DEPLOY.md`

## ⚠️ 部署前需要处理的问题

### 1. 数据持久化（重要！）
**问题**：Vercel Serverless Functions 使用临时文件系统，数据不会持久化。

**当前状态**：✅ **已解决** - 已实现自动 KV 存储适配器

**已完成**：
- [x] 创建 KV 存储适配器 `backend/src/services/kv-storage.ts`
- [x] 更新 `backend/src/services/storage.ts` 支持自动切换 KV/文件系统
- [x] 添加 `@vercel/kv` 依赖

**需要操作**：
- [ ] 在 Vercel Dashboard 中创建 KV 数据库（见 `KV_SETUP.md`）
- [ ] 验证 KV 环境变量已自动配置

### 2. Socket.IO 实时通信（重要！）
**问题**：Serverless Functions 不支持 Socket.IO 长连接。

**当前状态**：✅ **已解决** - 已实现轮询后备方案

**已完成**：
- [x] 修改 `frontend/story-zine/src/app/services/socket.service.ts`
  - 添加连接失败检测
  - 自动切换到轮询模式
  - 提供 `isPollingMode()` 方法
- [x] 修改 `frontend/story-zine/src/app/pages/story-detail.page.ts`
  - 实现自动轮询（每3秒）
  - 检测新提案和状态变化
  - 自动刷新页面数据

**工作原理**：
- Socket.IO 连接成功 → 使用实时事件
- Socket.IO 连接失败 → 自动切换到轮询模式（每3秒轮询一次）

### 3. 前端 API 基础路径
**检查**：确保前端 API 服务使用相对路径 `/api`

**当前状态**：`api.service.ts` 使用 `/api`，这是正确的。

### 4. 环境变量
**需要设置**（在 Vercel Dashboard）：
- [ ] `DATA_DIR`（可选，默认：`/tmp/data`）
- [ ] `PROPOSAL_LENGTH_MIN`（可选，默认：50）
- [ ] `PROPOSAL_LENGTH_MAX`（可选，默认：250）
- [ ] `PAGE_TOTAL_MIN`（可选，默认：150）
- [ ] `PAGE_TOTAL_MAX`（可选，默认：750）

## 📝 部署步骤

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **在 Vercel Dashboard 导入项目**
   - 访问 https://vercel.com/dashboard
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测配置

3. **设置环境变量**（如需要）
   - 在项目设置中添加环境变量

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

5. **测试**
   - 访问部署的 URL
   - 测试 API 端点：`/api/stories`
   - 测试前端页面

## 🔧 部署后可能需要调整

1. **如果构建失败**：
   - 检查 Node.js 版本（需要 20.x）
   - 检查构建日志
   - 确认所有依赖都已安装

2. **如果 API 返回 500 错误**：
   - 检查 Vercel 函数日志
   - 确认数据目录权限
   - 验证环境变量

3. **如果前端路由不工作**：
   - 确认 `vercel.json` 中的 rewrites 配置
   - 检查 Angular 构建输出目录

## 📚 相关文档

- 详细部署说明：`VERCEL_DEPLOY.md`
- Vercel 官方文档：https://vercel.com/docs

