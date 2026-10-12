import Vue from "vue";
import VueRouter from "vue-router";
import { neUiKitRouterPath } from "@/components/NEUIKit/utils/uikitRouter";

Vue.use(VueRouter);

export default new VueRouter({
  mode: "hash",
  routes: [
    {
      path: "/",
      redirect: neUiKitRouterPath.conversation,
    },
    {
      path: neUiKitRouterPath.chat,
      name: "Chat",
      component: () => import("../views/chat/ChatPage.vue"),
    },
    {
      path: neUiKitRouterPath.messageReadInfo,
      name: "MessageReadInfo",
      component: () => import("../views/chat/MessageReadInfoPage.vue"),
    },
    {
      path: neUiKitRouterPath.p2pSetting,
      name: "P2pSetting",
      component: () => import("../views/chat/P2pSettingPage.vue"),
    },
    {
      path: neUiKitRouterPath.conversation,
      name: "Conversation",
      component: () => import("../views/conversation/ConversationPage.vue"),
    },
    {
      path: neUiKitRouterPath.conversationSearch,
      name: "ConversationSearch",
      component: () => import("../views/conversation/ConversationSearchPage.vue"),
    },
    {
      path: neUiKitRouterPath.contacts,
      name: "Contacts",
      component: () => import("../views/contacts/ContactsPage.vue"),
    },
    {
      path: neUiKitRouterPath.blacklist,
      name: "Blacklist",
      component: () => import("../views/contacts/BlackListPage.vue"),
    },
    {
      path: neUiKitRouterPath.validlist,
      name: "ValidList",
      component: () => import("../views/contacts/ValidListPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamlist,
      name: "TeamList",
      component: () => import("../views/contacts/TeamListPage.vue"),
    },
    {
      path: neUiKitRouterPath.my,
      name: "My",
      component: () => import("../views/user/MyPage.vue"),
    },
    {
      path: neUiKitRouterPath.userSetting,
      name: "UserSetting",
      component: () => import("../views/user/SettingPage.vue"),
    },
    {
      path: neUiKitRouterPath.myDetail,
      name: "MyDetail",
      component: () => import("../views/user/MyDetailPage.vue"),
    },
    {
      path: neUiKitRouterPath.myDetailEdit,
      name: "MyDetailEdit",
      component: () => import("../views/user/MyDetailEditPage.vue"),
    },
    {
      path: neUiKitRouterPath.aboutNetease,
      name: "AboutNetease",
      component: () => import("../views/user/AboutNeteasePage.vue"),
    },
    {
      path: neUiKitRouterPath.friendCard,
      name: "FriendCard",
      component: () => import("../views/friend/FriendCardPage.vue"),
    },
    {
      path: neUiKitRouterPath.addFriend,
      name: "AddFriend",
      component: () => import("../views/friend/AddFriendPage.vue"),
    },
    {
      path: neUiKitRouterPath.friendInfoEdit,
      name: "FriendInfoEdit",
      component: () => import("../views/friend/FriendInfoEditPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamCreate,
      name: "TeamCreate",
      component: () => import("../views/team/TeamCreatePage.vue"),
    },
    {
      path: neUiKitRouterPath.teamSetting,
      name: "TeamSetting",
      component: () => import("../views/team/TeamSetPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamMember,
      name: "TeamMember",
      component: () => import("../views/team/TeamMemberPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamInfoEdit,
      name: "TeamInfoEdit",
      component: () => import("../views/team/TeamInfoEditPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamAvatarEdit,
      name: "TeamAvatarEdit",
      component: () => import("../views/team/TeamAvatarEditPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamIntroduceEdit,
      name: "TeamIntroduceEdit",
      component: () => import("../views/team/TeamIntroduceEditPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamAdd,
      name: "TeamAdd",
      component: () => import("../views/team/TeamAddPage.vue"),
    },
    {
      path: neUiKitRouterPath.teamNick,
      name: "TeamNick",
      component: () => import("../views/team/TeamNickPage.vue"),
    },
    {
      path: neUiKitRouterPath.login,
      name: "Login",
      component: () => import("../views/login/LoginPage.vue"),
    },
  ],
});
