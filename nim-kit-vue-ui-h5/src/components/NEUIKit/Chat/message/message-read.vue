<template>
  <div
    v-if="
      props.msg.sendingState ==
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

<script lang="ts" setup>
/** 消息已读未读组件 */

import { computed, ref, onMounted, onUnmounted, getCurrentInstance } from "vue";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import Icon from "../../CommonComponents/Icon.vue";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { useRouter } from "vue-router";

import { t } from "../../utils/i18n";
import { autorun } from "mobx";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";

const props = withDefaults(
  defineProps<{
    msg: V2NIMMessageForUI;
  }>(),
  {}
);
const router = useRouter();
const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
/** 是否需要显示群组消息已读未读，默认 false */
const teamManagerVisible = store?.localOptions.teamMsgReceiptVisible;

/** 是否需要显示 p2p 消息、p2p会话列表消息已读未读，默认 false */
const p2pMsgReceiptVisible = store?.localOptions.p2pMsgReceiptVisible;

/** 会话类型 */
const conversationType = nim.V2NIMConversationIdUtil.parseConversationType(
  props.msg.conversationId
) as unknown as V2NIMConst.V2NIMConversationType;

/** 单聊消息已读未读，用于UI变更 */
const p2pMsgRotateDeg = ref(0);

/**是否是云端会话 */
const enableV2CloudConversation = store?.sdkOptions?.enableV2CloudConversation;
const setP2pMsgRotateDeg = () => {
  /**如果是单聊 */
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
  ) {
    const conversation = enableV2CloudConversation
      ? store?.conversationStore?.conversations.get(props.msg.conversationId)
      : store?.localConversationStore?.conversations.get(
          props.msg.conversationId
        );

    p2pMsgRotateDeg.value =
      props?.msg?.createTime <= (conversation?.msgReceiptTime || 0) ? 360 : 0;
  }
};

const p2pMsgReadWatch = autorun(() => {
  setP2pMsgRotateDeg();
});

/** 跳转到已读未读详情 */
const jumpToTeamMsgReadInfo = () => {
  if (
    store?.connectStore.connectStatus !==
    V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED
  ) {
    showToast({
      message: t("offlineText"),
      type: "info",
    });
    return;
  }
  // 跳转到消息已读未读详情页
  if (props?.msg?.messageClientId && props?.msg?.conversationId) {
    router.push({
      path: neUiKitRouterPath.messageReadInfo,
      query: {
        messageClientId: props?.msg?.messageClientId,
        conversationId: props?.msg?.conversationId,
      },
    });
  }
};

/** 群消息已读未读，用于UI变更 */
const teamMsgRotateDeg = computed(() => {
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    const percentage =
      (props?.msg?.yxRead || 0) /
        ((props?.msg?.yxUnread || 0) + (props?.msg?.yxRead || 0)) || 0;
    return percentage * 360;
  }
  return 0;
});

onMounted(() => {
  setP2pMsgRotateDeg();
});

onUnmounted(() => {
  p2pMsgReadWatch();
});
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
