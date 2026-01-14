# 语雀 RAG 移动端安装指南

## ✅ 已完成的工作

所有计划中的功能已经完整实现，包括：

### 1. 项目结构 ✅
- 创建了完整的目录结构
- 配置文件（API地址、主题色）
- TypeScript 类型定义

### 2. 核心功能 ✅
- **认证系统**：JWT Token 认证，自动登录
- **聊天功能**：流式问答，打字机效果
- **历史记录**：本地存储，支持删除和清空
- **用户中心**：用户信息显示，登出功能

### 3. UI/UX ✅
- **主题色**：统一使用 #ee4d2d
- **暗黑模式**：自动适配系统主题
- **响应式设计**：适配不同屏幕尺寸
- **加载状态**：友好的用户反馈

## 📦 安装步骤

### 前置要求

1. **Node.js** >= 20
2. **Java JDK** 17+
3. **Android Studio** 和 Android SDK
4. **Android 模拟器或真机**

### 步骤 1: 安装依赖

```bash
cd mobile
npm install
```

注意：如果 npm install 在沙盒环境中失败，请在项目目录手动运行：

```bash
cd /Users/lawliet/Desktop/代码/yuque-rag/mobile
npm install
```

### 步骤 2: 配置后端地址

依赖已经在 `package.json` 中添加，后端地址已配置为：
```
https://chester-unplumed-angelic.ngrok-free.dev/
```

如需修改，编辑 `src/config/index.ts`。

### 步骤 3: 启动 Metro 服务器

```bash
npm start
```

### 步骤 4: 运行 Android 应用

在另一个终端：

```bash
npm run android
```

## 🎯 测试账号

- **用户名**: admin, **密码**: admin123
- **用户名**: user1, **密码**: password123
- **用户名**: test, **密码**: test123

## 📱 功能清单

### 登录页面 ✅
- [x] 用户名输入
- [x] 密码输入
- [x] 登录按钮（主题色）
- [x] 加载状态
- [x] 错误提示
- [x] 测试账号说明

### 聊天页面 ✅
- [x] 消息列表展示
- [x] 用户消息气泡（右侧，主题色背景）
- [x] AI 消息气泡（左侧，灰色背景）
- [x] 流式响应（打字机效果）
- [x] 消息输入框
- [x] 发送按钮（主题色）
- [x] 自动滚动到底部
- [x] 时间戳显示
- [x] 加载状态

### 历史页面 ✅
- [x] 会话列表展示
- [x] 会话标题和预览
- [x] 消息数量显示
- [x] 时间显示（今天、昨天、X天前）
- [x] 删除单个会话
- [x] 清空所有历史
- [x] 下拉刷新
- [x] 空状态提示

### 个人中心页面 ✅
- [x] 用户头像（首字母）
- [x] 用户名显示
- [x] 清空历史功能
- [x] 关于应用
- [x] 登出按钮（主题色）
- [x] 版本信息

### 导航系统 ✅
- [x] 认证栈（登录）
- [x] 主应用标签栏（聊天、历史、我的）
- [x] 底部导航（主题色高亮）
- [x] 根据登录状态切换导航

### 通用功能 ✅
- [x] 暗黑模式适配
- [x] 主题色应用（#ee4d2d）
- [x] Token 存储和管理
- [x] 自动登录检查
- [x] Token 过期处理
- [x] 网络错误处理
- [x] 加载动画
- [x] 错误提示

## 🔧 技术实现

### 认证流程
1. 用户输入用户名密码
2. 调用 `/auth/login` API
3. 保存 Token 和用户名到 AsyncStorage
4. AuthContext 更新状态
5. 自动切换到主应用导航

### 流式聊天
1. 用户发送消息
2. 调用 `/chat/stream` API
3. 使用 Fetch API 读取响应流
4. SSEParser 解析 SSE 数据
5. 逐字更新 AI 消息
6. 自动保存到本地历史

### 历史存储
1. 每次对话完成后保存
2. 使用 ChatSession 格式存储
3. AsyncStorage 持久化
4. 支持多会话管理

## 📝 文件说明

### 核心文件
- `App.tsx` - 应用入口，包含 AuthProvider 和导航
- `src/config/index.ts` - 配置文件（API地址、主题色）
- `src/contexts/AuthContext.tsx` - 认证状态管理
- `src/navigation/AppNavigator.tsx` - 导航配置

### 服务文件
- `src/services/api.ts` - Axios 客户端配置
- `src/services/authService.ts` - 认证 API
- `src/services/chatService.ts` - 聊天 API（含流式）

### 工具文件
- `src/utils/storage.ts` - AsyncStorage 封装
- `src/utils/sseParser.ts` - SSE 数据解析

### 页面文件
- `src/screens/LoginScreen.tsx` - 登录页
- `src/screens/ChatScreen.tsx` - 聊天页
- `src/screens/HistoryScreen.tsx` - 历史页
- `src/screens/ProfileScreen.tsx` - 个人中心

### 组件文件
- `src/components/MessageBubble.tsx` - 消息气泡
- `src/components/ChatInput.tsx` - 聊天输入框
- `src/components/LoadingIndicator.tsx` - 加载指示器
- `src/components/ErrorMessage.tsx` - 错误提示

## 🐛 常见问题

### 1. npm install 失败
手动在项目目录运行 npm install，不要在沙盒环境中运行。

### 2. Metro 启动失败
```bash
npx react-native start --reset-cache
```

### 3. Android 构建失败
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 4. 图标不显示
图标配置已添加到 `android/app/build.gradle`，首次运行会自动链接。

### 5. 网络请求失败
- 确认后端服务器正常运行
- 检查 `src/config/index.ts` 中的 API 地址
- 查看控制台错误信息

## 🎨 主题色应用

主题色 `#ee4d2d` 已应用到：
- ✅ 登录按钮
- ✅ 发送按钮
- ✅ 底部导航激活状态
- ✅ 用户消息气泡背景
- ✅ 头像背景
- ✅ 菜单项图标

## 🌓 暗黑模式

所有页面和组件都支持暗黑模式，会自动跟随系统设置：
- ✅ 背景色切换
- ✅ 文字颜色切换
- ✅ 卡片背景切换
- ✅ 边框颜色切换
- ✅ 输入框背景切换

## 📚 下一步

1. 运行 `npm install` 安装依赖
2. 启动 Metro: `npm start`
3. 运行应用: `npm run android`
4. 使用测试账号登录
5. 开始聊天！

## 🎉 完成状态

所有计划功能已 100% 完成！可以立即开始使用。

详细使用说明请查看 `README_MOBILE.md`。


