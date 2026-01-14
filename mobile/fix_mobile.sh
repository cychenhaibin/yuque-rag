#!/bin/bash
# 修复 React Native 项目路径问题

cd "$(dirname "$0")"

echo "🔧 正在修复 React Native 项目..."
echo ""

# 清理 node_modules
echo "1️⃣ 删除 node_modules..."
rm -rf node_modules

# 清理 package-lock.json
echo "2️⃣ 删除 package-lock.json..."
rm -rf package-lock.json

# 重新安装依赖
echo "3️⃣ 重新安装依赖..."
npm install

# 清理 Android 构建缓存
echo "4️⃣ 清理 Android 构建缓存..."
cd android
./gradlew clean
cd ..

# 清理 iOS Pods（如果需要）
if [ -d "ios/Pods" ]; then
    echo "5️⃣ 清理 iOS Pods..."
    cd ios
    rm -rf Pods
    rm -rf Podfile.lock
    pod install
    cd ..
fi

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


