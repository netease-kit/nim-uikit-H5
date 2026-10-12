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
      <Empty
        v-if="conversationList.length === 0"
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

<script>
/** 会话列表主界面 */
import { autorun } from "../utils/store.js";
import Icon from "../CommonComponents/Icon.vue";
import NetworkAlert from "../CommonComponents/NetworkAlert.vue";
import Empty from "../CommonComponents/Empty.vue";
import ConversationItem from "./conversation-item.vue";
import { t } from "../utils/i18n";
import { showToast } from "../utils/toast";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { trackInit } from "../utils/reporter";
import { V2NIMConst } from "../utils/sdk";
import { nim, uiKitStore } from "../utils/init.js";

export default {
  components: {
    Icon,
    NetworkAlert,
    Empty,
    ConversationItem,
  },
  data() {
    return {
      conversationList: [],
      addDropdownVisible: false,
      currentMoveSessionId: "",
      buttonClass: "button-box",
      loading: false,
      flag: false,
      conversationListWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    enableV2CloudConversation() {
      return this.store?.sdkOptions?.enableV2CloudConversation;
    },
  },
  mounted() {
    trackInit("ContactUIKit", nim?.options?.appkey);
    this.store?.uiStore.selectConversation("");
    this.conversationListWatch = autorun(() => {
      const conversationList = this.enableV2CloudConversation
        ? this.store?.uiStore?.conversations
        : this.store?.uiStore?.localConversations;

      this.conversationList = (conversationList || [])
        .slice()
        .sort((a, b) => b.sortOrder - a.sortOrder);
    });
  },
  beforeDestroy() {
    this.addDropdownVisible = false;
    if (this.conversationListWatch) {
      this.conversationListWatch();
    }
  },
  methods: {
    async handleScroll(event) {
      const target = event.target;
      if (!target) {
        return;
      }

      const isBottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 1;

      if (isBottom && !this.loading) {
        this.loading = true;
        const limit = this.store?.localOptions.conversationLimit || 100;
        try {
          if (this.enableV2CloudConversation) {
            const offset =
              this.store.uiStore.conversations[
                this.store.uiStore.conversations.length - 1
              ]?.sortOrder;
            await this.store?.conversationStore?.getConversationListActive(
              offset,
              limit
            );
          } else {
            const offset =
              this.store?.uiStore.localConversations[
                this.store.uiStore.localConversations.length - 1
              ]?.sortOrder;
            await this.store?.localConversationStore?.getConversationListActive(
              offset,
              limit
            );
          }
        } catch (error) {
          console.error("加载更多会话失败:", error);
        } finally {
          this.loading = false;
        }
      }
    },
    handleSessionItemLeftSlide(conversation) {
      this.currentMoveSessionId = conversation
        ? conversation.conversationId
        : "";
    },
    async handleSessionItemClick(conversation) {
      if (this.flag) {
        return;
      }
      this.currentMoveSessionId = "";
      try {
        this.flag = true;
        if (
          conversation.type ===
            V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM ||
          conversation.type ===
            V2NIMConst.V2NIMConversationType
              .V2NIM_CONVERSATION_TYPE_SUPER_TEAM
        ) {
          if (this.store?.sdkOptions?.enableV2CloudConversation) {
            await this.store?.conversationStore?.markConversationReadActive(
              conversation.conversationId
            );
          } else {
            await this.store?.localConversationStore?.markConversationReadActive(
              conversation.conversationId
            );
          }
        }

        await this.store?.uiStore.selectConversation(
          conversation.conversationId
        );
        this.$router.push(neUiKitRouterPath.chat);
      } catch {
        showToast({
          message: t("selectSessionFailText"),
          type: "info",
        });
      } finally {
        this.flag = false;
      }
    },
    async handleSessionItemDeleteClick(conversation) {
      try {
        if (this.enableV2CloudConversation) {
          await this.store?.conversationStore?.deleteConversationActive(
            conversation.conversationId
          );
        } else {
          await this.store?.localConversationStore?.deleteConversationActive(
            conversation.conversationId
          );
        }
        this.currentMoveSessionId = "";
      } catch {
        showToast({
          message: t("deleteSessionFailText"),
          type: "info",
        });
      }
    },
    async handleSessionItemStickTopChange(conversation) {
      if (conversation.stickTop) {
        try {
          if (this.enableV2CloudConversation) {
            await this.store?.conversationStore?.stickTopConversationActive(
              conversation.conversationId,
              false
            );
          } else {
            await this.store?.localConversationStore?.stickTopConversationActive(
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
          if (this.enableV2CloudConversation) {
            await this.store?.conversationStore?.stickTopConversationActive(
              conversation.conversationId,
              true
            );
          } else {
            await this.store?.localConversationStore?.stickTopConversationActive(
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
    },
    showAddDropdown() {
      this.addDropdownVisible = true;
    },
    hideAddDropdown() {
      this.addDropdownVisible = false;
    },
    onDropdownClick(urlType) {
      this.addDropdownVisible = false;
      this.$router.push({
        name: urlType === "addFriend" ? "AddFriend" : "TeamCreate",
      });
    },
    goToSearchPage() {
      this.$router.push(neUiKitRouterPath.conversationSearch);
    },
  },
};
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
