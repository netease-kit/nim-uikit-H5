<template>
  <div
    :class="`msg-item-wrapper ${
      props.msg.pinState &&
      !(
        props.msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        props.msg.timeValue !== undefined
      ) &&
      !props.msg.recallType
        ? 'msg-pin'
        : ''
    }`"
    :id="MSG_ID_FLAG + props.msg.messageClientId"
    :key="props.msg.createTime"
  >
    <!-- 消息时间间隔提示 -->
    <div
      class="msg-time"
      v-if="
        props.msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        props.msg.timeValue !== undefined
      "
    >
      {{ props.msg.timeValue }}
    </div>
    <!-- 撤回消息-可重新编辑 -->
    <div
      class="msg-common"
      :style="{
        flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse',
      }"
      v-else-if="
        props.msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        props.msg.recallType === 'reCallMsg' &&
        props.msg.canEdit
      "
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <MessageBubble :msg="props.msg" :bg-visible="true">
        <span class="recall-text">{{ t("recall2") }}</span>
        <text
          class="msg-recall-btn"
          @click="
            () => {
              handleReeditMsg(props.msg);
            }
          "
        >
          {{ t("reeditText") }}
        </text>
      </MessageBubble>
    </div>
    <!-- 撤回消息-不可重新编辑 -->
    <div
      class="msg-common"
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
      v-else-if="
        props.msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        props.msg.recallType === 'reCallMsg' &&
        !props.msg.canEdit
      "
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <MessageBubble :msg="props.msg" :bg-visible="true">
        <div class="recall-text">{{ t("you") + t("recall") }}</div>
      </MessageBubble>
    </div>
    <!-- 撤回消息-对方撤回-->
    <div
      class="msg-common"
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
      v-else-if="
        props.msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        props.msg.recallType === 'beReCallMsg'
      "
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <div :class="props.msg.isSelf ? 'self-msg-recall' : 'msg-recall'">
          <text class="msg-recall2">
            {{ !props.msg.isSelf ? t("recall2") : `${t("you") + t("recall")}` }}
          </text>
        </div>
      </div>
    </div>
    <!-- 文本消息 -->
    <div
      class="msg-common"
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
      "
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          <ReplyMessage v-if="!!replyMsg" :replyMsg="replyMsg"></ReplyMessage>
          <MessageText :msg="props.msg"></MessageText>
        </MessageBubble>
      </div>
      <MessageIsRead v-if="props.msg?.isSelf" :msg="props.msg"></MessageIsRead>
    </div>
    <!-- 图片消息 -->
    <div
      class="msg-common"
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
      "
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          <div
            @click="
              () => {
                //@ts-ignore
                handleImageTouch(props.msg.attachment.url);
              }
            "
          >
          <div class="msg-image" v-if="props.msg.sendingState == V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SENDING">
            <div 
              class="loading-spinner"
            ></div>
          </div>
            <img
              v-else
              class="msg-image"
              :lazy-load="true"
              mode="aspectFill"
              :src="imageUrl"
            />
          </div>
        </MessageBubble>
        <!-- 图片预览 -->
        <PreviewImage
          :visible="isPreviewVisible"
          :image-url="imageUrl"
          :onClose="
            () => {
              isPreviewVisible = false;
            }
          "
        />
      </div>
      <MessageIsRead v-if="props.msg?.isSelf" :msg="props.msg"></MessageIsRead>
    </div>
    <!-- 视频消息 -->
    <div
      class="msg-common"
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
      "
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="true"
          style="cursor: pointer"
        >
          <div
            class="video-msg-wrapper"
            @click="() => handleVideoTouch(props.msg)"
          >
            <div class="video-play-button">
              <div class="video-play-icon"></div>
            </div>
            <img
              class="msg-image"
              :lazy-load="true"
              mode="aspectFill"
              :src="videoFirstFrameDataUrl"
            ></img>
          </div>
        </MessageBubble>
      </div>
      <MessageIsRead v-if="props.msg?.isSelf" :msg="props.msg"></MessageIsRead>
    </div>
    <!-- 音视频消息 -->
    <div
      class="msg-common"
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
      "
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          <MessageG2 :msg="props.msg" />
        </MessageBubble>
      </div>
    </div>
    <!-- 文件消息 -->
    <div
      class="msg-common"
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE
      "
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="false"
        >
          <MessageFile :msg="props.msg" />
        </MessageBubble>
      </div>
      <MessageIsRead v-if="props.msg?.isSelf" :msg="props.msg"></MessageIsRead>
    </div>
    <!-- 语音消息 -->
    <div
      class="msg-common"
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
      "
      :style="{
        flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse',
      }"
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="true"
          style="cursor: pointer"
        >
          <MessageAudio
            :msg="props.msg"
            :broadcastNewAudioSrc="broadcastNewAudioSrc"
          />
        </MessageBubble>
      </div>
      <MessageIsRead v-if="props.msg?.isSelf" :msg="props.msg"></MessageIsRead>
    </div>
    <!-- 通知消息 -->
    <MessageNotification
      v-else-if="
        props.msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_NOTIFICATION
      "
      :msg="props.msg"
    />
    <!-- 未知消息 -->
    <div
      class="msg-common"
      :style="{ flexDirection: !props.msg.isSelf ? 'row' : 'row-reverse' }"
      v-else
    >
      <Avatar
        :account="props.msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!props.msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="props.msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          [{{ t("unknowMsgText") }}]
        </MessageBubble>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  onUnmounted,
  getCurrentInstance,
} from "vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import MessageBubble from "./message-bubble.vue";
import { events, MSG_ID_FLAG } from "../../utils/constants";
import { autorun } from "mobx";
import { t } from "../../utils/i18n";
import ReplyMessage from "./message-reply.vue";
import MessageFile from "./message-file.vue";
import MessageText from "./message-text.vue";
import MessageAudio from "./message-audio.vue";
import MessageNotification from "./message-notification.vue";
import MessageG2 from "./message-g2.vue";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import MessageIsRead from "./message-read.vue";
import emitter from "../../utils/eventBus";
import PreviewImage from "../../CommonComponents/PreviewImage.vue";



const isPreviewVisible = ref(false);
const props = withDefaults(
  defineProps<{
    msg: V2NIMMessageForUI & { timeValue?: number };
    index: number;
    replyMsgsMap?: {
      [key: string]: V2NIMMessageForUI;
    };
    broadcastNewAudioSrc: string;
  }>(),
  {}
);

const replyMsg = computed(() => {
  return props.replyMsgsMap && props.replyMsgsMap[props.msg.messageClientId];
});
const { proxy } = getCurrentInstance()!; // 获取组件实例

// 昵称
const appellation = ref("");
const accountId = proxy?.$UIKitStore.userStore?.myUserInfo.accountId;

// 会话类型
const conversationType =
  proxy?.$NIM.V2NIMConversationIdUtil.parseConversationType(
    props.msg.conversationId
  ) as unknown as V2NIMConst.V2NIMConversationType;
// 会话对象
const to = proxy?.$NIM.V2NIMConversationIdUtil.parseConversationTargetId(
  props.msg.conversationId
);

// 获取视频首帧
const videoFirstFrameDataUrl = computed(() => {
  //@ts-ignore
  const url = props.msg.attachment?.url;
  return url ? `${url}${url.includes("?") ? "&" : "?"}vframe=1` : "";
});

// 图片
const imageUrl = computed(() => {
  // 被拉黑
  if (props.msg.messageStatus.errorCode == 102426) {
    return "https://yx-web-nosdn.netease.im/common/c1f278b963b18667ecba4ee9a6e68047/img-fail.png";
  }
  //@ts-ignore
  return props.msg?.attachment?.url || props.msg.attachment?.file;
});

// 点击图片预览
const handleImageTouch = (url: string) => {
  if (url) {
    isPreviewVisible.value = true;
  }
};

// 点击视频播放
const handleVideoTouch = (msg: V2NIMMessageForUI) => {
   //@ts-ignore
   const url = msg.attachment?.url;
  if (url) {
    // 在新窗口打开视频
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// 重新编辑消息
const handleReeditMsg = (msg: V2NIMMessageForUI) => {
  
  emitter.emit(events.ON_REEDIT_MSG, msg);
};

// 监听昵称变化
const uninstallAppellationWatch = autorun(() => {
  // 昵称展示顺序 群昵称 > 备注 > 个人昵称 > 帐号
  appellation.value = proxy?.$UIKitStore.uiStore.getAppellation({
    account: props.msg.senderId,
    teamId:
      conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
        ? to
        : "",
  }) as string;
});

const teamId = computed(() => {
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    return to;
  }
  return "";
});

onUnmounted(() => {
  uninstallAppellationWatch();
});
</script>

<style scoped>
.msg-item-wrapper {
  padding: 0 10px 10px 10px;
}

.msg-common {
  padding-top: 8px;
  display: flex;
  align-items: flex-start;
  font-size: 16px;
}
.msg-pin {
  opacity: 1;
  background: #fffbea;
}
.msg-pin-tip {
  font-size: 11px;
  font-weight: normal;
  color: #3eaf96;
  margin: 8px 50px 0 50px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 10px auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);

}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.msg-content {
  display: flex;
  flex-direction: column;
}

.msg-name {
  font-size: 12px;
  color: #999;
  text-align: left;
  margin-bottom: 4px;
  max-width: 300px;
  padding-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-image {
  max-width: 100%;
  min-width: 150px;
  height: 200px;
  display: inline-block;
}

.msg-time {
  margin-top: 8px;
  text-align: center;
  color: #b3b7bc;
  font-size: 12px;
}

.msg-recall-btn {
  margin-left: 5px;
  color: #1861df;
}

.msg-recall2 {
  font-size: 16px;
}

.self-msg-recall {
  max-width: 360px;
  overflow: hidden;
  padding: 12px 16px;
  border-radius: 8px 0px 8px 8px;
  margin-right: 8px;
  background-color: #d6e5f6;
  color: #666666;
}

.recall-text{
  color: #666666;
}

.msg-recall {
  max-width: 360px;
  width: fit-content;
  overflow: hidden;
  padding: 12px 16px;
  border-radius: 0px 8px 8px 8px;
  margin-left: 8px;
  background-color: #e8eaed;
  color: #666666;
}

.recall-text {
  color: #666666;
}

.video-play-button {
  width: 50px;
  height: 50px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  z-index: 9;
}

.video-play-icon {
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 18px solid #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-40%, -50%);
}

.video-msg-wrapper {
  box-sizing: border-box;
  max-width: 360px;
}
</style>
../../utils/router