<template>
  <div
    class="p2p-msg-receipt-wrapper"
    v-if="
      conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P &&
      p2pMsgReceiptVisible
    "
  >
    <div v-if="p2pMsgRotateDeg == 360" class="icon-read-wrapper">
      <Icon type="icon-read" :size="16"></Icon>
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
</template>

<script>
import Icon from "../CommonComponents/Icon.vue";
import { V2NIMConst } from "../utils/sdk";
import { nim, uiKitStore } from "../utils/init.js";

export default {
  name: "ConversationItemRead",
  components: {
    Icon,
  },
  props: {
    conversation: {
      type: Object,
      required: true,
    },
  },
  computed: {
    p2pMsgReceiptVisible() {
      return uiKitStore.localOptions.p2pMsgReceiptVisible;
    },
    conversationType() {
      return nim.V2NIMConversationIdUtil.parseConversationType(
        this.conversation.conversationId
      );
    },
    p2pMsgRotateDeg() {
      return (this.conversation.msgReceiptTime || 0) >=
        (this.conversation.lastMessage &&
        this.conversation.lastMessage.messageRefer
          ? this.conversation.lastMessage.messageRefer.createTime
          : 0)
        ? 360
        : 0;
    },
  },
  data() {
    return {
      V2NIMConst,
    };
  },
};
</script>

<style scoped>
/* 消息已读状态容器 */
.p2p-msg-receipt-wrapper {
  width: 22px;
  height: 22px;
  overflow: hidden;
  line-height: 18px;
  vertical-align: bottom;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 已读图标容器 */
.icon-read-wrapper {
  margin: 0 3px 0 0;
  width: 18px;
  height: 18px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

/* 扇形进度容器 */
.sector {
  display: inline-block;
  position: relative;
  overflow: hidden;
  border: 2px solid #4c84ff;
  width: 14px;
  height: 14px;
  background-color: #fff;
  border-radius: 50%;
  margin: 0 3px 0 0;
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
  background-color: #fff;
}

/* 扇形进度遮罩层3 */
.cover-3 {
  right: 0;
  background-color: #4c84ff;
}
</style>
