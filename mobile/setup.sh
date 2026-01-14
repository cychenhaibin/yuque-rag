#!/bin/bash

# 语雀 RAG 移动端安装脚本

echo "================================"
echo "语雀 RAG 移动端安装向导"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js (>= 20)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "📦 正在安装依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装完成"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 安装完成！"
echo "================================"
echo ""
echo "运行应用："
echo "  npm start          - 启动 Metro 服务器"
echo "  npm run android    - 运行 Android 应用"
echo ""
echo "测试账号："
echo "  admin / admin123"
echo "  user1 / password123"
echo "  test / test123"
echo ""
echo "后端服务器: https://chester-unplumed-angelic.ngrok-free.dev/"
echo ""


