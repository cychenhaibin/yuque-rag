#!/bin/bash
# 修复 React Native 项目路径问题（移动目录后使用）

cd "$(dirname "$0")"

echo "🔧 正在修复 React Native 项目路径问题..."
echo ""

# 清理 node_modules
echo "1️⃣ 删除 node_modules..."
rm -rf node_modules

# 清理 package-lock.json
echo "2️⃣ 删除 package-lock.json..."
rm -rf package-lock.json

# 清理 Android 构建缓存和 Gradle 缓存
echo "3️⃣ 清理 Android 构建缓存..."
cd android
# 清理构建目录（包含 autolinking.json 等自动生成的文件）
rm -rf build
rm -rf app/build
# 清理 Gradle 缓存（包含旧路径信息）
rm -rf .gradle
# 清理 Gradle wrapper 缓存
if [ -d "$HOME/.gradle/caches" ]; then
    echo "   清理全局 Gradle 缓存..."
    rm -rf "$HOME/.gradle/caches"
fi
cd ..

# 重新安装依赖
echo "4️⃣ 重新安装依赖..."
npm install

# 清理并重新构建 Android 项目
echo "5️⃣ 清理 Android Gradle 项目..."
cd android
./gradlew clean --no-daemon
cd ..

# 清理 iOS Pods（如果需要）
if [ -d "ios/Pods" ]; then
    echo "6️⃣ 清理 iOS Pods..."
    cd ios
    rm -rf Pods
    rm -rf Podfile.lock
    pod install
    cd ..
fi

# 清理 Metro bundler 缓存
echo "7️⃣ 清理 Metro bundler 缓存..."
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*

echo ""
echo "✅ 修复完成！"
echo ""
echo "现在可以运行："
echo "  npm run android      - 运行 Android 应用"
echo "  npm run ios          - 运行 iOS 应用"
echo ""
echo "注意：首次运行时，请先在另一个终端启动 Metro bundler："
echo "  npx react-native start"
echo ""


