<template>
  <div class="message-input-root">
    <div class="input-root">
    <!-- 当回复消息时，输入框上需要展示被回复的消息-->
    <div v-if="isReplyMsg" class="reply-message-wrapper">
      <div class="reply-message-close" @click="removeReplyMsg">
        <Icon
          color="#929299"
          :iconStyle="{ fontWeight: '200' }"
          :size="13"
          type="icon-guanbi"
        />
      </div>
      <div class="reply-line">｜</div>
      <div class="reply-title">{{ t("replyText") }}</div>
      <div v-if="replyMsg" class="reply-to">
        <Appellation
          :account="replyMsg.senderId"
          :team-id="
            conversationType ===
            V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
              ? to
              : ''
          "
          color="#929299"
          :fontSize="13"
        >
        </Appellation>
      </div>
      <div class="reply-to-colon">:</div>
      <div
        v-if="replyMsg && replyMsg.messageClientId === 'noFind'"
        class="reply-noFind"
      >
        {{ t("replyNotFindText") }}
      </div>
      <div class="reply-message" v-else>
        <message-one-line
          v-if="
            replyMsg &&
            replyMsg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
          "
          :text="replyMsg.text"
        />
        <div v-else>
          {{
            replyMsg?.messageType
              ? `[${
                  REPLY_MSG_TYPE_MAP[replyMsg.messageType] || "Unsupported Type"
                }]`
              : "[Unknown]"
          }}
        </div>
      </div>
    </div>
    <div class="msg-input-wrapper">
      <div class="input-emoji-icon" @click="handleEmojiVisible">
        <Icon :size="24" type="icon-biaoqing" />
      </div>
      <div class="input-inner">
        <!-- 当从表情面板切换到文字输入时，直接唤起键盘，会导致input框滚动消失，故此处需要一个fake Input兼容下，保证先隐藏表情/其他面板，再弹出键盘 -->
        <div v-show="showFakeInput" @click="onHideFakeInput" class="fake-input">
          <div v-if="inputText" class="input-text">{{ inputText }}</div>
          <div v-else class="input-placeholder">
            {{
              isTeamMute ? t("teamMutePlaceholder") : t("chatInputPlaceHolder")
            }}
          </div>
        </div>
        <Input
          v-show="!showFakeInput"
          ref="msgInputRef"
          id="msg-input"
          class="msg-input-input"
          :placeholder="
            isTeamMute ? t('teamMutePlaceholder') : t('chatInputPlaceHolder')
          "
          v-model="inputText"
          :disabled="isTeamMute"
          :inputStyle="{
            padding: '0 10px',
          }"
          @confirm="handleSendTextMsg"
          @blur="handleInputBlur"
          @focus="handleInputFocus"
          @input="handleInputChange"
        >
        </Input>
      </div>
      <div @click="handleSendMoreVisible" class="input-send-more">
        <Icon type="send-more" :size="24" />
      </div>
    </div>
    <!-- 表情面板 -->
    <div v-if="emojiVisible" class="msg-emoji-panel" @click.stop="() => {}">
      <Face
        @emojiClick="handleEmoji"
        @emojiDelete="handleEmojiDelete"
        @emojiSend="handleSendTextMsg"
      />
    </div>
    <!-- 发送更多面板 -->
    <div v-if="sendMoreVisible" class="send-more-panel" @click.stop="() => {}">
      <div class="send-more-panel-item-wrapper">
        <div class="send-more-panel-item">
          <input
            type="file"
            ref="imageInput"
            accept="image/*"
            :disabled="imageSending || isTeamMute"
            class="file-input-overlay"
            @change="onImageSelected"
          />
          <Icon @click="handleSendImageMsg" :size="26" type="icon-tupian" />
        </div>
        <div class="icon-text">{{ t("albumText") }}</div>
      </div>
    </div>
    <BottomPopup
      v-model="mentionPopupVisible"
      @cancel="mentionPopupVisible = false"
      :showConfirm="false"
      :showCancel="true"
      :title="t('chooseMentionText')"
    >
      <MentionChooseList
        :teamId="to"
        @handleMemberClick="handleMentionSelect"
        @item-click="handleMentionSelect"
      ></MentionChooseList>
    </BottomPopup>
    </div>
  </div>
</template>

<script>
import Face from "./face.vue";
import Icon from "../../CommonComponents/Icon.vue";
import {
  ALLOW_AT,
  events,
  REPLY_MSG_TYPE_MAP,
  AT_ALL_ACCOUNT,
} from "../../utils/constants";
import { emojiMap } from "../../utils/emoji";
import { t } from "../../utils/i18n";
import MessageOneLine from "../../CommonComponents/MessageOneLine.vue";
import Appellation from "../../CommonComponents/Appellation.vue";
import { replaceEmoji } from "../../utils";
import { autorun } from "../../utils/store.js";
import emitter from "../../utils/eventBus";
import Input from "../../CommonComponents/Input.vue";
import { toast } from "../../utils/toast";
import { V2NIMConst } from "../../utils/sdk";
import BottomPopup from "../../CommonComponents/BottomPopup.vue";
import MentionChooseList from "./mention-choose-list.vue";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Face,
    Icon,
    MessageOneLine,
    Appellation,
    Input,
    BottomPopup,
    MentionChooseList,
  },
  props: {
    conversationType: {
      type: [Number, String],
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    replyMsgsMap: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      inputText: "",
      sendMoreVisible: false,
      emojiVisible: false,
      showFakeInput: false,
      isReplyMsg: false,
      isFocus: false,
      replyMsg: undefined,
      team: null,
      teamMembers: [],
      teamMute:
        V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN,
      isTeamOwner: false,
      isTeamManager: false,
      isTeamMute: false,
      mentionPopupVisible: false,
      cursorPosition: 0,
      atPosition: 0,
      selectedAtMembers: [],
      imageSending: false,
      uninstallTeamWatch: null,
      onReeditMsgHandler: null,
      onReplyMsgHandler: null,
      onAitTeamMemberHandler: null,
      onClosePanelHandler: null,
      REPLY_MSG_TYPE_MAP,
      V2NIMConst,
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    conversationId() {
      return this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
        ? nim.V2NIMConversationIdUtil.p2pConversationId(this.to)
        : nim.V2NIMConversationIdUtil.teamConversationId(this.to);
    },
    allowAtAll() {
      let ext = {};
      try {
        ext = JSON.parse((this.team || {}).serverExtension || "{}");
      } catch (error) {
        //
      }
      if (ext[ALLOW_AT] === "manager") {
        return this.isTeamOwner || this.isTeamManager;
      }
      return true;
    },
  },
  mounted() {
    this.uninstallTeamWatch = autorun(() => {
      if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        const team = this.store?.teamStore.teams.get(this.to);
        this.teamMembers = this.store?.teamMemberStore.getTeamMember(this.to);

        const myUser = this.store?.userStore.myUserInfo;
        this.isTeamOwner = team?.ownerAccountId == myUser?.accountId;
        this.isTeamManager = this.teamMembers
          .filter(
            (item) =>
              item.memberRole ===
              V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
          )
          .some((member) => member.accountId === (myUser ? myUser.accountId : ""));
        this.team = team;
        if (team) {
          this.teamMute = team.chatBannedMode;
        }
        this.updateTeamMute();
      }
    });

    this.onReeditMsgHandler = (msg) => {
      const replyMsg = this.replyMsgsMap?.[msg.messageClientId];
      this.replyMsg = undefined;
      this.isReplyMsg = false;
      this.store?.msgStore.removeReplyMsgActive(msg.conversationId);
      if (replyMsg?.messageClientId) {
        this.store?.msgStore.replyMsgActive(replyMsg);
        this.replyMsg = replyMsg;
        this.isReplyMsg = true;
      }
      this.inputText = msg?.oldText || "";
      this.isFocus = true;
    };
    this.onReplyMsgHandler = (msg) => {
      this.isReplyMsg = true;
      this.isFocus = true;
      this.replyMsg = msg;
    };
    this.onAitTeamMemberHandler = (member) => {
      const beReplyMember = member;
      this.selectedAtMembers = [
        ...this.selectedAtMembers.filter(
          (item) => item.accountId !== beReplyMember.accountId
        ),
        beReplyMember,
      ];
      this.inputText = this.inputText + "@" + beReplyMember.appellation + " ";
    };
    this.onClosePanelHandler = () => {
      this.emojiVisible = false;
      this.sendMoreVisible = false;
    };

    emitter.on(events.ON_REEDIT_MSG, this.onReeditMsgHandler);
    emitter.on(events.REPLY_MSG, this.onReplyMsgHandler);
    emitter.on(events.AIT_TEAM_MEMBER, this.onAitTeamMemberHandler);
    emitter.on(events.CLOSE_PANEL, this.onClosePanelHandler);
  },
  beforeDestroy() {
    this.removeReplyMsg();
    if (this.uninstallTeamWatch) {
      this.uninstallTeamWatch();
    }
    if (this.onReeditMsgHandler) {
      emitter.off(events.ON_REEDIT_MSG, this.onReeditMsgHandler);
    }
    if (this.onReplyMsgHandler) {
      emitter.off(events.REPLY_MSG, this.onReplyMsgHandler);
    }
    if (this.onAitTeamMemberHandler) {
      emitter.off(events.AIT_TEAM_MEMBER, this.onAitTeamMemberHandler);
    }
    if (this.onClosePanelHandler) {
      emitter.off(events.CLOSE_PANEL, this.onClosePanelHandler);
    }
  },
  methods: {
    updateTeamMute() {
      if (
        this.teamMute ===
        V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN
      ) {
        this.isTeamMute = false;
        return;
      }
      if (this.isTeamOwner || this.isTeamManager) {
        this.isTeamMute = false;
        return;
      }
      this.isTeamMute = true;
    },
    onHideFakeInput() {
      this.showFakeInput = false;
      this.emojiVisible = false;
      this.sendMoreVisible = false;

      const timer = setTimeout(() => {
        this.$nextTick(() => {
          try {
            const input = document.getElementById("msg-input");
            input?.focus();
          } catch (error) {
            console.log("error", error);
          }
          clearTimeout(timer);
        });
      }, 100);
    },
    onAtMembersExtHandler() {
      let ext;
      if (this.selectedAtMembers.length) {
        this.selectedAtMembers
          .filter((member) => {
            if (!this.allowAtAll && member.accountId === AT_ALL_ACCOUNT) {
              return false;
            }
            return true;
          })
          .forEach((member) => {
            const substr = `@${member.appellation}`;
            const positions = [];
            let pos = this.inputText?.indexOf(substr);
            while (pos !== -1) {
              positions.push(pos);
              pos = this.inputText?.indexOf(substr, pos + 1);
            }
            if (positions.length) {
              if (!ext) {
                ext = {
                  yxAitMsg: {
                    [member.accountId]: {
                      text: substr,
                      segments: [],
                    },
                  },
                };
              } else {
                ext.yxAitMsg[member.accountId] = {
                  text: substr,
                  segments: [],
                };
              }
              positions.forEach((position) => {
                const start = position;
                ext?.yxAitMsg[member.accountId].segments.push({
                  start,
                  end: start + substr.length,
                  broken: false,
                });
              });
            }
          });
      }
      return ext;
    },
    handleInputChange(event) {
      if (this.$refs.msgInputRef && this.$refs.msgInputRef.inputRef) {
        this.cursorPosition = this.$refs.msgInputRef.inputRef.selectionStart || 0;
      }

      if (
        event.data === "@" &&
        this.conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        this.atPosition = this.cursorPosition - 1;
        this.mentionPopupVisible = true;
        this.$refs.msgInputRef.inputRef.blur();
      } else {
        this.mentionPopupVisible = false;
      }
    },
    scrollBottom() {
      emitter.emit(events.ON_SCROLL_BOTTOM);
    },
    handleSendTextMsg() {
      if (this.inputText.trim() === "") {
        return;
      }
      const text = replaceEmoji(this.inputText);
      const textMsg = nim.V2NIMMessageCreator.createTextMessage(text);
      const ext = this.onAtMembersExtHandler();

      this.store?.msgStore
        .sendMessageActive({
          msg: textMsg,
          conversationId: this.conversationId,
          serverExtension: this.selectedAtMembers.length && ext,
          sendBefore: () => {
            this.scrollBottom();
          },
        })
        .catch(() => {
          toast.info(t("sendMsgFailedText"));
        })
        .finally(() => {
          emitter.emit(events.ON_SCROLL_BOTTOM);
        });

      this.inputText = "";
      this.isReplyMsg = false;
    },
    removeReplyMsg() {
      this.store?.msgStore.removeReplyMsgActive(this.replyMsg?.conversationId);
      this.isReplyMsg = false;
    },
    handleEmojiVisible() {
      if (this.isTeamMute) {
        return;
      }
      this.emojiVisible = true;
      this.showFakeInput = true;
      this.sendMoreVisible = false;
      emitter.emit(events.ON_SCROLL_BOTTOM);
    },
    handleEmoji(emoji) {
      this.inputText += emoji.key;
    },
    handleEmojiDelete() {
      let target = "";
      const isEmojiEnd = Object.keys(emojiMap).reduce((prev, cur) => {
        const isEnd = this.inputText.endsWith(cur);
        if (isEnd) {
          target = cur;
        }
        return prev || isEnd;
      }, false);
      if (isEmojiEnd && target) {
        this.inputText = this.inputText.slice(0, -target.length);
      } else {
        this.inputText = this.inputText.slice(0, -1);
      }
    },
    handleSendMoreVisible() {
      if (this.isTeamMute) {
        return;
      }
      this.emojiVisible = false;
      this.sendMoreVisible = !this.sendMoreVisible;
      this.showFakeInput = true;
      emitter.emit(events.ON_SCROLL_BOTTOM);
    },
    handleSendImageMsg() {
      if (this.isTeamMute || this.imageSending) {
        return;
      }
      this.$refs.imageInput?.click();
    },
    async onImageSelected(event) {
      const target = event.target;
      if (this.imageSending) {
        target.value = "";
        return;
      }
      const file = target.files?.[0];
      if (!file) {
        target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.info(t("selectImageText"));
        target.value = "";
        return;
      }

      this.imageSending = true;
      try {
        const imgMsg = nim.V2NIMMessageCreator.createImageMessage(file);
        await this.store?.msgStore.sendMessageActive({
          msg: imgMsg,
          conversationId: this.conversationId,
          progress: () => true,
          sendBefore: () => {
            this.scrollBottom();
          },
        });
        this.scrollBottom();
      } catch (err) {
        this.scrollBottom();
        toast.info(t("sendImageFailedText"));
      } finally {
        this.imageSending = false;
        target.value = "";
      }
    },
    handleInputFocus() {
      this.isFocus = true;
      if (this.$refs.msgInputRef && this.$refs.msgInputRef.inputRef) {
        this.cursorPosition = this.$refs.msgInputRef.inputRef.selectionStart || 0;
      }
    },
    handleInputBlur() {
      this.isFocus = false;
    },
    handleMentionSelect(member) {
      const nickInTeam = member.appellation;
      this.selectedAtMembers = [
        ...this.selectedAtMembers.filter(
          (item) => item.accountId !== member.accountId
        ),
        member,
      ];
      const currentText = this.inputText;
      const beforeAt = currentText.substring(0, this.atPosition);
      const afterAt = currentText.substring(this.atPosition + 1);
      this.inputText = beforeAt + "@" + nickInTeam + " " + afterAt;

      this.handleCloseMention();

      this.$nextTick(() => {
        if (this.$refs.msgInputRef && this.$refs.msgInputRef.inputRef) {
          const newCursorPos = this.atPosition + nickInTeam.length + 2;
          this.$refs.msgInputRef.inputRef.setSelectionRange(
            newCursorPos,
            newCursorPos
          );
        }
      });
    },
    handleCloseMention() {
      this.mentionPopupVisible = false;
    },
  },
};
</script>

<style scoped>
.message-input-root {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.input-root {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 300px;
}

.msg-input-wrapper {
  width: 100%;
  min-width: 0;
  background-color: #eff1f3;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  z-index: 999;
  display: flex;
  height: 55px;
  align-items: center;
  padding: 4px 0;
  box-sizing: border-box;
}

.msg-input-input {
  background-color: #fff;
  font-size: 16px;
  border-radius: 6px;
  margin-bottom: 5px;
  -webkit-tap-highlight-color: transparent;
}

.input-inner {
  flex: 1;
  min-width: 0;
}

.msg-input-button {
  flex: 1;
}

.msg-input-button.msg-input-loading {
  animation: loadingCircle 1s infinite linear;
  z-index: 1;
  width: 20px;
  height: 20px;
  margin-top: 4px;
}

.msg-input-button.msg-input-loading .loading {
  width: 100%;
  height: 100%;
}

.msg-ext {
  overflow-y: auto;
  width: 100%;
  height: 300px;
  background-color: #eff1f3;
  z-index: 1;
}

.msg-emoji-panel {
  overflow-y: auto;
  width: 100%;
  height: 246px;
  background-color: #eff1f3;
  z-index: 1;
}

.msg-audio-panel {
  overflow-y: hidden;
  width: 100%;
  height: 300px;
  background-color: #eff1f3;
  z-index: 1;
}

.send-more-panel {
  padding: 15px;
  overflow-y: hidden;
  width: 100%;
  height: 300px;
  background-color: #eff1f3;
  z-index: 1;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.send-more-panel-item-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  display: inline-block;
  margin-bottom: 10px;
}

.send-more-panel-item-wrapper .send-more-panel-item {
  background-color: #fff;
  border-radius: 8px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  margin: 0 15px;
  justify-content: center;
}

.send-more-panel-item-wrapper .icon-text {
  font-size: 12px;
  color: #747475;
  margin-top: 8px;
  text-align: center;
}

.reply-message-wrapper {
  display: flex;
  font-size: 13px;
  background-color: #eff1f2;
  height: 25px;
  padding-top: 6px;
  align-items: center;
  color: #929299;
}

.reply-message-wrapper .reply-noFind {
  width: fit-content;
}

.reply-message-wrapper .reply-to-colon {
  flex-basis: 3px;
  margin-right: 2px;
}

.reply-message-wrapper .reply-message-close {
  flex-basis: 14px;
  margin-left: 10px;
  display: flex;
  align-items: center;
}

.reply-message-wrapper .reply-message {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-message-wrapper .reply-message message-one-line {
  flex: 1;
  font-size: 13px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.reply-message-wrapper .reply-title {
  flex-basis: 30px;
  white-space: nowrap;
  margin-right: 5px;
}

.reply-message-wrapper .reply-to {
  max-width: 120px;
  flex: 0 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.fake-input {
  background-color: #fff;
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  padding: 0 12px;
  border-radius: 6px;
}

.input-emoji-icon,
.input-send-more {
  width: 35px;
  text-align: center;
  height: 55px;
  line-height: 55px;
}

.input-text {
  white-space: nowrap;
  color: #000;
}

.input-placeholder {
  background-color: #fff;
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  border-radius: 6px;
  color: #c0c4cc;
}

.file-picker-wrapper {
  position: absolute;
  width: 60px;
  height: 60px;
  z-index: 1;
}

.file-picker-wrapper .files-button {
  width: 60px;
  height: 60px;
}

.send-more-panel-item {
  position: relative;
  background-color: #fff;
  border-radius: 8px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  margin: 0 15px;
  justify-content: center;
}

.file-input-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}
</style>
