import { createRouter, createWebHashHistory } from "vue-router";
import { neUiKitRouterPath } from "@/components/NEUIKit/utils/uikitRouter";

// 创建路由实例
const router = createRouter({
  // 使用 hash 模式的路由
  history: createWebHashHistory(),
  routes: [
    {
      // 根路径重定向到会话列表页面
      path: "/",
      redirect: neUiKitRouterPath.conversation,
    },
    {
      // 聊天页面路由
      path: neUiKitRouterPath.chat,
      name: "Chat",
      component: () => import("../views/chat/ChatPage.vue"),
    },
    {
      // 消息已读信息页面路由
      path: neUiKitRouterPath.messageReadInfo,
      name: "MessageReadInfo",
      component: () => import("../views/chat/MessageReadInfoPage.vue"),
    },
    {
      // 单聊设置页面路由
      path: neUiKitRouterPath.p2pSetting,
      name: "P2pSetting",
      component: () => import("../views/chat/P2pSettingPage.vue"),
    },
    {
      // 会话列表页面路由
      path: neUiKitRouterPath.conversation,
      name: "Conversation",
      component: () => import("../views/conversation/ConversationPage.vue"),
    },
    {
      // 会话搜索页面路由
      path: neUiKitRouterPath.conversationSearch,
      name: "ConversationSearch",
      component: () =>
        import("../views/conversation/ConversationSearchPage.vue"),
    },
    {
      // 通讯录页面路由
      path: neUiKitRouterPath.contacts,
      name: "Contacts",
      component: () => import("../views/contacts/ContactsPage.vue"),
    },
    {
      // 黑名单列表页面路由
      path: neUiKitRouterPath.blacklist,
      name: "Blacklist",
      component: () => import("../views/contacts/BlackListPage.vue"),
    },
    {
      // 验证消息列表页面路由
      path: neUiKitRouterPath.validlist,
      name: "ValidList",
      component: () => import("../views/contacts/ValidListPage.vue"),
    },
    {
      // 群组列表页面路由
      path: neUiKitRouterPath.teamlist,
      name: "TeamList",
      component: () => import("../views/contacts/TeamListPage.vue"),
    },
    {
      // 个人中心页面路由
      path: neUiKitRouterPath.my,
      name: "My",
      component: () => import("../views/user/MyPage.vue"),
    },
    {
      // 用户设置页面路由
      path: neUiKitRouterPath.userSetting,
      name: "UserSetting",
      component: () => import("../views/user/SettingPage.vue"),
    },
    {
      // 我的详情页面路由
      path: neUiKitRouterPath.myDetail,
      name: "MyDetail",
      component: () => import("../views/user/MyDetailPage.vue"),
    },
    {
      // 我的详情编辑页面路由
      path: neUiKitRouterPath.myDetailEdit,
      name: "MyDetailEdit",
      component: () => import("../views/user/MyDetailEditPage.vue"),
    },
    {
      // 关于网易云信页面路由
      path: neUiKitRouterPath.aboutNetease,
      name: "AboutNetease",
      component: () => import("../views/user/AboutNeteasePage.vue"),
    },
    {
      // 好友名片页面路由
      path: neUiKitRouterPath.friendCard,
      name: "FriendCard",
      component: () => import("../views/friend/FriendCardPage.vue"),
    },
    {
      // 添加好友页面路由
      path: neUiKitRouterPath.addFriend,
      name: "AddFriend",
      component: () => import("../views/friend/AddFriendPage.vue"),
    },
    {
      // 好友信息编辑页面路由
      path: neUiKitRouterPath.friendInfoEdit,
      name: "FriendInfoEdit",
      component: () => import("../views/friend/FriendInfoEditPage.vue"),
    },
    {
      // 创建群组页面路由
      path: "/team/create",
      name: "TeamCreate",
      component: () => import("../views/team/TeamCreatePage.vue"),
    },
    {
      // 群组设置页面路由
      path: neUiKitRouterPath.teamSetting,
      name: "TeamSetting",
      component: () => import("../views/team/TeamSetPage.vue"),
    },
    {
      // 群组成员管理页面路由
      path: neUiKitRouterPath.teamMember,
      name: "TeamMMember",
      component: () => import("../views/team/TeamMemberPage.vue"),
    },
    {
      // 群组信息编辑页面路由
      path: neUiKitRouterPath.teamInfoEdit,
      name: "TeamInfoEdit",
      component: () => import("../views/team/TeamInfoEditPage.vue"),
    },
    {
      // 群组头像编辑页面路由
      path: neUiKitRouterPath.teamAvatarEdit,
      name: "TeamAvatarEdit",
      component: () => import("../views/team/TeamAvatarEditPage.vue"),
    },
    {
      // 群组介绍编辑页面路由
      path: neUiKitRouterPath.teamIntroduceEdit,
      name: "TeamNameEdit",
      component: () => import("../views/team/TeamIntroduceEditPage.vue"),
    },
    {
      // 添加群成员页面路由
      path: neUiKitRouterPath.teamAdd,
      name: "TeamAdd",
      component: () => import("../views/team/TeamAddPage.vue"),
    },
    {
      // 群昵称设置页面路由
      path: neUiKitRouterPath.teamNick,
      name: "TeamNick",
      component: () => import("../views/team/TeamNickPage.vue"),
    },
    {
      // 登录页面路由
      path: neUiKitRouterPath.login,
      name: "Login",
      component: () => import("../views/login/LoginPage.vue"),
    },
  ],
});

export default router;
