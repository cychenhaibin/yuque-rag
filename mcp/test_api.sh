#!/bin/bash
# MCP API 测试脚本

echo "======================================"
echo "MCP API 测试"
echo "======================================"
echo ""

MCP_URL="http://localhost:8001"
BACKEND_URL="http://localhost:8000"

# 测试 1: 检查 MCP 服务是否运行
echo "1. 测试 MCP 服务..."
curl -s "${MCP_URL}/mcp" -o /dev/null -w "HTTP %{http_code}\n" || echo "❌ MCP 服务未运行"
echo ""

# 测试 2: 检查后端服务
echo "2. 测试后端健康检查..."
curl -s "${BACKEND_URL}/health" | python3 -m json.tool 2>/dev/null || echo "❌ 后端服务未运行"
echo ""

# 测试 3: 通过 MCP 调用 health_check
echo "3. 通过 MCP 调用 health_check 工具..."
curl -X POST "${MCP_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "BACKEND_BASE_URL: ${BACKEND_URL}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "health_check",
      "arguments": {}
    },
    "id": 1
  }' | python3 -m json.tool 2>/dev/null
echo ""

# 测试 4: 获取可用工具列表
echo "4. 获取 MCP 可用工具列表..."
curl -X POST "${MCP_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }' | python3 -m json.tool 2>/dev/null | head -50
echo ""

echo "======================================"
echo "测试完成！"
echo "======================================"
