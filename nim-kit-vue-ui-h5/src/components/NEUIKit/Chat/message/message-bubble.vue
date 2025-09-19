<template>
  <!-- 收到的消息 -->
  <Tooltip
    v-if="!props.msg.isSelf"
    :placement="placement"
    ref="tooltipRef"
    color="white"
  >
    <template #content>
      <div class="msg-action-groups" v-if="!isUnknownMsg">
        <div
          class="msg-action-btn"
          v-if="
            props.msg.messageType ===
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
          "
          @click="handleCopy"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-fuzhi1"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("copyText") }}</text>
        </div>
        <div
          v-if="
            props.msg.messageType !==
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
          "
          class="msg-action-btn"
          @click="handleReplyMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-huifu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("replyText") }}</text>
        </div>
        <div
          v-if="
            props.msg.messageType !==
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO &&
            props.msg.messageType !==
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
          "
          class="msg-action-btn"
          @click="handleForwardMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-zhuanfa"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("forwardText") }}</text>
        </div>

        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
        </div>
      </div>
      <!-- 未知消息体 -->
      <div class="msg-action-groups-unknown" v-else>
        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
        </div>
      </div>
    </template>
    <div v-if="bgVisible" class="msg-bg msg-bg-in">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </Tooltip>
  <!-- 消息发送中 -->
  <div
    v-else-if="
      props.msg.sendingState ===
      V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SENDING
    "
    class="msg-status-wrapper"
  >
    <Icon
      :size="21"
      color="#337EFF"
      class="msg-status-icon icon-loading"
      type="icon-a-Frame8"
    ></Icon>
    <Tooltip
      :placement="placement"
      ref="tooltipRef"
      color="white"
      :align="props.msg.isSelf"
    >
      <template #content>
        <div class="msg-action-groups">
          <div
            class="msg-action-btn"
            v-if="
              props.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
            "
            @click="handleCopy"
          >
            <Icon
              :size="18"
              color="#656A72"
              class="msg-action-btn-icon"
              type="icon-fuzhi1"
            ></Icon>
            <text class="msg-action-btn-text">{{ t("copyText") }}</text>
          </div>
          <div class="msg-action-btn" @click="handleDeleteMsg">
            <Icon
              :size="18"
              color="#656A72"
              class="msg-action-btn-icon"
              type="icon-shanchu"
            ></Icon>
            <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
          </div>
        </div>
      </template>
      <div v-if="bgVisible" class="msg-bg msg-bg-out">
        <slot></slot>
      </div>
      <slot v-else></slot>
    </Tooltip>
  </div>
  <!-- 消息发送失败 -->
  <div
    v-else-if="
      props.msg.sendingState ===
        V2NIMConst.V2NIMMessageSendingState
          .V2NIM_MESSAGE_SENDING_STATE_FAILED ||
      props.msg.messageStatus.errorCode === 102426 ||
      props.msg.messageStatus.errorCode === 104404
    "
    class="msg-failed-wrapper"
  >
    <div class="msg-failed">
      <div class="msg-status-wrapper" @click="handleResendMsg">
        <div class="icon-fail">!</div>
      </div>
      <Tooltip
        :placement="placement"
        ref="tooltipRef"
        color="white"
        :align="props.msg.isSelf"
      >
        <template #content>
          <div
            class="msg-action-groups"
            :style="{
              width:
                props.msg.messageType ===
                V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
                  ? '112px'
                  : '56px',
            }"
          >
            <div
              class="msg-action-btn"
              v-if="
                props.msg.messageType ===
                V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
              "
              @click="handleCopy"
            >
              <Icon
                :size="18"
                color="#656A72"
                class="msg-action-btn-icon"
                type="icon-fuzhi1"
              ></Icon>
              <text class="msg-action-btn-text">{{ t("copyText") }}</text>
            </div>
            <div class="msg-action-btn" @click="handleDeleteMsg">
              <Icon
                :size="18"
                color="#656A72"
                class="msg-action-btn-icon"
                type="icon-shanchu"
              ></Icon>
              <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
            </div>
          </div>
        </template>
        <div v-if="bgVisible" class="msg-bg msg-bg-out">
          <slot></slot>
        </div>
        <slot v-else></slot>
      </Tooltip>
    </div>
    <div
      class="in-blacklist"
      v-if="props.msg.messageStatus.errorCode === 102426"
    >
      {{ t("sendFailWithInBlackText") }}
    </div>
    <div
      class="friend-delete"
      v-else-if="props.msg.messageStatus.errorCode === 104404"
    >
      {{ t("sendFailWithDeleteText") }}
      <span @click="addFriend" class="friend-verification">{{
        t("friendVerificationText")
      }}</span>
    </div>
  </div>
  <!-- 发出的消息 -->
  <Tooltip
    v-else-if="tooltipVisible"
    :placement="placement"
    ref="tooltipRef"
    color="white"
    :align="props.msg.isSelf"
  >
    <template #content>
      <div class="msg-action-groups" v-if="!isUnknownMsg">
        <div
          class="msg-action-btn"
          v-if="
            props.msg.messageType ===
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
          "
          @click="handleCopy"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-fuzhi1"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("copyText") }}</text>
        </div>
        <div
          v-if="
            props.msg.messageType !==
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
          "
          class="msg-action-btn"
          @click="handleReplyMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-huifu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("replyText") }}</text>
        </div>
        <div
          v-if="
            props.msg.messageType !==
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO &&
            props.msg.messageType !==
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
          "
          class="msg-action-btn"
          @click="handleForwardMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-zhuanfa"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("forwardText") }}</text>
        </div>

        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
        </div>
        <div class="msg-action-btn" @click="handleRecallMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-chehui"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("recallText") }}</text>
        </div>
      </div>
      <!-- 未知消息体 -->
      <div class="msg-action-groups-unknown" v-else>
        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
        </div>
      </div>
    </template>
    <div v-if="bgVisible" class="msg-bg msg-bg-out">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </Tooltip>

  <MessageForward
    v-model="showForward"
    :msgIdClient="msg.messageClientId"
    @close="showForward = false"
  />
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, getCurrentInstance } from "vue";
//@ts-ignore
import Tooltip from "../../CommonComponents/Tooltip.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { events } from "../../utils/constants";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { autorun } from "mobx";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { msgRecallTime } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { copyText } from "../../utils";
import emitter from "../../utils/eventBus";
import MessageForward from "./message-forward.vue";
import { showModal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import router from "@/router";
const tooltipRef = ref(null);

const props = withDefaults(
  defineProps<{
    msg: V2NIMMessageForUI;
    tooltipVisible?: boolean;
    bgVisible?: boolean;
    placement?: string;
  }>(),
  {}
);

const { proxy } = getCurrentInstance()!; // 获取组件实例

const store = proxy?.$UIKitStore;

onMounted(() => {
  // 当前版本仅支持文本、图片、文件、语音、视频 话单消息，其他消息类型统一为未知消息
  isUnknownMsg.value = !(
    props.msg.messageType ==
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ||
    props.msg.messageType ==
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ||
    props.msg.messageType ==
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE ||
    props.msg.messageType ==
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO ||
    props.msg.messageType ==
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO ||
    props.msg.messageType == V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
  );
});
// 是否是好友
const isFriend = ref(true);

// 未知消息
const isUnknownMsg = ref(false);

const closeTooltip = () => {
  // @ts-ignore
  tooltipRef?.value?.close();
};

// 复制消息
const handleCopy = async () => {
  closeTooltip();
  let timer = setTimeout(() => {
    try {
      copyText(props.msg.text as string);
      showToast({
        message: t("copySuccessText"),
        type: "info",
        duration: 2000,
      });
    } catch (err) {
      showToast({
        message: t("copyFailText"),
        type: "info",
        duration: 2000,
      });
    } finally {
      clearTimeout(timer);
    }
  }, 200);
};

// 滚动到底部
const scrollBottom = () => {
  emitter.emit(events.ON_SCROLL_BOTTOM);
};

// 重发消息
const handleResendMsg = async () => {
  const _msg = props.msg as V2NIMMessageForUI;
  proxy?.$UIKitStore.msgStore.removeMsg(_msg.conversationId, [
    _msg.messageClientId,
  ]);

  try {
    switch (_msg.messageType) {
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE:
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO:
        store?.msgStore.sendMessageActive({
          msg: _msg,
          conversationId: _msg.conversationId,
          progress: () => true,
          sendBefore: () => {
            scrollBottom();
          },
        });
        break;
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT:
        store?.msgStore.sendMessageActive({
          msg: _msg,
          conversationId: _msg.conversationId,
          sendBefore: () => {
            scrollBottom();
          },
        });
        break;
      default:
        store?.msgStore.sendMessageActive({
          msg: _msg,
          conversationId: _msg.conversationId,
          sendBefore: () => {
            scrollBottom();
          },
        });
        break;
    }
    scrollBottom();
  } catch (error) {
    console.log(error);
  }
};

// 转发消息
const showForward = ref(false);

const handleForwardMsg = () => {
  showForward.value = true;
};

// 回复消息
const handleReplyMsg = async () => {
  const _msg = props.msg;

  proxy?.$UIKitStore.msgStore.replyMsgActive(_msg);
  closeTooltip();
  emitter.emit(events.REPLY_MSG, props.msg);
  // 在群里回复其他人的消息，也是@被回复人
  if (
    props.msg.conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
    !props.msg.isSelf
  ) {
    emitter.emit(events.AIT_TEAM_MEMBER, {
      accountId: props.msg.senderId,
      appellation: store?.uiStore.getAppellation({
        account: props.msg.senderId,
        teamId: props.msg.receiverId,
        ignoreAlias: true,
      }),
    });
  }
};

// 撤回消息
const handleRecallMsg = () => {
  const diff = Date.now() - props.msg.createTime;
  if (diff > msgRecallTime) {
    showToast({
      message: t("msgRecallTimeErrorText"),
      type: "info",
    });
    closeTooltip();
    return;
  }
  showModal({
    title: t("recallText"),
    content: t("recall3"),
    confirmText: t("recallText"),
    onConfirm: () => {
      proxy?.$UIKitStore.msgStore.reCallMsgActive(props.msg).catch(() => {
        showToast({
          message: t("recallMsgFailText"),
          type: "info",
        });
      });
      closeTooltip();
    },
    onCancel: () => {
      closeTooltip();
    },
  });
};

// 删除消息
const handleDeleteMsg = () => {
  const _msg = props.msg;
  showModal({
    title: t("deleteText"),
    content: t("delete"),
    confirmText: t("deleteText"),
    onConfirm: () => {
      proxy?.$UIKitStore.msgStore
        .deleteMsgActive([_msg])
        .then(() => {
          showToast({
            message: t("deleteMsgSuccessText"),
            type: "info",
            duration: 2000,
          });
        })
        .catch(() => {
          showToast({
            message: t("deleteMsgFailText"),
            type: "info",
            duration: 2000,
          });
        });
      closeTooltip();
    },
    onCancel: () => {
      closeTooltip();
    },
  });
};

// 添加好友
const addFriend = () => {
  router.push({
    path: neUiKitRouterPath.friendCard,
    query: {
      accountId: props.msg.receiverId,
    },
  });
};

const uninstallFriendsWatch = autorun(() => {
  const _isFriend = proxy?.$UIKitStore.uiStore.friends
    .filter(
      (item) =>
        !proxy?.$UIKitStore.relationStore.blacklist.includes(item.accountId)
    )
    .map((item) => item.accountId)
    .some((item: any) => item.account === props.msg.receiverId);
  isFriend.value = _isFriend as boolean;
});

//卸载监听
onUnmounted(() => {
  uninstallFriendsWatch();
});
</script>

<style scoped>
.msg-bg {
  max-width: 63vw;
  overflow: hidden;
  padding: 12px 16px;
}

.msg-bg-in {
  border-radius: 0 8px 8px 8px;
  background-color: #e8eaed;
  margin-left: 8px;
}

.msg-bg-out {
  border-radius: 8px 0 8px 8px;
  background-color: #d6e5f6;
  margin-right: 8px;
}

.msg-action-groups {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  max-width: 224px;
  width: max-content;
}

.msg-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  width: 56px;
}

.msg-action-btn-icon {
  color: #656a72;
  font-size: 18px;
}

.msg-action-btn-text {
  color: #000;
  font-size: 14px;
  word-break: keep-all;
}

.msg-failed-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
}

.msg-failed-wrapper .in-blacklist {
  color: #b3b7bc;
  font-size: 14px;
  position: relative;
  right: 20%;
  margin: 10px 0;
}

.msg-failed-wrapper .friend-delete {
  color: #b3b7bc;
  font-size: 14px;
  margin: 10px 0;
}

.msg-failed-wrapper .friend-delete .friend-verification {
  color: #337eff;
  font-size: 14px;
}

.msg-status-wrapper {
  display: flex;
  flex-direction: row;
  margin-right: 8px;
  box-sizing: border-box;
  position: relative;
}

.msg-status-wrapper .msg-bg-out {
  margin-right: 0;
  flex: 1;
}

.msg-status-icon {
  margin-right: 8px;
  font-size: 21px;
}

@keyframes loadingCircle {
  100% {
    transform: rotate(360deg);
  }
}

.msg-status-icon.icon-loading {
  color: #337eff;
  animation: loadingCircle 1s infinite linear;
  position: absolute;
  bottom: 0px;
  left: -30px;
}

.icon-fail {
  background: #fc596a;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  margin-right: 5px;
  font-size: 15px;
}

.msg-failed {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
