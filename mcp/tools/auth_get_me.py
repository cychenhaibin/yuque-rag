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
async def auth_get_me(token: str = "") -> list[TextContent]:
    """
    获取当前登录用户的信息。
    
    该工具用于验证 token 是否有效，并获取当前认证用户的基本信息。
    
    参数说明:
        token (str, optional): 访问令牌，默认从请求头中获取。
    
    返回值:
        str: 包含用户名和认证状态的信息。
    
    示例用法:
        auth_get_me(token="your_access_token_here")
    
    注意事项:
        - 需要有效的 token 才能获取用户信息
        - 如果未提供 token，将尝试从请求头的 BACKEND_TOKEN 中获取
        - 可以用此接口验证 token 是否有效
    """
    # 获取请求对象
    request: Request = get_http_request()
    backend_url = request.headers.get("BACKEND_BASE_URL") or BACKEND_BASE_URL
    token = token or request.headers.get("BACKEND_TOKEN", "")
    
    if not token:
        return [TextContent(type="text", text="缺少访问令牌（token）参数，请提供 token 或在请求头中设置 BACKEND_TOKEN。")]
    
    url = f"{backend_url}/auth/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            result_text = f"认证成功！\n用户名: {data.get('username')}\n状态: {data.get('message', '认证有效')}"
            return [TextContent(type="text", text=result_text)]
        elif response.status_code == 401:
            return [TextContent(type="text", text="认证失败：无效的认证信息或 token 已过期")]
        else:
            return [TextContent(type="text", text=f"获取用户信息失败，状态码: {response.status_code}，信息: {response.text}")]
    except Exception as e:
        return [TextContent(type="text", text=f"请求异常: {str(e)}")]
