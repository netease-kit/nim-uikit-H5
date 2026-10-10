<template>
  <div>
    <div v-if="replyMsg?.messageClientId" class="reply-msg-wrapper">
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
            replyMsg.messageType ===
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
          "
        >
          <message-one-line :text="replyMsg.text"></message-one-line>
        </div>
        <div
          v-else-if="
            replyMsg.messageType ===
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
          {{ "[" + REPLY_MSG_TYPE_MAP[replyMsg.messageType] + "]" }}
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
          replyMsg.messageType ==
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
        "
        class="reply-message-content"
      >
        <message-text :msg="replyMsg" :fontSize="22"></message-text>
      </div>
      <div
        v-else-if="
          replyMsg?.messageType ==
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
        "
        class="msg-common"
        :style="{
          flexDirection: replyMsg.isSelf ? 'row-reverse' : 'row',
          backgroundColor: replyMsg.isSelf ? '#d6e5f6' : '#e8eaed',
          borderRadius: replyMsg.isSelf ? '8px 0px 8px 8px' : '0 8px 8px',
        }"
        @click.stop="() => {}"
      >
        <MessageAudio :msg="replyMsg" />
      </div>
      <div
        v-else-if="
          replyMsg?.messageType ==
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

<script>
import { t } from "../../utils/i18n";
import MessageOneLine from "../../CommonComponents/MessageOneLine.vue";
import MessageText from "./message-text.vue";
import { REPLY_MSG_TYPE_MAP } from "../../utils/constants";
import { autorun } from "../../utils/store.js";
import { V2NIMConst } from "../../utils/sdk";
import MessageAudio from "./message-audio.vue";
import Icon from "../../CommonComponents/Icon.vue";
import PreviewImage from "../../CommonComponents/PreviewImage.vue";
import { buildDownloadUrl } from "../../utils";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    MessageOneLine,
    MessageText,
    MessageAudio,
    Icon,
    PreviewImage,
  },
  props: {
    replyMsg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isFullScreen: false,
      repliedTo: "",
      isPreviewImgVisible: false,
      repliedToWatch: null,
      REPLY_MSG_TYPE_MAP,
      V2NIMConst,
      t,
      nim,
    };
  },
  computed: {
    attachment() {
      return this.replyMsg?.attachment || {};
    },
    name() {
      return this.attachment.name || "";
    },
    url() {
      return this.attachment.url || "";
    },
    downloadUrl() {
      return buildDownloadUrl(this.url, this.name);
    },
    isReplyMsgExist() {
      return this.replyMsg?.messageClientId !== "noFind";
    },
    imageUrl() {
      if (this.replyMsg.errorCode == 102426) {
        return "https://yx-web-nosdn.netease.im/common/c1f278b963b18667ecba4ee9a6e68047/img-fail.png";
      }
      return this.replyMsg?.attachment?.url || this.replyMsg.attachment?.file;
    },
  },
  mounted() {
    this.repliedTo = uiKitStore.uiStore.getAppellation({
      account: this.replyMsg?.senderId,
      teamId: this.replyMsg?.receiverId,
    });
    this.repliedToWatch = autorun(() => {
      this.repliedTo = uiKitStore.uiStore.getAppellation({
        account: this.replyMsg?.senderId,
        teamId: this.replyMsg?.receiverId,
      });
    });
  },
  beforeDestroy() {
    if (this.repliedToWatch) {
      this.repliedToWatch();
    }
  },
  methods: {
    showFullReplyMsg() {
      if (
        this.replyMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
      ) {
        this.isFullScreen = true;
        this.isPreviewImgVisible = true;
      } else if (
        this.replyMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
      ) {
        this.isFullScreen = true;
      } else if (
        this.replyMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
      ) {
        const url = this.replyMsg?.attachment?.url;
        if (url) {
          window.open(url, "_blank");
        }
      } else if (
        this.replyMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
      ) {
        this.isFullScreen = true;
      }
    },
    closeFullReplyMsg(event) {
      event.stopPropagation();
      this.isFullScreen = false;
    },
  },
};
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
