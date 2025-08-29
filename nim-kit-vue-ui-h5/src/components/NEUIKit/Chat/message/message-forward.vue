<template>
  <BottomPopup
    v-model="visible"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    :showConfirm="false"
    :showCancel="true"
    :title="t('forwardText')"
  >
    <div class="forward-container">
      <div class="tab-container">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'friend' }"
          @click="switchTab('friend')"
        >
          {{ t("sendToFriend") }}
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'team' }"
          @click="switchTab('team')"
        >
          {{ t("sendToTeam") }}
        </div>
      </div>

      <div class="list-container">
        <!-- 好友列表 -->
        <div v-if="currentTab === 'friend'" class="friend-list">
          <div
            v-for="friend in friendList"
            :key="friend.accountId"
            class="list-item"
            :class="{ selected: selectedId === friend.accountId }"
            @click="
              () =>
                selectItem(
                  friend.accountId,
                  V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
                )
            "
          >
            <Avatar :account="friend.accountId" size="40" />
            <div class="item-info">
              <Appellation :account="friend.accountId" />
            </div>
          </div>
        </div>

        <!-- 群聊列表 -->
        <div v-else class="team-list">
          <div
            v-for="team in teamList"
            :key="team.teamId"
            class="list-item"
            :class="{ selected: selectedId === team.teamId }"
            @click="
              () =>
                selectItem(
                  team.teamId,
                  V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
                )
            "
          >
            <Avatar :account="team.teamId" :avatar="team.avatar" size="40" />
            <div class="item-info">
              <div class="team-name">{{ team.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BottomPopup>
  <ForwardModal
    :forward-modal-visible="forwardModalVisible"
    :forward-to="forwardTo"
    :forward-msg="forwardMsg"
    :forward-conversation-type="forwardConversationType"
    :forward-to-team-info="forwardToTeamInfo"
    @confirm="handleForwardConfirm"
    @cancel="handleForwardCancel"
  />
</template>

<script lang="ts" setup>
import { ref, computed, getCurrentInstance } from "vue";
import BottomPopup from "../../CommonComponents/BottomPopup.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Appellation from "../../CommonComponents/Appellation.vue";
import { t } from "../../utils/i18n";
import { autorun } from "mobx";
import { onUnmounted } from "vue";
import type { V2NIMTeam } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import ForwardModal from "./message-forward-modal.vue";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { onMounted } from "vue";
import { toast } from "../../utils/toast";

const props = defineProps<{
  modelValue: boolean;
  msgIdClient: string; // 转发的消息对象
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "forward", targetId: string, type: "friend" | "team"): void;
  (e: "cancel"): void;
  (e: "confirm", targetId: string, type: "friend" | "team"): void;
  (e: "close"): void;
}>();

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const forwardConversationType = ref<V2NIMConst.V2NIMConversationType>(
  V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
);
const conversationId = store?.uiStore.selectedConversation;

let msgIdClient = "";
const forwardTo = ref("");
const forwardMsg = ref();
const forwardToTeamInfo = ref<V2NIMTeam>();

const forwardModalVisible = ref(false);
/**转发消息确认 */
const handleForwardConfirm = (forwardComment: string) => {
  forwardModalVisible.value = false;

  if (!forwardMsg.value) {
    toast.info(t("getForwardMessageFailed"));
    return;
  }

  const forwardConversationId = nim.V2NIMConversationIdUtil[
    forwardConversationType.value ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ? "p2pConversationId"
      : "teamConversationId"
  ](forwardTo.value);

  store?.msgStore
    .forwardMsgActive(forwardMsg.value, forwardConversationId, forwardComment)
    .then(() => {
      toast.info(t("forwardSuccessText"));
    })
    .catch(() => {
      toast.info(t("forwardFailedText"));
    })
    .finally(() => {
      emit("close");
    });
};
/**
 * 取消转发弹窗
 */
const handleForwardCancel = () => {
  forwardModalVisible.value = false;
};

const currentTab = ref<"friend" | "team">("friend");
const selectedId = ref<string>("");

// 获取好友列表
const friendList = ref<{ accountId: string; appellation: string }[]>([]);
// 获取群聊列表
const teamList = ref<V2NIMTeam[]>([]);

/** 好友列表监听 */
const friendListWatch = autorun(() => {
  const data = store?.uiStore.friends
    .filter((item) => !store?.relationStore.blacklist.includes(item.accountId))
    .map((item) => ({
      accountId: item.accountId,
      appellation: store?.uiStore.getAppellation({
        account: item.accountId,
      }),
    }));

  if (data?.length) {
    //@ts-ignore
    friendList.value = data;
  }
});

/** 群列表监听 */
const teamListWatch = autorun(() => {
  if (store?.uiStore.teamList) {
    teamList.value = store?.uiStore.teamList;
  }
});

onUnmounted(() => {
  friendListWatch();
  teamListWatch();
});

const switchTab = (tab: "friend" | "team") => {
  currentTab.value = tab;
  selectedId.value = "";
};

const selectItem = (_forwardTo: string, conversationType) => {
  selectedId.value = _forwardTo;
  forwardConversationType.value = conversationType;
  if (_forwardTo && msgIdClient) {
    forwardTo.value = _forwardTo;
    forwardMsg.value = store?.msgStore.getMsg(conversationId, [
      msgIdClient,
    ])?.[0];

    forwardModalVisible.value = true;
    if (
      conversationType ===
      V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
    ) {
      forwardToTeamInfo.value = store?.teamStore.teams.get(_forwardTo);
    }
  }
};

const handleConfirm = () => {
  if (!selectedId.value) {
    return;
  }
  emit("forward", selectedId.value, currentTab.value);
  visible.value = false;
};

const handleCancel = () => {
  visible.value = false;
};

onMounted(() => {
  msgIdClient = props?.msgIdClient;
});
</script>

<style scoped>
.forward-container {
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-container {
  display: flex;
  padding: 0 10px 10px 10px;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  color: #666;
  font-size: 14px;
}

.tab-item.active {
  color: #337eff;
  position: relative;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #337eff;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
}

.list-item:hover {
  background-color: #f5f5f5;
}

.list-item.selected {
  background-color: #e6f2ff;
}

.item-info {
  margin-left: 12px;
  flex: 1;
}

.team-name {
  font-size: 14px;
  color: #333;
}
</style>
