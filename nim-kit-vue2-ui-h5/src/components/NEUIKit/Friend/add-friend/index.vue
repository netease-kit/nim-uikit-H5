<template>
  <div class="add-friend-wrapper">
    <NavBar :title="t('addFriendText')" />
    <div class="search-input-wrapper">
      <div class="search-icon">
        <Icon :size="20" color="#A6ADB6" type="icon-sousuo"></Icon>
      </div>
      <Input
        class="search-input"
        type="text"
        v-model="searchText"
        @input="onInputValueChange"
        @confirm="handleSearch"
        placeholder-class="placeholder"
        :placeholder="t('enterAccount')"
        :inputStyle="{
          backgroundColor: '#f2f4f5',
        }"
      />
    </div>
    <Empty
      :text="t('noExistUser')"
      v-if="searchResState == 'searchEmpty'"
    ></Empty>
    <div class="user-wrapper" v-else-if="searchResState === 'searchResult'">
      <Avatar
        class="user-avatar"
        :account="(userInfo && userInfo.accountId) || ''"
      />
      <div class="user-info">
        <div class="user-nick">
          {{ (userInfo && userInfo.name) || (userInfo && userInfo.accountId) }}
        </div>
        <div class="user-id">{{ userInfo && userInfo.accountId }}</div>
      </div>
      <!-- 如果是好友之间去聊天，如果不是好友，添加好友 -->
      <Button
        v-if="relation !== 'stranger'"
        class="go-chat-button"
        :disabled="actionPending"
        @click="gotoChat"
      >
        {{ t("chatButtonText") }}
      </Button>
      <Button
        v-else
        class="go-chat-button"
        :disabled="actionPending"
        @click="applyFriend"
      >
        {{ t("addText") }}
      </Button>
    </div>
  </div>
</template>

<script>
import Avatar from "../../CommonComponents/Avatar.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import Empty from "../../CommonComponents/Empty.vue";
import { t } from "../../utils/i18n";
import Button from "../../CommonComponents/Button.vue";
import { autorun } from "../../utils/store.js";
import { V2NIMConst } from "../../utils/sdk";
import Input from "../../CommonComponents/Input.vue";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  name: "AddFriend",
  components: {
    Avatar,
    NavBar,
    Icon,
    Empty,
    Button,
    Input,
  },
  data() {
    return {
      searchResState: "beginSearch",
      userInfo: null,
      relation: "stranger",
      searchText: "",
      searchRequestId: 0,
      searchPending: false,
      actionPending: false,
      uninstallRelationWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
  },
  mounted() {
    this.uninstallRelationWatch = autorun(() => {
      this.store?.uiStore.friends;
      if (this.userInfo?.accountId) {
        this.relation = this.store?.uiStore.getRelation(
          this.userInfo.accountId
        ).relation;
      }
    });
  },
  beforeDestroy() {
    if (this.uninstallRelationWatch) {
      this.uninstallRelationWatch();
    }
  },
  methods: {
    async handleSearch(value) {
      const account = String(value || "").trim();
      const requestId = ++this.searchRequestId;
      if (!account) {
        this.searchPending = false;
        this.searchResState = "beginSearch";
        this.userInfo = null;
        this.relation = "stranger";
        return;
      }

      this.searchPending = true;
      try {
        const user = await this.store?.userStore.getUserActive(account);
        if (requestId !== this.searchRequestId) {
          return;
        }
        if (!user) {
          this.userInfo = null;
          this.relation = "stranger";
          this.searchResState = "searchEmpty";
        } else {
          this.userInfo = user;
          this.relation = this.store?.uiStore.getRelation(user.accountId).relation;
          this.searchResState = "searchResult";
        }
      } catch (error) {
        if (requestId !== this.searchRequestId) {
          return;
        }
        this.userInfo = null;
        this.relation = "stranger";
        this.searchResState = "searchEmpty";
        showToast({
          message: t("searchFailText"),
          type: "info",
        });
      } finally {
        if (requestId === this.searchRequestId) {
          this.searchPending = false;
        }
      }
    },
    async applyFriend() {
      if (this.actionPending) {
        return;
      }
      const account = this.userInfo?.accountId;
      if (account) {
        this.actionPending = true;
        try {
          await this.store?.friendStore.addFriendActive(account, {
            addMode:
              V2NIMConst.V2NIMFriendAddMode.V2NIM_FRIEND_MODE_TYPE_APPLY,
            postscript: "",
          });
          await this.store?.relationStore.removeUserFromBlockListActive(account);
          showToast({
            message: t("applyFriendSuccessText"),
            type: "info",
          });
        } catch (error) {
          showToast({
            message: t("applyFriendFailText"),
            type: "info",
          });
        } finally {
          this.actionPending = false;
        }
      }
    },
    async gotoChat() {
      if (this.actionPending) {
        return;
      }
      const to = this.userInfo?.accountId;
      if (to) {
        this.actionPending = true;
        try {
          const conversationId = nim?.V2NIMConversationIdUtil.p2pConversationId(
            to
          );
          await this.store?.uiStore.selectConversation(conversationId);
          this.$router.push(neUiKitRouterPath.chat);
        } catch (error) {
          showToast({
            message: t("gotoChatFailText"),
            type: "info",
          });
        } finally {
          this.actionPending = false;
        }
      }
    },
    onInputValueChange() {
      this.searchRequestId += 1;
      this.searchPending = false;
      this.searchResState = "beginSearch";
      this.userInfo = null;
      this.relation = "stranger";
    },
  },
};
</script>

<style scoped>
.add-friend-wrapper {
  height: 100%;
  background-color: #fff;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f2f4f5;
  box-sizing: border-box;
  margin: 10px;
  padding: 3px 5px;
  border-radius: 3px;
}
.search-icon {
  color: #a6adb6;
  background-size: 100% 100%;
  width: 20px;
  height: 20px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-input {
  display: inline-block;
  background-color: #f2f4f5;
  flex: 1;
}

.placeholder {
  color: #a6adb6;
}

.user-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 10px;
  box-sizing: border-box;
}
.user-avatar {
  flex: 0 0 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-block;
}
.go-chat-button {
  height: 30px;
  font-size: 14px;
  line-height: 30px;
  margin: 5px;
  flex: 0 0 70px;
}
.user-info {
  flex: 1;
  margin-left: 15px;
  overflow: hidden;
  color: #000;
}
.user-nick {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.user-id {
  width: 100%;
  font-size: 14px;
  color: #b5b6b8;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
