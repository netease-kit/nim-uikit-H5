<template>
  <div
    v-if="
      msg.sendingState ==
      V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED
    "
    class="msg-read-wrapper"
  >
    <div
      v-if="
        conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P &&
        p2pMsgReceiptVisible
      "
    >
      <div v-if="p2pMsgRotateDeg == 360" class="icon-read-wrapper">
        <Icon type="icon-read" :size="18"></Icon>
      </div>
      <div v-else class="sector">
        <span
          class="cover-1"
          :style="`transform: rotate(${p2pMsgRotateDeg}deg)`"
        ></span>
        <span
          :class="p2pMsgRotateDeg >= 180 ? 'cover-2 cover-3' : 'cover-2'"
        ></span>
      </div>
    </div>
    <div
      v-if="
        conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
        teamManagerVisible
      "
    >
      <div class="icon-read-wrapper" v-if="teamMsgRotateDeg == 360">
        <Icon type="icon-read" :size="18"></Icon>
      </div>
      <div v-else class="sector" @click="jumpToTeamMsgReadInfo">
        <span
          class="cover-1"
          :style="`transform: rotate(${teamMsgRotateDeg}deg)`"
        ></span>
        <span
          :class="teamMsgRotateDeg >= 180 ? 'cover-2 cover-3' : 'cover-2'"
        ></span>
      </div>
    </div>
  </div>
</template>

<script>
/** 消息已读未读组件 */

import Icon from "../../CommonComponents/Icon.vue";
import { V2NIMConst } from "../../utils/sdk";
import { t } from "../../utils/i18n";
import { autorun } from "../../utils/store.js";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Icon,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      p2pMsgRotateDeg: 0,
      p2pMsgReadWatch: null,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    teamManagerVisible() {
      return this.store?.localOptions.teamMsgReceiptVisible;
    },
    p2pMsgReceiptVisible() {
      return this.store?.localOptions.p2pMsgReceiptVisible;
    },
    conversationType() {
      return nim.V2NIMConversationIdUtil.parseConversationType(
        this.msg.conversationId
      );
    },
    enableV2CloudConversation() {
      return this.store?.sdkOptions?.enableV2CloudConversation;
    },
    teamMsgRotateDeg() {
      if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        const percentage =
          (this.msg?.yxRead || 0) /
            ((this.msg?.yxUnread || 0) + (this.msg?.yxRead || 0)) || 0;
        return percentage * 360;
      }
      return 0;
    },
  },
  mounted() {
    this.setP2pMsgRotateDeg();
    this.p2pMsgReadWatch = autorun(() => {
      this.setP2pMsgRotateDeg();
    });
  },
  beforeDestroy() {
    if (this.p2pMsgReadWatch) {
      this.p2pMsgReadWatch();
    }
  },
  methods: {
    setP2pMsgRotateDeg() {
      if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ) {
        const conversation = this.enableV2CloudConversation
          ? this.store?.conversationStore?.conversations.get(
              this.msg.conversationId
            )
          : this.store?.localConversationStore?.conversations.get(
              this.msg.conversationId
            );

        this.p2pMsgRotateDeg =
          this.msg?.createTime <= (conversation?.msgReceiptTime || 0) ? 360 : 0;
      }
    },
    jumpToTeamMsgReadInfo() {
      if (
        this.store?.connectStore.connectStatus !==
        V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED
      ) {
        showToast({
          message: t("offlineText"),
          type: "info",
        });
        return;
      }
      if (this.msg?.messageClientId && this.msg?.conversationId) {
        this.$router.push({
          path: neUiKitRouterPath.messageReadInfo,
          query: {
            messageClientId: this.msg?.messageClientId,
            conversationId: this.msg?.conversationId,
          },
        });
      }
    },
  },
};
</script>

<style scoped>
/* 消息已读状态容器 */
.msg-read-wrapper {
  align-self: flex-end;
}

/* 已读图标容器 */
.icon-read-wrapper {
  margin: 0 10px 5px 0;
}

/* 扇形进度容器 */
.sector {
  display: inline-block;
  position: relative;
  overflow: hidden;
  border: 2px solid #4c84ff;
  width: 16px;
  height: 16px;
  background-color: #eee;
  border-radius: 50%;
  margin: 0 10px 0 0;
}

/* 扇形进度遮罩层1 */
.cover-1 {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: #4c84ff;
  transform-origin: right;
}

/* 扇形进度遮罩层2 */
.cover-2 {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: #eee;
}

/* 扇形进度遮罩层3 */
.cover-3 {
  right: 0;
  background-color: #4c84ff;
}
</style>
