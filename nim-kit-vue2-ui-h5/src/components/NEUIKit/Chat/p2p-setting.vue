<template>
  <div class="p2p-set-container-wrapper">
    <NavBar :title="t('setText')" />
    <div class="p2p-set-container">
      <div class="p2p-set-card">
        <div class="p2p-set-item">
          <div class="p2p-set-my-info">
            <Avatar :account="account" />
            <div class="p2p-set-my-nick">{{ myNick }}</div>
          </div>
          <div class="member-add" @click="addTeamMember">
            <Icon type="icon-tianjiaanniu" />
          </div>
        </div>
      </div>
      <div class="p2p-set-card">
        <div class="p2p-set-item p2p-set-item-flex-sb">
          <div>{{ t("sessionMuteText") }}</div>
          <UIKitSwitch
            :checked="!isMute"
            :disabled="mutePending"
            @change="changeSessionMute"
          />
        </div>
        <div class="p2p-set-item p2p-set-item-flex-sb">
          <div>{{ t("stickTopText") }}</div>
          <UIKitSwitch
            :checked="isStickTop"
            :disabled="stickTopPending"
            @change="changeStickTopInfo"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**单聊设置组件 */

import NavBar from "../CommonComponents/NavBar.vue";
import Avatar from "../CommonComponents/Avatar.vue";
import Icon from "../CommonComponents/Icon.vue";

import { autorun } from "../utils/store.js";
import { t } from "../utils/i18n";
import { V2NIMConst } from "../utils/sdk";
import { toast } from "../utils/toast";
import UIKitSwitch from "../CommonComponents/Switch.vue";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { nim, uiKitStore } from "../utils/init.js";

export default {
  components: {
    NavBar,
    Avatar,
    Icon,
    UIKitSwitch,
  },
  data() {
    return {
      myNick: "",
      conversation: null,
      isMute: false,
      isStickTop: false,
      mutePending: false,
      stickTopPending: false,
      account: "",
      conversationId: "",
      p2pSetWatch: null,
      t,
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
    const accountId = this.$route.query.accountId || "";
    this.account = accountId;

    const conversationId =
      nim.V2NIMConversationIdUtil.p2pConversationId(accountId);
    this.conversationId = conversationId;

    this.p2pSetWatch = autorun(() => {
      this.conversation = this.enableV2CloudConversation
        ? this.store.conversationStore?.conversations.get(conversationId)
        : this.store.localConversationStore?.conversations.get(conversationId);

      this.myNick = this.store.uiStore.getAppellation({
        account: accountId,
      });
      this.isMute = this.store.relationStore.mutes.includes(accountId);
      this.isStickTop = !!this.conversation?.stickTop;
    });
  },
  beforeDestroy() {
    if (this.p2pSetWatch) {
      this.p2pSetWatch();
    }
  },
  methods: {
    addTeamMember() {
      const to = nim.V2NIMConversationIdUtil.parseConversationTargetId(
        this.conversationId
      );
      this.$router.push({
        path: neUiKitRouterPath.teamCreate,
        query: {
          p2pConversationId: to,
        },
      });
    },
    async changeSessionMute(value) {
      if (this.mutePending) {
        return;
      }
      this.mutePending = true;
      try {
        await this.store.relationStore.setP2PMessageMuteModeActive(
          this.account,
          !value
            ? V2NIMConst.V2NIMP2PMessageMuteMode.V2NIM_P2P_MESSAGE_MUTE_MODE_ON
            : V2NIMConst.V2NIMP2PMessageMuteMode
                .V2NIM_P2P_MESSAGE_MUTE_MODE_OFF
        );
      } catch (error) {
        toast.info(
          !value ? t("sessionMuteFailText") : t("sessionUnMuteFailText")
        );
      } finally {
        this.mutePending = false;
      }
    },
    async changeStickTopInfo(value) {
      if (this.stickTopPending) {
        return;
      }
      this.stickTopPending = true;
      const checked = value;
      try {
        if (this.enableV2CloudConversation) {
          await this.store.conversationStore?.stickTopConversationActive(
            this.conversationId,
            checked
          );
        } else {
          await this.store.localConversationStore?.stickTopConversationActive(
            this.conversationId,
            checked
          );
        }
      } catch (error) {
        toast.info(
          checked ? t("addStickTopFailText") : t("deleteStickTopFailText")
        );
      } finally {
        this.stickTopPending = false;
      }
    },
  },
};
</script>

<style scoped>
.p2p-set-container-wrapper {
  height: 100vh;
  background-color: #fff;
}
.p2p-set-container {
  height: 100%;
  box-sizing: border-box;
  background-color: #eff1f4;
  padding: 10px 20px;
}

.p2p-set-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 0 8px 0 10px;
  margin-bottom: 10px;
}

.p2p-set-button {
  text-align: center;
  background: #ffffff;
  border-radius: 8px;
  color: #e6605c;
  height: 40px;
  line-height: 40px;
}

.p2p-set-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 10px 0;
  color: #000;
}

.p2p-set-item:not(:last-child) {
  border-bottom: 1px solid #f5f8fc;
}

.p2p-set-item-flex-sb {
  justify-content: space-between;
}

.p2p-set-my-info {
  margin-right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.p2p-set-my-nick {
  margin-top: 5px;
  color: #000;
  font-size: 12px;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-icon {
  margin: 0 16px;
  color: #999999;
}

.p2p-info-item {
  height: 70px;
  display: flex;
  align-items: center;
}

.p2p-info-title {
  font-size: 16px;
  margin-left: 10px;
  width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.p2p-members-item {
  height: 90px;
}

.p2p-members-info-item {
  display: flex;
  align-items: center;
}

.p2p-members-info {
  height: 40px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.p2p-info-subtitle {
  color: #999999;
}

.member-list {
  white-space: nowrap;
  overflow-x: hidden;
  margin-right: 30px;
  height: 50px;
  display: flex;
  align-items: center;
}

.member-add {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  border: 1px dashed #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-item {
  margin-right: 10px;
  display: inline-block;
  flex-shrink: 0;
}
</style>
