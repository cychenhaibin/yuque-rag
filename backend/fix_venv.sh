#!/bin/bash
# 修复虚拟环境脚本

cd "$(dirname "$0")"

echo "🔧 正在修复虚拟环境..."
echo ""

# 删除旧的虚拟环境
echo "1️⃣ 删除旧的虚拟环境..."
rm -rf venv

# 创建新的虚拟环境
echo "2️⃣ 创建新的虚拟环境..."
python3 -m venv venv

# 升级 pip
echo "3️⃣ 升级 pip..."
./venv/bin/pip install --upgrade pip

# 安装依赖
echo "4️⃣ 安装依赖包..."
./venv/bin/pip install -r requirements.txt

echo ""
echo "✅ 虚拟环境修复完成！"
echo ""
echo "现在可以运行："
echo "  ./run_server.sh      - 启动 FastAPI 服务"
echo "  ./run_app.sh         - 运行命令行问答"
echo "  ./run_webui.sh       - 运行 Streamlit 调试页面"
echo ""



