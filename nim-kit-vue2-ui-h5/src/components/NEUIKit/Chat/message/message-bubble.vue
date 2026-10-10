<template>
  <div class="message-bubble-root">
    <!-- 收到的消息 -->
    <Tooltip
      v-if="!msg.isSelf"
      :placement="placement"
      ref="tooltipRef"
      color="white"
    >
    <template #content>
      <div class="msg-action-groups" v-if="!isUnknownMsg">
        <div
          class="msg-action-btn"
          v-if="
            msg.messageType ===
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
          <span class="msg-action-btn-text">{{ t("copyText") }}</span>
        </div>
        <div
          v-if="
            msg.messageType !==
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
          <span class="msg-action-btn-text">{{ t("replyText") }}</span>
        </div>
        <div
          v-if="
            msg.messageType !==
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO &&
            msg.messageType !==
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
          <span class="msg-action-btn-text">{{ t("forwardText") }}</span>
        </div>

        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <span class="msg-action-btn-text">{{ t("deleteText") }}</span>
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
          <span class="msg-action-btn-text">{{ t("deleteText") }}</span>
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
      msg.sendingState ===
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
      :align="msg.isSelf"
    >
      <template #content>
        <div class="msg-action-groups">
          <div
            class="msg-action-btn"
            v-if="
              msg.messageType ===
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
            <span class="msg-action-btn-text">{{ t("copyText") }}</span>
          </div>
          <div class="msg-action-btn" @click="handleDeleteMsg">
            <Icon
              :size="18"
              color="#656A72"
              class="msg-action-btn-icon"
              type="icon-shanchu"
            ></Icon>
            <span class="msg-action-btn-text">{{ t("deleteText") }}</span>
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
      msg.sendingState ===
        V2NIMConst.V2NIMMessageSendingState
          .V2NIM_MESSAGE_SENDING_STATE_FAILED ||
      msg.messageStatus.errorCode === 102426 ||
      msg.messageStatus.errorCode === 104404
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
        :align="msg.isSelf"
      >
        <template #content>
          <div
            class="msg-action-groups"
            :style="{
              width:
                msg.messageType ===
                V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
                  ? '112px'
                  : '56px',
            }"
          >
            <div
              class="msg-action-btn"
              v-if="
                msg.messageType ===
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
              <span class="msg-action-btn-text">{{ t("copyText") }}</span>
            </div>
            <div class="msg-action-btn" @click="handleDeleteMsg">
              <Icon
                :size="18"
                color="#656A72"
                class="msg-action-btn-icon"
                type="icon-shanchu"
              ></Icon>
              <span class="msg-action-btn-text">{{ t("deleteText") }}</span>
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
      v-if="msg.messageStatus.errorCode === 102426"
    >
      {{ t("sendFailWithInBlackText") }}
    </div>
    <div
      class="friend-delete"
      v-else-if="msg.messageStatus.errorCode === 104404"
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
    :align="msg.isSelf"
  >
    <template #content>
      <div class="msg-action-groups" v-if="!isUnknownMsg">
        <div
          class="msg-action-btn"
          v-if="
            msg.messageType ===
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
          <span class="msg-action-btn-text">{{ t("copyText") }}</span>
        </div>
        <div
          v-if="
            msg.messageType !==
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
          <span class="msg-action-btn-text">{{ t("replyText") }}</span>
        </div>
        <div
          v-if="
            msg.messageType !==
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO &&
            msg.messageType !==
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
          <span class="msg-action-btn-text">{{ t("forwardText") }}</span>
        </div>

        <div class="msg-action-btn" @click="handleDeleteMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-shanchu"
          ></Icon>
          <span class="msg-action-btn-text">{{ t("deleteText") }}</span>
        </div>
        <div class="msg-action-btn" @click="handleRecallMsg">
          <Icon
            :size="18"
            color="#656A72"
            class="msg-action-btn-icon"
            type="icon-chehui"
          ></Icon>
          <span class="msg-action-btn-text">{{ t("recallText") }}</span>
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
          <span class="msg-action-btn-text">{{ t("deleteText") }}</span>
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
  </div>
</template>

<script>
import Tooltip from "../../CommonComponents/Tooltip.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { events } from "../../utils/constants";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { autorun } from "../../utils/store.js";
import { V2NIMConst } from "../../utils/sdk";
import { msgRecallTime } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { copyText } from "../../utils";
import emitter from "../../utils/eventBus";
import MessageForward from "./message-forward.vue";
import { showModal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import { uiKitStore } from "../../utils/init.js";
export default {
  components: {
    Tooltip,
    Icon,
    MessageForward,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
    tooltipVisible: {
      type: Boolean,
      default: false,
    },
    bgVisible: {
      type: Boolean,
      default: false,
    },
    placement: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      showForward: false,
      isFriend: true,
      isUnknownMsg: false,
      uninstallFriendsWatch: null,
      V2NIMConst,
      t,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
  },
  mounted() {
    this.isUnknownMsg = !(
      this.msg.messageType ==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ||
      this.msg.messageType ==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ||
      this.msg.messageType ==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE ||
      this.msg.messageType ==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO ||
      this.msg.messageType ==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO ||
      this.msg.messageType ==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
    );

    this.uninstallFriendsWatch = autorun(() => {
      const isFriend = uiKitStore.uiStore.friends
        .filter(
          (item) =>
            !uiKitStore.relationStore.blacklist.includes(item.accountId)
        )
        .map((item) => item.accountId)
        .some((item) => item === this.msg.receiverId);
      this.isFriend = isFriend;
    });
  },
  beforeDestroy() {
    if (this.uninstallFriendsWatch) {
      this.uninstallFriendsWatch();
    }
  },
  methods: {
    closeTooltip() {
      this.$refs.tooltipRef?.close();
    },
    handleCopy() {
      this.closeTooltip();
      const timer = setTimeout(() => {
        try {
          copyText(this.msg.text);
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
    },
    scrollBottom() {
      emitter.emit(events.ON_SCROLL_BOTTOM);
    },
    async handleResendMsg() {
      const msg = this.msg;
      uiKitStore.msgStore.removeMsg(msg.conversationId, [msg.messageClientId]);

      try {
        switch (msg.messageType) {
          case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE:
          case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO:
            this.store?.msgStore.sendMessageActive({
              msg,
              conversationId: msg.conversationId,
              progress: () => true,
              sendBefore: () => {
                this.scrollBottom();
              },
            });
            break;
          default:
            this.store?.msgStore.sendMessageActive({
              msg,
              conversationId: msg.conversationId,
              sendBefore: () => {
                this.scrollBottom();
              },
            });
            break;
        }
        this.scrollBottom();
      } catch (error) {
        console.log(error);
      }
    },
    handleForwardMsg() {
      this.showForward = true;
    },
    handleReplyMsg() {
      const msg = this.msg;
      uiKitStore.msgStore.replyMsgActive(msg);
      this.closeTooltip();
      emitter.emit(events.REPLY_MSG, this.msg);
      if (
        this.msg.conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
        !this.msg.isSelf
      ) {
        emitter.emit(events.AIT_TEAM_MEMBER, {
          accountId: this.msg.senderId,
          appellation: this.store?.uiStore.getAppellation({
            account: this.msg.senderId,
            teamId: this.msg.receiverId,
            ignoreAlias: true,
          }),
        });
      }
    },
    handleRecallMsg() {
      const diff = Date.now() - this.msg.createTime;
      if (diff > msgRecallTime) {
        showToast({
          message: t("msgRecallTimeErrorText"),
          type: "info",
        });
        this.closeTooltip();
        return;
      }
      showModal({
        title: t("recallText"),
        content: t("recall3"),
        confirmText: t("recallText"),
        onConfirm: () => {
          uiKitStore.msgStore.reCallMsgActive(this.msg).catch(() => {
            showToast({
              message: t("recallMsgFailText"),
              type: "info",
            });
          });
          this.closeTooltip();
        },
        onCancel: () => {
          this.closeTooltip();
        },
      });
    },
    handleDeleteMsg() {
      const msg = this.msg;
      showModal({
        title: t("deleteText"),
        content: t("delete"),
        confirmText: t("deleteText"),
        onConfirm: () => {
          uiKitStore.msgStore
            .deleteMsgActive([msg])
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
          this.closeTooltip();
        },
        onCancel: () => {
          this.closeTooltip();
        },
      });
    },
    addFriend() {
      this.$router.push({
        path: neUiKitRouterPath.friendCard,
        query: {
          accountId: this.msg.receiverId,
        },
      });
    },
  },
};
</script>

<style scoped>
.message-bubble-root {
  min-width: 0;
  max-width: 100%;
}

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
  display: block;
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
