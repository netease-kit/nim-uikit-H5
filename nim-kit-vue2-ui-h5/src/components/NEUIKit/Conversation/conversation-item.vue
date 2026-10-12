<template>
  <div
    :class="[
      'conversation-item-container',
      {
        'show-action-list': showMoreActions,
        'stick-on-top': conversation.stickTop,
      },
    ]"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @click="() => handleConversationItemClick()"
  >
    <div class="conversation-item-content">
      <div class="conversation-item-left">
        <div class="unread" v-if="unread">
          <div class="dot" v-if="isMute"></div>
          <div class="badge" v-else>{{ unread }}</div>
        </div>
        <Avatar :account="to" :avatar="teamAvatar" />
      </div>
      <div class="conversation-item-right">
        <div class="conversation-item-top">
          <Appellation
            class="conversation-item-title"
            v-if="
              conversation.type ===
              V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
            "
            :account="to"
          />
          <span v-else class="conversation-item-title">
            {{ sessionName }}
          </span>
          <span class="conversation-item-time">{{ date }}</span>
        </div>
        <div class="conversation-item-desc">
          <span class="conversation-item-desc-span">
            <span v-if="beMentioned" class="beMentioned">
              {{ "[" + t("someoneText") + "@" + t("meText") + "]" }}
            </span>
            <ConversationItemIsRead
              v-if="showSessionUnread"
              :conversation="conversation"
            ></ConversationItemIsRead>
            <span
              v-if="conversation.lastMessage"
              class="conversation-item-desc-content"
            >
              <LastMsgContent :lastMessage="conversation.lastMessage" />
            </span>
          </span>
          <div class="conversation-item-state">
            <Icon
              v-if="isMute"
              iconClassName="conversation-item-desc-state"
              type="icon-xiaoximiandarao"
              color="#ccc"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="right-action-list">
      <div
        v-for="action in moreActions"
        :key="action.type"
        :class="['right-action-item', action.class]"
        @click="() => handleClick(action.type)"
      >
        {{ action.name }}
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "../CommonComponents/Avatar.vue";
import Appellation from "../CommonComponents/Appellation.vue";
import Icon from "../CommonComponents/Icon.vue";
import { formatConversationTime } from "../utils/date";
import { t } from "../utils/i18n";
import { V2NIMConst } from "../utils/sdk";
import ConversationItemIsRead from "./conversation-item-read.vue";
import LastMsgContent from "./conversation-item-last-msg-content.vue";
import { nim, uiKitStore } from "../utils/init.js";
export default {
  components: {
    Avatar,
    Appellation,
    Icon,
    ConversationItemIsRead,
    LastMsgContent,
  },
  props: {
    conversation: {
      type: Object,
      required: true,
    },
    showMoreActions: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      startX: 0,
      startY: 0,
      max: 99,
      t,
      V2NIMConst,
      nim,
      uiKitStore,
    };
  },
  computed: {
    moreActions() {
      return [
        {
          name: this.conversation.stickTop
            ? t("deleteStickTopText")
            : t("addStickTopText"),
          class: "action-top",
          type: "action-top",
        },
        {
          name: t("deleteSessionText"),
          class: "action-delete",
          type: "action-delete",
        },
      ];
    },
    teamAvatar() {
      if (
        this.conversation.type ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      ) {
        return this.conversation.avatar;
      }
      return "";
    },
    sessionName() {
      return this.conversation.name || this.conversation.conversationId;
    },
    to() {
      return nim.V2NIMConversationIdUtil.parseConversationTargetId(
        this.conversation.conversationId
      );
    },
    date() {
      const time =
        this.conversation.lastMessage?.messageRefer.createTime ||
        this.conversation.updateTime;
      return formatConversationTime(time);
    },
    unread() {
      return this.conversation.unreadCount > 0
        ? this.conversation.unreadCount > this.max
          ? `${this.max}+`
          : `${this.conversation.unreadCount}`
        : "";
    },
    isMute() {
      return !!this.conversation.mute;
    },
    beMentioned() {
      return !!this.conversation.aitMsgs?.length;
    },
    showSessionUnread() {
      const myUserAccountId = nim.V2NIMLoginService.getLoginUser();
      if (
        this.conversation.type ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ) {
        return (
          this.conversation?.lastMessage?.messageRefer.senderId ===
            myUserAccountId &&
          this.conversation?.lastMessage?.messageType !==
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL &&
          this.conversation?.lastMessage?.messageType !==
            V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_NOTIFICATION &&
          this.conversation?.lastMessage?.sendingState ===
            V2NIMConst.V2NIMMessageSendingState
              .V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED &&
          this.conversation?.lastMessage?.lastMessageState !==
            V2NIMConst.V2NIMLastMessageState.V2NIM_MESSAGE_STATUS_REVOKE
        );
      }
      return false;
    },
  },
  methods: {
    handleClick(type) {
      if (type === "action-top") {
        this.$emit("stickyToTop", this.conversation);
      } else {
        this.$emit("delete", this.conversation);
      }
    },
    handleTouchStart(event) {
      this.startX = event.changedTouches[0].pageX;
      this.startY = event.changedTouches[0].pageY;
    },
    handleTouchMove(event) {
      const moveEndX = event.changedTouches[0].pageX;
      const moveEndY = event.changedTouches[0].pageY;
      const deltaX = moveEndX - this.startX + 20;
      const deltaY = moveEndY - this.startY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        this.$emit("leftSlide", null);
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
        this.$emit("leftSlide", this.conversation);
      }
    },
    handleConversationItemClick() {
      if (this.showMoreActions) {
        this.$emit("leftSlide", null);
        return;
      }
      this.$emit("click", this.conversation);
    },
  },
};
</script>

<style scoped>
/* 基础容器 */
.conversation-item-container {
  position: relative;
  transition: transform 0.3s;
  z-index: 9;
}

.conversation-item-container.show-action-list {
  transform: translateX(-200px);
}

.conversation-item-container.stick-on-top {
  background: #f3f5f7;
}

.beMentioned {
  color: #ff4d4f;
}

.content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧操作列表 */
.right-action-list {
  position: absolute;
  top: 0;
  right: -200px;
  bottom: 0;
  width: 200px;
}

.right-action-item {
  width: 100px;
  display: inline-block;
  color: #fff;
  text-align: center;
  height: 72px;
  line-height: 72px;
}

.action-top {
  background: #337eff;
}

.action-delete {
  background: #a8abb6;
}

/* 会话内容 */
.conversation-item-content {
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 15px;
  height: 72px;
  box-sizing: border-box;
}

.conversation-item-left {
  position: relative;
}

.conversation-item-desc-span {
  display: flex;
  flex: 1;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
}

.conversation-item-state {
  display: inline-block;
  width: 26px;
  box-sizing: border-box;
  height: 22px;
}
.conversation-item-badge {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

.conversation-item-right {
  flex: 1;
  width: 0;
  margin-left: 10px;
}

.conversation-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-item-time {
  font-size: 12px;
  color: #ccc;
  text-align: right;
  width: 90px;
  flex-shrink: 0;
}

.conversation-item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(51, 51, 51);
  font-size: 16px;
}

.conversation-item-desc {
  width: 100%;
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 22px;
  overflow: hidden;
}

.conversation-item-desc-state {
  margin-left: 10px;
}

.conversation-item-desc-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* 未读标记 */
.dot {
  background-color: #ff4d4f;
  color: #fff;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  box-sizing: border-box;
  z-index: 99;
}

.badge {
  background-color: #ff4d4f;
  color: #fff;
  font-size: 12px;
  min-width: 20px;
  height: 20px;
  line-height: 19px;
  border-radius: 10px;
  padding: 0 5px;
  box-sizing: border-box;
  text-align: center;
  z-index: 99;
  position: relative;
}

.unread {
  position: absolute;
  right: -4px;
  top: -2px;
  z-index: 99;
}

.conversation-item-desc-ait {
  display: inline-block;
}
</style>
