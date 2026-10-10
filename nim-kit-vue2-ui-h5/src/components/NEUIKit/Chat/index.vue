<template>
  <div class="msg-page-wrapper-h5">
    <NavBar :title="title" :showLeft="true">
      <template v-slot:left>
        <div @click="backToConversation">
          <Icon type="icon-zuojiantou" :size="24"></Icon>
        </div>
      </template>
      <template v-slot:right>
        <div @click="handleSetting">
          <Icon type="icon-More" :size="24" />
        </div>
      </template>
    </NavBar>
    <div class="msg-alert">
      <NetworkAlert />
    </div>
    <MessageList
      :conversationType="conversationType"
      :to="to"
      :msgs="msgs"
      :loading-more="loadingMore"
      :no-more="noMore"
      :reply-msgs-map="replyMsgsMap"
    />
    <MessageInput
      :reply-msgs-map="replyMsgsMap"
      :conversation-type="conversationType"
      :to="to"
    />
  </div>
</template>

<script>
import { trackInit } from "../utils/reporter";
import { autorun } from "../utils/store.js";
import NetworkAlert from "../CommonComponents/NetworkAlert.vue";
import NavBar from "./message/nav-bar.vue";
import Icon from "../CommonComponents/Icon.vue";
import MessageList from "./message/message-list.vue";
import MessageInput from "./message/message-input.vue";
import { HISTORY_LIMIT, events } from "../utils/constants";
import { t } from "../utils/i18n";
import { V2NIMConst } from "../utils/sdk";
import emitter from "../utils/eventBus";
import { showModal } from "../utils/modal";
import { showToast } from "../utils/toast";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { nim, uiKitStore } from "../utils/init.js";

const processReplyMsgs = (messages) => {
  const replyMsgsMap = {};
  const reqMsgs = [];
  const messageClientIds = {};

  messages.forEach((msg) => {
    if (msg.serverExtension) {
      try {
        const { yxReplyMsg } = JSON.parse(msg.serverExtension);
        if (yxReplyMsg) {
          const replyMsg = messages.find(
            (item) => item.messageClientId === yxReplyMsg.idClient
          );
          if (replyMsg) {
            replyMsgsMap[msg.messageClientId] = replyMsg;
          } else {
            replyMsgsMap[msg.messageClientId] = {
              messageClientId: "noFind",
            };
            const {
              scene,
              from,
              to,
              idServer,
              messageClientId,
              time,
              receiverId,
            } = yxReplyMsg;

            if (
              scene &&
              from &&
              to &&
              idServer &&
              messageClientId &&
              time &&
              receiverId
            ) {
              reqMsgs.push({
                scene,
                from,
                to,
                idServer,
                messageClientId,
                time,
                receiverId,
              });
              messageClientIds[idServer] = msg.messageClientId;
            }
          }
        }
      } catch {
        // Ignore malformed extension data and continue with threadReply.
      }
    }

    if (msg.threadReply) {
      const threadReply = msg.threadReply;
      const replyMsg = messages.find(
        (item) => item.messageClientId === threadReply.messageClientId
      );
      if (replyMsg) {
        replyMsgsMap[msg.messageClientId] = replyMsg;
      } else {
        replyMsgsMap[msg.messageClientId] = {
          messageClientId: "noFind",
        };
        const {
          conversationType,
          conversationId,
          senderId,
          receiverId,
          messageServerId,
          messageClientId,
          createTime,
        } = threadReply;

        if (
          conversationType &&
          conversationId &&
          senderId &&
          receiverId &&
          messageServerId &&
          messageClientId &&
          createTime
        ) {
          reqMsgs.push({
            scene: conversationType,
            from: senderId,
            to: conversationId,
            idServer: messageServerId,
            messageClientId,
            time: createTime,
            receiverId,
          });
          messageClientIds[messageServerId] = msg.messageClientId;
        }
      }
    }
  });

  return { _replyMsgsMap: replyMsgsMap, reqMsgs, messageClientIds };
};

export default {
  name: "UIKitChat",
  components: {
    NetworkAlert,
    NavBar,
    Icon,
    MessageList,
    MessageInput,
  },
  data() {
    return {
      title: "",
      loadingMore: false,
      noMore: false,
      msgs: [],
      replyMsgsMap: {},
      isMounted: false,
      connectedWatch: null,
      msgsWatch: null,
      conversationTypeWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    conversationId() {
      return this.store?.uiStore.selectedConversation;
    },
    conversationType() {
      return nim.V2NIMConversationIdUtil.parseConversationType(
        this.conversationId
      );
    },
    to() {
      return nim.V2NIMConversationIdUtil.parseConversationTargetId(
        this.conversationId
      );
    },
    teamManagerVisible() {
      return this.store?.localOptions.teamMsgReceiptVisible;
    },
    p2pMsgReceiptVisible() {
      return this.store?.localOptions.p2pMsgReceiptVisible;
    },
  },
  mounted() {
    trackInit("ChatUIKit", nim?.options?.appkey);
    this.setupWatchers();
    this.setNavTitle();

    if (this.msgs.length) {
      const messages = [...this.msgs].reverse();
      this.handleHistoryMsgReceipt(messages);
    }

    nim.V2NIMMessageService.on("onReceiveMessages", this.onReceiveMessages);
    nim.V2NIMTeamService.on("onTeamDismissed", this.onTeamDismissed);
    nim.V2NIMTeamService.on("onTeamLeft", this.onTeamLeft);
    emitter.on(events.GET_HISTORY_MSG, this.loadMoreMsgs);
  },
  beforeDestroy() {
    nim.V2NIMTeamService.off("onTeamDismissed", this.onTeamDismissed);
    nim.V2NIMTeamService.off("onTeamLeft", this.onTeamLeft);
    nim.V2NIMMessageService.off("onReceiveMessages", this.onReceiveMessages);
    emitter.off(events.GET_HISTORY_MSG, this.loadMoreMsgs);
    if (this.connectedWatch) {
      this.connectedWatch();
    }
    if (this.msgsWatch) {
      this.msgsWatch();
    }
    if (this.conversationTypeWatch) {
      this.conversationTypeWatch();
    }
  },
  methods: {
    setupWatchers() {
      this.conversationTypeWatch = autorun(() => {
        this.setNavTitle();
      });

      this.connectedWatch = autorun(() => {
        if (
          this.store?.connectStore.connectStatus ===
            V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED &&
          this.store?.connectStore.loginStatus ==
            V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
        ) {
          this.loadMoreMsgs().then(() => {
            if (!this.isMounted) {
              this.$nextTick(() => {
                emitter.emit(events.ON_SCROLL_BOTTOM);
                this.isMounted = true;
              });
            }
          });
        }
      });

      this.msgsWatch = autorun(() => {
        const messages = Array.from(
          this.store?.msgStore.getMsg(this.conversationId) || []
        );
        this.msgs = messages;

        if (messages.length !== 0) {
          const {
            _replyMsgsMap: replyMsgsMap,
            reqMsgs,
            messageClientIds,
          } = processReplyMsgs(messages);

          if (reqMsgs.length > 0) {
            nim.V2NIMMessageService.getMessageListByRefers(
              reqMsgs.map((item) => ({
                senderId: item.from,
                receiverId: item.receiverId,
                messageClientId: item.messageClientId,
                messageServerId: item.idServer,
                createTime: item.time,
                conversationType: item.scene,
                conversationId: item.to,
              }))
            )
              .then((res) => {
                if (res?.length > 0) {
                  res.forEach((item) => {
                    if (item.messageServerId) {
                      replyMsgsMap[messageClientIds[item.messageServerId]] = item;
                    }
                  });
                }
                this.replyMsgsMap = { ...replyMsgsMap };
              })
              .catch(() => {
                this.replyMsgsMap = { ...replyMsgsMap };
              });
          } else {
            this.replyMsgsMap = { ...replyMsgsMap };
          }
        }
      });
    },
    backToConversation() {
      this.$router.push(neUiKitRouterPath.conversation);
    },
    onTeamDismissed(data) {
      if (data.teamId === this.to) {
        showModal({
          content: t("onDismissTeamText"),
          title: t("tipText"),
          onCancel: () => {
            this.backToConversation();
          },
          onConfirm: () => {
            this.backToConversation();
          },
        });
      }
    },
    handleSetting() {
      if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ) {
        this.$router.push({
          path: neUiKitRouterPath.p2pSetting,
          query: {
            accountId: this.to,
          },
        });
      } else if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        this.$router.push({
          path: neUiKitRouterPath.teamSetting,
          query: {
            teamId: this.to,
          },
        });
      }
    },
    onTeamLeft() {
      showToast({
        message: t("onRemoveTeamText"),
        type: "info",
        duration: 1000,
      });
      this.backToConversation();
    },
    onReceiveMessages(msgs) {
      const curRoute = this.$route.path;
      if (
        msgs.length &&
        !msgs[0]?.isSelf &&
        msgs[0].conversationId == this.conversationId &&
        curRoute === neUiKitRouterPath.chat
      ) {
        this.handleMsgReceipt(msgs);
      }
      emitter.emit(events.ON_SCROLL_BOTTOM);
    },
    handleMsgReceipt(msg) {
      if (
        msg[0].conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P &&
        this.p2pMsgReceiptVisible
      ) {
        this.store?.msgStore.sendMsgReceiptActive(msg[0]);
      } else if (
        msg[0].conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
        this.teamManagerVisible
      ) {
        this.store?.msgStore.sendTeamMsgReceiptActive(msg);
      }
    },
    handleHistoryMsgReceipt(msgs) {
      if (
        this.conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P &&
        this.p2pMsgReceiptVisible
      ) {
        const myUserAccountId = nim.V2NIMLoginService.getLoginUser();
        const othersMsgs = msgs
          .filter(
            (item) =>
              !["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
          )
          .filter((item) => item.senderId !== myUserAccountId);

        if (othersMsgs.length > 0) {
          this.store?.msgStore.sendMsgReceiptActive(othersMsgs[0]);
        }
      } else if (
        this.conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
        this.teamManagerVisible
      ) {
        const myUserAccountId = nim.V2NIMLoginService.getLoginUser();
        const myMsgs = msgs
          .filter(
            (item) =>
              !["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
          )
          .filter((item) => item.senderId === myUserAccountId);

        this.store?.msgStore.getTeamMsgReadsActive(myMsgs, this.conversationId);

        const othersMsgs = msgs
          .filter(
            (item) =>
              !["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
          )
          .filter((item) => item.senderId !== myUserAccountId);

        if (othersMsgs.length > 0 && othersMsgs.length < 50) {
          this.store?.msgStore.sendTeamMsgReceiptActive(othersMsgs);
        }
      }
    },
    async getHistory(endTime, lastMsgId) {
      if (this.noMore || this.loadingMore) {
        return [];
      }
      this.loadingMore = true;
      try {
        if (this.conversationId) {
          const historyMsgs = await this.store?.msgStore.getHistoryMsgActive({
            conversationId: this.conversationId,
            endTime,
            lastMsgId,
            limit: HISTORY_LIMIT,
          });

          if (historyMsgs?.length) {
            if (historyMsgs.length < HISTORY_LIMIT) {
              this.noMore = true;
            }
            this.handleHistoryMsgReceipt(historyMsgs);
            return historyMsgs;
          }
          this.noMore = true;
        }
      } finally {
        this.loadingMore = false;
      }
      return [];
    },
    loadMoreMsgs(lastMsg) {
      const request = lastMsg
        ? this.getHistory(lastMsg.createTime, lastMsg.messageServerId)
        : this.getHistory(Date.now());
      return request.catch(() => {
        showToast({
          message: t("getHistoryMsgFailedText"),
          type: "info",
        });
        return [];
      });
    },
    setNavTitle() {
      if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ) {
        this.title = this.store?.uiStore.getAppellation({
          account: this.to,
        });
      } else if (
        this.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        const team = this.store?.teamStore.teams.get(this.to);
        const subTitle = `(${team?.memberCount || 0})`;
        this.title = (team?.name || "") + subTitle;
      }
    },
  },
};
</script>

<style scoped>
.msg-page-wrapper-h5 {
  width: 100%;
  height: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
}

.msg-alert {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  z-index: 1;
}

.msg-wrapper {
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
}

.msg-wrapper-h5 {
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
}

.msg-wrapper > message-list {
  height: 100%;
}
</style>
