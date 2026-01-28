# Vercel 部署指南

本指南将帮助您将 MCP 服务部署到 Vercel。

## 前置要求

1. 一个 Vercel 账号（免费版即可）
2. 已安装 Vercel CLI（可选，用于本地测试）
3. Git 仓库（GitHub、GitLab 或 Bitbucket）

## 部署步骤

### 1. 准备代码

确保以下文件已创建：
- `vercel.json` - Vercel 配置文件
- `api/index.py` - API 入口文件
- `api/requirements.txt` - Python 依赖
- `.vercelignore` - 忽略文件列表

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 必需环境变量

- `BACKEND_BASE_URL`: RAG 后端服务的 URL（例如：`https://your-backend.vercel.app` 或 `http://your-server.com:8000`）

#### 可选环境变量（根据使用需求）

**如果使用语雀管理功能：**
- `YUQUE_SPACE_SUBDOMAIN`: 语雀空间子域名（默认：`www`）
- `DEFAULT_API_TOKEN`: 语雀 API Token
- `DEFAULT_GROUP_LOGIN`: 语雀团队 login
- `DEFAULT_BOOK_SLUG`: 知识库 slug（可选）

**如果使用 RAG 问答功能：**
- `BACKEND_TOKEN`: RAG 系统的访问令牌（通过 `auth_login` 工具获取，通常不需要在环境变量中设置）

#### 在 Vercel Dashboard 中设置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目 `yuque-rag-mcp`
3. 进入 **Settings** → **Environment Variables**
4. 添加上述环境变量
5. 选择环境（Production、Preview、Development）
6. 点击 **Save**

#### 使用本地 .env 文件（开发环境）

在 `mcp/` 目录下创建 `.env` 文件（参考 `.env.example`）：

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，填入您的配置
```

**注意**: `.env` 文件已添加到 `.gitignore`，不会被提交到 Git。

### 3. 部署到 Vercel

#### 方法一：通过 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入您的 Git 仓库
4. 在项目设置中：
   - **Root Directory**: 设置为 `mcp`（如果仓库根目录不是 mcp）
   - **Framework Preset**: 选择 "Other"
   - **Build Command**: 留空
   - **Output Directory**: 留空
5. 添加环境变量（见步骤 2）
6. 点击 "Deploy"

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果尚未安装）
npm i -g vercel

# 登录 Vercel
vercel login

# 在 mcp 目录下部署
cd mcp
vercel

# 生产环境部署
vercel --prod
```

### 4. 验证部署

部署完成后，访问以下 URL 验证服务是否正常运行：

```
https://your-project.vercel.app/health
```

应该返回：
```json
{
  "service": "yuque-mcp",
  "status": "running",
  "version": "1.0.0"
}
```

## 配置 Cursor 使用 Vercel 部署的 MCP 服务

在 Cursor 的 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "yuque-rag": {
      "url": "https://your-project.vercel.app",
      "headers": {
        "BACKEND_BASE_URL": "https://your-backend.vercel.app",
        "BACKEND_TOKEN": "your_rag_access_token",
        "YUQUE_SPACE_SUBDOMAIN": "www",
        "DEFAULT_API_TOKEN": "your_yuque_api_token",
        "DEFAULT_GROUP_LOGIN": "your_group",
        "DEFAULT_BOOK_SLUG": "your_book"
      }
    }
  }
}
```

## 注意事项

1. **冷启动**: Vercel 的无服务器函数在首次请求时可能有冷启动延迟（通常 1-3 秒）

2. **超时限制**: 
   - Hobby 计划：10 秒超时
   - Pro 计划：60 秒超时
   - Enterprise 计划：300 秒超时

3. **函数大小限制**: 
   - 部署包大小限制为 50MB（未压缩）
   - 如果依赖过多，考虑使用 `requirements-mcp.txt` 中的精简依赖

4. **环境变量**: 
   - 敏感信息（如 API Token）应通过 Vercel Dashboard 设置，不要提交到代码仓库

5. **后端服务**: 
   - 确保 RAG 后端服务可以公开访问（或配置 Vercel 的 IP 白名单）
   - 如果后端也在 Vercel 上，使用 Vercel 的内部网络连接

## 故障排查

### 问题：部署失败

- 检查 `api/requirements.txt` 中的依赖是否正确
- 查看 Vercel 构建日志中的错误信息
- 确保 Python 版本兼容（Vercel 默认使用 Python 3.9）

### 问题：运行时错误

- 检查环境变量是否正确设置
- 查看 Vercel 函数日志
- 确保后端服务可访问

### 问题：工具加载失败

- 检查 `tools/` 目录是否包含在部署中
- 查看函数日志中的导入错误
- 确保所有依赖都已安装

## 本地测试

在部署到 Vercel 之前，可以使用 Vercel CLI 在本地测试：

```bash
cd mcp
vercel dev
```

这将启动一个本地开发服务器，模拟 Vercel 的运行环境。

## 更新部署

每次推送到 Git 仓库的主分支时，Vercel 会自动重新部署。您也可以手动触发部署：

```bash
vercel --prod
```

## 相关资源

- [Vercel Python 文档](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Vercel 环境变量](https://vercel.com/docs/environment-variables)
- [FastMCP 文档](https://gofastmcp.com/)
