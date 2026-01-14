# 语雀 RAG 移动端应用

基于 React Native 开发的语雀 RAG 问答系统 Android 客户端。

## 功能特性

✅ **用户登录认证** - JWT Token 认证，单设备登录  
✅ **流式聊天问答** - 支持打字机效果的流式响应  
✅ **聊天历史** - 本地存储聊天记录  
✅ **用户信息管理** - 个人中心和设置  
✅ **暗黑模式** - 自动适配系统主题  
✅ **主题色** - 统一使用 #ee4d2d 主题色

## 技术栈

- **React Native 0.83.1** - 跨平台移动应用框架
- **TypeScript** - 类型安全
- **React Navigation** - 页面导航
- **AsyncStorage** - 本地数据持久化
- **Axios** - HTTP 客户端
- **React Native Vector Icons** - 图标库

## 环境要求

- Node.js >= 20
- Java JDK 17+
- Android Studio
- Android SDK (API Level 24+)

## 安装步骤

### 1. 安装依赖

```bash
cd mobile
npm install
```

### 2. 配置后端地址

如果需要修改后端服务器地址，编辑 `src/config/index.ts`:

```typescript
export const Config = {
  API_BASE_URL: 'https://your-backend-url.com',
  // ...其他配置
};
```

### 3. 运行 Android 应用

```bash
# 启动 Metro 服务器
npm start

# 在另一个终端运行 Android
npm run android
```

或者使用项目根目录的脚本：

```bash
# 从项目根目录
cd mobile
npm start
```

## 项目结构

```
mobile/src/
├── config/          # 配置文件（API地址、主题色）
│   └── index.ts
├── contexts/        # React Context（认证状态管理）
│   └── AuthContext.tsx
├── screens/         # 页面组件
│   ├── LoginScreen.tsx       # 登录页
│   ├── ChatScreen.tsx        # 聊天页
│   ├── HistoryScreen.tsx     # 历史记录页
│   └── ProfileScreen.tsx     # 个人中心页
├── components/      # 可复用组件
│   ├── MessageBubble.tsx     # 消息气泡
│   ├── ChatInput.tsx         # 聊天输入框
│   ├── LoadingIndicator.tsx # 加载指示器
│   └── ErrorMessage.tsx      # 错误提示
├── services/        # API 服务
│   ├── api.ts               # API 客户端配置
│   ├── authService.ts       # 认证服务
│   └── chatService.ts       # 聊天服务
├── utils/           # 工具函数
│   ├── storage.ts           # AsyncStorage 封装
│   └── sseParser.ts         # SSE 流解析
├── types/           # TypeScript 类型定义
│   └── index.ts
└── navigation/      # 导航配置
    └── AppNavigator.tsx
```

## 功能说明

### 1. 登录认证

- 支持用户名密码登录
- JWT Token 认证
- 自动登录（记住登录状态）
- 单设备登录机制

**测试账号：**
- admin / admin123
- user1 / password123
- test / test123

### 2. 聊天问答

- 流式响应（打字机效果）
- 实时消息展示
- 自动滚动到最新消息
- 消息时间戳显示
- 错误处理和重试

### 3. 聊天历史

- 本地存储聊天记录
- 按时间倒序展示
- 支持删除单个会话
- 清空所有历史
- 下拉刷新

### 4. 个人中心

- 显示用户信息
- 退出登录
- 清空历史记录
- 应用信息

### 5. 主题支持

- 自动适配系统暗黑模式
- 统一主题色 #ee4d2d
- 响应式 UI 设计

## API 接口

应用连接到后端服务器，使用以下接口：

- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出
- `GET /auth/me` - 获取用户信息
- `POST /chat/stream` - 流式问答

## 开发指南

### 调试

```bash
# 查看日志
npx react-native log-android

# 打开开发者菜单（在模拟器中）
# 按两次 R 键重新加载
# 按 Ctrl+M (Windows/Linux) 或 Cmd+M (macOS) 打开菜单
```

### 构建 APK

```bash
# 进入 android 目录
cd android

# 构建 Debug APK
./gradlew assembleDebug

# 构建 Release APK（需要签名配置）
./gradlew assembleRelease
```

生成的 APK 位于：
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 常见问题

### 1. Metro 服务器无法启动

```bash
# 清理缓存
npx react-native start --reset-cache
```

### 2. Android 构建失败

```bash
# 清理构建
cd android
./gradlew clean
cd ..
npm run android
```

### 3. 网络请求失败

- 检查后端服务器是否正常运行
- 确认 `src/config/index.ts` 中的 API 地址正确
- Android 模拟器访问 localhost 需要使用 `10.0.2.2`
- 真机测试需要使用局域网 IP 或公网地址

### 4. 图标不显示

```bash
# 重新链接资源
npx react-native-asset
```

## 性能优化

- 使用 FlatList 优化长列表渲染
- 流式响应减少等待时间
- AsyncStorage 本地缓存
- 图片和资源优化
- 按需加载组件

## 安全考虑

- Token 安全存储（AsyncStorage）
- HTTPS 通信
- 密码不明文传输
- 单设备登录保护
- 敏感信息加密

## 后续计划

- [ ] iOS 版本支持
- [ ] 消息搜索功能
- [ ] 语音输入
- [ ] 分享功能
- [ ] 推送通知
- [ ] 离线模式

## 许可证

Apache 2.0

## 联系方式

如有问题或建议，请查看主项目 README 或提交 Issue。


