# 云信 IM UIKit React H5

## 项目简介

云信 IM UIKit React H5 是基于网易云信 IM SDK（`nim-web-sdk-ng`）开发的即时通讯 UIKit，专为移动端 H5 场景设计，提供完整的即时通讯功能，包括会话列表、聊天、通讯录、好友管理、群组管理等核心功能。

### 技术栈

- **前端框架**: React (支持 React >= 16.14.0)
- **构建工具**: Webpack 5
- **路由**: React Router DOM v6 (HashRouter)
- **状态管理**: MobX 6
- **IM SDK**: nim-web-sdk-ng 10.x
- **类型检查**: TypeScript 5
- **样式**: Less

### 特性

- ✅ **兼容性强**: 支持 React 16.14.0+ 版本，适配各种宿主项目
- ✅ **功能完整**: 提供会话、聊天、通讯录、好友、群组等全套 IM 功能
- ✅ **移动优化**: 针对 H5 移动端场景深度优化
- ✅ **国际化**: 内置中英文国际化支持
- ✅ **按需加载**: 基于 React.lazy 的路由级代码分割
- ✅ **类型安全**: 完整的 TypeScript 类型支持

## 目录结构

```
im-kit-react-ui-h5/
├── public/                      # 静态资源目录
│   └── index.html              # HTML 模板
├── src/                         # 源代码目录
│   ├── NEUIKit/                # UIKit 核心组件库
│   │   ├── chat/              # 聊天模块
│   │   │   ├── message/       # 消息相关组件
│   │   │   │   ├── message-input/      # 消息输入框
│   │   │   │   ├── message-list/       # 消息列表
│   │   │   │   ├── message-bubble/     # 消息气泡
│   │   │   │   ├── message-audio/      # 音频消息
│   │   │   │   ├── message-file/       # 文件消息
│   │   │   │   ├── message-forward/    # 消息转发
│   │   │   │   └── ...
│   │   │   ├── message-read-info/      # 消息已读信息
│   │   │   └── p2p-setting/            # 单聊设置
│   │   ├── conversation/      # 会话列表模块
│   │   │   ├── conversation-list/      # 会话列表
│   │   │   └── conversation-search/    # 会话搜索
│   │   ├── contact/           # 通讯录模块
│   │   │   ├── friend-list/   # 好友列表
│   │   │   ├── team-list/     # 群组列表
│   │   │   ├── black-list/    # 黑名单
│   │   │   └── valid-list/    # 验证消息列表
│   │   ├── friend/            # 好友管理模块
│   │   │   ├── friend-add/    # 添加好友
│   │   │   ├── friend-card/   # 好友名片
│   │   │   └── friend-edit/   # 编辑好友信息
│   │   ├── team/              # 群组管理模块
│   │   │   ├── team-add/      # 添加群成员
│   │   │   ├── team-create/   # 创建群组
│   │   │   ├── team-member/   # 群成员列表
│   │   │   └── team-setting/  # 群设置
│   │   ├── user/              # 用户信息模块
│   │   │   ├── my-detail/     # 个人详情
│   │   │   ├── setting/       # 设置
│   │   │   └── about-netease/ # 关于
│   │   ├── login/             # 登录模块
│   │   ├── common/            # 通用资源
│   │   │   ├── components/    # 通用 UI 组件
│   │   │   │   ├── Avatar/    # 头像组件
│   │   │   │   ├── Button/    # 按钮组件
│   │   │   │   ├── Modal/     # 弹窗组件
│   │   │   │   ├── Toast/     # 提示组件
│   │   │   │   └── ...
│   │   │   ├── contextManager/  # Context 管理
│   │   │   ├── hooks/         # 自定义 Hooks
│   │   │   ├── locales/       # 国际化语言包
│   │   │   ├── utils/         # 工具函数
│   │   │   └── style/         # 通用样式
│   │   └── static/            # UIKit 静态资源
│   ├── config/                # 配置文件
│   ├── layouts/               # 布局组件（含 Provider）
│   ├── utils/                 # 工具函数
│   ├── App.tsx                # 应用根组件
│   ├── index.tsx              # 应用入口
│   └── routes.tsx             # 路由配置
├── package.json               # 项目依赖配置
├── tsconfig.json              # TypeScript 配置
├── typings.d.ts               # 类型声明
├── webpack.config.js          # Webpack 构建配置
└── README.md                  # 项目文档
```

### 核心模块说明

#### NEUIKit 组件库

NEUIKit 是项目的核心组件库，包含所有 IM 功能的组件实现：

- **chat**: 聊天核心模块，包含消息展示、输入、转发、已读等完整功能
- **conversation**: 会话列表，支持会话搜索
- **contact**: 通讯录，包括好友、群组、黑名单、验证消息
- **friend**: 好友管理，包括添加、名片、编辑等
- **team**: 群组管理，包括创建、成员管理、群设置等
- **user**: 用户相关，包括个人信息、设置等
- **login**: 登录模块
- **common**: 通用资源（组件、工具、国际化等）

## 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0 或 yarn >= 1.22.0

## 安装依赖

```bash
npm install
```

或使用 yarn:

```bash
yarn install
```

## 启动项目

### 开发模式

启动开发服务器，支持热更新：

```bash
npm run dev
```

或使用 start 命令：

```bash
npm start
```

开发服务器将在 `http://localhost:8000` 启动。

### 生产构建

构建生产版本：

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 类型检查

运行 TypeScript 类型检查：

```bash
npm run type-check
```

监听模式下的类型检查：

```bash
npm run type-check:watch
```

## 切换为 react16 注意事项

**项目依赖**: 安装 react 和 react-dom 为 16.x 版本支持

```
npm install react@16 react-dom@16 @types/react@16 @types/react-dom@16 -D
```

**项目更改**: 本项目默认使用 react18, 并已经抽离了路由等 react 和 react-dom 依赖, 只需要打开 `src/utils/reactDomCompat.ts` 里面关于 react16 的支持函数, 注释 react18 的支持函数, 即可完成从 react18 降版本至 react16 的支持.

## 路由结构

项目使用 React Router DOM v6 的 HashRouter 进行路由管理，主要路由包括：

- `/login` - 登录页面
- `/index` - 会话列表（首页）
- `/conversation` - 会话搜索
- `/chat/:sessionId/:sessionType/:sessionName` - 聊天页面
- `/readinfo/:sessionId/:sessionType` - 消息已读信息
- `/p2psetting/:id` - 单聊设置
- `/contact` - 通讯录
- `/friendlist` - 好友列表
- `/teamlist` - 群组列表
- `/blacklist` - 黑名单
- `/validlist` - 验证消息列表
- `/friendcard/:accId` - 好友名片
- `/friendadd/:accId` - 添加好友
- `/friendedit/:accId` - 编辑好友
- `/teamcreate` - 创建群组
- `/teamadd/:id` - 添加群成员
- `/teammember/:id` - 群成员列表
- `/teamsetting/:id` - 群设置
- `/me` - 个人中心
- `/mydetail` - 个人详情
- `/detailitemedit/:type` - 编辑详情项
- `/setting` - 设置
- `/aboutnetease` - 关于

## 配置说明

### Webpack 配置 (`webpack.config.js`)

- **入口**: `src/index.tsx`
- **输出**: `dist/` 目录
- **开发服务器**: 端口 8000，支持热更新
- **代码分割**: 使用 `splitChunks` 将第三方库提取到 `vendors` chunk
- **Less 支持**: 配置了 less-loader，支持 Less 样式
- **路径别名**: `@` 指向 `src` 目录

### TypeScript 配置 (`tsconfig.json`)

- **目标**: ES2015
- **JSX**: react
- **模块**: ESNext
- **路径映射**: `@/*` 映射到 `src/*`
- **严格模式**: 已启用

## 依赖说明

### 核心依赖

- `@xkit-yx/im-store-v2`: 云信 IM 状态管理库
- `nim-web-sdk-ng`: 云信 IM Web SDK
- `mobx` / `mobx-react`: 状态管理
- `react-router-dom`: 路由管理

### Peer Dependencies

项目将 React 和 React DOM 声明为 peerDependencies，要求宿主项目提供 React >= 16.14.0：

```json
"peerDependencies": {
  "react": ">=16.14.0",
  "react-dom": ">=16.14.0"
}
```

这样设计可以避免在宿主项目中出现多个 React 实例，确保更好的兼容性。

## 国际化

项目内置中英文国际化支持，语言包位于 `src/NEUIKit/common/locales/`：

- `zh.ts` - 中文语言包
- `en.ts` - 英文语言包

## 开发注意事项

1. **Provider 包裹**: 所有页面都需要被 `Provider` 包裹以获取 IM 状态和国际化上下文，项目已在 `src/layouts/index.tsx` 中统一处理

2. **路径别名**: 使用 `@/` 前缀导入 `src` 目录下的模块，例如：
   ```typescript
   import { Button } from '@/NEUIKit/common/components/Button'
   ```

3. **代码分割**: 路由页面使用 `React.lazy()` 进行懒加载，提升首屏加载速度

4. **类型检查**: 提交代码前请运行 `npm run type-check` 确保没有类型错误

## github 地址

https://github.com/netease-kit/nim-uikit-H5

## 版本信息

当前版本：v11.0.0

## 许可证

私有项目
