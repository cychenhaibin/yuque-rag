# 语雀知识库管理 & RAG 问答 MCP 服务器

## 项目简介
本项目基于 FastMCP 框架，提供一个集成了**语雀知识库管理**和 **RAG 智能问答**功能的 MCP 服务器。

### 包含两类工具

#### 1. 语雀管理工具
- 直接调用**语雀官方 API**进行文档管理
- 支持创建分组、创建/更新文档、获取文档列表等
- **需要配置**：语雀 API Token、Group Login、Book Slug

#### 2. RAG 问答工具
- 调用**本地 RAG 后端服务**进行智能问答
- 支持知识库检索、互联网搜索、混合搜索
- 支持流式和非流式问答
- **需要配置**：RAG 后端服务地址

> 💡 **重要说明**：这两类工具使用**不同的配置参数**，可以根据需求选择使用一个或两个。详见 [配置说明](#环境变量配置) 和 [工具对比文档](TOOLS_COMPARISON.md)。

## 环境配置

### 依赖安装

#### Python 版本要求
- **推荐**: Python 3.10+
- **最低**: Python 3.8+

#### 安装方式

**方式 1: 使用 MCP 专用依赖文件（推荐）**

使用精简的依赖文件，兼容 Python 3.8+：

```bash
cd mcp
pip3 install -r requirements-mcp.txt --user
```

**方式 2: 手动安装核心依赖**

```bash
pip3 install fastmcp starlette requests python-dotenv --user
```

**方式 3: 安装完整项目依赖（需要 Python 3.10+）**

如果你的 Python 版本 >= 3.10，可以安装完整依赖：

```bash
pip3 install -r ../requirements.txt --user
```

#### 验证安装

```bash
python3 -c "import fastmcp; print('✓ FastMCP 已安装，版本:', fastmcp.__version__)"
```

### 环境变量配置
请在项目根目录创建 `.env` 文件，配置以下环境变量：

#### 语雀 API 相关配置
- `YUQUE_SPACE_SUBDOMAIN`：语雀空间子域名（用于访问语雀空间的URL前缀，如 https://[SUBDOMAIN].yuque.com）
- `DEFAULT_API_TOKEN`：默认API访问令牌（用于认证调用语雀API的权限）
- `DEFAULT_GROUP_LOGIN`：默认群组（团队）别名（指定需要访问的语雀群组标识）
- `DEFAULT_BOOK_SLUG`：默认知识库别名（语雀文档库的唯一标识符，用于定位具体文档库）

#### RAG 后端服务配置
- `BACKEND_BASE_URL`：RAG 后端服务地址，默认为 `http://localhost:8000`

示例：
```
YUQUE_SPACE_SUBDOMAIN=your_space_subdomain_here
DEFAULT_API_TOKEN=your_api_token_here
DEFAULT_GROUP_LOGIN=your_group_login_here
DEFAULT_BOOK_SLUG=your_book_slug_here
BACKEND_BASE_URL=http://localhost:8000
```

此外，也可以通过 MCP 客户端请求头传递这些变量。

### 完整配置示例

根据你需要使用的工具，配置相应的参数：

#### 只使用 RAG 工具（问答功能）

如果只需要使用 RAG 问答功能，配置：

```json
{
    "mcpServers": {
       "yuque-rag": {
          "url": "http://localhost:8000/mcp",
          "headers": {
              "BACKEND_BASE_URL": "http://localhost:8000",
              "BACKEND_TOKEN": "your_rag_access_token"
            }
        }
    }
}
```

#### 只使用语雀管理工具

如果只需要使用语雀知识库管理功能，配置：

```json
{
    "mcpServers": {
       "yuque-rag": {
          "url": "http://localhost:8000/mcp",
          "headers": {
              "YUQUE_SPACE_SUBDOMAIN": "www",
              "DEFAULT_API_TOKEN": "your_yuque_api_token",
              "DEFAULT_GROUP_LOGIN": "your_group",
              "DEFAULT_BOOK_SLUG": "your_book"
            }
        }
    }
}
```

#### 同时使用两类工具（推荐）

如果需要同时使用 RAG 和语雀管理功能，配置全部参数：

```json
{
    "mcpServers": {
       "yuque-rag": {
          "url": "http://localhost:8000/mcp",
          "headers": {
              "BACKEND_BASE_URL": "http://localhost:8000",
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



## 启动服务

运行服务器主程序 `server.py`，支持多种传输模式：

```bash
python server.py --transport streamable-http
```

可选传输模式：
- `streamable-http`（默认）：基于 HTTP 流的传输
- `sse`：基于服务器发送事件（Server-Sent Events）
- `stdio`：基于标准输入输出流

## 工具说明

服务器自动加载 `tools/` 目录下的所有工具模块，主要包括：

### 语雀知识库管理工具

- **`create_yuque_group(name: str)`**  
  创建语雀知识库中的分组（目录）。
  
  参数说明:  
    * `name (str)`: 要创建的分组名称。该名称在当前知识库中应具有唯一性。

- **`create_yuque_doc_in_group(...)`**  
  在指定的语雀知识库中的指定分组下创建一个文档。如果该分组不存在，则会先创建该分组，再在其中创建文档。
  
  参数说明:
    * `group_name (str)`: 分组名称。如果该分组不存在，将自动创建。
    * `doc_title (str)`: 要创建的文档的标题。
    * `doc_body (str)`: 文档的内容，支持 Markdown 格式。

- **`get_yuque_doc_list(group_login, book_slug, offset, limit)`**  
  获取知识库中的文档列表，支持分页。

- **`get_yuque_doc_detail(...)`**  
  获取指定文档的详细内容。

- **`get_yuque_repo_toc(...)`**  
  获取知识库的完整目录结构。

### RAG 问答系统工具

#### 系统管理

- **`health_check()`**  
  检查 RAG 后端系统运行状态。
  
  返回值: 系统状态信息（无需认证）

#### 用户认证

- **`auth_login(username, password, device_info="MCP Client")`**  
  使用用户名和密码登录 RAG 系统，获取访问 token。
  
  参数说明:
    * `username (str)`: 用户名（必填）
    * `password (str)`: 密码（必填）
    * `device_info (str)`: 设备信息（可选）
  
  默认测试账号:
    - 用户名: admin, 密码: admin123
    - 用户名: user1, 密码: password123
    - 用户名: test, 密码: test123
  
  返回值: 包含 access_token 的认证信息

- **`auth_logout(token="")`**  
  登出当前用户，使 token 失效。
  
  参数说明:
    * `token (str)`: 访问令牌（可从请求头获取）

- **`auth_get_me(token="")`**  
  获取当前登录用户的信息，验证 token 是否有效。
  
  参数说明:
    * `token (str)`: 访问令牌（可从请求头获取）

#### 智能问答

- **`chat(question, token="", use_web_search=False, use_hybrid=False)`**  
  向 RAG 系统提问并获取完整答案（一次性返回）。
  
  参数说明:
    * `question (str)`: 用户提出的问题（必填）
    * `token (str)`: 访问令牌（必填）
    * `use_web_search (bool)`: 是否使用互联网搜索（默认 False）
    * `use_hybrid (bool)`: 是否混合搜索（默认 False）
  
  搜索模式:
    - 默认模式：仅从知识库检索
    - 互联网搜索模式：仅使用互联网搜索（DuckDuckGo）
    - 混合搜索模式：同时使用知识库和互联网

- **`chat_stream(question, token="", use_web_search=False, use_hybrid=False)`**  
  向 RAG 系统提问并获取流式答案（逐字返回）。
  
  参数说明与 `chat` 相同，但返回方式为流式（适合实时展示场景）



## 使用示例

### 启动服务器

启动服务器并使用默认传输：

```bash
python server.py
```

指定传输模式为 SSE：

```bash
python server.py --transport sse
```

### RAG 问答系统使用流程

#### 1. 检查系统健康状态

```python
# 调用 health_check 工具
health_check()
```

#### 2. 用户登录获取 token

```python
# 调用 auth_login 工具
auth_login(username="admin", password="admin123")
# 返回示例:
# 登录成功！
# 用户名: admin
# Token 类型: bearer
# 访问令牌: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# 过期时间: 86400 秒
```

#### 3. 使用 token 进行问答

```python
# 知识库检索模式
chat(
    question="什么是RAG？",
    token="your_access_token_here"
)

# 互联网搜索模式
chat(
    question="Python最新版本是什么？",
    token="your_access_token_here",
    use_web_search=True
)

# 混合搜索模式
chat(
    question="RAG技术的最新发展",
    token="your_access_token_here",
    use_hybrid=True
)
```

#### 4. 使用流式问答（实时返回）

```python
# 流式问答
chat_stream(
    question="解释一下向量数据库",
    token="your_access_token_here"
)
```

#### 5. 验证 token 和获取用户信息

```python
# 获取当前用户信息
auth_get_me(token="your_access_token_here")
```

#### 6. 登出

```python
# 登出并使 token 失效
auth_logout(token="your_access_token_here")
```

### MCP 客户端配置示例

在 MCP 客户端配置中，可以通过请求头传递配置参数：

```json
{
    "mcpServers": {
       "yuque-rag": {
          "url": "http://localhost:8000/mcp",
          "headers": {
              "BACKEND_BASE_URL": "http://localhost:8000",
              "BACKEND_TOKEN": "your_access_token_here",
              "YUQUE_SPACE_SUBDOMAIN": "www",
              "DEFAULT_API_TOKEN": "your_yuque_api_token",
              "DEFAULT_GROUP_LOGIN": "your_group",
              "DEFAULT_BOOK_SLUG": "your_book"
            }
        }
    }
}
```

## 语雀文档重要的概念
接口域名为 https://www.yuque.com，但要注意访问空间内资源需要使用该空间的子域名。

网址路径：

语雀的网址有一定的格式，比如https://www.yuque.com/yuque/developer/api。
这里面包含了用户或团队的名称、知识库的标识，以及文档的标识。

```
https://www.yuque.com/yuque/developer/api        [文档完整访问路径]
                        |
                        +-- yuque/               [团队或用户的登录名(group_login)]
                                |
                                +-- developer/   [知识库的标识(book_slug)]
                                       |
                                       +-- api   [文档的标识(doc_slug)]

```

## 语雀文档身份认证

语雀所有的开放 API 都需要 Token 验证之后才能访问。

### 个人用户认证 超级会员专享权益
获取 Token 可通过点击语雀的个人头像，并进入 个人设置 页面拿到，如下图：

![image](https://github.com/user-attachments/assets/daf7caca-ac77-4177-9857-fea0934e0edc)

### 企业团队身份认证 旗舰版空间专享权益
空间内的团队，可进入团队设置页面进行获取（仅旗舰版空间可使用），如下图。
![image](https://github.com/user-attachments/assets/4ec55e0e-b0d6-4e69-af83-628578700062)



## 贡献指南

欢迎提交 Issue 和 Pull Request，改进功能或修复问题。

## 联系方式

如有疑问，请联系项目维护者。
