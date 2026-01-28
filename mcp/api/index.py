"""
Vercel 部署入口文件
适配 FastMCP 到 Vercel 的 Python 运行时
"""

import sys
import os
from pathlib import Path
import json
from http.server import BaseHTTPRequestHandler

# 添加父目录到路径，以便导入模块
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

# 导入 MCP 实例和工具加载函数
from mcp_instance import mcp
from server import load_all_modules_from_directory

# 确保工具已加载（只加载一次）
_tools_loaded = False

def ensure_tools_loaded():
    """确保工具模块已加载"""
    global _tools_loaded
    if not _tools_loaded:
        # 切换到父目录以正确加载工具
        original_cwd = os.getcwd()
        try:
            os.chdir(parent_dir)
            print("Loading MCP tools...")
            load_all_modules_from_directory()
            _tools_loaded = True
            print("MCP tools loaded successfully")
        finally:
            os.chdir(original_cwd)

# 初始化时加载工具
ensure_tools_loaded()

# FastMCP 基于 Starlette，直接访问其应用
# FastMCP 内部使用 Starlette，我们可以通过其内部属性访问
try:
    # 尝试获取 FastMCP 的 Starlette 应用
    if hasattr(mcp, 'app'):
        app = mcp.app
    elif hasattr(mcp, '_app'):
        app = mcp._app
    else:
        # 如果无法直接访问，创建一个简单的包装器
        app = None
except:
    app = None


class handler(BaseHTTPRequestHandler):
    """Vercel HTTP 请求处理器"""
    
    def log_message(self, format, *args):
        """重写日志方法，避免输出到 stderr"""
        pass
    
    def do_GET(self):
        """处理 GET 请求"""
        self._handle_request()
    
    def do_POST(self):
        """处理 POST 请求"""
        self._handle_request()
    
    def do_PUT(self):
        """处理 PUT 请求"""
        self._handle_request()
    
    def do_DELETE(self):
        """处理 DELETE 请求"""
        self._handle_request()
    
    def do_OPTIONS(self):
        """处理 OPTIONS 请求（CORS 预检）"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, BACKEND_BASE_URL, BACKEND_TOKEN')
        self.send_header('Access-Control-Max-Age', '3600')
        self.end_headers()
    
    def _handle_request(self):
        """处理 HTTP 请求"""
        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b''
            
            # 如果无法访问 ASGI 应用，使用 FastMCP 的 HTTP 处理
            if app is None:
                # 使用 FastMCP 的 run 方法处理请求
                # 但 Vercel 需要同步响应，所以我们需要一个不同的方法
                # 创建一个简单的 HTTP 端点来处理 MCP 请求
                self._handle_mcp_request(body)
                return
            
            # 构建 ASGI scope
            query_string = self.path.split('?', 1)[1] if '?' in self.path else ''
            path_info = self.path.split('?')[0]
            
            scope = {
                'type': 'http',
                'method': self.command,
                'path': path_info,
                'query_string': query_string.encode(),
                'headers': [(k.lower().encode(), v.encode()) for k, v in self.headers.items()],
                'server': (self.headers.get('Host', 'localhost').split(':')[0], 443),
                'client': None,
                'scheme': 'https',
                'root_path': '',
                'app': app,
            }
            
            # 使用 asyncio 运行 ASGI 应用
            import asyncio
            
            # 创建异步响应容器
            response_data = {'status': 200, 'headers': [], 'body': b''}
            
            async def receive():
                """ASGI receive 函数"""
                return {
                    'type': 'http.request',
                    'body': body,
                    'more_body': False
                }
            
            async def send(message):
                """ASGI send 函数"""
                if message['type'] == 'http.response.start':
                    response_data['status'] = message['status']
                    response_data['headers'] = message.get('headers', [])
                elif message['type'] == 'http.response.body':
                    response_data['body'] += message.get('body', b'')
            
            # 运行异步应用
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            loop.run_until_complete(app(scope, receive, send))
            
            # 发送响应
            self.send_response(response_data['status'])
            
            # 设置响应头
            for header_name, header_value in response_data['headers']:
                if isinstance(header_name, bytes):
                    header_name = header_name.decode()
                if isinstance(header_value, bytes):
                    header_value = header_value.decode()
                self.send_header(header_name, header_value)
            
            # 添加 CORS 头
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, BACKEND_BASE_URL, BACKEND_TOKEN')
            
            self.end_headers()
            self.wfile.write(response_data['body'])
            
        except Exception as e:
            # 错误处理
            error_msg = str(e)
            import traceback
            traceback.print_exc()
            print(f"Error handling request: {error_msg}", file=sys.stderr)
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'error': 'Internal Server Error',
                'message': error_msg
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
    
    def _handle_mcp_request(self, body):
        """处理 MCP 请求（备用方法）"""
        # 这是一个简化的处理方式，主要用于健康检查等简单端点
        if self.path == '/health' or self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'service': 'yuque-mcp',
                'status': 'running',
                'version': '1.0.0'
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'error': 'Not Found',
                'message': 'MCP endpoint not available in this deployment mode'
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
