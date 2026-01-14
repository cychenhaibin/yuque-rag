#!/bin/bash
# 激活本地虚拟环境

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 输出提示信息
echo "🚀 激活本地 Python 虚拟环境..."
echo ""
echo "📁 项目目录: $(pwd)"
echo "🐍 Python 版本: $(./venv/bin/python --version)"
echo ""
echo "✅ 环境已激活！"
echo ""
echo "运行应用："
echo "  ./run_app.sh         - 运行命令行问答"
echo "  ./run_server.sh      - 运行 FastAPI 服务"
echo "  ./run_webui.sh       - 运行 Streamlit 调试页面"
echo ""
echo "或直接使用："
echo "  ./venv/bin/python app.py"
echo ""

# 如果在支持的 shell 中运行，则激活虚拟环境
if [ -n "$BASH_VERSION" ] || [ -n "$ZSH_VERSION" ]; then
    source venv/bin/activate
    export PS1="(yuque-rag) $PS1"
fi


