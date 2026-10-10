<template>
  <div class="msg-list-wrapper" @touchstart="handleTapMessageList">
    <div
      id="message-scroll-list"
      class="message-scroll-list"
      ref="messageListRef"
    >
      <div v-show="loadingMore" class="msg-tip">
        {{ t("loadingMoreText") }}
      </div>
      <div
        v-show="!noMore && !loadingMore"
        @click="onLoadMore"
        class="view-more-text"
      >
        {{ t("viewMoreText") }}
      </div>
      <div class="msg-tip" v-show="noMore">{{ t("noMoreText") }}</div>
      <div v-for="item in finalMsgs" :key="item.messageClientId">
        <MessageItem
          :msg="item"
          :key="item.messageClientId"
          :reply-msgs-map="replyMsgsMap"
          :broadcastNewAudioSrc="broadcastNewAudioSrc"
          @audio-play="handleAudioPlay"
        >
        </MessageItem>
      </div>
    </div>
  </div>
</template>

<script>
import MessageItem from "./message-item.vue";
import { caculateTimeago } from "../../utils/date";
import { t } from "../../utils/i18n";
import { V2NIMConst } from "../../utils/sdk";
import { autorun } from "../../utils/store.js";
import emitter from "../../utils/eventBus";
import { events } from "../../utils/constants";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  name: "MessageList",
  components: {
    MessageItem,
  },
  props: {
    msgs: {
      type: Array,
      required: true,
    },
    conversationType: {
      type: [Number, String],
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    loadingMore: {
      type: Boolean,
      default: false,
    },
    noMore: {
      type: Boolean,
      default: false,
    },
    replyMsgsMap: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      scrollTop: 0,
      broadcastNewAudioSrc: "",
      teamWatch: null,
      onLoadMoreHandler: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    finalMsgs() {
      const res = [];
      this.msgs.forEach((item, index) => {
        if (
          index > 0 &&
          item.createTime - this.msgs[index - 1].createTime > 5 * 60 * 1000
        ) {
          res.push({
            ...item,
            messageClientId: `time-${item.createTime}`,
            messageType: V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM,
            sendingState:
              V2NIMConst.V2NIMMessageSendingState
                .V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED,
            timeValue: caculateTimeago(item.createTime),
          });
        }
        res.push({
          ...item,
        });
      });
      return res;
    },
  },
  beforeMount() {
    let team;
    this.teamWatch = autorun(() => {
      team = uiKitStore.teamStore.teams.get(this.to);
    });

    if (
      this.conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
    ) {
      uiKitStore.teamMemberStore.getTeamMemberActive({
        teamId: this.to,
        queryOption: {
          limit: Math.max(team?.memberLimit || 0, 200),
          roleQueryType: 0,
        },
      });
    }

    this.onLoadMoreHandler = () => this.onLoadMore();
    emitter.on(events.ON_LOAD_MORE, this.onLoadMoreHandler);
  },
  mounted() {
    emitter.on(events.ON_SCROLL_BOTTOM, this.scrollToBottom);
  },
  beforeDestroy() {
    emitter.off(events.ON_SCROLL_BOTTOM, this.scrollToBottom);
    if (this.onLoadMoreHandler) {
      emitter.off(events.ON_LOAD_MORE, this.onLoadMoreHandler);
    }
    if (this.teamWatch) {
      this.teamWatch();
    }
  },
  methods: {
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messageListRef) {
          this.$refs.messageListRef.scrollTop =
            this.$refs.messageListRef.scrollHeight;
        }
      });
    },
    onLoadMore() {
      if (this.loadingMore || this.noMore) {
        return;
      }
      const msg = this.finalMsgs.filter(
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
    },
    handleAudioPlay(audioSrc) {
      this.broadcastNewAudioSrc = audioSrc;
    },
    handleTapMessageList() {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        activeElement.blur();
      }
      emitter.emit(events.CLOSE_PANEL);
    },
  },
};
</script>

<style scoped>
.msg-list-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  height: 100%;
  min-width: 0;
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
  overflow-x: hidden;
  width: 100%;
  min-width: 0;
}

.view-more-text {
  text-align: center;
  color: #b3b7bc;
  font-size: 15px;
  margin-top: 20px;
}
</style>
