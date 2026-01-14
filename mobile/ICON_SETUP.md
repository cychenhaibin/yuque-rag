# QuickQue 应用图标设置指南

## 📱 概述

你的应用图标源文件位于：`src/asserts/logo.png`

需要将这个图标转换为不同尺寸，分别用于 Android 和 iOS 平台。

---

## 🤖 Android 图标设置

### 需要的尺寸

Android 需要以下尺寸的图标（放在对应的 `mipmap-*` 目录）：

| 密度 | 目录 | 尺寸 | 圆角图标尺寸 |
|------|------|------|-------------|
| mdpi | `mipmap-mdpi` | 48x48 | 48x48 |
| hdpi | `mipmap-hdpi` | 72x72 | 72x72 |
| xhdpi | `mipmap-xhdpi` | 96x96 | 96x96 |
| xxhdpi | `mipmap-xxhdpi` | 144x144 | 144x144 |
| xxxhdpi | `mipmap-xxxhdpi` | 192x192 | 192x192 |

### 设置步骤

1. **生成图标文件**
   - 使用在线工具：https://icon.kitchen/ 或 https://www.appicon.co/
   - 或者使用 ImageMagick/GraphicsMagick 命令行工具
   - 或者使用设计软件（Photoshop、Figma 等）导出不同尺寸

2. **替换现有图标**
   - 将生成的图标文件复制到对应目录：
     ```
     android/app/src/main/res/mipmap-mdpi/ic_launcher.png
     android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
     android/app/src/main/res/mipmap-hdpi/ic_launcher.png
     android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
     ... (其他尺寸类似)
     ```

3. **重新构建应用**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

---

## 🍎 iOS 图标设置

### 需要的尺寸

iOS 需要以下尺寸的图标（放在 `Images.xcassets/AppIcon.appiconset/` 目录）：

| 用途 | 尺寸 | 文件名 |
|------|------|--------|
| App Icon - 20pt | 40x40 (2x), 60x60 (3x) | icon-20@2x.png, icon-20@3x.png |
| App Icon - 29pt | 58x58 (2x), 87x87 (3x) | icon-29@2x.png, icon-29@3x.png |
| App Icon - 40pt | 80x80 (2x), 120x120 (3x) | icon-40@2x.png, icon-40@3x.png |
| App Icon - 60pt | 120x120 (2x), 180x180 (3x) | icon-60@2x.png, icon-60@3x.png |
| App Store | 1024x1024 (1x) | icon-1024.png |

### 设置步骤

1. **生成图标文件**
   - 使用 Xcode 的 Asset Catalog（推荐）
   - 或者使用在线工具生成所有尺寸

2. **使用 Xcode 设置（推荐）**
   - 打开 `ios/mobile.xcworkspace`（不是 .xcodeproj）
   - 在左侧导航栏找到 `mobile/Images.xcassets/AppIcon`
   - 将对应尺寸的图标拖拽到相应位置
   - Xcode 会自动更新 `Contents.json`

3. **手动设置**
   - 将生成的图标文件放到 `ios/mobile/Images.xcassets/AppIcon.appiconset/` 目录
   - 更新 `Contents.json` 文件，添加文件名引用

4. **重新构建应用**
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

---

## 🛠️ 快速生成工具推荐

### 在线工具（最简单）
1. **App Icon Generator**: https://www.appicon.co/
   - 上传你的 logo.png
   - 自动生成所有尺寸
   - 下载并解压到对应目录

2. **Icon Kitchen**: https://icon.kitchen/
   - 支持 Android 和 iOS
   - 可以生成圆角图标

### 命令行工具

#### 使用 ImageMagick（如果已安装）
```bash
# 安装 ImageMagick (macOS)
brew install imagemagick

# 生成 Android 图标
convert src/asserts/logo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert src/asserts/logo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert src/asserts/logo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert src/asserts/logo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert src/asserts/logo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# 生成圆角图标（需要先创建圆角版本）
# 可以使用在线工具或设计软件生成圆角版本
```

---

## ✅ 验证

设置完成后，重新构建应用：

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

安装到设备后，检查主屏幕上的应用图标是否正确显示。

---

## 📝 注意事项

1. **图标要求**
   - 图标应该是正方形
   - 建议使用 PNG 格式，支持透明背景
   - 避免在图标边缘放置重要内容（系统可能会裁剪）

2. **圆角图标（Android）**
   - Android 8.0+ 会自动应用圆角
   - 但建议提供 `ic_launcher_round.png` 以确保兼容性

3. **iOS 图标**
   - iOS 会自动应用圆角，不需要手动创建圆角版本
   - 但图标本身应该是正方形

4. **当前配置**
   - Android 图标配置在 `AndroidManifest.xml` 中已设置
   - iOS 图标使用 Asset Catalog，配置在 `Contents.json` 中

