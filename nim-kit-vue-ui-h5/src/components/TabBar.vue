<template>
  <nav class="tabbar" v-if="showTabBar">
    <router-link to="/conversation" class="tab-item">
      <div class="tab-item-content">
        <div class="icon-wrapper">
          <img
            :src="
              $route.path === '/conversation'
                ? conversationSelectedIcon
                : conversationIcon
            "
            class="tab-icon"
          />
          <span v-if="conversationUnread" class="unread-dot"></span>
        </div>
        <span>{{ t("messageText") }}</span>
      </div>
    </router-link>
    <router-link to="/contacts" class="tab-item">
      <div class="tab-item-content">
        <div class="icon-wrapper">
          <img
            :src="
              $route.path === '/contacts' ? contactsSelectedIcon : contactsIcon
            "
            class="tab-icon"
          />
          <span v-if="contactsUnread" class="unread-dot"></span>
        </div>
        <span>{{ t("contactText") }}</span>
      </div>
    </router-link>
    <router-link to="/my" class="tab-item">
      <div class="tab-item-content">
        <img
          :src="$route.path === '/my' ? meSelectedIcon : meIcon"
          class="tab-icon"
        />
        <span>{{ t("mineText") }}</span>
      </div>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, getCurrentInstance } from "vue";
import { useRoute } from "vue-router";
import conversationIcon from "./NEUIKit/static/conversation.png";
import conversationSelectedIcon from "./NEUIKit/static/conversation-selected.png";
import contactsIcon from "./NEUIKit/static/contact.png";
import contactsSelectedIcon from "./NEUIKit/static/contact-selected.png";
import meIcon from "./NEUIKit/static/me.png";
import meSelectedIcon from "./NEUIKit/static/me-selected.png";
import RootStore from "@xkit-yx/im-store-v2";
import { autorun } from "mobx";
import { t } from "./NEUIKit/utils/i18n";
const route = useRoute();

const showTabBar = computed(() => {
  const allowedRoutes = ["/conversation", "/contacts", "/my"];
  return allowedRoutes.includes(route.path);
});
const conversationUnread = ref(false);
const contactsUnread = ref(false);
const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;

onMounted(() => {
  autorun(() => {
    // 会话未读数，去掉 !!就是实际未读数
    /**是否是云端会话 */
    const enableV2CloudConversation =
      store?.sdkOptions?.enableV2CloudConversation;

    conversationUnread.value = enableV2CloudConversation
      ? !!store?.conversationStore?.totalUnreadCount
      : !!store?.localConversationStore?.totalUnreadCount;

    // 通讯录验证消息未读数
    contactsUnread.value = !!store?.sysMsgStore.getTotalUnreadMsgsCount();
  });
});
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  background-color: #fff;
  border-top: 1px solid #eee;
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent; /* 添加这行 */
}
.tab-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tab-item.router-link-active {
  color: #409eff;
}

.icon-wrapper {
  position: relative;
  display: inline-block;
  height: 24px;
}

.unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #ff4d4f;
  border-radius: 50%;
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.tab-item span {
  font-size: 12px;
}
</style>
