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
async def auth_login(username: str, password: str, device_info: str = "MCP Client") -> list[TextContent]:
    """
    使用用户名和密码登录 RAG 系统，获取访问 token。
    
    该工具用于认证用户并获取 JWT token，用于后续需要认证的接口调用。
    
    参数说明:
        username (str): 用户名（必填）。
        password (str): 密码（必填）。
        device_info (str, optional): 设备信息，默认为 "MCP Client"。
    
    返回值:
        str: 包含 access_token、token_type、username 和 expires_in 的认证信息。
    
    示例用法:
        auth_login(username="admin", password="admin123")
        auth_login(username="admin", password="admin123", device_info="My Device")
    
    默认测试账号:
        - 用户名: admin, 密码: admin123
        - 用户名: user1, 密码: password123
        - 用户名: test, 密码: test123
    
    注意事项:
        - 单设备登录机制：一个账号同时只能在一台设备登录
        - 新设备登录会使旧设备的 token 失效
        - 请妥善保存返回的 access_token，用于后续接口调用
    """
    # 获取请求对象
    request: Request = get_http_request()
    backend_url = request.headers.get("BACKEND_BASE_URL") or BACKEND_BASE_URL
    
    url = f"{backend_url}/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "username": username,
        "password": password,
        "device_info": device_info
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            result_text = f"""登录成功！
用户名: {data.get('username')}
Token 类型: {data.get('token_type')}
访问令牌: {data.get('access_token')}
过期时间: {data.get('expires_in')} 秒

请保存此 token 用于后续接口调用。
在调用需要认证的接口时，请在请求头中添加：
Authorization: Bearer {data.get('access_token')}
"""
            return [TextContent(type="text", text=result_text)]
        elif response.status_code == 401:
            return [TextContent(type="text", text="登录失败：用户名或密码错误")]
        else:
            return [TextContent(type="text", text=f"登录失败，状态码: {response.status_code}，信息: {response.text}")]
    except Exception as e:
        return [TextContent(type="text", text=f"请求异常: {str(e)}")]
