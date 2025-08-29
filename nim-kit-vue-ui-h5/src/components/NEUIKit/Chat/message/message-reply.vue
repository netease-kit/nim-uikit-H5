<template>
  <div>
    <div v-if="props.replyMsg?.messageClientId" class="reply-msg-wrapper">
      <!-- replyMsg 不存在 说明回复的消息被删除或者撤回 -->
      <div v-if="!isReplyMsgExist">
        <span>{{ t("replyNotFindText") }}</span>
      </div>
      <div v-else class="reply-msg" @click="showFullReplyMsg">
        <div class="reply-msg-name-wrapper">
          <div class="reply-msg-name-line">|</div>
          <div class="reply-msg-name-content">{{ repliedTo }}</div>
          <div class="reply-msg-name-to">:</div>
        </div>
        <div
          class="reply-msg-content"
          v-if="
            props.replyMsg.messageType ===
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
          "
        >
          <message-one-line :text="props.replyMsg.text"></message-one-line>
        </div>
        <div
          v-else-if="
            props.replyMsg.messageType ===
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE
          "
          class="other-msg-wrapper"
        >
          <a
            class="other-msg-wrapper-text"
            target="_blank"
            rel="noopener noreferrer"
            :href="downloadUrl"
            :download="name"
            :showUnderLine="false"
          >
            {{ t("fileMsgTitleText") }}
          </a>
        </div>
        <div class="other-msg-wrapper other-msg-wrapper-text" v-else>
          {{ "[" + REPLY_MSG_TYPE_MAP[props.replyMsg.messageType] + "]" }}
        </div>
      </div>
    </div>
    <!-- 点击被回复的消息需要全屏显示 -->
    <div
      v-if="isFullScreen"
      class="reply-full-screen"
      @click="showFullReplyMsg"
    >
      <div class="reply-message-close" @click="closeFullReplyMsg">
        <Icon
          color="#929299"
          :iconStyle="{ fontWeight: '200' }"
          :size="18"
          type="icon-guanbi"
        />
      </div>
      <div
        v-if="
          props.replyMsg.messageType ==
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
        "
        class="reply-message-content"
      >
        <message-text :msg="replyMsg" :fontSize="22"></message-text>
      </div>
      <div
        v-else-if="
          props.replyMsg?.messageType ==
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
        "
        class="msg-common"
        :style="{
          flexDirection: props.replyMsg.isSelf ? 'row-reverse' : 'row',
          backgroundColor: props.replyMsg.isSelf ? '#d6e5f6' : '#e8eaed',
          borderRadius: props.replyMsg.isSelf ? '8px 0px 8px 8px' : '0 8px 8px',
        }"
        @click.stop="() => {}"
      >
        <MessageAudio :msg="replyMsg" />
      </div>
      <div
        v-else-if="
          props.replyMsg?.messageType ==
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
        "
        class="msg-common"
        @click="
          (e) => {
            e.stopPropagation();
            isFullScreen = false;
          }
        "
      >
        <PreviewImage
          :visible="isPreviewImgVisible"
          :image-url="imageUrl"
          :onClose="
            () => {
              isPreviewImgVisible = false;
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { t } from "../../utils/i18n";
import MessageOneLine from "../../CommonComponents/MessageOneLine.vue";
import { ref, onMounted, computed, getCurrentInstance, onUnmounted } from "vue";
import MessageText from "./message-text.vue";
import { REPLY_MSG_TYPE_MAP } from "../../utils/constants";
import { autorun } from "mobx";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import MessageAudio from "./message-audio.vue";
import Icon from "../../CommonComponents/Icon.vue";
import PreviewImage from "../../CommonComponents/PreviewImage.vue";

const props = withDefaults(defineProps<{ replyMsg: V2NIMMessageForUI }>(), {});
const { proxy } = getCurrentInstance()!; // 获取组件实例

const isFullScreen = ref(false);
const repliedTo = ref("");

const isPreviewImgVisible = ref(false);

//@ts-ignore
const { name = "", url = "" } = props.replyMsg?.attachment || {};

const downloadUrl =
  url + ((url as string).includes("?") ? "&" : "?") + `download=${name}`;

// 被回复消息是否存在
const isReplyMsgExist = computed(() => {
  return props.replyMsg?.messageClientId !== "noFind";
});

const imageUrl = computed(() => {
  // 被拉黑
  if (props.replyMsg.errorCode == 102426) {
    return "https://yx-web-nosdn.netease.im/common/c1f278b963b18667ecba4ee9a6e68047/img-fail.png";
  }
  //@ts-ignore
  return props.replyMsg?.attachment?.url || props.replyMsg.attachment?.file;
});

onMounted(() => {
  repliedTo.value = proxy?.$UIKitStore.uiStore.getAppellation({
    account: props.replyMsg?.senderId as string,
    teamId: props.replyMsg?.receiverId,
  }) as string;
});

const repliedToWatch = autorun(() => {
  repliedTo.value = proxy?.$UIKitStore.uiStore.getAppellation({
    account: props.replyMsg?.senderId as string,
    teamId: props.replyMsg?.receiverId,
  }) as string;
});

const showFullReplyMsg = () => {
  if (
    props.replyMsg?.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
  ) {
    isFullScreen.value = true;
    isPreviewImgVisible.value = true;
  } else if (
    props.replyMsg?.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
  ) {
    isFullScreen.value = true;
  } else if (
    props.replyMsg?.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
  ) {
    //@ts-ignore
    const url = props.replyMsg?.attachment?.url;
    if (url) {
      window.open(url, "_blank");
    }
  } else if (
    props.replyMsg?.messageType ===
    V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
  ) {
    isFullScreen.value = true;
  }
};

// 点击全屏的回复消息，关闭全屏
const closeFullReplyMsg = (e) => {
  e.stopPropagation();
  isFullScreen.value = false;
};

onUnmounted(() => {
  repliedToWatch();
});
</script>

<style scoped>
.reply-msg-wrapper {
  display: flex;
  align-items: center;
  color: #929299;
  font-size: 13px;
  white-space: nowrap;
  width: 100%;
}

.reply-msg-wrapper .reply-msg {
  display: flex;
  align-items: center;
}

.reply-msg-wrapper .reply-msg {
  flex: 1;
  font-size: 13px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.reply-msg-wrapper .reply-msg-name-wrapper {
  margin-right: 5px;
  max-width: 125px;
  flex: 0 0 auto;
  display: flex;
  white-space: nowrap;
}

.reply-msg-name-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.reply-msg-wrapper .reply-msg-name-line {
  flex-basis: 0 0 3px;
  margin-right: 2px;
}

.reply-msg-wrapper .reply-msg-name-to {
  flex-basis: 0 0 3px;
}

.reply-msg-wrapper .reply-msg-name-content {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.reply-msg-wrapper .reply-msg-content {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.reply-msg-image {
  width: 100%;
}

.reply-full-screen {
  position: fixed;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  height: 100vh;
  overflow: hidden;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 24px;
  justify-content: center;
  touch-action: none;
  z-index: 999999999;
  box-sizing: border-box;
}

.reply-message-content {
  height: 85vh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 30px 30px 100px 30px;
  touch-action: none;
  display: flex;
  align-items: center;
}

.other-msg-wrapper {
  flex-wrap: nowrap;
  color: #929299;
}

.other-msg-wrapper-text {
  color: #929299;
}

.reply-message-close {
  position: fixed;
  right: 20px;
  z-index: 999999;
  top: 60px;
}

.reply-message-close-mp {
  position: fixed;
  right: 20px;
  top: 100px;
  z-index: 999999;
}

.msg-common {
  display: flex;
  align-items: flex-start;
  font-size: 16px;
  max-width: 360px;
  overflow: hidden;
  padding: 16px 20px;
}
</style>
