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
async def auth_logout(token: str = "") -> list[TextContent]:
    """
    登出当前用户，使 token 失效。
    
    该工具用于安全登出，使当前 token 失效，防止未授权访问。
    
    参数说明:
        token (str, optional): 访问令牌，默认从请求头中获取。
    
    返回值:
        str: 登出结果消息。
    
    示例用法:
        auth_logout(token="your_access_token_here")
    
    注意事项:
        - 需要有效的 token 才能登出
        - 登出后 token 将失效，无法再用于访问需要认证的接口
        - 如果未提供 token，将尝试从请求头的 BACKEND_TOKEN 中获取
    """
    # 获取请求对象
    request: Request = get_http_request()
    backend_url = request.headers.get("BACKEND_BASE_URL") or BACKEND_BASE_URL
    token = token or request.headers.get("BACKEND_TOKEN", "")
    
    if not token:
        return [TextContent(type="text", text="缺少访问令牌（token）参数，请提供 token 或在请求头中设置 BACKEND_TOKEN。")]
    
    url = f"{backend_url}/auth/logout"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return [TextContent(type="text", text=f"登出成功: {data.get('message', '用户已登出')}")]
        elif response.status_code == 401:
            return [TextContent(type="text", text="登出失败：无效的认证信息或 token 已过期")]
        else:
            return [TextContent(type="text", text=f"登出失败，状态码: {response.status_code}，信息: {response.text}")]
    except Exception as e:
        return [TextContent(type="text", text=f"请求异常: {str(e)}")]
