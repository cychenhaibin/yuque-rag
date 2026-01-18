#!/bin/bash

# Android 构建脚本
# 用法: bash build_android.sh [debug|release]
# 默认构建 debug 版本

BUILD_TYPE=${1:-debug}

echo "================================"
echo "Android 构建脚本"
echo "================================"
echo ""
echo "构建类型: $BUILD_TYPE"
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查是否在正确的目录
if [ ! -d "android" ]; then
    echo "❌ 错误: 未找到 android 目录"
    exit 1
fi

# 检查 Gradle Wrapper 是否存在
if [ ! -f "android/gradlew" ]; then
    echo "❌ 错误: 未找到 gradlew 文件"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
cd android
./gradlew clean

if [ $? -ne 0 ]; then
    echo "❌ 清理失败"
    exit 1
fi

echo ""
echo "📦 开始构建 APK..."

# 根据构建类型选择命令
if [ "$BUILD_TYPE" = "release" ]; then
    echo "构建 Release 版本..."
    # 跳过 lint 检查以节省内存和构建时间
    ./gradlew assembleRelease -x lintVitalAnalyzeRelease -x lintVitalRelease
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 构建成功！"
        echo ""
        echo "APK 位置:"
        echo "  $(pwd)/app/build/outputs/apk/release/app-release.apk"
        echo ""
        
        # 显示 APK 信息
        if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
            APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
            echo "APK 大小: $APK_SIZE"
        fi
    else
        echo "❌ 构建失败"
        exit 1
    fi
else
    echo "构建 Debug 版本..."
    # Debug 版本也跳过 lint 检查
    ./gradlew assembleDebug -x lintVitalAnalyzeDebug -x lintVitalDebug
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 构建成功！"
        echo ""
        echo "APK 位置:"
        echo "  $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
        echo ""
        
        # 显示 APK 信息
        if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
            APK_SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
            echo "APK 大小: $APK_SIZE"
        fi
    else
        echo "❌ 构建失败"
        exit 1
    fi
fi

cd ..

echo ""
echo "================================"
echo "构建完成！"
echo "================================"

