import os
import requests
from mcp.types import TextContent
from dotenv import load_dotenv
from mcp_instance import mcp
from fastmcp.server.dependencies import get_http_request
from starlette.requests import Request

load_dotenv()

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

@mcp.tool()
async def chat(question: str, token: str = "", use_web_search: bool = False, use_hybrid: bool = False) -> list[TextContent]:
    """
    向 RAG 系统提问并获取完整答案（一次性返回，非流式）。
    
    该工具支持三种搜索模式：
    1. 默认模式：仅从知识库检索（use_web_search=False, use_hybrid=False）
    2. 互联网搜索模式：仅使用互联网搜索（use_web_search=True）
    3. 混合搜索模式：同时使用知识库和互联网（use_hybrid=True）
    
    参数说明:
        question (str): 用户提出的问题（必填）。
        token (str, optional): 访问令牌，默认从请求头中获取。
        use_web_search (bool, optional): 是否使用互联网搜索（DuckDuckGo），默认为 False。
        use_hybrid (bool, optional): 是否混合搜索（知识库+互联网），默认为 False。
    
    返回值:
        str: 包含生成的答案和来源列表的完整响应。
    
    示例用法:
        # 知识库检索
        chat(question="什么是RAG？", token="your_token")
        
        # 互联网搜索
        chat(question="Python最新版本是什么？", token="your_token", use_web_search=True)
        
        # 混合搜索
        chat(question="RAG技术的最新发展", token="your_token", use_hybrid=True)
    
    注意事项:
        - 需要有效的 token 才能使用
        - use_web_search 和 use_hybrid 不能同时为 True
        - 返回结果包含答案和最多 5 个来源
        - 来源类型包括：knowledge_base（知识库）和 web_search（互联网搜索）
    """
    # 获取请求对象
    request: Request = get_http_request()
    backend_url = request.headers.get("BACKEND_BASE_URL") or BACKEND_BASE_URL
    token = token or request.headers.get("BACKEND_TOKEN", "")
    
    if not token:
        return [TextContent(type="text", text="缺少访问令牌（token）参数，请先使用 auth_login 登录获取 token，或在请求头中设置 BACKEND_TOKEN。")]
    
    if not question or not question.strip():
        return [TextContent(type="text", text="问题不能为空，请提供有效的问题。")]
    
    url = f"{backend_url}/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "question": question.strip(),
        "use_web_search": use_web_search,
        "use_hybrid": use_hybrid
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        if response.status_code == 200:
            data = response.json()
            
            # 格式化答案
            result_text = f"【答案】\n{data.get('answer', '未生成答案')}\n\n"
            
            # 格式化来源
            sources = data.get('sources', [])
            if sources:
                result_text += "【来源】\n"
                for i, source in enumerate(sources, 1):
                    source_type = source.get('type', 'unknown')
                    title = source.get('title', '未知标题')
                    
                    if source_type == 'knowledge_base':
                        repo = source.get('repo', '未知知识库')
                        result_text += f"{i}. [知识库] {title} (来自: {repo})\n"
                    elif source_type == 'web_search':
                        url_link = source.get('url', '')
                        result_text += f"{i}. [网络搜索] {title}\n   链接: {url_link}\n"
                    else:
                        result_text += f"{i}. {title}\n"
            else:
                result_text += "【来源】无来源信息\n"
            
            return [TextContent(type="text", text=result_text)]
        elif response.status_code == 401:
            return [TextContent(type="text", text="认证失败：无效的认证信息或 token 已过期，请重新登录。")]
        else:
            return [TextContent(type="text", text=f"问答请求失败，状态码: {response.status_code}，信息: {response.text}")]
    except requests.exceptions.Timeout:
        return [TextContent(type="text", text="请求超时：生成答案时间过长，请稍后重试。")]
    except Exception as e:
        return [TextContent(type="text", text=f"请求异常: {str(e)}")]
