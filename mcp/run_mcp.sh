#!/bin/bash
# MCP 服务器启动脚本（使用 Python 3.11）

echo "启动 MCP 服务器..."
echo ""

# 检查 Python 3.11
if ! command -v python3.11 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3.11"
    echo "请使用以下命令安装依赖："
    echo "  ./install-py311.sh"
    exit 1
fi

# 检查依赖是否安装
python3.11 -c "import fastmcp" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 错误: 依赖未安装"
    echo "请先运行安装脚本："
    echo "  ./install-py311.sh"
    exit 1
fi

echo "✓ 使用 Python 版本: $(python3.11 --version)"
echo ""

# 启动服务器
python3.11 server.py "$@"
