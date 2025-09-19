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

<script lang="ts" setup>
import { trackInit } from "../utils/reporter";
import { autorun } from "mobx";
import { ref, onMounted, onUnmounted, getCurrentInstance, nextTick } from "vue";
import NetworkAlert from "../CommonComponents/NetworkAlert.vue";
import NavBar from "./message/nav-bar.vue";
import Icon from "../CommonComponents/Icon.vue";
import MessageList from "./message/message-list.vue";
import MessageInput from "./message/message-input.vue";
import { HISTORY_LIMIT, events } from "../utils/constants";
import { t } from "../utils/i18n";
import type { V2NIMMessage } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import type { V2NIMConversationType } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMConversationService";
import { useRouter } from "vue-router";
import emitter from "../utils/eventBus";
import { showModal } from "../utils/modal";
import { showToast } from "../utils/toast";
import { neUiKitRouterPath } from "../utils/uikitRouter";

export interface YxReplyMsg {
  messageClientId: string;
  scene: V2NIMConst.V2NIMConversationType;
  from: string;
  receiverId: string;
  to: string;
  idServer: string;
  time: number;
}

const title = ref("");
const router = useRouter();

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;

/**会话ID */
const conversationId = store?.uiStore.selectedConversation as string;
/**会话类型 */
const conversationType =
  proxy?.$NIM.V2NIMConversationIdUtil.parseConversationType(
    conversationId
  ) as unknown as V2NIMConversationType;
/**对话方 */
const to =
  proxy?.$NIM.V2NIMConversationIdUtil.parseConversationTargetId(conversationId);

trackInit("ChatUIKit", nim?.options?.appkey);

/**回到会话列表 */
const backToConversation = () => {
  router.push(neUiKitRouterPath.conversation);
};

/**是否需要显示群组消息已读未读，默认 false */
const teamManagerVisible = store?.localOptions.teamMsgReceiptVisible;

/**是否需要显示 p2p 消息、p2p会话列表消息已读未读，默认 false */
const p2pMsgReceiptVisible = store?.localOptions.p2pMsgReceiptVisible;

let isMounted = false;

const loadingMore = ref(false);

/**是否还有更多历史消息 */

const noMore = ref(false);

/**消息列表 */
const msgs = ref<V2NIMMessage[]>([]);

/**回复消息map，用于回复消息的解析处理 */
const replyMsgsMap = ref<Record<string, V2NIMMessage>>();

/** 解散群组回调 */
const onTeamDismissed = (data: any) => {
  if (data.teamId === to) {
    showModal({
      content: t("onDismissTeamText"),
      title: t("tipText"),
      onCancel: () => {
        backToConversation();
      },
      onConfirm: () => {
        backToConversation();
      },
    });
  }
};

// 跳转设置页
const handleSetting = () => {
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
  ) {
    router.push({
      path: neUiKitRouterPath.p2pSetting,
      query: {
        accountId: to,
      },
    });
  } else if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    router.push({
      path: neUiKitRouterPath.teamSetting,
      query: {
        teamId: to,
      },
    });
  }
};

/** 自己主动离开群组或被管理员踢出回调 */
const onTeamLeft = (data: any) => {
  showToast({
    message: t("onRemoveTeamText"),
    type: "info",
    duration: 1000,
  });
  backToConversation();
};

/** 收到新消息 */
const onReceiveMessages = (msgs: V2NIMMessage[]) => {
  // 当前在聊天页，视为消息已读，发送已读回执
  const curRoute = router.currentRoute.value.path;
  if (
    msgs.length &&
    !msgs[0]?.isSelf &&
    msgs[0].conversationId == conversationId &&
    // todo
    curRoute === neUiKitRouterPath.chat
  ) {
    handleMsgReceipt(msgs);
  }
  emitter.emit(events.ON_SCROLL_BOTTOM);
};

/** 处理收到消息的已读回执 */
const handleMsgReceipt = (msg: V2NIMMessage[]) => {
  if (
    msg[0].conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P &&
    p2pMsgReceiptVisible
  ) {
    store?.msgStore.sendMsgReceiptActive(msg[0]);
  } else if (
    msg[0].conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
    teamManagerVisible
  ) {
    store?.msgStore.sendTeamMsgReceiptActive(msg);
  }
};

/** 处理历史消息的已读未读 */
const handleHistoryMsgReceipt = (msgs: V2NIMMessage[]) => {
  /** 如果是单聊 */
  if (
    conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P &&
    p2pMsgReceiptVisible
  ) {
    const myUserAccountId = proxy?.$NIM.V2NIMLoginService.getLoginUser();
    const othersMsgs = msgs
      .filter(
        (item: V2NIMMessage) =>
          // @ts-ignore
          !["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
      )
      .filter((item: V2NIMMessage) => item.senderId !== myUserAccountId);

    /** 发送单聊消息已读回执 */
    if (othersMsgs.length > 0) {
      store?.msgStore.sendMsgReceiptActive(othersMsgs?.[0]);
    }

    /** 如果是群聊 */
  } else if (
    conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
    teamManagerVisible
  ) {
    const myUserAccountId = proxy?.$NIM.V2NIMLoginService.getLoginUser();
    const myMsgs = msgs
      .filter(
        (item: V2NIMMessage) =>
          // @ts-ignore
          !["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
      )
      .filter((item: V2NIMMessage) => item.senderId === myUserAccountId);

    store?.msgStore.getTeamMsgReadsActive(myMsgs, conversationId);

    // 发送群消息已读回执
    // sdk 要求 一次最多传入 50 个消息对象
    const othersMsgs = msgs
      .filter(
        (item: V2NIMMessage) =>
          // @ts-ignore
          !["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
      )
      .filter((item: V2NIMMessage) => item.senderId !== myUserAccountId);

    if (othersMsgs.length > 0 && othersMsgs.length < 50) {
      store?.msgStore.sendTeamMsgReceiptActive(othersMsgs);
    }
  }
};

/** 拉取历史消息 */
const getHistory = async (endTime: number, lastMsgId?: string) => {
  try {
    if (noMore.value) {
      return [];
    }
    if (loadingMore.value) {
      return [];
    }
    loadingMore.value = true;
    if (conversationId) {
      const historyMsgs = await store?.msgStore.getHistoryMsgActive({
        conversationId,
        endTime,
        lastMsgId,
        limit: HISTORY_LIMIT,
      });

      loadingMore.value = false;

      if (historyMsgs?.length) {
        if (historyMsgs.length < HISTORY_LIMIT) {
          noMore.value = true;
        }
        // 消息已读未读相关
        handleHistoryMsgReceipt(historyMsgs);
        return historyMsgs;
      } else {
        noMore.value = true;
      }
    }
  } catch (error) {
    loadingMore.value = false;
    throw error;
  }
};

/** 加载更多消息 */
const loadMoreMsgs = (lastMsg) => {
  if (lastMsg) {
    getHistory(lastMsg.createTime, lastMsg.messageServerId);
  } else {
    getHistory(Date.now());
  }
};

/** 监听当前聊天页面的会话类型 */
const conversationTypeWatch = autorun(() => {
  // 如果是单聊
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
  ) {
    title.value = store?.uiStore.getAppellation({
      account: to,
    }) as string;
    // 如果是群聊
  } else if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    const team = store?.teamStore.teams.get(to);
    const subTitle = `(${team?.memberCount || 0})`;
    title.value = (team?.name || "") + subTitle;
  }
});

/** 监听连接状态 */
const connectedWatch = autorun(() => {
  if (
    store?.connectStore.connectStatus ===
    V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED
  ) {
    if (
      store?.connectStore.loginStatus ==
      V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
    ) {
      // 进入聊天页首次加载消息
      getHistory(Date.now()).then(() => {
        if (!isMounted) {
          nextTick(() => {
            emitter.emit(events.ON_SCROLL_BOTTOM);
            isMounted = true;
          });
        }
      });
    }
  }
});

/** 动态更新消息 */
const msgsWatch = autorun(() => {
  const messages = store?.msgStore.getMsg(conversationId) || [];

  msgs.value = messages || [];

  // 遍历所有消息，找出被回复消息，储存在map中
  if (messages.length !== 0) {
    const _replyMsgsMap: any = {};
    const reqMsgs: YxReplyMsg[] = [];
    const messageClientIds: Record<string, string> = {};
    msgs.value.forEach((msg) => {
      if (msg.serverExtension) {
        try {
          // yxReplyMsg 存储着被回复消息的相关消息
          const { yxReplyMsg } = JSON.parse(msg.serverExtension);
          if (yxReplyMsg) {
            // 从消息列表中找到被回复消息，replyMsg 为被回复的消息
            const replyMsg = msgs.value.find(
              (item) => item.messageClientId === yxReplyMsg.idClient
            );
            // 如果直接找到，存储在map中
            if (replyMsg) {
              _replyMsgsMap[msg.messageClientId] = replyMsg;
              // 如果没找到，说明被回复的消息可能有三种情况：1.被删除 2.被撤回 3.不在当前消息列表中（一次性没拉到，在之前的消息中）
            } else {
              _replyMsgsMap[msg.messageClientId] = {
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
        } catch {}
      }
    });

    if (reqMsgs.length > 0) {
      // 从服务器拉取被回复消息, 但是有频率控制
      proxy?.$NIM.V2NIMMessageService.getMessageListByRefers(
        //@ts-ignore
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
        .then((res: any) => {
          if (res?.length > 0) {
            res.forEach((item: any) => {
              if (item.messageServerId) {
                _replyMsgsMap[messageClientIds[item.messageServerId]] = item;
              }
            });
          }
          replyMsgsMap.value = { ..._replyMsgsMap };
        })
        .catch(() => {
          replyMsgsMap.value = { ..._replyMsgsMap };
        });
    } else {
      replyMsgsMap.value = { ..._replyMsgsMap };
    }
  }

  // 当聊天消息小于6条时，由于页面被键盘撑起，导致已经发出的消息不可见，所以需要隐藏键盘
  if (messages.length < 6) {
  }
});

/** 设置页面标题 */
const setNavTitle = () => {
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
  ) {
    title.value = store?.uiStore.getAppellation({
      account: to,
    }) as string;
  } else if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    const team = store?.teamStore.teams.get(to);
    const subTitle = `(${team?.memberCount || 0})`;
    title.value = (team?.name || "") + subTitle;
  }
};

onMounted(() => {
  setNavTitle();

  if (msgs.value.length) {
    const _msgs = [...msgs.value].reverse();
    handleHistoryMsgReceipt(_msgs);
  }

  /** 收到消息 */
  proxy?.$NIM.V2NIMMessageService.on(
    "onReceiveMessages",
    //@ts-ignore
    onReceiveMessages
  );
  /** 解散群组回调 */
  proxy?.$NIM.V2NIMTeamService.on("onTeamDismissed", onTeamDismissed);
  /** 自己主动离开群组或被管理员踢出回调 */
  proxy?.$NIM.V2NIMTeamService.on("onTeamLeft", onTeamLeft);

  emitter.on(events.GET_HISTORY_MSG, loadMoreMsgs);
});

onUnmounted(() => {
  proxy?.$NIM.V2NIMTeamService.off("onTeamDismissed", onTeamDismissed);
  proxy?.$NIM.V2NIMTeamService.off("onTeamLeft", onTeamLeft);
  proxy?.$NIM.V2NIMMessageService.off(
    "onReceiveMessages",
    //@ts-ignore
    onReceiveMessages
  );

  emitter.off(events.GET_HISTORY_MSG, loadMoreMsgs);
  /** 移除store的数据监听 */
  connectedWatch();
  msgsWatch();
  conversationTypeWatch();
});
</script>

<style scoped>
.msg-page-wrapper-h5 {
  width: 100%;
  height: 100%;
  max-width: 100%;
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
