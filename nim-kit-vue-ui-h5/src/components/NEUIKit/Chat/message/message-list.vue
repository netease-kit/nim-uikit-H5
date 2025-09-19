<template>
  <div class="msg-list-wrapper" @touchstart="handleTapMessageList">
    <div
      id="message-scroll-list"
      scroll-y="true"
      :scroll-top="scrollTop"
      class="message-scroll-list"
      ref="messageListRef"
    >
      <div v-show="!noMore" @click="onLoadMore" class="view-more-text">
        {{ t("viewMoreText") }}
      </div>
      <div class="msg-tip" v-show="noMore">{{ t("noMoreText") }}</div>
      <div v-for="(item, index) in finalMsgs" :key="item.messageClientId">
        <MessageItem
          :msg="item"
          :index="index"
          :key="item.messageClientId"
          :reply-msgs-map="replyMsgsMap"
          :broadcastNewAudioSrc="broadcastNewAudioSrc"
        >
        </MessageItem>
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
} from "vue";
import MessageItem from "./message-item.vue";
import { caculateTimeago } from "../../utils/date";
import { t } from "../../utils/i18n";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { autorun } from "mobx";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import type { V2NIMTeam } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import emitter from "../../utils/eventBus";
import { events } from "../../utils/constants";

const props = withDefaults(
  defineProps<{
    msgs: V2NIMMessageForUI[];
    conversationType: V2NIMConst.V2NIMConversationType;
    to: string;
    loadingMore?: boolean;
    noMore?: boolean;
    replyMsgsMap?: {
      [key: string]: V2NIMMessageForUI;
    };
  }>(),
  {}
);

const { proxy } = getCurrentInstance()!; // 获取组件实例
const messageListRef = ref<HTMLElement | null>(null);

const scrollTop = ref(0);

// 处理完的最终消息列表
const finalMsgs = computed(() => {
  const res: V2NIMMessageForUI[] = [];
  props.msgs.forEach((item, index) => {
    // 如果两条消息间隔超过5分钟，插入一条自定义时间消息
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

const broadcastNewAudioSrc = ref<string>("");

// 消息滑动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
};

// 加载更多消息
const onLoadMore = () => {
  const msg = finalMsgs.value.filter(
    (item) =>
      !(
        item.messageType ===
          V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
        ["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
      )
  )[0];
  emitter.emit(events.GET_HISTORY_MSG, msg);
};

// 点击消息列表
const handleTapMessageList = () => {
  // 点击消息列表时让输入框失焦
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

  // 加载更多消息
  emitter.on(events.ON_LOAD_MORE, () => {
    const msg = finalMsgs.value.filter(
      (item) =>
        !(
          item.messageType ===
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
          ["beReCallMsg", "reCallMsg"].includes(item.recallType || "")
        )
    )[0];
    if (msg) {
      emitter.emit(events.GET_HISTORY_MSG, msg);
    }
  });
});

onMounted(() => {
  emitter.on(events.ON_SCROLL_BOTTOM, scrollToBottom);
});

onUnmounted(() => {
  emitter.off(events.ON_SCROLL_BOTTOM, scrollToBottom);
  emitter.off(events.ON_LOAD_MORE);
  teamWatch();
});
</script>

<style scoped>
.msg-list-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  height: 100%;
  box-sizing: border-box;
  padding: 0px 10px 5px 10px;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  background-color: #fff;
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
