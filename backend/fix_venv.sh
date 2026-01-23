#!/bin/bash
# 修复虚拟环境路径问题（移动目录后使用）

cd "$(dirname "$0")"

echo "🔧 正在修复虚拟环境路径问题..."
echo ""

# 检查 Python3 是否可用
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3，请先安装 Python 3"
    exit 1
fi

echo "📦 Python 版本: $(python3 --version)"
echo ""

# 备份旧的虚拟环境（可选）
if [ -d "venv" ]; then
    echo "🗑️  删除旧的虚拟环境..."
    rm -rf venv
fi

# 创建新的虚拟环境
echo "✨ 创建新的虚拟环境..."
python3 -m venv venv

# 激活虚拟环境
echo "🔌 激活虚拟环境..."
source venv/bin/activate

# 升级 pip
echo "⬆️  升级 pip..."
pip install --upgrade pip

# 安装依赖
echo "📥 安装依赖包..."
pip install -r requirements.txt

echo ""
echo "✅ 虚拟环境修复完成！"
echo ""
echo "现在可以运行："
echo "  ./run_server.sh      - 运行 FastAPI 服务"
echo "  ./run_app.sh         - 运行命令行问答"
echo "  ./run_webui.sh       - 运行 Streamlit 调试页面"


