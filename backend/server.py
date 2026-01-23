# server.py

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from app import initialize_retriever_and_llm
import json
from typing import AsyncGenerator, Optional, List, Dict
from auth.auth import AuthService, get_current_user, user_manager
from tools.web_search import WebSearchTool

# 初始化 RAG 模型
retriever, llm = initialize_retriever_and_llm()

# 初始化网络搜索工具
web_search_tool = WebSearchTool(max_results=5)

# 创建 FastAPI 应用，配置 Swagger 文档
app = FastAPI(
    title="语雀 RAG 问答系统 API",
    description="""
    基于语雀知识库的 RAG（检索增强生成）问答系统。
    
    ## 功能特性
    - 📚 知识库检索问答
    - 🔄 流式响应支持
    - 🤖 支持本地/远程大模型
    - 🔍 两阶段检索（向量 + 重排序）
    
    ## 使用说明
    1. 使用 `/chat` 接口进行常规问答（一次性返回）
    2. 使用 `/chat/stream` 接口获取流式响应（实时打字效果）
    3. 使用 `/health` 接口检查系统健康状态
    """,
    version="1.0.0",
    contact={
        "name": "Yuque RAG Project",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)

# 允许跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== 数据模型 ==============

class LoginRequest(BaseModel):
    """登录请求模型"""
    username: str = Field(..., description="用户名", example="admin")
    password: str = Field(..., description="密码", example="admin123")
    device_info: Optional[str] = Field(None, description="设备信息（可选）", example="Chrome on Windows")

class LoginResponse(BaseModel):
    """登录响应模型"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(..., description="令牌类型", example="bearer")
    username: str = Field(..., description="用户名")
    expires_in: int = Field(..., description="过期时间（秒）")

class LogoutResponse(BaseModel):
    """登出响应模型"""
    message: str = Field(..., description="响应消息", example="登出成功")

class QueryRequest(BaseModel):
    """问答请求模型"""
    question: str = Field(
        ..., 
        description="用户提出的问题",
        example="四月语雀有哪些更新？"
    )
    use_web_search: bool = Field(
        False,
        description="是否使用互联网搜索",
        example=False
    )
    use_hybrid: bool = Field(
        False,
        description="是否混合搜索（知识库+互联网）",
        example=False
    )

class SourceItem(BaseModel):
    """来源项模型"""
    type: str = Field(..., description="来源类型", example="knowledge_base")
    title: str = Field(..., description="标题", example="语雀更新日志")
    url: Optional[str] = Field(None, description="URL（互联网搜索时使用）")
    repo: Optional[str] = Field(None, description="知识库名称（知识库检索时使用）")

class ChatResponse(BaseModel):
    """问答响应模型"""
    answer: str = Field(
        ..., 
        description="系统生成的回答",
        example="四月语雀的更新包括新增了团队协作功能，优化了文档编辑体验，以及增强了安全策略。"
    )
    sources: Optional[List[SourceItem]] = Field(
        None,
        description="答案来源列表",
        example=[
            {"type": "knowledge_base", "title": "语雀更新日志", "repo": "产品文档"}
        ]
    )

class HealthResponse(BaseModel):
    """健康检查响应模型"""
    status: str = Field(..., description="服务状态", example="ok")
    message: str = Field(..., description="状态信息", example="系统运行正常")


# ============== API 接口 ==============

# ============== 认证接口 ==============

@app.post(
    "/auth/login",
    response_model=LoginResponse,
    tags=["认证"],
    summary="用户登录",
    description="使用用户名和密码登录系统。一个账号同时只能在一台设备登录，新设备登录会使旧设备的登录失效。"
)
def login(req: LoginRequest):
    """
    用户登录接口
    
    **默认测试账号：**
    - 用户名: `admin`, 密码: `admin123`
    - 用户名: `user1`, 密码: `password123`
    - 用户名: `test`, 密码: `test123`
    
    **单设备登录机制：**
    - 每次登录会生成新的token
    - 新token会自动使旧token失效
    - 其他设备的旧token将无法继续使用
    
    Args:
        req: 包含用户名、密码和设备信息的请求体
        
    Returns:
        LoginResponse: 包含access_token和用户信息
        
    Raises:
        HTTPException 401: 用户名或密码错误
    """
    try:
        result = AuthService.login(
            username=req.username,
            password=req.password,
            device_info=req.device_info or ""
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")


@app.post(
    "/auth/logout",
    response_model=LogoutResponse,
    tags=["认证"],
    summary="用户登出",
    description="登出当前用户，使token失效"
)
def logout(current_user: str = Depends(get_current_user)):
    """
    用户登出接口
    
    需要在请求头中携带有效的token：
    ```
    Authorization: Bearer <your_token>
    ```
    
    Args:
        current_user: 当前认证的用户名（自动注入）
        
    Returns:
        LogoutResponse: 登出成功消息
    """
    try:
        AuthService.logout(current_user)
        return {"message": f"用户 {current_user} 已登出"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登出失败: {str(e)}")


@app.get(
    "/auth/me",
    tags=["认证"],
    summary="获取当前用户信息",
    description="获取当前登录用户的信息"
)
def get_me(current_user: str = Depends(get_current_user)):
    """
    获取当前用户信息
    
    需要在请求头中携带有效的token：
    ```
    Authorization: Bearer <your_token>
    ```
    
    Args:
        current_user: 当前认证的用户名（自动注入）
        
    Returns:
        用户信息
    """
    return {
        "username": current_user,
        "message": "认证成功"
    }


# ============== 系统接口 ==============

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["系统"],
    summary="健康检查",
    description="检查系统运行状态"
)
def health_check():
    """
    健康检查接口，用于监控系统状态。
    
    Returns:
        HealthResponse: 包含系统状态信息
    """
    return {
        "status": "ok",
        "message": "系统运行正常"
    }


@app.post(
    "/chat",
    response_model=ChatResponse,
    tags=["问答"],
    summary="问答接口（一次性返回）",
    description="向系统提问并获取完整答案（非流式）【需要登录】"
)
def chat(req: QueryRequest, current_user: str = Depends(get_current_user)):
    """
    常规问答接口，返回完整的答案。
    
    **需要认证：** 请在请求头中携带token
    ```
    Authorization: Bearer <your_token>
    ```
    
    Args:
        req: 包含用户问题的请求体
        current_user: 当前认证的用户名（自动注入）
        
    Returns:
        ChatResponse: 包含生成的答案
        
    Example:
        ```json
        POST /chat
        {
            "question": "什么是RAG？"
        }
        ```
    """
    query = req.question.strip()
    if not query:
        return {"answer": "❗请输入问题", "sources": []}

    sources: List[Dict[str, str]] = []
    
    # 根据参数决定搜索模式
    if req.use_web_search:
        # 纯互联网搜索模式
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            web_results = list(ddgs.text(query, max_results=5))
        
        # 收集互联网搜索来源
        for result in web_results:
            sources.append({
                "type": "web_search",
                "title": result.get('title', '未知标题'),
                "url": result.get('href', '')
            })
        
        # 格式化搜索结果
        web_context = f"🔍 互联网搜索结果（共 {len(web_results)} 条）：\n\n"
        for i, result in enumerate(web_results, 1):
            web_context += f"【{i}】{result['title']}\n"
            web_context += f"📄 {result['body']}\n"
            web_context += f"🔗 来源: {result['href']}\n\n"
        
        context = web_context
        prompt = f"根据以下互联网搜索结果回答问题：\n\n{context}\n\n问题：{query}\n\n请用中文简洁地总结回答："
        
    elif req.use_hybrid:
        # 混合搜索模式（知识库 + 互联网）
        # 检索知识库
        relevant_docs = retriever.invoke(query)
        kb_context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        # 收集知识库来源
        seen_titles = set()
        for doc in relevant_docs:
            title = doc.metadata.get("title", "未知文档")
            # 去重：同一标题只显示一次
            if title not in seen_titles:
                seen_titles.add(title)
                sources.append({
                    "type": "knowledge_base",
                    "title": title,
                    "repo": doc.metadata.get("repo", "未知知识库")
                })
        
        # 互联网搜索
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            web_results = list(ddgs.text(query, max_results=5))
        
        # 收集互联网搜索来源
        for result in web_results:
            sources.append({
                "type": "web_search",
                "title": result.get('title', '未知标题'),
                "url": result.get('href', '')
            })
        
        # 格式化搜索结果
        web_context = f"🔍 互联网搜索结果（共 {len(web_results)} 条）：\n\n"
        for i, result in enumerate(web_results, 1):
            web_context += f"【{i}】{result['title']}\n"
            web_context += f"📄 {result['body']}\n"
            web_context += f"🔗 来源: {result['href']}\n\n"
        
        # 合并两种来源
        prompt = f"""请根据以下信息回答问题：

【知识库内容】
{kb_context}

【互联网搜索结果】
{web_context}

问题：{query}

请综合以上信息用中文回答："""
        
    else:
        # 默认模式：知识库检索
        relevant_docs = retriever.invoke(query)
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        prompt = f"根据以下内容回答问题：\n\n{context}\n\n问题：{query}\n\n回答："
        
        # 收集知识库来源（去重）
        seen_titles = set()
        for doc in relevant_docs:
            title = doc.metadata.get("title", "未知文档")
            if title not in seen_titles:
                seen_titles.add(title)
                sources.append({
                    "type": "knowledge_base",
                    "title": title,
                    "repo": doc.metadata.get("repo", "未知知识库")
                })
    
    # 限制来源数量（最多5个）
    sources = sources[:5]
    
    answer = llm.generate(prompt)

    return {"answer": answer, "sources": sources if sources else None}


@app.post(
    "/chat/stream",
    tags=["问答"],
    summary="问答接口（流式返回）",
    description="向系统提问并获取流式答案（SSE格式，支持实时打字效果）【需要登录】",
    responses={
        200: {
            "description": "成功返回流式数据",
            "content": {
                "text/event-stream": {
                    "example": "data: {\"content\": \"你\"}\n\ndata: {\"content\": \"好\"}\n\n"
                }
            }
        }
    }
)
async def chat_stream(req: QueryRequest, current_user: str = Depends(get_current_user)):
    """
    流式问答接口，使用 Server-Sent Events (SSE) 返回答案。
    
    适用于需要实时展示回答进度的场景（如前端打字机效果）。
    
    **需要认证：** 请在请求头中携带token
    ```
    Authorization: Bearer <your_token>
    ```
    
    Args:
        req: 包含用户问题的请求体
        current_user: 当前认证的用户名（自动注入）
        
    Returns:
        StreamingResponse: SSE 格式的流式响应
        
    Example:
        ```javascript
        const eventSource = new EventSource('/chat/stream', {
            method: 'POST',
            body: JSON.stringify({question: '什么是RAG？'})
        });
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data.content); // 逐字输出
        };
        ```
    """
    query = req.question.strip()
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        if not query:
            yield f"data: {json.dumps({'content': '❗请输入问题', 'done': True}, ensure_ascii=False)}\n\n"
            return
        
        try:
            sources: List[Dict[str, str]] = []
            context = ""
            prompt = ""
            
            # 根据参数决定搜索模式
            if req.use_web_search:
                # 纯互联网搜索模式
                from duckduckgo_search import DDGS
                with DDGS() as ddgs:
                    web_results = list(ddgs.text(query, max_results=5))
                
                # 收集互联网搜索来源
                for result in web_results:
                    sources.append({
                        "type": "web_search",
                        "title": result.get('title', '未知标题'),
                        "url": result.get('href', '')
                    })
                
                # 格式化搜索结果
                web_context = f"🔍 互联网搜索结果（共 {len(web_results)} 条）：\n\n"
                for i, result in enumerate(web_results, 1):
                    web_context += f"【{i}】{result['title']}\n"
                    web_context += f"📄 {result['body']}\n"
                    web_context += f"🔗 来源: {result['href']}\n\n"
                
                context = web_context
                prompt = f"根据以下互联网搜索结果回答问题：\n\n{context}\n\n问题：{query}\n\n请用中文简洁地总结回答："
                
            elif req.use_hybrid:
                # 混合搜索模式（知识库 + 互联网）
                # 检索知识库
                relevant_docs = retriever.invoke(query)
                kb_context = "\n\n".join([doc.page_content for doc in relevant_docs])
                
                # 收集知识库来源
                seen_titles = set()
                for doc in relevant_docs:
                    title = doc.metadata.get("title", "未知文档")
                    # 去重：同一标题只显示一次
                    if title not in seen_titles:
                        seen_titles.add(title)
                        sources.append({
                            "type": "knowledge_base",
                            "title": title,
                            "repo": doc.metadata.get("repo", "未知知识库")
                        })
                
                # 互联网搜索
                from duckduckgo_search import DDGS
                with DDGS() as ddgs:
                    web_results = list(ddgs.text(query, max_results=5))
                
                # 收集互联网搜索来源
                for result in web_results:
                    sources.append({
                        "type": "web_search",
                        "title": result.get('title', '未知标题'),
                        "url": result.get('href', '')
                    })
                
                # 格式化搜索结果
                web_context = f"🔍 互联网搜索结果（共 {len(web_results)} 条）：\n\n"
                for i, result in enumerate(web_results, 1):
                    web_context += f"【{i}】{result['title']}\n"
                    web_context += f"📄 {result['body']}\n"
                    web_context += f"🔗 来源: {result['href']}\n\n"
                
                # 合并两种来源
                prompt = f"""请根据以下信息回答问题：

【知识库内容】
{kb_context}

【互联网搜索结果】
{web_context}

问题：{query}

请综合以上信息用中文回答："""
                
            else:
                # 默认模式：知识库检索
                relevant_docs = retriever.invoke(query)
                context = "\n\n".join([doc.page_content for doc in relevant_docs])
                prompt = f"根据以下内容回答问题：\n\n{context}\n\n问题：{query}\n\n回答："
                
                # 收集知识库来源（去重）
                seen_titles = set()
                for doc in relevant_docs:
                    title = doc.metadata.get("title", "未知文档")
                    if title not in seen_titles:
                        seen_titles.add(title)
                        sources.append({
                            "type": "knowledge_base",
                            "title": title,
                            "repo": doc.metadata.get("repo", "未知知识库")
                        })
            
            # 限制来源数量（最多5个）
            sources = sources[:5]
            
            # 流式生成答案
            for chunk in llm.generate_stream(prompt):
                yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            
            # 发送完成标记和来源信息
            yield f"data: {json.dumps({'done': True, 'sources': sources}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # 禁用nginx缓冲
        }
    )
