<template>
  <!-- 收到的消息 -->
  <Tooltip
    v-if="!props.readonly && !props.msg.isSelf && !props.isMultiSelecting && !props.msg.recallType"
    :placement="placement"
    ref="tooltipRef"
    color="white"
  >
    <template #content>
      <div
        class="msg-action-groups"
        v-if="!isUnknownMsg"
        :style="actionGroupStyle(normalActionCount)"
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
        <div
          v-if="canPinMsg"
          class="msg-action-btn"
          @click="handlePinMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-pin"
          ></Icon>
          <text class="msg-action-btn-text">{{
            pinned ? t("unpinText") : t("pinText")
          }}</text>
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
        <div class="msg-action-btn" @click="handleMultiSelect">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-multi-select"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("multiSelectText") }}</text>
        </div>
        <div
          v-if="isUnconvertedVoiceMsg"
          class="msg-action-btn"
          @click="handleVoiceToText"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-voice-to-text"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("voiceToTextText") }}</text>
        </div>
        <div
          v-if="canCollectMsg"
          class="msg-action-btn"
          @click="handleCollectMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-collection"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("collectionText") }}</text>
        </div>
      </div>
      <!-- 未知消息体 -->
      <div class="msg-action-groups-unknown" v-else :style="actionGroupStyle(2)">
        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
        </div>
        <div class="msg-action-btn" @click="handleMultiSelect">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-multi-select"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("multiSelectText") }}</text>
        </div>
      </div>
    </template>
    <div v-if="bgVisible" :class="getBubbleClass('msg-bg-in')">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </Tooltip>
  <template v-else-if="!props.msg.isSelf">
    <div v-if="bgVisible" :class="getBubbleClass('msg-bg-in')">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </template>
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
      v-if="!props.readonly && !props.isMultiSelecting"
      :placement="placement"
      ref="tooltipRef"
      color="white"
      :align="props.msg.isSelf"
    >
      <template #content>
        <div
          class="msg-action-groups"
          :style="
            actionGroupStyle(
              props.msg.messageType ===
                V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
                ? 3
                : 2
            )
          "
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
          <div class="msg-action-btn" @click="handleMultiSelect">
            <Icon
              :size="18"
              color="#656A72"
              class="msg-action-btn-icon"
              type="icon-multi-select"
            ></Icon>
            <text class="msg-action-btn-text">{{ t("multiSelectText") }}</text>
          </div>
        </div>
      </template>
      <div v-if="bgVisible" :class="getBubbleClass('msg-bg-out')">
        <slot></slot>
      </div>
      <slot v-else></slot>
    </Tooltip>
    <template v-else>
      <div v-if="bgVisible" :class="getBubbleClass('msg-bg-out')">
        <slot></slot>
      </div>
      <slot v-else></slot>
    </template>
  </div>
  <!-- 消息发送失败 -->
  <div
    v-else-if="
      props.msg.sendingState ===
        V2NIMConst.V2NIMMessageSendingState
          .V2NIM_MESSAGE_SENDING_STATE_FAILED ||
      isMessageStatusFailed
    "
    class="msg-failed-wrapper"
  >
    <div class="msg-failed">
      <div class="msg-status-wrapper" @click="handleResendMsg">
        <div class="icon-fail">!</div>
      </div>
      <Tooltip
        v-if="!props.readonly && !props.isMultiSelecting"
        :placement="placement"
        ref="tooltipRef"
        color="white"
        :align="props.msg.isSelf"
      >
        <template #content>
          <div
            class="msg-action-groups"
            :style="
              actionGroupStyle(
                props.msg.messageType ===
                  V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
                  ? 3
                  : 2
              )
            "
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
            <div class="msg-action-btn" @click="handleMultiSelect">
              <Icon
                :size="18"
                color="#656A72"
                class="msg-action-btn-icon"
                type="icon-multi-select"
              ></Icon>
              <text class="msg-action-btn-text">{{ t("multiSelectText") }}</text>
            </div>
          </div>
        </template>
        <div v-if="bgVisible" :class="getBubbleClass('msg-bg-out')">
          <slot></slot>
        </div>
        <slot v-else></slot>
      </Tooltip>
      <template v-else>
        <div v-if="bgVisible" :class="getBubbleClass('msg-bg-out')">
          <slot></slot>
        </div>
        <slot v-else></slot>
      </template>
    </div>
    <div
      class="in-blacklist"
      v-if="props.msg.messageStatus?.errorCode === 102426"
    >
      {{ t("sendFailWithInBlackText") }}
    </div>
    <div
      class="friend-delete"
      v-else-if="props.msg.messageStatus?.errorCode === 104404"
    >
      {{ t("sendFailWithDeleteText") }}
      <span @click="addFriend" class="friend-verification">{{
        t("friendVerificationText")
      }}</span>
    </div>
  </div>
  <!-- 发出的消息 -->
  <Tooltip
    v-else-if="tooltipVisible && !props.readonly && !props.isMultiSelecting && !props.msg.recallType"
    :placement="placement"
    ref="tooltipRef"
    color="white"
    :align="props.msg.isSelf"
  >
    <template #content>
      <div
        class="msg-action-groups"
        v-if="!isUnknownMsg"
        :style="actionGroupStyle(normalActionCount)"
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
        <div
          v-if="canPinMsg"
          class="msg-action-btn"
          @click="handlePinMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-pin"
          ></Icon>
          <text class="msg-action-btn-text">{{
            pinned ? t("unpinText") : t("pinText")
          }}</text>
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
        <div
          v-if="
            props.msg.messageType !==
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
          "
          class="msg-action-btn"
          @click="handleRecallMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-chehui"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("recallText") }}</text>
        </div>
        <div class="msg-action-btn" @click="handleMultiSelect">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-multi-select"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("multiSelectText") }}</text>
        </div>
        <div
          v-if="isUnconvertedVoiceMsg"
          class="msg-action-btn"
          @click="handleVoiceToText"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-voice-to-text"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("voiceToTextText") }}</text>
        </div>
        <div
          v-if="canCollectMsg"
          class="msg-action-btn"
          @click="handleCollectMsg"
        >
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-collection"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("collectionText") }}</text>
        </div>
      </div>
      <!-- 未知消息体 -->
      <div class="msg-action-groups-unknown" v-else :style="actionGroupStyle(2)">
        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("deleteText") }}</text>
        </div>
        <div class="msg-action-btn" @click="handleMultiSelect">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-multi-select"
          ></Icon>
          <text class="msg-action-btn-text">{{ t("multiSelectText") }}</text>
        </div>
      </div>
    </template>
    <div v-if="bgVisible" :class="getBubbleClass('msg-bg-out')">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </Tooltip>
  <template v-else>
    <div v-if="bgVisible" :class="getBubbleClass(props.msg.isSelf ? 'msg-bg-out' : 'msg-bg-in')">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </template>

  <MessageForward
    v-model="showForward"
    :msgIdClient="msg.messageClientId"
    @close="showForward = false"
  />
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, getCurrentInstance } from "vue";
//@ts-ignore
import Tooltip from "../../CommonComponents/Tooltip.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { events } from "../../utils/constants";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { autorun } from "mobx";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/src/types";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { msgRecallTime } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { copyText } from "../../utils";
import emitter from "../../utils/eventBus";
import MessageForward from "./message-forward.vue";
import { showModal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import router from "@/router";
import {
  canOperatePin,
  getMessageRefer,
  isMessagePinned,
} from "../message-pin/utils";
import {
  canCollectMessage,
  createMessageCollectionParams,
  getMessageCollectionConverter,
  isCollectionLimitError,
} from "../../utils/collection";
const tooltipRef = ref(null);

const props = withDefaults(
  defineProps<{
    msg: V2NIMMessageForUI;
    tooltipVisible?: boolean;
    bgVisible?: boolean;
    placement?: string;
    voiceTextMap?: Record<string, string>;
    setVoiceText?: (messageClientId: string, text: string) => void;
    isMultiSelecting?: boolean;
    onMultiSelect?: (msg: V2NIMMessageForUI) => void;
    readonly?: boolean;
  }>(),
  {
    isMultiSelecting: false,
    readonly: false,
  }
);

const { proxy } = getCurrentInstance()!; // 获取组件实例

const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const isMountedRef = ref(false);

onMounted(() => {
  isMountedRef.value = true;
  // 当前版本支持文本、图片、文件、语音、视频、位置和话单消息，其他消息类型统一为未知消息
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
    props.msg.messageType ==
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_LOCATION ||
    props.msg.messageType == V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL ||
    store?.msgStore.isChatMergedForwardMsg(props.msg)
  );
});
// 是否是好友
const isFriend = ref(true);

// 未知消息
const isUnknownMsg = ref(false);
const pinned = computed(() => isMessagePinned(props.msg));
const isMergedForward = computed(() => store?.msgStore.isChatMergedForwardMsg(props.msg));
const canPinMsg = computed(() => canOperatePin(props.msg) || isMergedForward.value);
const canCollectMsg = computed(() => canCollectMessage(props.msg) || isMergedForward.value);
const messageStatusErrorCode = computed(() => props.msg.messageStatus?.errorCode);
const isMessageStatusFailed = computed(
  () =>
    messageStatusErrorCode.value !== undefined &&
    messageStatusErrorCode.value !== 200
);
const isImageMsg = computed(
  () =>
    props.msg.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
);
const getBubbleClass = (directionClass: string) => [
  "msg-bg",
  directionClass,
  {
    "msg-bg-image": isImageMsg.value,
  },
];
// 操作面板的列数由按钮数量决定（--action-columns），少算一个按钮面板就会因为列数不足而换行。
// 因此这里每一项都必须和模板里实际渲染的条件保持一致，顺序也与模板一致。
const normalActionCount = computed(() => {
  const isCallMsg =
    props.msg.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL;
  const isAudioMsg =
    props.msg.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO;
  const isTextMsg =
    props.msg.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT;
  return (
    (isTextMsg ? 1 : 0) + // 复制
    (!isCallMsg ? 1 : 0) + // 回复
    (!isAudioMsg && !isCallMsg ? 1 : 0) + // 转发
    (canPinMsg.value ? 1 : 0) + // 标记/取消标记
    1 + // 删除
    (props.msg.isSelf && !isCallMsg ? 1 : 0) + // 撤回（话单消息不展示）
    1 + // 多选
    (isUnconvertedVoiceMsg.value ? 1 : 0) + // 语音转文字
    (canCollectMsg.value ? 1 : 0) // 收藏
  );
});

const actionGroupStyle = (count: number) => ({
  "--action-columns": Math.max(1, Math.min(count, 4)),
});

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

  // 恢复回复消息状态，确保重发失败回复消息时保持回复关系
  const threadReply = (_msg as any).threadReply
  if (threadReply) {
    store?.msgStore.replyMsgActive(threadReply)
  }

  try {
    switch (_msg.messageType) {
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE:
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO:
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE:
        await store?.msgStore.sendMessageActive({
          msg: _msg,
          conversationId: _msg.conversationId,
          progress: () => true,
          sendBefore: () => {
            scrollBottom();
          },
        });
        break;
      case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT:
        await store?.msgStore.sendMessageActive({
          msg: _msg,
          conversationId: _msg.conversationId,
          sendBefore: () => {
            scrollBottom();
          },
        });
        break;
      default:
        await store?.msgStore.sendMessageActive({
          msg: _msg,
          conversationId: _msg.conversationId,
          sendBefore: () => {
            scrollBottom();
          },
        });
        break;
    }
  } catch (error) {
    showToast(t('resendMsgFailText'));
  } finally {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollBottom())
    })
  }
};

// 转发消息
const showForward = ref(false);

const handleForwardMsg = () => {
  closeTooltip();
  showForward.value = true;
};

const handleMultiSelect = () => {
  closeTooltip();
  props.onMultiSelect?.(props.msg);
};

const isPinLimitError = (error: unknown) => {
  const err = error as {
    code?: number;
    errorCode?: number;
    messageStatus?: { errorCode?: number };
  };

  return (
    err?.code === 107319 ||
    err?.errorCode === 107319 ||
    err?.messageStatus?.errorCode === 107319
  );
};

const handlePinMsg = async () => {
  closeTooltip();

  if (
    store?.connectStore.loginStatus !==
    V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
  ) {
    showToast({ message: t("offlineText"), type: "info" });
    return;
  }

  try {
    if (pinned.value) {
      await store?.msgStore.unpinMessageActive(getMessageRefer(props.msg));
    } else {
      await store?.msgStore.pinMessageActive(props.msg);
    }
  } catch (error) {
    showToast({
      message:
        !pinned.value && isPinLimitError(error)
          ? t("107319")
          : pinned.value
          ? t("unpinFailedText")
          : t("pinFailedText"),
      type: "info",
    });
  }
};

const handleCollectMsg = async () => {
  closeTooltip();

  if (
    store?.connectStore.loginStatus !==
    V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
  ) {
    showToast({ message: t("offlineText"), type: "info" });
    return;
  }

  try {
    const converter = getMessageCollectionConverter(nim);
    if (!converter) {
      throw new Error("V2NIMMessageConverter unavailable");
    }

    const conversationType = nim.V2NIMConversationIdUtil.parseConversationType(props.msg.conversationId);
    const isTeamMessage = conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM;
    const teamId = isTeamMessage ? nim.V2NIMConversationIdUtil.parseConversationTargetId(props.msg.conversationId) : undefined;
    const conversation = store?.sdkOptions?.enableV2CloudConversation
      ? store?.conversationStore?.conversations.get(props.msg.conversationId)
      : store?.localConversationStore?.conversations.get(props.msg.conversationId);

    await store?.msgStore.addCollectionActive(
      createMessageCollectionParams(props.msg, converter, {
        conversationName: conversation?.name,
        senderName: store?.uiStore.getAppellation({ account: props.msg.senderId, teamId }),
        avatar: store?.userStore.users.get(props.msg.senderId)?.avatar,
      })
    );
    showToast({ message: t("addCollectionSuccessText"), type: "info" });
  } catch (error) {
    showToast({
      message: isCollectionLimitError(error)
        ? t("collectionLimitText")
        : t("addCollectionFailedText"),
      type: "info",
    });
  }
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
const addFriend = async () => {
  // 仅在锚点模式下移除 URL 中的 anchorMessageClientId，防止从好友页返回后仍锚点到标记消息
  if (router.currentRoute.value.query.anchorMessageClientId) {
    await router.replace({
      path: neUiKitRouterPath.chat,
      query: { conversationId: router.currentRoute.value.query.conversationId },
    });
  }
  router.push({
    path: neUiKitRouterPath.friendCard,
    query: {
      accountId: props.msg.receiverId,
    },
  });
};

const isUnconvertedVoiceMsg = computed(() => {
  return (
    props.msg.messageType ===
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO &&
    !props.voiceTextMap?.[props.msg.messageClientId]
  );
});

const handleVoiceToText = async () => {
  closeTooltip();

  if (
    store?.connectStore.loginStatus !==
    V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
  ) {
    showToast({
      message: t("offlineText"),
      type: "info",
    });
    return;
  }

  const attachment = props.msg.attachment as any;
  if (!attachment?.url || !attachment?.duration) {
    showToast({
      message: t("voiceToTextFailText"),
      type: "info",
    });
    return;
  }

  try {
    const text = await nim?.V2NIMMessageService.voiceToText({
      voiceUrl: attachment.url,
      duration: attachment.duration,
      mimeType: "aac",
      sampleRate: "16000",
      sceneName: attachment.sceneName,
    });

    if (!isMountedRef.value) {
      return;
    }

    if (text) {
      props.setVoiceText?.(props.msg.messageClientId, text);
    } else {
      showToast({
        message: t("voiceToTextFailText"),
        type: "info",
      });
    }
  } catch {
    if (!isMountedRef.value) {
      return;
    }
    showToast({
      message: t("voiceToTextFailText"),
      type: "info",
    });
  }
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
  isMountedRef.value = false;
  uninstallFriendsWatch();
});
</script>

<style scoped>
.msg-bg {
  max-width: 63vw;
  overflow: hidden;
  padding: 12px 16px;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
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

.msg-bg-image {
  max-width: none;
  padding: 0;
  background: transparent;
}

.msg-action-groups {
  display: grid;
  grid-template-columns: repeat(var(--action-columns, 4), 56px);
  row-gap: 10px;
  width: calc(var(--action-columns, 4) * 56px);
}

.msg-action-groups-unknown {
  display: grid;
  grid-template-columns: repeat(var(--action-columns, 2), 56px);
  row-gap: 10px;
  width: calc(var(--action-columns, 2) * 56px);
}

.msg-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 56px;
}

.msg-action-btn-icon {
  color: #656a72;
  font-size: 18px;
}

.msg-action-btn-text {
  color: #000;
  font-size: 13px;
  line-height: 100%;
  text-align: center;
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  white-space: normal;
  margin-top: 5px;
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
  text-align: right;
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
  align-items: center;
  margin-right: 8px;
  box-sizing: border-box;
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
