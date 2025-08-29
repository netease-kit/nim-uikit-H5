## 配置项目

请在 `src/config/index.ts` 下配置 `NIM_APP_KEY`, `NIM_ACCOUNT_DEFAULT`, `NIM_TOKEN_DEFAULT` 即可配置静态登录.

如果有私有化部署的需求, 仍需要配置连接地址变量 `NIM_LBS_URLS`, `NIM_LINK_URL`

## 启动项目

依赖安装

```
npm install
```

启动脚本

```
npm run dev
```

## 项目结构大略

```

src
├── config 配置文件
│   └── index.ts
├── layouts 基础布局入口
├── NEUIKit 组件库入口
│   ├── chat 聊天功能入口
│   ├── common 通用功能
│   │   ├── components 公用组件入口
│   ├── contact 联系人相关功能
│   ├── conversation 会话相关功能
│   ├── friend 好友相关功能
│   ├── login 登录相关功能
│   ├── static 各种静态资源
│   ├── team 群操作相关功能
│   └── user 个人资料和设置相关功能
└── pages 页面入口
    ├── chat 聊天页
    ├── contacts 联系人页
    ├── conversation 会话相关页面
    ├── friend 好友操作相关页面
    ├── login 登录页
    ├── team 群操作相关页面
    └── user 个人资料和设置相关页面
```
