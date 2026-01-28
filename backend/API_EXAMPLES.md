# API 使用示例

本文档提供语雀 RAG 问答系统 API 的详细使用示例。

## 📑 目录

- [API 基础信息](#-api-基础信息)
- [认证说明](#-认证说明)
- [API 接口列表](#-api-接口列表)
  - [1. 健康检查](#1-健康检查)
  - [2. 用户登录](#2-用户登录)
  - [3. 用户登出](#3-用户登出)
  - [4. 获取当前用户信息](#4-获取当前用户信息)
  - [5. 问答接口（一次性返回）](#5-问答接口一次性返回)
  - [6. 流式问答接口（SSE）](#6-流式问答接口sse)
- [搜索接口说明](#-搜索接口说明)
- [错误处理](#-错误处理)
- [性能优化建议](#-性能优化建议)
- [完整使用流程示例](#-完整使用流程示例)
- [实际应用场景](#-实际应用场景)
- [最佳实践](#-最佳实践)
- [相关资源](#-相关资源)

## 📡 API 基础信息

- **基础 URL**: `http://localhost:8000`
- **Content-Type**: `application/json`
- **Swagger 文档**: http://localhost:8000/docs
- **认证方式**: Bearer Token（JWT）

## 🔐 认证说明

大部分接口需要认证才能访问。认证流程如下：

1. 使用用户名和密码调用 `/auth/login` 获取 token
2. 在后续请求的请求头中携带 token：`Authorization: Bearer <your_token>`
3. 使用 `/auth/logout` 登出，使 token 失效

**默认测试账号：**
- 用户名: `admin`, 密码: `admin123`
- 用户名: `user1`, 密码: `password123`
- 用户名: `test`, 密码: `test123`

**单设备登录机制：**
- 每次登录会生成新的 token
- 新 token 会自动使旧 token 失效
- 其他设备的旧 token 将无法继续使用

## 🔍 API 接口列表

### 1. 健康检查

检查服务是否正常运行。**无需认证**

**请求**
```http
GET /health
```

**响应示例**
```json
{
  "status": "ok",
  "message": "系统运行正常"
}
```

**cURL 示例**
```bash
curl http://localhost:8000/health
```

**JavaScript 示例**
```javascript
fetch('http://localhost:8000/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 2. 用户登录

使用用户名和密码登录系统，获取访问 token。**无需认证**

**请求**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "device_info": "Chrome on Windows"  // 可选
}
```

**响应示例**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "admin",
  "expires_in": 86400
}
```

**cURL 示例**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Python 示例**
```python
import requests

response = requests.post(
    'http://localhost:8000/auth/login',
    json={
        'username': 'admin',
        'password': 'admin123',
        'device_info': 'Python Client'  # 可选
    }
)

data = response.json()
token = data['access_token']
print(f"Token: {token}")
```

**JavaScript 示例**
```javascript
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123',
    device_info: 'Browser Client'  // 可选
  })
});

const data = await response.json();
const token = data.access_token;
console.log('Token:', token);
```

---

### 3. 用户登出

登出当前用户，使 token 失效。**需要认证**

**请求**
```http
POST /auth/logout
Authorization: Bearer <your_token>
```

**响应示例**
```json
{
  "message": "用户 admin 已登出"
}
```

**cURL 示例**
```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer <your_token>"
```

**Python 示例**
```python
import requests

token = "your_token_here"
response = requests.post(
    'http://localhost:8000/auth/logout',
    headers={'Authorization': f'Bearer {token}'}
)

data = response.json()
print(data['message'])
```

**JavaScript 示例**
```javascript
const token = 'your_token_here';
const response = await fetch('http://localhost:8000/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.message);
```

---

### 4. 获取当前用户信息

获取当前登录用户的信息。**需要认证**

**请求**
```http
GET /auth/me
Authorization: Bearer <your_token>
```

**响应示例**
```json
{
  "username": "admin",
  "message": "认证成功"
}
```

**cURL 示例**
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <your_token>"
```

**Python 示例**
```python
import requests

token = "your_token_here"
response = requests.get(
    'http://localhost:8000/auth/me',
    headers={'Authorization': f'Bearer {token}'}
)

data = response.json()
print(f"当前用户: {data['username']}")
```

**JavaScript 示例**
```javascript
const token = 'your_token_here';
const response = await fetch('http://localhost:8000/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('当前用户:', data.username);
```

---

### 5. 问答接口（一次性返回）

发送问题并获取完整答案（非流式）。**需要认证**

**请求参数说明：**
- `question` (string, 必需): 用户提出的问题
- `use_web_search` (boolean, 可选, 默认: false): 是否使用互联网搜索（DuckDuckGo）
- `use_hybrid` (boolean, 可选, 默认: false): 是否混合搜索（知识库 + 互联网）

**搜索模式说明：**
- 默认模式（`use_web_search=false`, `use_hybrid=false`）: 仅从知识库检索
- 互联网搜索模式（`use_web_search=true`）: 仅使用互联网搜索
- 混合搜索模式（`use_hybrid=true`）: 同时使用知识库和互联网搜索

**请求**
```http
POST /chat
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "question": "什么是 RAG？",
  "use_web_search": false,
  "use_hybrid": false
}
```

**响应示例**
```json
{
  "answer": "RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合了信息检索和文本生成的技术。它通过检索相关文档来增强大语言模型的回答能力...",
  "sources": [
    {
      "type": "knowledge_base",
      "title": "RAG技术介绍",
      "repo": "技术文档"
    }
  ]
}
```

**sources 字段说明：**
- `type`: 来源类型，`knowledge_base`（知识库）或 `web_search`（互联网搜索）
- `title`: 文档标题或网页标题
- `repo`: 知识库名称（仅知识库来源有此字段）
- `url`: 网页链接（仅互联网搜索来源有此字段）

**cURL 示例**
```bash
# 默认模式（知识库检索）
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"question": "什么是RAG？"}'

# 互联网搜索模式
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "question": "Python最新版本是什么？",
    "use_web_search": true
  }'

# 混合搜索模式
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "question": "RAG技术的最新发展",
    "use_hybrid": true
  }'
```

**Python 示例**
```python
import requests

token = "your_token_here"
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}

# 默认模式
response = requests.post(
    'http://localhost:8000/chat',
    headers=headers,
    json={'question': '什么是RAG？'}
)

# 互联网搜索模式
response = requests.post(
    'http://localhost:8000/chat',
    headers=headers,
    json={
        'question': 'Python最新版本是什么？',
        'use_web_search': True
    }
)

# 混合搜索模式
response = requests.post(
    'http://localhost:8000/chat',
    headers=headers,
    json={
        'question': 'RAG技术的最新发展',
        'use_hybrid': True
    }
)

data = response.json()
print(f"答案: {data['answer']}")
print(f"来源: {data.get('sources', [])}")
```

**JavaScript 示例**
```javascript
const token = 'your_token_here';

// 默认模式
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    question: '什么是RAG？'
  })
});

// 互联网搜索模式
const webResponse = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    question: 'Python最新版本是什么？',
    use_web_search: true
  })
});

// 混合搜索模式
const hybridResponse = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    question: 'RAG技术的最新发展',
    use_hybrid: true
  })
});

const data = await response.json();
console.log('答案:', data.answer);
console.log('来源:', data.sources);
```

---

### 6. 流式问答接口（SSE）

发送问题并实时接收答案片段（流式响应）。**需要认证**

**请求参数说明：**
- `question` (string, 必需): 用户提出的问题
- `use_web_search` (boolean, 可选, 默认: false): 是否使用互联网搜索（DuckDuckGo）
- `use_hybrid` (boolean, 可选, 默认: false): 是否混合搜索（知识库 + 互联网）

**请求**
```http
POST /chat/stream
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "question": "什么是 RAG？",
  "use_web_search": false,
  "use_hybrid": false
}
```

**响应格式（Server-Sent Events）**
```
data: {"content": "R"}

data: {"content": "A"}

data: {"content": "G"}

data: {"content": "（"}

data: {"content": "检"}

...

data: {"done": true, "sources": [{"type": "knowledge_base", "title": "RAG技术介绍", "repo": "技术文档"}]}

```

**Python 示例**
```python
import requests
import json

def stream_chat(question, token, use_web_search=False, use_hybrid=False):
    """
    流式问答
    
    Args:
        question: 用户问题
        token: 认证token
        use_web_search: 是否使用互联网搜索
        use_hybrid: 是否混合搜索
    """
    url = 'http://localhost:8000/chat/stream'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    payload = {
        'question': question,
        'use_web_search': use_web_search,
        'use_hybrid': use_hybrid
    }
    
    response = requests.post(url, headers=headers, json=payload, stream=True)
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = json.loads(line[6:])
                
                if 'content' in data:
                    print(data['content'], end='', flush=True)
                
                if data.get('done'):
                    print('\n完成')
                    if 'sources' in data:
                        print('来源:', data['sources'])
                    break
                    
                if 'error' in data:
                    print(f'\n错误: {data["error"]}')
                    break

# 使用示例
token = "your_token_here"

# 默认模式
stream_chat('什么是RAG？', token)

# 互联网搜索模式
stream_chat('Python最新版本是什么？', token, use_web_search=True)

# 混合搜索模式
stream_chat('RAG技术的最新发展', token, use_hybrid=True)
```

**JavaScript 示例（Fetch API）**
```javascript
async function streamChat(question, token, options = {}) {
  const { use_web_search = false, use_hybrid = false } = options;
  
  const response = await fetch('http://localhost:8000/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question,
      use_web_search,
      use_hybrid
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.content) {
          fullAnswer += data.content;
          console.log(data.content);
        }
        
        if (data.done) {
          console.log('\n完成');
          if (data.sources) {
            console.log('来源:', data.sources);
          }
          return fullAnswer;
        }
        
        if (data.error) {
          console.error('错误:', data.error);
          return;
        }
      }
    }
  }
}

// 使用示例
const token = 'your_token_here';

// 默认模式
streamChat('什么是RAG？', token);

// 互联网搜索模式
streamChat('Python最新版本是什么？', token, { use_web_search: true });

// 混合搜索模式
streamChat('RAG技术的最新发展', token, { use_hybrid: true });
```

**JavaScript 示例（EventSource - 仅支持 GET）**
```javascript
// 注意：标准 EventSource 只支持 GET 请求
// 对于 POST 请求，请使用上面的 Fetch API 示例

// 如果后端提供 GET 接口，可以这样使用：
const eventSource = new EventSource(
  'http://localhost:8000/chat/stream?question=' + 
  encodeURIComponent('什么是RAG？')
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.content) {
    console.log(data.content);
  }
  
  if (data.done) {
    console.log('完成');
    eventSource.close();
  }
  
  if (data.error) {
    console.error('错误:', data.error);
    eventSource.close();
  }
};

eventSource.onerror = (error) => {
  console.error('连接错误:', error);
  eventSource.close();
};
```

**React 示例**
```typescript
import { useState } from 'react';

interface StreamOptions {
  use_web_search?: boolean;
  use_hybrid?: boolean;
}

function ChatComponent() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const token = 'your_token_here'; // 从登录接口获取

  const sendQuestion = async (
    question: string, 
    options: StreamOptions = {}
  ) => {
    setLoading(true);
    setAnswer('');
    setSources([]);

    try {
      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          use_web_search: options.use_web_search || false,
          use_hybrid: options.use_hybrid || false
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.content) {
              fullAnswer += data.content;
              setAnswer(fullAnswer);
            }
            
            if (data.done) {
              setLoading(false);
              if (data.sources) {
                setSources(data.sources);
              }
              return;
            }
            
            if (data.error) {
              console.error(data.error);
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('发送失败:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => sendQuestion('什么是RAG？')}
        disabled={loading}
      >
        {loading ? '生成中...' : '发送问题'}
      </button>
      <div>{answer}</div>
      {sources.length > 0 && (
        <div>
          <h3>来源：</h3>
          <ul>
            {sources.map((source, index) => (
              <li key={index}>
                {source.type === 'knowledge_base' ? (
                  <span>{source.title} ({source.repo})</span>
                ) : (
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 🔐 错误处理

### 常见错误响应

**401 Unauthorized** - 认证失败
```json
{
  "detail": "未提供认证信息"  // 或 "无效的认证信息" / "用户名或密码错误"
}
```

**400 Bad Request** - 请求参数错误
```json
{
  "detail": "问题不能为空"  // 或其他参数验证错误
}
```

**500 Internal Server Error** - 服务器内部错误
```json
{
  "detail": "生成回答时发生错误"
}
```

**503 Service Unavailable** - 服务不可用
```json
{
  "detail": "模型未就绪，请稍后重试"
}
```

### 错误处理示例

**Python（包含认证）**
```python
import requests

token = "your_token_here"
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}

try:
    response = requests.post(
        'http://localhost:8000/chat',
        headers=headers,
        json={'question': '什么是RAG？'},
        timeout=60
    )
    
    # 处理认证错误
    if response.status_code == 401:
        print('认证失败，请重新登录')
        # 重新登录获取token
        login_response = requests.post(
            'http://localhost:8000/auth/login',
            json={'username': 'admin', 'password': 'admin123'}
        )
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            headers['Authorization'] = f'Bearer {token}'
            # 重试请求
            response = requests.post(
                'http://localhost:8000/chat',
                headers=headers,
                json={'question': '什么是RAG？'},
                timeout=60
            )
    
    response.raise_for_status()
    data = response.json()
    print(data['answer'])
    
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        print('认证失败，请检查token')
    else:
        print(f'HTTP 错误: {e}')
except requests.exceptions.Timeout:
    print('请求超时')
except requests.exceptions.RequestException as e:
    print(f'请求失败: {e}')
```

**JavaScript（包含认证）**
```javascript
let token = 'your_token_here';

async function chatWithRetry(question) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    let response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ question })
    });

    // 处理认证错误，重新登录
    if (response.status === 401) {
      console.log('认证失败，重新登录...');
      const loginResponse = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.access_token;
        headers['Authorization'] = `Bearer ${token}`;
        
        // 重试请求
        response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ question })
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('答案:', data.answer);
    return data;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}

// 使用示例
chatWithRetry('什么是RAG？').catch(console.error);
```

## 🔍 搜索接口说明

### 互联网搜索接口

系统使用 **DuckDuckGo Search API** 进行互联网搜索，通过 `duckduckgo_search` Python 库调用。

**搜索接口特点：**
- 无需 API Key，免费使用
- 支持实时网络搜索
- 返回最多 5 条搜索结果
- 搜索结果包含标题、摘要和链接

**使用方式：**
- 在 `/chat` 或 `/chat/stream` 接口中设置 `use_web_search=true` 启用纯互联网搜索
- 设置 `use_hybrid=true` 启用混合搜索（知识库 + 互联网）

**搜索来源格式：**
```json
{
  "type": "web_search",
  "title": "搜索结果标题",
  "url": "https://example.com/page"
}
```

## 📊 性能优化建议

1. **使用流式接口**：提供更好的用户体验，无需等待完整答案
2. **设置合理超时**：建议至少 60 秒，因为 LLM 生成可能较慢
3. **错误重试**：网络不稳定时实现指数退避重试
4. **缓存结果**：相同问题可以缓存答案，减少 API 调用
5. **合理选择搜索模式**：
   - 知识库相关问题优先使用默认模式（更快）
   - 实时信息使用互联网搜索
   - 需要综合信息时使用混合搜索

## 🔗 相关资源

- **Swagger UI**: http://localhost:8000/docs - 可视化 API 文档
- **ReDoc**: http://localhost:8000/redoc - 另一种文档样式
- **项目 README**: 查看完整项目文档

## 💡 最佳实践

1. **认证管理**：
   - 登录后妥善保存 token，避免频繁登录
   - 实现 token 过期自动刷新机制
   - 在请求失败时检查是否为认证错误，必要时重新登录

2. **搜索模式选择**：
   - 知识库相关问题：使用默认模式（`use_web_search=false`, `use_hybrid=false`）
   - 实时信息查询：使用互联网搜索模式（`use_web_search=true`）
   - 需要综合信息：使用混合搜索模式（`use_hybrid=true`）

3. **始终处理错误**：网络请求可能失败，务必添加错误处理

4. **显示加载状态**：让用户知道系统正在处理

5. **实现取消功能**：允许用户中断长时间运行的请求

6. **流式优先**：优先使用流式接口以提供更好的体验

7. **合理超时**：根据实际情况设置超时时间（建议至少 60 秒）

8. **来源展示**：向用户展示答案来源，提高可信度

## 📝 完整使用流程示例

### Python 完整示例

```python
import requests
import json
import time

class YuqueRAGClient:
    """语雀RAG API客户端"""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.username = None
    
    def login(self, username, password, device_info=None):
        """登录获取token"""
        response = requests.post(
            f'{self.base_url}/auth/login',
            json={
                'username': username,
                'password': password,
                'device_info': device_info or 'Python Client'
            }
        )
        response.raise_for_status()
        data = response.json()
        self.token = data['access_token']
        self.username = data['username']
        print(f"登录成功: {self.username}")
        return self.token
    
    def logout(self):
        """登出"""
        if not self.token:
            return
        try:
            requests.post(
                f'{self.base_url}/auth/logout',
                headers={'Authorization': f'Bearer {self.token}'}
            )
            print("登出成功")
        except:
            pass
        finally:
            self.token = None
            self.username = None
    
    def chat(self, question, use_web_search=False, use_hybrid=False):
        """问答接口（一次性返回）"""
        if not self.token:
            raise ValueError("请先登录")
        
        response = requests.post(
            f'{self.base_url}/chat',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'
            },
            json={
                'question': question,
                'use_web_search': use_web_search,
                'use_hybrid': use_hybrid
            },
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    
    def chat_stream(self, question, use_web_search=False, use_hybrid=False):
        """流式问答接口"""
        if not self.token:
            raise ValueError("请先登录")
        
        response = requests.post(
            f'{self.base_url}/chat/stream',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'
            },
            json={
                'question': question,
                'use_web_search': use_web_search,
                'use_hybrid': use_hybrid
            },
            stream=True,
            timeout=60
        )
        response.raise_for_status()
        
        full_answer = ''
        sources = []
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = json.loads(line[6:])
                    if 'content' in data:
                        full_answer += data['content']
                        print(data['content'], end='', flush=True)
                    if data.get('done'):
                        print('\n')
                        if 'sources' in data:
                            sources = data['sources']
                        break
                    if 'error' in data:
                        raise Exception(data['error'])
        
        return {'answer': full_answer, 'sources': sources}

# 使用示例
if __name__ == '__main__':
    client = YuqueRAGClient()
    
    try:
        # 1. 登录
        client.login('admin', 'admin123')
        
        # 2. 知识库问答
        print("=== 知识库问答 ===")
        result = client.chat('什么是RAG？')
        print(f"答案: {result['answer']}")
        print(f"来源: {result.get('sources', [])}")
        
        # 3. 互联网搜索
        print("\n=== 互联网搜索 ===")
        result = client.chat('Python最新版本是什么？', use_web_search=True)
        print(f"答案: {result['answer']}")
        print(f"来源: {result.get('sources', [])}")
        
        # 4. 混合搜索
        print("\n=== 混合搜索 ===")
        result = client.chat('RAG技术的最新发展', use_hybrid=True)
        print(f"答案: {result['answer']}")
        print(f"来源: {result.get('sources', [])}")
        
        # 5. 流式问答
        print("\n=== 流式问答 ===")
        result = client.chat_stream('解释一下向量数据库')
        print(f"\n完整答案: {result['answer']}")
        print(f"来源: {result['sources']}")
        
    finally:
        # 6. 登出
        client.logout()
```

### JavaScript/TypeScript 完整示例

```typescript
class YuqueRAGClient {
  private baseUrl: string;
  private token: string | null = null;
  private username: string | null = null;

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async login(username: string, password: string, deviceInfo?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        device_info: deviceInfo || 'Browser Client'
      })
    });

    if (!response.ok) {
      throw new Error('登录失败');
    }

    const data = await response.json();
    this.token = data.access_token;
    this.username = data.username;
    console.log(`登录成功: ${this.username}`);
    return this.token;
  }

  async logout(): Promise<void> {
    if (!this.token) return;

    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      console.log('登出成功');
    } catch (e) {
      // 忽略登出错误
    } finally {
      this.token = null;
      this.username = null;
    }
  }

  async chat(
    question: string,
    options: { use_web_search?: boolean; use_hybrid?: boolean } = {}
  ): Promise<{ answer: string; sources?: any[] }> {
    if (!this.token) {
      throw new Error('请先登录');
    }

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        question,
        use_web_search: options.use_web_search || false,
        use_hybrid: options.use_hybrid || false
      })
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    return await response.json();
  }

  async chatStream(
    question: string,
    options: { use_web_search?: boolean; use_hybrid?: boolean } = {},
    onChunk?: (chunk: string) => void
  ): Promise<{ answer: string; sources?: any[] }> {
    if (!this.token) {
      throw new Error('请先登录');
    }

    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        question,
        use_web_search: options.use_web_search || false,
        use_hybrid: options.use_hybrid || false
      })
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';
    let sources: any[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            fullAnswer += data.content;
            onChunk?.(data.content);
          }
          if (data.done) {
            if (data.sources) {
              sources = data.sources;
            }
            return { answer: fullAnswer, sources };
          }
          if (data.error) {
            throw new Error(data.error);
          }
        }
      }
    }

    return { answer: fullAnswer, sources };
  }
}

// 使用示例
async function example() {
  const client = new YuqueRAGClient();

  try {
    // 1. 登录
    await client.login('admin', 'admin123');

    // 2. 知识库问答
    console.log('=== 知识库问答 ===');
    const result1 = await client.chat('什么是RAG？');
    console.log('答案:', result1.answer);
    console.log('来源:', result1.sources);

    // 3. 互联网搜索
    console.log('\n=== 互联网搜索 ===');
    const result2 = await client.chat('Python最新版本是什么？', {
      use_web_search: true
    });
    console.log('答案:', result2.answer);
    console.log('来源:', result2.sources);

    // 4. 流式问答
    console.log('\n=== 流式问答 ===');
    await client.chatStream(
      '解释一下向量数据库',
      {},
      (chunk) => process.stdout.write(chunk)
    );
  } finally {
    // 5. 登出
    await client.logout();
  }
}

example().catch(console.error);
```

## 🎯 实际应用场景

### 场景1：聊天机器人
使用流式接口实时展示回答，提供类似 ChatGPT 的体验。支持知识库检索、互联网搜索和混合搜索模式。

### 场景2：知识库问答
集成到企业知识库系统，提供智能搜索和问答功能。使用默认模式从企业内部知识库检索答案。

### 场景3：文档助手
在文档阅读工具中集成，帮助用户快速理解文档内容。可以结合知识库和互联网信息提供更全面的答案。

### 场景4：API 集成
作为微服务集成到现有系统，提供 AI 问答能力。支持认证机制，可以集成到现有的用户系统中。

### 场景5：实时信息查询
使用互联网搜索模式查询最新信息，如新闻、技术更新、市场动态等。

### 场景6：综合信息检索
使用混合搜索模式，同时从知识库和互联网获取信息，提供更全面的答案。

## 📞 支持与反馈

如有问题或建议，请查看项目 README 或提交 Issue。


