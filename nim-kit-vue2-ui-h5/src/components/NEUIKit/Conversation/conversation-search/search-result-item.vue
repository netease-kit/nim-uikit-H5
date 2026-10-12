<template>
  <div class="search-result-list-item" @click="handleItemClick">
    <div class="result-item-avatar">
      <Avatar :account="to" :avatar="teamAvatar" />
    </div>
    <div v-if="!isTeam" class="result-item-title">
      <Appellation :account="to" />
      <div class="result-item-account">{{ to }}</div>
    </div>
    <div v-else class="result-item-title">
      {{ teamName }}
    </div>
  </div>
</template>

<script>
import { t } from "../../utils/i18n";
import { showToast } from "../../utils/toast";
import Avatar from "../../CommonComponents/Avatar.vue";
import Appellation from "../../CommonComponents/Appellation.vue";
import { V2NIMConst } from "../../utils/sdk";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { uiKitStore } from "../../utils/init.js";

export default {
  name: "ConversationSearchResultItem",
  components: {
    Avatar,
    Appellation,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      store: uiKitStore,
      flag: false,
    };
  },
  computed: {
    teamAvatar() {
      return this.item.teamId ? this.item.avatar : undefined;
    },
    to() {
      return this.item.teamId ? this.item.teamId : this.item.accountId;
    },
    isTeam() {
      return !!this.item.teamId;
    },
    teamName() {
      return this.item.teamId ? this.item.name : "";
    },
    enableV2CloudConversation() {
      return this.store && this.store.sdkOptions
        ? this.store.sdkOptions.enableV2CloudConversation
        : false;
    },
  },
  methods: {
    async handleItemClick() {
      if (this.flag) return;
      try {
        this.flag = true;
        let conversationType;
        let receiverId;

        if (this.item.accountId) {
          conversationType =
            V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P;
          receiverId = this.item.accountId;
        } else if (this.item.teamId) {
          conversationType =
            V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM;
          receiverId = this.item.teamId;
        } else {
          throw new Error("unknown scene");
        }

        if (this.enableV2CloudConversation) {
          await this.store.conversationStore.insertConversationActive(
            conversationType,
            receiverId
          );
        } else {
          await this.store.localConversationStore.insertConversationActive(
            conversationType,
            receiverId
          );
        }

        this.$router.push(neUiKitRouterPath.chat);
      } catch (error) {
        showToast({
          message: t("selectSessionFailText"),
          type: "info",
        });
      } finally {
        this.flag = false;
      }
    },
  },
};
</script>

<style scoped>
.search-result-list-item {
  display: flex;
  align-items: center;
  height: 50px;
  margin: 10px 0;
}

.result-item-avatar {
  width: 42px;
}

.result-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 10px;
  font-size: 14px;
  color: #000;
}
.result-item-account {
  font-size: 13px;
  color: #b5b6b8;
}
</style>
