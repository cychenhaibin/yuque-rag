#!/bin/bash
# MCP 服务器依赖安装脚本（Python 3.11）

echo "======================================"
echo "MCP 服务器依赖安装（Python 3.11）"
echo "======================================"
echo ""

# 检查 Python 3.11
echo "检查 Python 3.11..."
if ! command -v python3.11 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3.11"
    echo "请先安装 Python 3.11"
    exit 1
fi

PYTHON_VERSION=$(python3.11 --version 2>&1 | awk '{print $2}')
echo "✓ Python 版本: $PYTHON_VERSION"
echo ""

# 升级 pip
echo "升级 pip..."
python3.11 -m pip install --upgrade pip --user
echo ""

# 安装依赖
echo "安装 MCP 服务器依赖..."
python3.11 -m pip install -r requirements-mcp.txt --user

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✓ 安装完成！"
    echo "======================================"
    echo ""
    echo "验证安装..."
    python3.11 -c "import fastmcp; print('✓ FastMCP 版本:', fastmcp.__version__)"
    python3.11 -c "import starlette; print('✓ Starlette 已安装')"
    python3.11 -c "import requests; print('✓ Requests 已安装')"
    python3.11 -c "import dotenv; print('✓ Python-dotenv 已安装')"
    echo ""
    echo "现在可以启动 MCP 服务器了："
    echo "  python3.11 server.py"
    echo ""
    echo "或者使用启动脚本："
    echo "  ./run_mcp.sh"
    echo ""
else
    echo ""
    echo "======================================"
    echo "❌ 安装失败"
    echo "======================================"
    echo ""
    echo "请检查错误信息并重试"
    exit 1
fi
