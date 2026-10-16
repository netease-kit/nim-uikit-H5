<template>
  <div class="msg-list-wrapper" @touchstart="handleTapMessageList">
    <div
      id="message-scroll-list"
      class="message-scroll-list"
      ref="messageListRef"
      @scroll="handleScroll"
    >
      <div v-show="hasOlder" @click="onLoadMore" class="view-more-text">
        {{ loadingOlder ? t("loadingMoreText") : t("viewMoreText") }}
      </div>
      <div class="msg-tip" v-show="!hasOlder">{{ t("noMoreText") }}</div>
      <div v-for="(item, index) in finalMsgs" :key="item.messageClientId">
        <MessageItem
          :msg="item"
          :index="index"
          :key="item.messageClientId"
          :reply-msgs-map="replyMsgsMap"
          :broadcastNewAudioSrc="broadcastNewAudioSrc"
          :voice-text-map="props.voiceTextMap"
          :set-voice-text="props.setVoiceText"
          :is-multi-selecting="props.isMultiSelecting"
          :selected="
            props.selectedMessageIds.includes(getMessageSelectKey(item))
          "
          :on-toggle-select="props.onToggleSelect"
          :on-multi-select="props.onMultiSelect"
        />
      </div>
      <div v-if="anchorMode && loadingNewer" class="msg-tip">
        {{ t("loadingMoreText") }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  onBeforeMount,
  onUnmounted,
  getCurrentInstance,
  nextTick,
  onMounted,
  watch,
} from "vue";
import MessageItem from "./message-item.vue";
import { caculateTimeago } from "../../utils/date";
import { t } from "../../utils/i18n";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { autorun } from "mobx";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/src/types";
import type { V2NIMTeam } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import emitter from "../../utils/eventBus";
import { events, MSG_ID_FLAG } from "../../utils/constants";
import { getMessageSelectKey } from "./message-multi-select/utils";

const props = withDefaults(
  defineProps<{
    msgs: V2NIMMessageForUI[];
    conversationType: V2NIMConst.V2NIMConversationType;
    to: string;
    loadingOlder?: boolean;
    hasOlder?: boolean;
    replyMsgsMap?: {
      [key: string]: V2NIMMessageForUI;
    };
    voiceTextMap?: Record<string, string>;
    setVoiceText?: (messageClientId: string, text: string) => void;
    anchorMessageClientId?: string;
    anchorMode?: boolean;
    loadingNewer?: boolean;
    autoScrollToBottom?: boolean;
    onLoadOlder?: (firstMsg?: V2NIMMessageForUI) => void | Promise<unknown>;
    onLoadNewer?: (lastMsg?: V2NIMMessageForUI) => void | Promise<unknown>;
    /**
     * show：是否需要展示“回到最新”入口（滚过最后一条正常消息的高度才算离开最新）
     * atLatest：视口是否真的在消息列表底部（仅能测量时透传），用于新消息提醒的计数与位置保持
     */
    onLatestVisibilityChange?: (show: boolean, atLatest?: boolean) => void;
    isMultiSelecting?: boolean;
    isScrollLocked?: boolean;
    selectedMessageIds?: string[];
    onToggleSelect?: (msg: V2NIMMessageForUI) => void;
    onMultiSelect?: (msg: V2NIMMessageForUI) => void;
  }>(),
  {
    loadingOlder: false,
    hasOlder: true,
    anchorMessageClientId: "",
    anchorMode: false,
    loadingNewer: false,
    autoScrollToBottom: true,
    isMultiSelecting: false,
    isScrollLocked: false,
    selectedMessageIds: () => [],
  }
);

const { proxy } = getCurrentInstance()!;
const messageListRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let resizeRafId = 0;
let onViewportResize: (() => void) | null = null;
const broadcastNewAudioSrc = ref<string>("");
const anchorScrolled = ref(false);
const anchorScrollId = ref("");
const pagingLock = ref(false);
const restoringScrollPosition = ref(false);
const pendingPagination = ref<{
  direction: "older" | "newer";
  prevScrollHeight: number;
  prevScrollTop: number;
} | null>(null);

interface MessageListScrollSnapshot {
  anchorMessageClientId: string;
  anchorOffsetTop: number;
  scrollTop: number;
}

const isNormalMsg = (item: any) =>
  !(
    item.messageType ===
      V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
    (item.timeValue !== undefined || ["beReCallMsg", "reCallMsg"].includes(item.recallType || ""))
  );

// 处理完的最终消息列表
const finalMsgs = computed(() => {
  const res: V2NIMMessageForUI[] = [];
  props.msgs.forEach((item, index) => {
    if (
      index > 0 &&
      item.createTime - props.msgs[index - 1].createTime > 5 * 60 * 1000
    ) {
      res.push({
        ...item,
        messageClientId: "time-" + item.createTime,
        messageType: V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM,
        sendingState:
          V2NIMConst.V2NIMMessageSendingState
            .V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED,
        // @ts-ignore
        timeValue: caculateTimeago(item.createTime),
      });
    }
    res.push({
      ...item,
    });
  });

  return res;
});

const getFirstNormalMsg = () => finalMsgs.value.find(isNormalMsg);

const getLastNormalMsg = () => {
  const normalMsgs = finalMsgs.value.filter(isNormalMsg);
  return normalMsgs[normalMsgs.length - 1];
};

// 最后一条正常消息的标识。撤回时列表长度不变，但“最后一条正常消息”会换成更早的一条，
// 需要据此重新建立观察，避免 ResizeObserver 一直挂在已被删除的节点上。
const lastNormalMessageClientId = computed(
  () => getLastNormalMsg()?.messageClientId || ""
);

let latestMessageResizeObserver: ResizeObserver | null = null;
// “回到最新”入口上一次的判定结果（连带当时的滚动位置）
let latestVisibilitySnapshot: { scrollTop: number; show: boolean } | null = null;

// 触发“回到最新”判定的来源：layout=内容/尺寸变化，programmatic=程序滚动，restore=恢复位置，scroll=用户手动滚动
type LatestVisibilitySource = "scroll" | "layout" | "restore" | "programmatic";
// 是否跟随底部。用户在底部附近时为 true；此后内容变高（新消息、图片加载完成、标记提示出现等）会自动贴底
let shouldStickToBottom = true;
// 标记“这一帧内的滚动事件是程序触发的（scrollToBottom），不是用户手滑”
let programmaticScrollFrame = 0;

// 锚定后的“沉降期”：在这段时间内持续把锚点保持在视口中心。
// 进入聊天页时消息列表会先渲染已有消息，随后被锚点分页整体替换（27→18→27 这类）并补拉更新消息，
// 内容高度先缩后涨。若只在 +100ms 滚一次，中途的收缩会让浏览器把 scrollTop 夹到新的底部，
// 内容再涨回来时锚点已经掉到视口外（scrollTop 停在中间），iOS 上尤其容易撞上。
// 用户一触摸列表或主动回到最新就立刻停止，不做长期跟随。
const ANCHOR_SETTLE_MS = 2000;
let anchorSettleFrame = 0;
let anchorSettleUntil = 0;

/** 让锚点元素中心对齐滚动容器中心（自己算 scrollTop，不依赖浏览器对 scrollIntoView 的实现） */
const centerAnchor = () => {
  const container = messageListRef.value;
  if (!container || !props.anchorMessageClientId) return;
  const el = document.getElementById(
    `${MSG_ID_FLAG}${props.anchorMessageClientId}`
  );
  if (!el) return;
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const delta = Math.round(
    elRect.top +
      elRect.height / 2 -
      (containerRect.top + container.clientHeight / 2)
  );
  if (Math.abs(delta) > 1) {
    container.scrollTop += delta;
  }
};

const stopAnchorSettle = () => {
  if (anchorSettleFrame) {
    cancelAnimationFrame(anchorSettleFrame);
    anchorSettleFrame = 0;
  }
  anchorSettleUntil = 0;
};

const startAnchorSettle = () => {
  stopAnchorSettle();
  anchorSettleUntil = performance.now() + ANCHOR_SETTLE_MS;
  const tick = () => {
    anchorSettleFrame = 0;
    if (performance.now() > anchorSettleUntil) {
      stopAnchorSettle();
      return;
    }
    centerAnchor();
    anchorSettleFrame = requestAnimationFrame(tick);
  };
  anchorSettleFrame = requestAnimationFrame(tick);
};

/**
 * 解析“回到最新”入口是否展示。
 * - 视口真的在底部（atLatest）时一定不展示；
 * - 用户滚动了位置时按产品口径重算：滚过最后一条正常消息的高度才算离开最新；
 * - 位置没变、只有内容变化时（撤回把最后一条换成更早的一条、图片加载完成等）沿用上一次判定，
 *   否则内容变化会在用户手指没动的情况下翻转判定，出现“撤回后回到最新箭头消失”。
 */
const resolveLatestVisibility = (
  scrollTop: number,
  distanceFromBottom: number,
  atLatest: boolean
) => {
  const previous = latestVisibilitySnapshot;
  let show: boolean;
  if (atLatest) {
    show = false;
  } else if (!previous || previous.scrollTop !== scrollTop) {
    const lastMsg = getLastNormalMsg();
    const lastElement = lastMsg?.messageClientId
      ? document.getElementById(`${MSG_ID_FLAG}${lastMsg.messageClientId}`)
      : null;
    const latestMessageHeight = lastElement
      ? Math.max(lastElement.getBoundingClientRect().height, 1)
      : 0;
    show =
      latestMessageHeight > 0
        ? distanceFromBottom >= latestMessageHeight - 1
        : distanceFromBottom > 1;
  } else {
    show = previous.show;
  }
  latestVisibilitySnapshot = { scrollTop, show };
  return show;
};

const updateLatestVisibility = (source: LatestVisibilitySource = "layout") => {
  if (!messageListRef.value) {
    props.onLatestVisibilityChange?.(false);
    return;
  }
  if (props.anchorMode) {
    shouldStickToBottom = false;
  }
  const container = messageListRef.value;
  // 贴底跟随：内容/尺寸变化（新消息、图片加载完成、标记提示 msg-pin-tip 出现等）时，
  // 只要用户本来就在底部附近，就自动滚到最新，避免新增的内容被顶到屏幕外；
  // 程序触发的滚动（scrollToBottom）无条件贴底。
  if (
    (source === "programmatic" ||
      (source === "layout" && shouldStickToBottom)) &&
    !props.isMultiSelecting &&
    !props.isScrollLocked &&
    !restoringScrollPosition.value
  ) {
    container.scrollTop = container.scrollHeight;
  }
  const { scrollTop, scrollHeight, clientHeight } = container;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  if (source === "programmatic") {
    shouldStickToBottom = true;
  } else if (source !== "layout") {
    // 用户手动滚动 / 恢复位置后，按“是否真的在底部”刷新贴底状态
    shouldStickToBottom = distanceFromBottom <= 1;
  }
  // 位置口径：只表达“视口是否真的在列表底部”，不受消息内容高度影响，
  // 用于新消息提醒的计数与是否保持滚动位置。
  const atLatest = distanceFromBottom <= 1;
  props.onLatestVisibilityChange?.(
    resolveLatestVisibility(scrollTop, distanceFromBottom, atLatest),
    atLatest
  );
};

const captureScrollPosition = (): MessageListScrollSnapshot | null => {
  const container = messageListRef.value;
  if (!container) return null;
  const containerTop = container.getBoundingClientRect().top;
  const anchor = Array.from(
    container.querySelectorAll<HTMLElement>(`[id^="${MSG_ID_FLAG}"]`)
  ).find((element) => element.getBoundingClientRect().bottom > containerTop);
  return {
    anchorMessageClientId: anchor?.id.slice(MSG_ID_FLAG.length) || "",
    anchorOffsetTop: anchor
      ? anchor.getBoundingClientRect().top - containerTop
      : 0,
    scrollTop: container.scrollTop,
  };
};

const restoreScrollPosition = (snapshot: MessageListScrollSnapshot | null) => {
  if (!snapshot) return;
  restoringScrollPosition.value = true;
  requestAnimationFrame(() => {
    const container = messageListRef.value;
    if (!container) {
      restoringScrollPosition.value = false;
      return;
    }
    const anchor = snapshot.anchorMessageClientId
      ? document.getElementById(
          `${MSG_ID_FLAG}${snapshot.anchorMessageClientId}`
        )
      : null;
    if (anchor) {
      const currentOffset =
        anchor.getBoundingClientRect().top -
        container.getBoundingClientRect().top;
      container.scrollTop += currentOffset - snapshot.anchorOffsetTop;
    } else {
      container.scrollTop = snapshot.scrollTop;
    }
    updateLatestVisibility("restore");
    requestAnimationFrame(() => {
      restoringScrollPosition.value = false;
    });
  });
};

defineExpose({ captureScrollPosition, restoreScrollPosition });

const observeLatestMessage = () => {
  latestMessageResizeObserver?.disconnect();
  latestMessageResizeObserver = null;
  const lastMsg = getLastNormalMsg();
  const lastElement = lastMsg?.messageClientId
    ? document.getElementById(`${MSG_ID_FLAG}${lastMsg.messageClientId}`)
    : null;
  if (lastElement) {
    // 回调第一个参数是 entries（ResizeObserverEntry[]），不能直接当 source 传，这里固定为 layout
    latestMessageResizeObserver = new ResizeObserver(() =>
      updateLatestVisibility("layout")
    );
    latestMessageResizeObserver.observe(lastElement);
  }
  updateLatestVisibility();
};

// 消息滑动到底部
const scrollToBottom = (event?: unknown) => {
  if (
    props.isMultiSelecting ||
    props.isScrollLocked ||
    restoringScrollPosition.value
  ) return;
  const options = event as { behavior?: ScrollBehavior } | undefined;
  // 用户主动回到最新，结束锚点跟随
  stopAnchorSettle();
  nextTick(() => {
    if (messageListRef.value) {
      shouldStickToBottom = true;
      cancelAnimationFrame(programmaticScrollFrame);
      // 滚动事件在本帧结束前触发，借此把这批滚动事件识别为程序滚动而非用户滚动
      programmaticScrollFrame = requestAnimationFrame(() => {
        programmaticScrollFrame = 0;
      });
      const top = messageListRef.value.scrollHeight;
      if (options?.behavior === "smooth") {
        messageListRef.value.scrollTo({ top, behavior: "smooth" });
      } else {
        messageListRef.value.scrollTop = top;
      }
      updateLatestVisibility("programmatic");
    }
  });
};

const scrollToAnchor = () => {
  if (!props.anchorMessageClientId) {
    return false;
  }
  const el = document.getElementById(
    `${MSG_ID_FLAG}${props.anchorMessageClientId}`
  );
  if (!el) {
    return false;
  }
  el.scrollIntoView({ block: "center" });
  // 进入沉降期：页面刚打开时列表还会被锚点分页整体替换、并补拉更新消息，内容高度先缩后涨，
  // 只滚一次容易在收缩那一下被浏览器夹到底部而丢掉锚点位置
  startAnchorSettle();
  return true;
};

const unlockPaginationAfterRender = () => {
  requestAnimationFrame(() => {
    const pending = pendingPagination.value;
    if (!pending || props.loadingOlder || props.loadingNewer) {
      return;
    }

    if (messageListRef.value && pending.direction === "older") {
      const nextScrollHeight = messageListRef.value.scrollHeight;
      messageListRef.value.scrollTop =
        pending.prevScrollTop + (nextScrollHeight - pending.prevScrollHeight);
    }

    requestAnimationFrame(() => {
      if (props.loadingOlder || props.loadingNewer) {
        return;
      }
      pagingLock.value = false;
      pendingPagination.value = null;
    });
  });
};

const startPagination = (
  direction: "older" | "newer",
  load: () => void | Promise<unknown>
) => {
  if (pagingLock.value || !messageListRef.value) {
    return;
  }

  pagingLock.value = true;
  pendingPagination.value = {
    direction,
    prevScrollHeight: messageListRef.value.scrollHeight,
    prevScrollTop: messageListRef.value.scrollTop,
  };

  Promise.resolve(load()).finally(() => {
    setTimeout(() => {
      if (!props.loadingOlder && !props.loadingNewer) {
        unlockPaginationAfterRender();
      }
    }, 0);
  });
};

// 加载更多消息
const onLoadMore = () => {
  if (pagingLock.value || props.loadingOlder || !props.onLoadOlder) {
    return;
  }
  const msg = getFirstNormalMsg();
  if (!msg) {
    return;
  }
  startPagination("older", () => props.onLoadOlder?.(msg));
};

const handleScroll = () => {
  if (!messageListRef.value) {
    return;
  }
  if (pagingLock.value || props.loadingOlder || props.loadingNewer) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = messageListRef.value;
  // 区分来源：恢复位置/程序滚动不应被当成“用户手动滚动”而取消贴底状态
  const source: LatestVisibilitySource = restoringScrollPosition.value
    ? "restore"
    : programmaticScrollFrame
      ? "programmatic"
      : "scroll";
  updateLatestVisibility(source);
  if (
    props.anchorMode &&
    props.onLoadNewer &&
    scrollHeight - scrollTop - clientHeight < 24
  ) {
    const msg = getLastNormalMsg();
    if (msg) {
      startPagination("newer", () => props.onLoadNewer?.(msg));
    }
  }
  if (props.anchorMode && scrollTop < 24) {
    onLoadMore();
  }
};

// 点击消息列表
const handleTapMessageList = () => {
  // 用户触摸列表，结束锚点跟随
  stopAnchorSettle();
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.tagName === "INPUT") {
    activeElement.blur();
  }

  emitter.emit(events.CLOSE_PANEL);
};

let teamWatch = () => {};

onBeforeMount(() => {
  let team: V2NIMTeam | undefined = undefined;

  teamWatch = autorun(() => {
    team = proxy?.$UIKitStore.teamStore.teams.get(props.to);
  });

  if (
    props.conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    proxy?.$UIKitStore.teamMemberStore.getTeamMemberActive({
      teamId: props.to,
      queryOption: {
        limit: Math.max((team as unknown as V2NIMTeam)?.memberLimit || 0, 200),
        roleQueryType: 0,
      },
    });
  }

  emitter.on(events.ON_LOAD_MORE, onLoadMore);
});

onMounted(() => {
  if (props.autoScrollToBottom) {
    emitter.on(events.ON_SCROLL_BOTTOM, scrollToBottom);
  }

  setTimeout(() => {
    if (props.anchorMessageClientId) {
      if (scrollToAnchor()) {
        anchorScrolled.value = true;
        anchorScrollId.value = props.anchorMessageClientId;
      }
    } else if (props.autoScrollToBottom) {
      scrollToBottom();
    }
    nextTick(observeLatestMessage);
  }, 100);

  // 记录上一次的状态，用于判断 resize 前用户是否在底部
  const prevState = { clientHeight: 0, distanceFromBottom: 0 };

  // 滚动容器高度变化时（键盘弹起/收起、网络断开提示条等），若用户之前在底部附近则保持滚到底部
  const scrollEl = messageListRef.value;
  const scrollToBottomIfNear = () => {
    const el = messageListRef.value;
    if (!el) return;
    const { scrollHeight, scrollTop, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const wasNearBottom = prevState.distanceFromBottom < 48;
    const isNearBottom = distanceFromBottom < 48;
    // 容器变矮（键盘弹起）时，之前用户在底部附近 → 需要保持滚到底部
    const containerShrunk = clientHeight < prevState.clientHeight;

    if (
      !props.isMultiSelecting &&
      !props.isScrollLocked &&
      !restoringScrollPosition.value &&
      (isNearBottom || (wasNearBottom && containerShrunk))
    ) {
      el.scrollTop = scrollHeight;
    }

    prevState.clientHeight = clientHeight;
    prevState.distanceFromBottom = distanceFromBottom;
    updateLatestVisibility();
  };

  if (scrollEl) {
    resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(scrollToBottomIfNear);
    });
    resizeObserver.observe(scrollEl);
  }

  // H5 键盘弹起/收起时 visualViewport 变化，但容器 CSS 尺寸可能不变，ResizeObserver 不触发
  onViewportResize = () => {
    scrollToBottomIfNear();
  };
  window.visualViewport?.addEventListener('resize', onViewportResize);
});

watch(
  () => [props.anchorMessageClientId, finalMsgs.value.length],
  () => {
    if (!props.anchorMessageClientId) {
      return;
    }
    if (anchorScrollId.value !== props.anchorMessageClientId) {
      anchorScrolled.value = false;
      anchorScrollId.value = props.anchorMessageClientId;
    }
    if (anchorScrolled.value) {
      return;
    }

    setTimeout(() => {
      if (scrollToAnchor()) {
        anchorScrolled.value = true;
      }
      nextTick(observeLatestMessage);
    }, 100);
  }
);

watch(
  () => [
    finalMsgs.value.length,
    lastNormalMessageClientId.value,
    props.loadingOlder,
    props.loadingNewer,
  ],
  () => {
    const pending = pendingPagination.value;
    if (pending && !props.loadingOlder && !props.loadingNewer) {
      unlockPaginationAfterRender();
    }
    nextTick(observeLatestMessage);
  }
);

watch(
  () => props.anchorMode,
  () => nextTick(observeLatestMessage)
);

watch(
  () => props.autoScrollToBottom,
  (autoScroll, oldAutoScroll) => {
    if (oldAutoScroll) {
      emitter.off(events.ON_SCROLL_BOTTOM, scrollToBottom);
    }
    if (autoScroll) {
      emitter.on(events.ON_SCROLL_BOTTOM, scrollToBottom);
    }
  }
);

onUnmounted(() => {
  stopAnchorSettle();
  emitter.off(events.ON_SCROLL_BOTTOM, scrollToBottom);
  emitter.off(events.ON_LOAD_MORE, onLoadMore);
  teamWatch();
  resizeObserver?.disconnect();
  resizeObserver = null;
  cancelAnimationFrame(resizeRafId);
  cancelAnimationFrame(programmaticScrollFrame);
  latestMessageResizeObserver?.disconnect();
  latestMessageResizeObserver = null;
  if (onViewportResize) {
    window.visualViewport?.removeEventListener('resize', onViewportResize);
    onViewportResize = null;
  }
});
</script>

<style scoped>
.msg-list-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  height: 100%;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  background-color: #fff;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.msg-tip {
  text-align: center;
  color: #b3b7bc;
  font-size: 12px;
  margin-top: 10px;
  width: 100%;
}

.block {
  width: 100%;
  height: 40px;
}

.message-scroll-list {
  height: 100%;
  box-sizing: border-box;
  padding-bottom: 1px;
  overflow-y: auto;
  width: 100%;
}

.view-more-text {
  text-align: center;
  color: #b3b7bc;
  font-size: 15px;
  margin-top: 20px;
}
</style>
