<template>
  <div
    :class="`msg-item-wrapper ${
      msg.pinState &&
      !(
        msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        msg.timeValue !== undefined
      ) &&
      !msg.recallType
        ? 'msg-pin'
        : ''
    }`"
    :id="MSG_ID_FLAG + msg.messageClientId"
  >
    <!-- 消息时间间隔提示 -->
    <div
      class="msg-time"
      v-if="
        msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        msg.timeValue !== undefined
      "
    >
      {{ msg.timeValue }}
    </div>
    <!-- 撤回消息-可重新编辑 -->
    <div
      class="msg-common"
      :style="{
        flexDirection: !msg.isSelf ? 'row' : 'row-reverse',
      }"
      v-else-if="
        msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        msg.recallType === 'reCallMsg' &&
        msg.canEdit
      "
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <MessageBubble :msg="msg" :bg-visible="true">
        <span class="recall-text">{{ t("recall2") }}</span>
        <span
          class="msg-recall-btn"
          @click="
            () => {
              handleReeditMsg(msg);
            }
          "
        >
          {{ t("reeditText") }}
        </span>
      </MessageBubble>
    </div>
    <!-- 撤回消息-不可重新编辑 -->
    <div
      class="msg-common"
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
      v-else-if="
        msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        msg.recallType === 'reCallMsg' &&
        !msg.canEdit
      "
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <MessageBubble :msg="msg" :bg-visible="true">
        <div class="recall-text">{{ t("you") + t("recall") }}</div>
      </MessageBubble>
    </div>
    <!-- 撤回消息-对方撤回-->
    <div
      class="msg-common"
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
      v-else-if="
        msg.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        msg.recallType === 'beReCallMsg'
      "
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <div :class="msg.isSelf ? 'self-msg-recall' : 'msg-recall'">
          <span class="msg-recall2">
            {{ !msg.isSelf ? t("recall2") : `${t("you") + t("recall")}` }}
          </span>
        </div>
      </div>
    </div>
    <!-- 文本消息 -->
    <div
      class="msg-common"
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
      "
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          <ReplyMessage v-if="!!replyMsg" :replyMsg="replyMsg"></ReplyMessage>
          <MessageText :msg="msg"></MessageText>
        </MessageBubble>
      </div>
      <MessageIsRead v-if="msg?.isSelf" :msg="msg"></MessageIsRead>
    </div>
    <!-- 图片消息 -->
    <div
      class="msg-common"
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
      "
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          <div
            @click="
              () => {
                handleImageTouch(msg.attachment.url);
              }
            "
          >
          <div class="msg-image" v-if="msg.sendingState == V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SENDING">
            <div 
              class="loading-spinner"
            ></div>
          </div>
            <img
              v-else
              class="msg-image"
              loading="lazy"
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
      <MessageIsRead v-if="msg?.isSelf" :msg="msg"></MessageIsRead>
    </div>
    <!-- 视频消息 -->
    <div
      class="msg-common"
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
      "
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="true"
          style="cursor: pointer"
        >
          <div
            class="video-msg-wrapper"
            @click="() => handleVideoTouch(msg)"
          >
            <div class="video-play-button">
              <div class="video-play-icon"></div>
            </div>
            <img
              class="msg-image"
              loading="lazy"
              :src="videoFirstFrameDataUrl"
            />
          </div>
        </MessageBubble>
      </div>
      <MessageIsRead v-if="msg?.isSelf" :msg="msg"></MessageIsRead>
    </div>
    <!-- 音视频消息 -->
    <div
      class="msg-common"
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
      "
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          <MessageG2 :msg="msg" />
        </MessageBubble>
      </div>
    </div>
    <!-- 文件消息 -->
    <div
      class="msg-common"
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE
      "
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="false"
        >
          <MessageFile :msg="msg" />
        </MessageBubble>
      </div>
      <MessageIsRead v-if="msg?.isSelf" :msg="msg"></MessageIsRead>
    </div>
    <!-- 语音消息 -->
    <div
      class="msg-common"
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
      "
      :style="{
        flexDirection: !msg.isSelf ? 'row' : 'row-reverse',
      }"
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="true"
          style="cursor: pointer"
        >
          <MessageAudio
            :msg="msg"
            :broadcastNewAudioSrc="broadcastNewAudioSrc"
            @audio-play="$emit('audio-play', $event)"
          />
        </MessageBubble>
      </div>
      <MessageIsRead v-if="msg?.isSelf" :msg="msg"></MessageIsRead>
    </div>
    <!-- 通知消息 -->
    <MessageNotification
      v-else-if="
        msg.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_NOTIFICATION
      "
      :msg="msg"
    />
    <!-- 未知消息 -->
    <div
      class="msg-common"
      :style="{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }"
      v-else
    >
      <Avatar
        :account="msg.senderId"
        :teamId="teamId"
        :goto-user-card="true"
      />
      <div class="msg-content">
        <div class="msg-name" v-if="!msg.isSelf">
          {{ appellation }}
        </div>
        <MessageBubble
          :msg="msg"
          :tooltip-visible="true"
          :bg-visible="true"
        >
          [{{ t("unknowMsgText") }}]
        </MessageBubble>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "../../CommonComponents/Avatar.vue";
import MessageBubble from "./message-bubble.vue";
import { events, MSG_ID_FLAG } from "../../utils/constants";
import { autorun } from "../../utils/store.js";
import { t } from "../../utils/i18n";
import ReplyMessage from "./message-reply.vue";
import MessageFile from "./message-file.vue";
import MessageText from "./message-text.vue";
import MessageAudio from "./message-audio.vue";
import MessageNotification from "./message-notification.vue";
import MessageG2 from "./message-g2.vue";
import PreviewImage from "../../CommonComponents/PreviewImage.vue";
import { V2NIMConst } from "../../utils/sdk";
import MessageIsRead from "./message-read.vue";
import emitter from "../../utils/eventBus";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Avatar,
    MessageBubble,
    ReplyMessage,
    MessageFile,
    MessageText,
    MessageAudio,
    MessageNotification,
    MessageG2,
    PreviewImage,
    MessageIsRead,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
    replyMsgsMap: {
      type: Object,
      default: () => ({}),
    },
    broadcastNewAudioSrc: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      isPreviewVisible: false,
      appellation: "",
      uninstallAppellationWatch: null,
      V2NIMConst,
      MSG_ID_FLAG,
      t,
      nim,
    };
  },
  computed: {
    replyMsg() {
      return this.replyMsgsMap && this.replyMsgsMap[this.msg.messageClientId];
    },
    conversationType() {
      return nim.V2NIMConversationIdUtil.parseConversationType(
        this.msg.conversationId
      );
    },
    to() {
      return nim.V2NIMConversationIdUtil.parseConversationTargetId(
        this.msg.conversationId
      );
    },
    videoFirstFrameDataUrl() {
      const url = this.msg.attachment?.url;
      return url ? `${url}${url.includes("?") ? "&" : "?"}vframe=1` : "";
    },
    imageUrl() {
      if (this.msg.messageStatus.errorCode == 102426) {
        return "https://yx-web-nosdn.netease.im/common/c1f278b963b18667ecba4ee9a6e68047/img-fail.png";
      }
      return this.msg?.attachment?.url || this.msg.attachment?.file;
    },
    teamId() {
      if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        return this.to;
      }
      return "";
    },
  },
  mounted() {
    this.uninstallAppellationWatch = autorun(() => {
      this.appellation = uiKitStore.uiStore.getAppellation({
        account: this.msg.senderId,
        teamId:
          this.conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
            ? this.to
            : "",
      });
    });
  },
  beforeDestroy() {
    if (this.uninstallAppellationWatch) {
      this.uninstallAppellationWatch();
    }
  },
  methods: {
    handleImageTouch(url) {
      if (url) {
        this.isPreviewVisible = true;
      }
    },
    handleVideoTouch(msg) {
      const url = msg.attachment?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    handleReeditMsg(msg) {
      emitter.emit(events.ON_REEDIT_MSG, msg);
    },
  },
};
</script>

<style scoped>
.msg-item-wrapper {
  padding: 0 10px 10px 10px;
  min-width: 0;
}

.msg-common {
  padding-top: 8px;
  display: flex;
  align-items: flex-start;
  font-size: 16px;
  min-width: 0;
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
  min-width: 0;
  max-width: 100%;
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
  object-fit: cover;
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
