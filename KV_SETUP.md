# Vercel KV 存储配置指南

## 什么是 Vercel KV？

Vercel KV 是基于 Redis 的键值存储服务，专为 Vercel Serverless Functions 设计，提供持久化数据存储。

## 配置步骤

### 1. 在 Vercel Dashboard 中创建 KV 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击顶部菜单的 **"Storage"** 标签
4. 点击 **"Create Database"**
5. 选择 **"KV"**（Redis）
6. 输入数据库名称（例如：`story-maker-kv`）
7. 选择区域（建议选择离用户最近的区域）
8. 点击 **"Create"**

### 2. 连接 KV 数据库到项目

创建 KV 数据库后，Vercel 会自动：
- 将 KV 数据库连接到你的项目
- 设置环境变量 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`
- 这些环境变量会在所有部署环境中自动可用

### 3. 验证配置

部署后，代码会自动检测 KV 环境变量：
- 如果检测到 `KV_REST_API_URL` 或 `KV_URL`，将使用 KV 存储
- 如果没有检测到，将回退到文件系统（仅用于本地开发）

## 数据存储结构

在 KV 中，数据使用以下键结构存储：

```
story-maker:stories:index                    # 故事索引列表
story-maker:stories:{storyId}:story           # 单个故事数据
story-maker:stories:{storyId}:pages:page1     # 页面 1
story-maker:stories:{storyId}:pages:page2     # 页面 2
story-maker:stories:{storyId}:pages:page3     # 页面 3
story-maker:stories:{storyId}:proposals       # 提案列表
```

## 本地开发

### 选项 1：使用本地 Redis（推荐）

1. 安装 Redis：
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # 或使用 Docker
   docker run -d -p 6379:6379 redis
   ```

2. 设置环境变量：
   ```bash
   export KV_REST_API_URL="http://localhost:6379"
   export KV_REST_API_TOKEN=""
   ```

### 选项 2：使用 Vercel KV（需要网络连接）

1. 在 Vercel Dashboard 中创建 KV 数据库
2. 在本地 `.env.local` 文件中添加：
   ```
   KV_REST_API_URL=你的_KV_URL
   KV_REST_API_TOKEN=你的_KV_TOKEN
   ```

### 选项 3：使用文件系统（仅用于测试）

不设置 KV 环境变量，代码会自动使用文件系统存储（数据不会持久化）。

## 监控和调试

### 查看 KV 数据

在 Vercel Dashboard 中：
1. 进入项目的 **"Storage"** 标签
2. 点击你的 KV 数据库
3. 可以查看和编辑存储的键值对

### 调试日志

代码会在控制台输出存储模式：
- `Using KV storage` - 使用 KV 存储
- `Using file system storage` - 使用文件系统存储

## 费用

Vercel KV 的免费套餐包括：
- 256 MB 存储空间
- 每天 30,000 次读取
- 每天 30,000 次写入

对于大多数应用来说，免费套餐已经足够。如果需要更多资源，可以升级到付费计划。

## 故障排除

### 问题：KV 存储不工作

1. **检查环境变量**：
   - 确认 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 已设置
   - 在 Vercel Dashboard 的 "Settings" > "Environment Variables" 中检查

2. **检查 KV 数据库连接**：
   - 在 Vercel Dashboard 的 "Storage" 标签中确认 KV 数据库已连接到项目

3. **查看日志**：
   - 在 Vercel Dashboard 的 "Functions" 标签中查看函数日志
   - 查找 KV 相关的错误信息

### 问题：数据丢失

- 确认使用的是 KV 存储而不是文件系统
- 检查 KV 数据库的存储配额
- 查看 Vercel Dashboard 中的 KV 使用情况

## 迁移现有数据

如果你有现有的文件系统数据需要迁移到 KV：

1. 导出文件系统数据
2. 编写迁移脚本将数据写入 KV
3. 验证数据完整性

（迁移脚本需要根据你的具体数据结构编写）

