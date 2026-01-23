#!/bin/bash

# 修复 @react-native-voice/voice 原生模块链接问题的脚本

echo "🔧 开始修复 Voice 模块链接问题..."

cd "$(dirname "$0")"

echo "1️⃣  清理构建缓存..."
cd android
./gradlew clean
cd ..

echo "2️⃣  清理 Metro 缓存..."
rm -rf node_modules/.cache
rm -rf /tmp/metro-*

echo "3️⃣  重新安装依赖（如果需要）..."
# 如果 node_modules 有问题，取消下面的注释
# rm -rf node_modules
# npm install

echo "4️⃣  重新构建 Android 应用..."
echo "⚠️  请确保设备已连接或模拟器已启动"
echo ""
echo "运行以下命令重新构建："
echo "  cd mobile"
echo "  npm run android"
echo ""
echo "或者："
echo "  cd mobile/android"
echo "  ./gradlew clean"
echo "  cd .."
echo "  npx react-native run-android"

echo ""
echo "✅ 准备完成！如果问题仍然存在，请："
echo "   - 卸载应用后重新安装"
echo "   - 确保设备支持语音识别服务"
echo "   - 检查 AndroidManifest.xml 中的权限配置"


