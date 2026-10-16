import { ref, watch, type Ref } from "vue";
import { autorun, reaction } from "mobx";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/src/types";
import type { PinInfo } from "@xkit-yx/im-store-v2/dist/types/src/pinMsgsMap";
import { HISTORY_LIMIT } from "../../utils/constants";

const ANCHOR_HISTORY_LIMIT = 10;

const getMessageKey = (item: V2NIMMessageForUI) => {
  if (item.messageClientId) return `client:${item.messageClientId}`;
  if (item.messageServerId && item.messageServerId !== "0") {
    return `server:${item.messageServerId}`;
  }
  return `local:${item.conversationId}:${item.senderId}:${item.createTime}`;
};

const isSameMessage = (left: V2NIMMessageForUI, right: V2NIMMessageForUI) => {
  return (
    getMessageKey(left) === getMessageKey(right) ||
    (!!left.messageClientId && left.messageClientId === right.messageClientId) ||
    (!!left.messageServerId &&
      left.messageServerId !== "0" &&
      left.messageServerId === right.messageServerId)
  );
};

const isSendingMessage = (msg: V2NIMMessageForUI) =>
  msg.sendingState ===
  V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SENDING;

const getMessagesToPreserve = (
  snapshot: V2NIMMessageForUI[],
  current: V2NIMMessageForUI[],
  preservedMessageClientIds: string[] = []
) => {
  // Keep request-time additions, pending sends, and explicitly retained local notices.
  const snapshotKeys = new Set(snapshot.map(getMessageKey));
  const sendingKeys = new Set(snapshot.filter(isSendingMessage).map(getMessageKey));
  const preservedIdSet = new Set(preservedMessageClientIds);
  return current.filter((msg) => {
    const key = getMessageKey(msg);
    return (
      !snapshotKeys.has(key) ||
      sendingKeys.has(key) ||
      preservedIdSet.has(msg.messageClientId)
    );
  });
};

export interface ChatMessageLoaderOptions {
  conversationId: string;
  anchorMessageClientId?: string;
  loginStatus: Ref<V2NIMConst.V2NIMLoginStatus>;
  store: any;
  nim: any;
  onHistoryMessagesLoaded?: (
    messages: V2NIMMessageForUI[]
  ) => void | Promise<void>;
  onError?: (error: any) => void;
}

const mergeMessages = (messages: V2NIMMessageForUI[]) => {
  const result: V2NIMMessageForUI[] = [];
  messages.forEach((item) => {
    const index = result.findIndex((existing) => isSameMessage(existing, item));
    if (index >= 0) {
      result[index] = item;
    } else {
      result.push(item);
    }
  });
  return result.sort((a, b) => a.createTime - b.createTime);
};

export const createChatMessageLoader = ({
  conversationId,
  anchorMessageClientId = "",
  loginStatus,
  store,
  nim,
  onHistoryMessagesLoaded,
  onError,
}: ChatMessageLoaderOptions) => {
  const msgs = ref<V2NIMMessageForUI[]>([]);
  const loadingOlder = ref(false);
  const loadingNewer = ref(false);
  const hasOlder = ref(true);
  const hasNewer = ref(false);
  const anchorMode = ref(false);
  const hasLoadedLatest = ref(false);
  const showLatestHint = ref(false);
  const hasLoadedInitial = ref(false);
  let prevLoginStatus = loginStatus.value;
  let canceled = false;
  let requestGeneration = 0;
  let loadingOlderOwner: number | null = null;

  const beginLoadingOlder = (generation: number) => {
    if (loadingOlder.value && loadingOlderOwner !== generation) {
      loadingOlderOwner = null;
      loadingOlder.value = false;
    }
    if (loadingOlder.value) return false;
    loadingOlderOwner = generation;
    loadingOlder.value = true;
    return true;
  };

  const endLoadingOlder = (generation: number) => {
    if (loadingOlderOwner !== generation) return;
    loadingOlderOwner = null;
    loadingOlder.value = false;
  };

  const isCurrentRequest = (context: {
    generation: number;
    conversationId: string;
    nim: any;
    store: any;
    accountId: string;
    loginStatus: V2NIMConst.V2NIMLoginStatus;
  }) => {
    try {
      return (
        !canceled &&
        context.generation === requestGeneration &&
        context.conversationId === conversationId &&
        context.nim === nim &&
        context.store === store &&
        context.loginStatus === loginStatus.value &&
        context.accountId === context.nim.V2NIMLoginService.getLoginUser()
      );
    } catch {
      return false;
    }
  };

  const normalizeHistoryMsgs = (messages: V2NIMMessageForUI[]) => {
    const pinMap = store.msgStore.pinMsgs.map.get(conversationId);
    return messages
      .map((item) => {
        if (pinMap?.has(item.messageClientId)) {
          return store.msgStore.handleMsgPinState({ ...item }, pinMap);
        }
        return {
          ...item,
          pinState: 0,
          operatorId: undefined,
        };
      })
      .sort((a, b) => a.createTime - b.createTime);
  };

  const getConversationLastMessage = () => {
    const conversationStore = store.sdkOptions?.enableV2CloudConversation
      ? store.conversationStore
      : store.localConversationStore;
    return conversationStore?.conversations.get(conversationId)?.lastMessage;
  };

  const containsLastMessage = (messages: V2NIMMessageForUI[]) => {
    const lastMessage = getConversationLastMessage();
    if (!lastMessage) {
      return false;
    }

    const refer = lastMessage.messageRefer;
    return messages.some((msg) => {
      if (
        refer?.messageClientId &&
        msg.messageClientId === refer.messageClientId
      ) {
        return true;
      }
      if (
        refer?.messageServerId &&
        msg.messageServerId === refer.messageServerId
      ) {
        return true;
      }
      return (
        msg.messageClientId === lastMessage.messageClientId ||
        msg.messageServerId === lastMessage.messageServerId
      );
    });
  };

  const updateLatestStateByMessages = (messages: V2NIMMessageForUI[]) => {
    if (messages.length === 0 || containsLastMessage(messages)) {
      hasNewer.value = false;
      hasLoadedLatest.value = true;
      showLatestHint.value = false;
    }
  };

  const syncLoadedMessagesFromStore = (loadedMessages: V2NIMMessageForUI[]) => {
    if (!conversationId || !loadedMessages.length) {
      return;
    }

    const messageClientIds = loadedMessages
      .map((item) => item.messageClientId)
      .filter(Boolean);
    const storeMsgs =
      store.msgStore.getMsg(conversationId, messageClientIds) || [];
    if (!storeMsgs.length) {
      return;
    }

    const storeMsgMap = new Map<string, V2NIMMessageForUI>(
      storeMsgs.map((item: V2NIMMessageForUI) => [item.messageClientId, item])
    );
    msgs.value = mergeMessages(
      msgs.value.map((item) => storeMsgMap.get(item.messageClientId) || item)
    );
  };

  const notifyHistoryMessagesLoaded = async (
    loadedMessages: V2NIMMessageForUI[]
  ) => {
    if (!loadedMessages.length) {
      return;
    }
    await onHistoryMessagesLoaded?.(loadedMessages);
    if (anchorMode.value) {
      syncLoadedMessagesFromStore(loadedMessages);
    }
  };

  const refreshLocalPinState = () => {
    if (!conversationId) {
      return;
    }
    const pinMap = store.msgStore.pinMsgs.map.get(conversationId);
    const currentMsgs = store.msgStore.getMsg(conversationId) || [];
    if (!currentMsgs.length) {
      return;
    }

    const nextMsgs = currentMsgs.map((msg: V2NIMMessageForUI) => {
      if (pinMap?.has(msg.messageClientId)) {
        return store.msgStore.handleMsgPinState({ ...msg }, pinMap);
      }
      return {
        ...msg,
        pinState: 0,
        operatorId: undefined,
      };
    });

    const currentMsgMap = new Map<string, V2NIMMessageForUI>(
      currentMsgs.map((msg: V2NIMMessageForUI) => [msg.messageClientId, msg])
    );
    nextMsgs.forEach((msg: V2NIMMessageForUI) => {
      const currentMsg = currentMsgMap.get(msg.messageClientId);
      if (
        currentMsg?.pinState !== msg.pinState ||
        currentMsg?.operatorId !== msg.operatorId
      ) {
        store.msgStore.updateMsg(conversationId, msg.messageClientId, {
          pinState: msg.pinState,
          operatorId: msg.operatorId,
        });
      }
    });

    if (!anchorMode.value) {
      msgs.value = nextMsgs;
      return;
    }

    const nextMsgMap = new Map<string, V2NIMMessageForUI>(
      nextMsgs.map((msg: V2NIMMessageForUI) => [msg.messageClientId, msg])
    );
    msgs.value = msgs.value.map(
      (msg) => nextMsgMap.get(msg.messageClientId) || msg
    );
  };

  const syncPinnedMessageList = async (forceUpdate = false) => {
    if (!conversationId) {
      return false;
    }
    const currentRequestGeneration = ++requestGeneration;
    const requestConversationId = conversationId;
    const requestNim = nim;
    const requestStore = store;
    const requestAccountId = nim.V2NIMLoginService.getLoginUser();
    const requestLoginStatus = loginStatus.value;
    const requestContext = {
      generation: currentRequestGeneration,
      conversationId: requestConversationId,
      nim: requestNim,
      store: requestStore,
      accountId: requestAccountId,
      loginStatus: requestLoginStatus,
    };

    try {
      const cachedPinMap = requestStore.msgStore.pinMsgs.map.get(requestConversationId);
      let pinInfos: PinInfo[] = cachedPinMap && !forceUpdate
        ? (Array.from(cachedPinMap.values()) as PinInfo[])
        : ((await requestNim.V2NIMMessageService.getPinnedMessageList(requestConversationId)) || []).map((pin: any) => ({
            ...pin,
            pinState: 1,
          }));
      let shouldWritePinMap = forceUpdate || !cachedPinMap;
      const missingMessageRefers = pinInfos
        .filter((pinInfo) => !pinInfo.message)
        .map((pinInfo) => pinInfo.messageRefer);

      if (missingMessageRefers.length) {
        try {
          const messages = (await requestNim.V2NIMMessageService.getMessageListByRefers(
            missingMessageRefers
          )) || [];
          const messageMap = new Map<string, V2NIMMessageForUI>(
            (messages || []).map(
              (message: any) =>
                [message.messageClientId, message] as [string, V2NIMMessageForUI]
            )
          );
          pinInfos = pinInfos.map((pinInfo) => {
            const message = messageMap.get(pinInfo.messageRefer.messageClientId);
            return message ? { ...pinInfo, message } : pinInfo;
          });
          shouldWritePinMap = shouldWritePinMap || messages.length > 0;
        } catch (error) {
          console.error("Get pinned message details failed", error);
        }
      }

      if (!isCurrentRequest(requestContext)) return false;

      if (shouldWritePinMap) {
        requestStore.msgStore.pinMsgs.clear(requestConversationId);
        requestStore.msgStore.pinMsgs.set(requestConversationId, pinInfos);
      }
      refreshLocalPinState();
      return true;
    } catch (error) {
      console.error("Get pinned message list failed", error);
      return isCurrentRequest(requestContext);
    }
  };

  const getAnchorMessage = async () => {
    if (!anchorMessageClientId || !conversationId) {
      return undefined;
    }

    const localMsg = store.msgStore.getMsg(conversationId, [
      anchorMessageClientId,
    ])?.[0];
    if (localMsg) {
      return localMsg;
    }

    const pinInfo = store.msgStore.pinMsgs
      .map
      .get(conversationId)
      ?.get(anchorMessageClientId);
    if (pinInfo?.message) {
      return pinInfo.message as V2NIMMessageForUI;
    }

    if (pinInfo?.messageRefer) {
      const result = await nim.V2NIMMessageService.getMessageListByRefers([
        pinInfo.messageRefer,
      ]);
      return result?.[0] as V2NIMMessageForUI | undefined;
    }

    return undefined;
  };

  const loadLatestHistory = async (
    resetLocalMessages = false,
    preservedMessageClientIds: string[] = []
  ) => {
    if (!conversationId) {
      return [];
    }
    const currentRequestGeneration = ++requestGeneration;
    const requestConversationId = conversationId;
    const requestNim = nim;
    const requestStore = store;
    const requestAccountId = nim.V2NIMLoginService.getLoginUser();
    const requestLoginStatus = loginStatus.value;
    const snapshot = resetLocalMessages
      ? (store.msgStore.getMsg(conversationId) || [])
      : [];
    if (!beginLoadingOlder(currentRequestGeneration)) return [];
    try {
      const historyMsgs = await nim.V2NIMMessageService.getMessageList({
        conversationId,
        endTime: Date.now(),
        limit: HISTORY_LIMIT,
      });
      if (!isCurrentRequest({
        generation: currentRequestGeneration,
        conversationId: requestConversationId,
        nim: requestNim,
        store: requestStore,
        accountId: requestAccountId,
        loginStatus: requestLoginStatus,
      })) {
        return [];
      }

      const normalizedMsgs = normalizeHistoryMsgs(historyMsgs || []);

      hasOlder.value = normalizedMsgs.length >= HISTORY_LIMIT;
      hasNewer.value = false;
      anchorMode.value = false;
      hasLoadedLatest.value = true;
      showLatestHint.value = false;
      if (resetLocalMessages) {
        const currentMessages = store.msgStore.getMsg(conversationId) || [];
        const messagesToPreserve = getMessagesToPreserve(
          snapshot,
          currentMessages,
          preservedMessageClientIds
        );
        const nextMessages = mergeMessages([
          ...normalizedMsgs,
          ...messagesToPreserve,
        ]);
        store.msgStore.removeMsg(conversationId);
        store.msgStore.addMsg(conversationId, nextMessages);
        msgs.value = nextMessages;
      } else {
        store.msgStore.addMsg(conversationId, normalizedMsgs);
        msgs.value = store.msgStore.getMsg(conversationId) || normalizedMsgs;
      }
      await notifyHistoryMessagesLoaded(normalizedMsgs);
      return normalizedMsgs;
    } finally {
      endLoadingOlder(currentRequestGeneration);
    }
  };

  const loadAnchorHistory = async () => {
    if (!anchorMessageClientId || !conversationId) {
      return false;
    }
    const currentRequestGeneration = ++requestGeneration;
    const requestConversationId = conversationId;
    const requestNim = nim;
    const requestStore = store;
    const requestAccountId = nim.V2NIMLoginService.getLoginUser();
    const requestLoginStatus = loginStatus.value;
    if (!beginLoadingOlder(currentRequestGeneration)) return false;
    try {
      const anchorMessage = await getAnchorMessage();
      if (!anchorMessage) {
        return false;
      }

      const [beforeMsgs, afterMsgs] = await Promise.all([
        nim.V2NIMMessageService.getMessageList({
          conversationId,
          anchorMessage,
          direction:
            V2NIMConst.V2NIMQueryDirection.V2NIM_QUERY_DIRECTION_DESC,
          limit: ANCHOR_HISTORY_LIMIT,
        }),
        nim.V2NIMMessageService.getMessageList({
          conversationId,
          anchorMessage,
          direction: V2NIMConst.V2NIMQueryDirection.V2NIM_QUERY_DIRECTION_ASC,
          limit: ANCHOR_HISTORY_LIMIT,
        }),
      ]);
      if (!isCurrentRequest({
        generation: currentRequestGeneration,
        conversationId: requestConversationId,
        nim: requestNim,
        store: requestStore,
        accountId: requestAccountId,
        loginStatus: requestLoginStatus,
      })) {
        return false;
      }

      const normalizedMsgs = normalizeHistoryMsgs([
        ...(beforeMsgs || []),
        anchorMessage,
        ...(afterMsgs || []),
      ]);
      const mergedMsgs = mergeMessages(normalizedMsgs);
      const hasLoadedLatestNow =
        (afterMsgs || []).length === 0 ||
        containsLastMessage([anchorMessage, ...(afterMsgs || [])]);

      store.msgStore.addMsg(conversationId, mergedMsgs);
      msgs.value = mergedMsgs;
      hasOlder.value = (beforeMsgs || []).length >= ANCHOR_HISTORY_LIMIT;
      hasNewer.value = !hasLoadedLatestNow;
      anchorMode.value = true;
      hasLoadedLatest.value = hasLoadedLatestNow;
      showLatestHint.value = false;
      await notifyHistoryMessagesLoaded(mergedMsgs);
      return true;
    } finally {
      endLoadingOlder(currentRequestGeneration);
    }
  };

  const loadOlder = async (firstMsg?: V2NIMMessageForUI) => {
    if (!conversationId || !hasOlder.value) {
      return [];
    }
    const currentRequestGeneration = ++requestGeneration;
    const requestConversationId = conversationId;
    const requestNim = nim;
    const requestStore = store;
    const requestAccountId = nim.V2NIMLoginService.getLoginUser();
    const requestLoginStatus = loginStatus.value;
    if (!beginLoadingOlder(currentRequestGeneration)) return [];
    try {
      let historyMsgs: V2NIMMessageForUI[] = [];
      if (anchorMode.value && firstMsg) {
        historyMsgs =
          (await nim.V2NIMMessageService.getMessageList({
            conversationId,
            anchorMessage: firstMsg,
            direction:
              V2NIMConst.V2NIMQueryDirection.V2NIM_QUERY_DIRECTION_DESC,
            limit: HISTORY_LIMIT,
          })) || [];
      } else {
        const anchorMessage = firstMsg?.messageClientId
          ? store.msgStore.getMsg(conversationId, [firstMsg.messageClientId])?.[0] || firstMsg
          : undefined;
        historyMsgs = (await nim.V2NIMMessageService.getMessageList({
          conversationId,
          endTime: firstMsg?.createTime || Date.now(),
          anchorMessage: anchorMessage as any,
          limit: HISTORY_LIMIT,
        })) || [];
      }

      if (!isCurrentRequest({
        generation: currentRequestGeneration,
        conversationId: requestConversationId,
        nim: requestNim,
        store: requestStore,
        accountId: requestAccountId,
        loginStatus: requestLoginStatus,
      })) return [];

      const normalizedMsgs = normalizeHistoryMsgs(historyMsgs);
      hasOlder.value = normalizedMsgs.length >= HISTORY_LIMIT;
      if (normalizedMsgs.length) {
        store.msgStore.addMsg(conversationId, normalizedMsgs);
        msgs.value = mergeMessages([...normalizedMsgs, ...msgs.value]);
        await notifyHistoryMessagesLoaded(normalizedMsgs);
      }
      return normalizedMsgs;
    } finally {
      endLoadingOlder(currentRequestGeneration);
    }
  };

  const loadNewer = async (lastMsg?: V2NIMMessageForUI) => {
    if (
      !anchorMode.value ||
      loadingNewer.value ||
      !lastMsg ||
      !hasNewer.value
    ) {
      return [];
    }
    const currentRequestGeneration = ++requestGeneration;
    const requestConversationId = conversationId;
    const requestNim = nim;
    const requestStore = store;
    const requestAccountId = nim.V2NIMLoginService.getLoginUser();
    const requestLoginStatus = loginStatus.value;
    loadingNewer.value = true;
    try {
      const newerMsgs =
        (await nim.V2NIMMessageService.getMessageList({
          conversationId,
          anchorMessage: lastMsg,
          direction: V2NIMConst.V2NIMQueryDirection.V2NIM_QUERY_DIRECTION_ASC,
          limit: HISTORY_LIMIT,
        })) || [];
      if (!isCurrentRequest({
        generation: currentRequestGeneration,
        conversationId: requestConversationId,
        nim: requestNim,
        store: requestStore,
        accountId: requestAccountId,
        loginStatus: requestLoginStatus,
      })) return [];

      const normalizedMsgs = normalizeHistoryMsgs(newerMsgs);

      if (normalizedMsgs.length) {
        store.msgStore.addMsg(conversationId, normalizedMsgs);
        msgs.value = mergeMessages([...msgs.value, ...normalizedMsgs]);
        await notifyHistoryMessagesLoaded(normalizedMsgs);
      }
      if (
        normalizedMsgs.length === 0 ||
        normalizedMsgs.length < HISTORY_LIMIT ||
        containsLastMessage(normalizedMsgs)
      ) {
        updateLatestStateByMessages(normalizedMsgs);
      }
      return normalizedMsgs;
    } finally {
      loadingNewer.value = false;
    }
  };

  const switchToLatest = async (preservedMessageClientIds: string[] = []) => {
    loadingNewer.value = true;
    try {
      return await loadLatestHistory(true, preservedMessageClientIds);
    } finally {
      loadingNewer.value = false;
    }
  };

  const handleIncomingMessages = (messages: V2NIMMessageForUI[]) => {
    if (!conversationId || !messages.length) {
      return false;
    }
    const currentMessages = normalizeHistoryMsgs(
      messages.filter((item) => item.conversationId === conversationId)
    );
    if (!currentMessages.length) {
      return false;
    }

    if (!anchorMode.value) {
      return true;
    }

    if (hasLoadedLatest.value) {
      msgs.value = mergeMessages([...msgs.value, ...currentMessages]);
    } else {
      showLatestHint.value = true;
    }
    return false;
  };

  const msgDispose = autorun(() => {
    if (!conversationId) {
      return;
    }
    const storeMsgs = store.msgStore.getMsg(conversationId) || [];
    if (anchorMode.value) {
      const normalizedStoreMsgs = normalizeHistoryMsgs(storeMsgs);
      const storeMsgMap = new Map<string, V2NIMMessageForUI>(
        normalizedStoreMsgs.map((msg: V2NIMMessageForUI) => [
          msg.messageClientId,
          msg,
        ])
      );
      const retainedMsgs = msgs.value
        .filter((msg) => storeMsgMap.has(msg.messageClientId))
        .map((msg) => storeMsgMap.get(msg.messageClientId) || msg);

      if (hasLoadedLatest.value && storeMsgs.length) {
        msgs.value = mergeMessages([...retainedMsgs, ...normalizedStoreMsgs]);
      } else {
        msgs.value = retainedMsgs;
      }
      return;
    }
    msgs.value = storeMsgs;
  });

  const pinDispose = reaction(
    () => {
      if (!conversationId) {
        return "";
      }
      const pinMap = store.msgStore.pinMsgs.map.get(conversationId);
      return pinMap
        ? [...pinMap.values()]
            .map((pinInfo: any) =>
              [
                pinInfo.messageRefer?.messageClientId,
                pinInfo.pinState,
                pinInfo.operatorId,
                pinInfo.updateTime,
              ].join(":")
            )
            .join("|")
        : "";
    },
    () => {
      refreshLocalPinState();
    },
    { fireImmediately: true }
  );

  const stopLoginWatch = watch(
    loginStatus,
    (curLoginStatus) => {
      if (
        curLoginStatus !==
        V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
      ) {
        prevLoginStatus = curLoginStatus;
        return;
      }
      if (!conversationId) {
        return;
      }

      const loadInitialMessages = async () => {
        const forceUpdatePinList =
          hasLoadedInitial.value &&
          prevLoginStatus !==
            V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED;
        const pinnedMessagesSynced = await syncPinnedMessageList(
          forceUpdatePinList
        );
        if (canceled || !pinnedMessagesSynced) {
          return;
        }
        const loadedAnchor = anchorMessageClientId
          ? await loadAnchorHistory()
          : false;
        if (!canceled && (!anchorMessageClientId || !loadedAnchor)) {
          await loadLatestHistory();
        }
        hasLoadedInitial.value = true;
        prevLoginStatus = curLoginStatus;
      };

      // 重连（loginStatus 由断开变回已登录）时不能清空消息列表：
      // 清空会让滚动容器的内容瞬间塌陷、scrollTop 被夹回 0，随后回填历史/最新一页也不会恢复滚动位置，
      // 表现为"自动滚动到最后一页消息的第一条"。
      // 只在首次加载时清空（切换会话会新建 loader，其 hasLoadedInitial 仍为 false，清空逻辑不受影响），
      // 与 react 侧 useChatMessageLoader 的 `conversationChanged || !hasLoadedInitialRef.current` 判断对齐。
      if (!hasLoadedInitial.value) {
        msgs.value = [];
      }
      hasOlder.value = true;
      hasNewer.value = false;
      anchorMode.value = false;
      hasLoadedLatest.value = false;
      showLatestHint.value = false;

      loadInitialMessages().catch((error) => {
        if (!canceled) {
          onError?.(error);
        }
      });
    },
    { immediate: true }
  );

  const dispose = () => {
    canceled = true;
    requestGeneration += 1;
    msgDispose();
    pinDispose();
    stopLoginWatch();
  };

  return {
    msgs,
    loadingOlder,
    loadingNewer,
    hasOlder,
    hasNewer,
    anchorMode,
    hasLoadedLatest,
    showLatestHint,
    loadOlder,
    loadNewer,
    switchToLatest,
    handleIncomingMessages,
    refreshLocalPinState,
    syncPinnedMessageList,
    dispose,
  };
};
