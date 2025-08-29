<template>
  <div class="conversation-wrapper">
    <div
      class="dropdown-mark"
      v-if="addDropdownVisible"
      @touchstart="hideAddDropdown"
    ></div>
    <div class="navigation-bar">
      <div class="logo-box">
        <img
          src="https://yx-web-nosdn.netease.im/common/bbcd9929e31bfee02663fc0bcdabe1c5/yx-logo.png"
          class="logo-img"
        />
        <div>{{ t("appText") }}</div>
      </div>
      <div :class="buttonClass">
        <div class="button-icon-add" @click="showAddDropdown">
          <Icon type="icon-More" :size="24" />
        </div>
        <div v-if="addDropdownVisible" class="dropdown-container">
          <div class="add-menu-list">
            <div class="add-menu-item" @click="onDropdownClick('addFriend')">
              <Icon type="icon-tianjiahaoyou" :style="{ marginRight: '5px' }" />
              {{ t("addFriendText") }}
            </div>
            <div class="add-menu-item" @click="onDropdownClick('createGroup')">
              <Icon
                type="icon-chuangjianqunzu"
                :style="{ marginRight: '5px' }"
              />
              {{ t("createTeamText") }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="block"></div>
    <NetworkAlert />
    <div v-if="!conversationList || conversationList.length === 0">
      <div class="security-tip">
        <div>
          {{ t("securityTipText") }}
        </div>
      </div>
      <div class="conversation-search" @click="goToSearchPage">
        <div class="search-input-wrapper">
          <div class="search-icon-wrapper">
            <Icon
              iconClassName="search-icon"
              :size="16"
              color="#A6ADB6"
              type="icon-sousuo"
            ></Icon>
          </div>
          <div class="search-input">{{ t("searchText") }}</div>
        </div>
      </div>
      <!-- 页面初始化的过程中，sessionList编译到小程序和h5出现sessionList为undefined的情况，即使给了默认值为空数组，故在此处进行判断 -->
      <Empty
        v-if="!conversationList || conversationList.length === 0"
        :text="t('conversationEmptyText')"
      />
    </div>
    <div
      v-else
      class="conversation-list-wrapper"
      ref="listWrapper"
      @scroll="handleScroll"
    >
      <div class="security-tip">
        <div>
          {{ t("securityTipText") }}
        </div>
      </div>
      <div class="conversation-search" @click="goToSearchPage">
        <div class="search-input-wrapper">
          <div class="search-icon-wrapper">
            <Icon
              iconClassName="search-icon"
              :size="16"
              color="#A6ADB6"
              type="icon-sousuo"
            ></Icon>
          </div>
          <div class="search-input">{{ t("searchText") }}</div>
        </div>
      </div>
      <div
        v-for="conversation in conversationList"
        :key="conversation.conversationId"
      >
        <ConversationItem
          :key="conversation.conversationId"
          :showMoreActions="
            currentMoveSessionId === conversation.conversationId
          "
          :conversation="conversation"
          @delete="handleSessionItemDeleteClick"
          @stickyToTop="handleSessionItemStickTopChange"
          @click="handleSessionItemClick"
          @leftSlide="handleSessionItemLeftSlide"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** 会话列表主界面 */

import { onUnmounted, ref, getCurrentInstance } from "vue";
import { autorun } from "mobx";
import Icon from "../CommonComponents/Icon.vue";
import NetworkAlert from "../CommonComponents/NetworkAlert.vue";
import Empty from "../CommonComponents/Empty.vue";
import ConversationItem from "./conversation-item.vue";
import { t } from "../utils/i18n";
import { showToast } from "../utils/toast";
import type {
  V2NIMConversationForUI,
  V2NIMLocalConversationForUI,
} from "@xkit-yx/im-store-v2/dist/types/types";
import { useRouter } from "vue-router";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { onMounted } from "vue";
import { trackInit } from "../utils/reporter";

const conversationList = ref<
  (V2NIMConversationForUI | V2NIMLocalConversationForUI)[]
>([]);
const addDropdownVisible = ref(false);

const currentMoveSessionId = ref("");

let buttonClass = "button-box";

const router = useRouter();

const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;

trackInit("ContactUIKit", nim.options.appkey);

/**是否是云端会话 */
const enableV2CloudConversation = store?.sdkOptions?.enableV2CloudConversation;

const listWrapper = ref<HTMLElement | null>(null);
const loading = ref(false);

onMounted(() => {
  store?.uiStore.selectConversation("");
});

// 处理滚动事件
const handleScroll = async (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  // 判断是否滚动到底部
  const isBottom =
    target.scrollHeight - target.scrollTop <= target.clientHeight + 1;

  if (isBottom && !loading.value) {
    loading.value = true;
    const limit = store?.localOptions.conversationLimit || 100;
    try {
      // 这里添加加载更多会话的逻辑
      if (enableV2CloudConversation) {
        const offset =
          store.uiStore.conversations[store.uiStore.conversations.length - 1]
            ?.sortOrder;
        await store?.conversationStore?.getConversationListActive(
          offset,
          limit
        );
      } else {
        const offset = store?.uiStore.localConversations[
          store.uiStore.localConversations.length - 1
        ]?.sortOrder as number;
        await store?.localConversationStore?.getConversationListActive(
          offset,
          limit
        );
      }
    } catch (error) {
      console.error("加载更多会话失败:", error);
    } finally {
      loading.value = false;
    }
  }
};

/** 会话左滑 */
const handleSessionItemLeftSlide = (
  conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI | null
) => {
  // 微信小程序点击也会触发左滑事件，但此时 conversation 为 null
  if (conversation) {
    currentMoveSessionId.value = conversation.conversationId;
  } else {
    currentMoveSessionId.value = "";
  }
};

let flag = false;
// 点击会话
const handleSessionItemClick = async (
  conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI
) => {
  if (flag) return;
  currentMoveSessionId.value = "";
  try {
    flag = true;
    await store?.uiStore.selectConversation(conversation.conversationId);
    router.push(neUiKitRouterPath.chat);
  } catch {
    showToast({
      message: t("selectSessionFailText"),
      type: "info",
    });
  } finally {
    flag = false;
  }
};

// 删除会话
const handleSessionItemDeleteClick = async (
  conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI
) => {
  try {
    if (enableV2CloudConversation) {
      await store?.conversationStore?.deleteConversationActive(
        conversation.conversationId
      );
    } else {
      await store?.localConversationStore?.deleteConversationActive(
        conversation.conversationId
      );
    }
    currentMoveSessionId.value = "";
  } catch {
    showToast({
      message: t("deleteSessionFailText"),
      type: "info",
    });
  }
};

// 置顶会话
const handleSessionItemStickTopChange = async (
  conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI
) => {
  if (conversation.stickTop) {
    try {
      if (enableV2CloudConversation) {
        await store?.conversationStore?.stickTopConversationActive(
          conversation.conversationId,
          false
        );
      } else {
        await store?.localConversationStore?.stickTopConversationActive(
          conversation.conversationId,
          false
        );
      }
    } catch {
      showToast({
        message: t("deleteStickTopFailText"),
        type: "info",
      });
    }
  } else {
    try {
      if (enableV2CloudConversation) {
        await store?.conversationStore?.stickTopConversationActive(
          conversation.conversationId,
          true
        );
      } else {
        await store?.localConversationStore?.stickTopConversationActive(
          conversation.conversationId,
          true
        );
      }
    } catch {
      showToast({
        message: t("addStickTopFailText"),
        type: "info",
      });
    }
  }
};

const showAddDropdown = () => {
  addDropdownVisible.value = true;
};

const hideAddDropdown = () => {
  addDropdownVisible.value = false;
};

const onDropdownClick = (urlType: "addFriend" | "createGroup") => {
  const urlMap = {
    // 添加好友
    addFriend: neUiKitRouterPath.addFriend,
    // 创建群聊
    createGroup: neUiKitRouterPath.teamCreate,
  };
  addDropdownVisible.value = false;
  const path = urlMap[urlType];

  router.push({
    name: urlType === "addFriend" ? "AddFriend" : "TeamCreate",
  });
};

/** 跳转至搜索页面 */
const goToSearchPage = () => {
  router.push(neUiKitRouterPath.conversationSearch);
};

/** 监听会话列表 */
const conversationListWatch = autorun(() => {
  const _conversationList = enableV2CloudConversation
    ? store?.uiStore?.conversations
    : store?.uiStore?.localConversations;

  conversationList.value = _conversationList?.sort(
    (
      a: V2NIMConversationForUI | V2NIMLocalConversationForUI,
      b: V2NIMConversationForUI | V2NIMLocalConversationForUI
    ) => b.sortOrder - a.sortOrder
  ) as (V2NIMConversationForUI | V2NIMLocalConversationForUI)[];

  // todo
  // setTabUnread();
});

onUnmounted(() => {
  addDropdownVisible.value = false;
  conversationListWatch();
});
</script>

<style scoped>
.conversation-wrapper {
  height: 100%;
  overflow: hidden;
  background-color: #fff;
}

.navigation-bar {
  position: fixed;
  height: 60px;
  border-bottom: 1px solid #e9eff5;
  padding-left: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  width: 100%;
  opacity: 1;
  z-index: 999;
}

.conversation-search {
  display: flex;
  align-items: center;
  height: 54px;
  box-sizing: border-box;
  overflow: hidden;
  padding: 10px;
}

.security-tip {
  padding: 0 10px;
  background: #fff5e1;
  height: 50px;
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  text-align: center;
  white-space: wrap;
  color: #eb9718;
  text-align: left;
  display: flex;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  height: 34px;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px 10px;
  background: #f3f5f7;
  border-radius: 5px;
}

.search-input {
  margin-left: 5px;
  color: #999999;
}

.search-icon-wrapper {
  height: 22px;
  display: flex;
  align-items: center;
}

.block {
  height: 60px;
  width: 100%;
  display: block;
}

.conversation-list-wrapper {
  height: calc(100% - 120px);
  box-sizing: border-box;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo-box {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: #000;
}
.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.logo-title {
  font-size: 20px;
  font-weight: 500;
  color: #000;
}

.button-icon-add {
  position: relative;
  right: 20px;
}

.dropdown-mark {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.dropdown-container {
  position: absolute;
  top: 100%;
  right: 30px;
  min-width: 122px;
  min-height: 40px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  box-shadow: 0px 4px 7px rgba(133, 136, 140, 0.25);
  border-radius: 8px;
  color: #000;
  z-index: 99;
}

.add-menu-list {
  padding: 15px 10px;
}
.add-menu-item {
  white-space: nowrap;
  font-size: 16px;
  padding-left: 5px;
  margin-bottom: 10px;
  height: 30px;
  line-height: 30px;
  display: flex;
  align-items: center;
}
.add-menu-item:last-child {
  margin-bottom: 0;
}

.conversation-block {
  width: 100%;
  height: 72px;
}
</style>
