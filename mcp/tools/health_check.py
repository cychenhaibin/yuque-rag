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
async def health_check() -> list[TextContent]:
    """
    检查 RAG 后端系统运行状态。
    
    该工具用于检查语雀 RAG 问答系统后端服务是否正常运行。
    无需认证即可访问。
    
    返回值:
        str: 系统状态信息，包含状态码和消息。
    
    示例用法:
        health_check()
    
    注意事项:
        - 此接口无需认证
        - 返回 "ok" 表示系统运行正常
    """
    # 获取请求对象，从请求头读取可能的自定义后端地址
    request: Request = get_http_request()
    backend_url = request.headers.get("BACKEND_BASE_URL") or BACKEND_BASE_URL
    
    url = f"{backend_url}/health"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            result_text = f"系统状态: {data.get('status', 'unknown')}\n消息: {data.get('message', 'N/A')}"
            return [TextContent(type="text", text=result_text)]
        else:
            return [TextContent(type="text", text=f"健康检查失败，状态码: {response.status_code}，信息: {response.text}")]
    except Exception as e:
        return [TextContent(type="text", text=f"请求异常: {str(e)}")]
