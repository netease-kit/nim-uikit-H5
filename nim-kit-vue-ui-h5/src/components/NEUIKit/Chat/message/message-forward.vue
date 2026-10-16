<template>
  <FullScreenModal
    :visible="visible"
    :title="t('chooseText')"
    @back="handleClose"
  >
    <template #left>
      <button class="forward-cancel-btn" type="button" @click="handleClose">
        {{ t("cancelText") }}
      </button>
    </template>
    <template #right>
      <button
        v-if="!multiSelect"
        class="forward-multi-select-btn"
        type="button"
        @click="toggleMultiSelect"
      >
        {{ t("multiSelectText") }}
      </button>
      <button
        v-else
        class="forward-multi-send-btn"
        type="button"
        :disabled="selectedIds.length === 0"
        @click="handleMultiSend"
      >
        {{ t("yesText") }}
      </button>
    </template>

    <div class="forward-fullscreen-content">
      <!-- 搜索框 -->
      <div class="forward-search-wrapper">
        <div class="forward-search-box">
          <img class="forward-search-icon" src="../../static/icons/icon-sousuo.png" alt="" />
          <input
            class="forward-search-input"
            type="text"
            :placeholder="t('searchText')"
            v-model="searchText"
          />
          <span
            v-if="searchText"
            class="forward-search-clear"
            @click="searchText = ''"
          >✕</span>
        </div>
      </div>

      <!-- 多选模式下，已选头像展示区 -->
      <div
        v-if="multiSelect && selectedAvatars.length > 0"
        class="forward-selected-bar"
        @click="showSelectedModal = true"
      >
        <div class="forward-selected-scroll">
          <Avatar
            v-for="item in selectedAvatars"
            :key="item.id"
            :account="item.id"
            :avatar="item.avatar"
            size="36"
          />
        </div>
        <span class="forward-selected-arrow">›</span>
      </div>

      <!-- 最近转发 水平滚动栏（在 tab 之上，搜索时隐藏） -->
      <div
        v-if="!searchText && recentForwards.length > 0"
        class="forward-recent-bar"
      >
        <div class="forward-recent-label">{{ t("recentForwardText") }}</div>
        <div class="forward-recent-scroll">
          <div
            v-for="item in recentForwards"
            :key="'rf-' + item.id"
            class="forward-recent-item"
            :class="{ 'forward-recent-item-selected': multiSelect && selectedIds.includes(item.id) }"
            @click="handleItemClick(item)"
          >
            <Avatar :account="item.id" :avatar="item.avatar" size="36" />
            <div class="forward-recent-name">
              <Appellation
                v-if="item.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P"
                :account="item.id"
              />
              <span v-else>{{ item.name }}</span>
            </div>
            <div
              v-if="multiSelect"
              class="forward-checkbox forward-checkbox-small"
              :class="{ 'forward-checkbox-checked': selectedIds.includes(item.id) }"
            >
              <span v-if="selectedIds.includes(item.id)" class="forward-checkbox-icon">✓</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签栏 -->
      <div class="forward-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="forward-tab-item"
          :class="{ 'forward-tab-active': currentTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>

      <!-- 列表 -->
      <div ref="forwardListRef" class="forward-list">
        <!-- 最近会话 -->
        <div v-if="currentTab === 'recent'">
          <div v-if="recentList.length === 0" class="forward-empty">
            {{ t("conversationEmptyText") }}
          </div>
          <div v-else-if="searchText && filteredRecent.length === 0" class="forward-search-empty">
            <img class="forward-search-empty-img" :src="EMPTY_IMG_URL" alt="empty" />
            <div class="forward-search-empty-text">
              {{ t("searchNoResultPrefix") }}<span class="forward-search-empty-keyword">{{ searchText }}</span>{{ t("searchNoResultSuffix") }}
            </div>
          </div>
          <div v-else class="forward-list-section">
            <div
              v-for="item in filteredRecent"
              :key="item.id"
              class="forward-list-item"
              :class="{ 'forward-list-item-selected': multiSelect && selectedIds.includes(item.id) }"
              @click="handleItemClick(item)"
            >
              <div
                v-if="multiSelect"
                class="forward-checkbox"
                :class="{ 'forward-checkbox-checked': selectedIds.includes(item.id) }"
              >
                <span v-if="selectedIds.includes(item.id)" class="forward-checkbox-icon">✓</span>
              </div>
              <Avatar :account="item.id" :avatar="item.avatar" size="40" />
              <div class="forward-item-name">
                <Appellation
                  v-if="item.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P"
                  :account="item.id"
                />
                <template v-else>
                  <span class="forward-item-name-text">{{ item.name }}</span>
                  <span
                    v-if="item.memberCount != null"
                    class="forward-item-count"
                  >({{ item.memberCount }})</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 好友列表 -->
        <div v-if="currentTab === 'friend'">
          <div v-if="friendList.length === 0" class="forward-empty">
            {{ t("noFriendText") }}
          </div>
          <div v-else-if="searchText && filteredFriends.length === 0" class="forward-search-empty">
            <img class="forward-search-empty-img" :src="EMPTY_IMG_URL" alt="empty" />
            <div class="forward-search-empty-text">
              {{ t("searchNoResultPrefix") }}<span class="forward-search-empty-keyword">{{ searchText }}</span>{{ t("searchNoResultSuffix") }}
            </div>
          </div>
          <div v-else class="forward-list-section">
            <div
              v-for="item in filteredFriends"
              :key="item.id"
              class="forward-list-item"
              :class="{ 'forward-list-item-selected': multiSelect && selectedIds.includes(item.id) }"
              @click="handleItemClick(item)"
            >
              <div
                v-if="multiSelect"
                class="forward-checkbox"
                :class="{ 'forward-checkbox-checked': selectedIds.includes(item.id) }"
              >
                <span v-if="selectedIds.includes(item.id)" class="forward-checkbox-icon">✓</span>
              </div>
              <Avatar :account="item.id" size="40" />
              <div class="forward-item-name">
                <Appellation :account="item.id" />
              </div>
            </div>
          </div>
        </div>

        <!-- 群聊列表 -->
        <div v-if="currentTab === 'team'">
          <div v-if="teamList.length === 0" class="forward-empty">
            {{ t("teamEmptyText") }}
          </div>
          <div v-else-if="searchText && filteredTeams.length === 0" class="forward-search-empty">
            <img class="forward-search-empty-img" :src="EMPTY_IMG_URL" alt="empty" />
            <div class="forward-search-empty-text">
              {{ t("searchNoResultPrefix") }}<span class="forward-search-empty-keyword">{{ searchText }}</span>{{ t("searchNoResultSuffix") }}
            </div>
          </div>
          <div v-else class="forward-list-section">
            <div
              v-for="item in filteredTeams"
              :key="item.id"
              class="forward-list-item"
              :class="{ 'forward-list-item-selected': multiSelect && selectedIds.includes(item.id) }"
              @click="handleItemClick(item)"
            >
              <div
                v-if="multiSelect"
                class="forward-checkbox"
                :class="{ 'forward-checkbox-checked': selectedIds.includes(item.id) }"
              >
                <span v-if="selectedIds.includes(item.id)" class="forward-checkbox-icon">✓</span>
              </div>
              <Avatar :account="item.id" :avatar="item.avatar" size="40" />
              <div class="forward-item-name">
                <span class="forward-item-name-text">{{ item.name }}</span>
                <span
                  v-if="item.memberCount != null"
                  class="forward-item-count"
                >({{ item.memberCount }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenModal>

  <!-- 已选详情弹窗 -->
  <FullScreenModal
    :visible="showSelectedModal"
    :title="`${t('selectedText')}(${selectedAvatars.length})`"
    @back="showSelectedModal = false"
  >
    <template #left>
      <button class="forward-cancel-btn" type="button" @click="showSelectedModal = false">
        {{ t("cancelText") }}
      </button>
    </template>
    <div class="forward-selected-detail-list">
      <div
        v-for="item in selectedAvatars"
        :key="item.id"
        class="forward-selected-detail-item"
      >
        <Avatar :account="item.id" :avatar="item.avatar" size="40" />
        <div class="forward-selected-detail-name">
          <Appellation
            v-if="item.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P"
            :account="item.id"
          />
          <span v-else>{{ item.name }}</span>
          <span
            v-if="item.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM"
            class="forward-selected-detail-count"
          >({{ store?.teamStore?.teams?.get(item.id)?.memberCount || 0 }})</span>
        </div>
        <span
          class="forward-selected-detail-remove"
          @click="
            (e) => {
              e.stopPropagation()
              const next = selectedIds.filter((id: string) => id !== item.id)
              selectedIds = next
            }
          "
        >✕</span>
      </div>
    </div>
  </FullScreenModal>

  <ForwardModal
    :forward-modal-visible="forwardModalVisible"
    :forward-to="forwardTo"
    :forward-msg="forwardMsg"
    :source-conversation-id="conversationId"
    :forward-conversation-type="forwardConversationType"
    :forward-to-team-info="forwardToTeamInfo"
    :is-one-by-one-forward="forwardMode === 'oneByOne' || (!!msgs?.length && forwardMode !== 'merged')"
    :forward-mode="forwardMode"
    :forward-targets="forwardTargets"
    @confirm="handleForwardConfirm"
    @cancel="handleForwardCancel"
  />
</template>

<script lang="ts" setup>
import { ref, computed, watch, getCurrentInstance } from "vue";
import FullScreenModal from "../../CommonComponents/FullScreenModal.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Appellation from "../../CommonComponents/Appellation.vue";
import { t } from "../../utils/i18n";
import { autorun } from "mobx";
import { onUnmounted } from "vue";
import ForwardModal from "./message-forward-modal.vue";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { toast } from "../../utils/toast";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/src/types";
import { sendMergedForwardMessage } from "./merged-forward/utils";
import { friendGroupByPy } from "../../utils/friend";

const RECENT_FORWARDS_KEY = "nim_recent_forwards_v2";
const MAX_RECENT_FORWARDS = 5;
const EMPTY_IMG_URL = "https://yx-web-nosdn.netease.im/common/e0f58096f06c18cdd101f2614e6afb09/empty.png";

interface RecentForwardItem {
  id: string;
  type: "p2p" | "team";
  name: string;
}

interface ForwardTarget {
  id: string;
  type: number;
  name: string;
  avatar?: string;
  accountId?: string;
  memberCount?: number;
}

function getRecentForwards(accountId?: string): RecentForwardItem[] {
  try {
    const key = accountId ? `${RECENT_FORWARDS_KEY}_${accountId}` : RECENT_FORWARDS_KEY
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function addRecentForward(item: RecentForwardItem, accountId?: string) {
  const list = getRecentForwards(accountId).filter((f) => f.id !== item.id);
  list.unshift(item);
  if (list.length > MAX_RECENT_FORWARDS) list.pop();
  const key = accountId ? `${RECENT_FORWARDS_KEY}_${accountId}` : RECENT_FORWARDS_KEY
  localStorage.setItem(key, JSON.stringify(list));
}

const props = defineProps<{
  modelValue: boolean;
  msgIdClient: string;
  conversationId?: string;
  msg?: V2NIMMessageForUI;
  msgs?: V2NIMMessageForUI[];
  forwardMode?: "normal" | "oneByOne" | "merged";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "forward", targetId: string, type: "friend" | "team"): void;
  (e: "cancel"): void;
  (e: "confirm", targetId: string, type: "friend" | "team"): void;
  (e: "close"): void;
  (e: "forwardSuccess"): void;
}>();

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const myAccountId = computed(() => store?.userStore.myUserInfo?.accountId || '');

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const conversationId = computed(
  () => props.conversationId || store?.uiStore.selectedConversation
);

// 搜索和标签状态
const searchText = ref("");
const currentTab = ref<"recent" | "friend" | "team">("recent");
const multiSelect = ref(false);
const selectedIds = ref<string[]>([]);

// 转发确认弹窗
const forwardModalVisible = ref(false);
const forwardTo = ref("");
const forwardMsg = ref<any>();
const forwardConversationType = ref<V2NIMConst.V2NIMConversationType>(
  V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
);
const forwardToTeamInfo = ref<any>();

// 多选目标列表（用户在多选模式下选了目标后，弹出二次确认时使用）
const forwardTargets = ref<ForwardTarget[]>([]);

// 已选详情弹窗
const showSelectedModal = ref(false);

// 最近会话数据：通过 API 主动拉取，存到 ref 中
const conversationList = ref<any[]>([]);

// 最近转发数据源：localStorage 不是响应式的，必须先落到 ref 上，
// 否则 computed 求值一次后就一直用缓存（原因见 syncRecentForwards 的注释）
const recentForwardRaw = ref<RecentForwardItem[]>([]);

// 重读最近转发（localStorage → ref）
// 单条转发的选择器实例是常驻的：它挂在每个 message-bubble 上随消息列表一起创建，
// 不随开关销毁，而 localStorage 的变化不会让 computed 失效，所以必须在每次打开时主动重读一次；
// 多选转发的实例是 v-if 按需挂载的，所以会出现“多选能看到、单条转发看不到”的差异
// （react 两个入口都是按需挂载，不存在这个问题）
const syncRecentForwards = () => {
  recentForwardRaw.value = getRecentForwards(myAccountId.value);
};

// 好友列表（过滤黑名单，按拼音排序，与通讯录顺序一致）
const friendList = ref<ForwardTarget[]>([]);
const friendListWatch = autorun(() => {
  const data = store?.uiStore.friends
    .filter((item: { accountId: string }) => !store?.relationStore.blacklist.includes(item.accountId))
    .map((item: { accountId: string }) => ({
      id: item.accountId,
      type: V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P as number,
      name: store?.uiStore.getAppellation({ account: item.accountId }) || "",
      accountId: item.accountId,
    }));
  if (data?.length) {
    friendList.value = friendGroupByPy(data, { firstKey: 'name' }, false).flatMap(g => g.data) as ForwardTarget[];
  }
});

// 群聊列表
const teamList = ref<ForwardTarget[]>([]);
const teamListWatch = autorun(() => {
  if (store?.uiStore.teamList) {
    teamList.value = store.uiStore.teamList.map((team: any) => ({
      id: team.teamId,
      type: V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM as number,
      name: team.name || "",
      avatar: team.avatar,
      memberCount: team.memberCount,
    }));
  }
});

// 最近会话列表：用 parseConversationTargetId 解析出 targetId 作为 id，后续转发/头像/名称都基于此
const recentList = computed(() => {
  return conversationList.value.map((conv: any) => {
    const targetId = nim?.V2NIMConversationIdUtil.parseConversationTargetId(conv.conversationId);
    const isTeam = conv.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM;
    return {
      id: targetId,
      type: conv.type as number,
      name: conv.name || "",
      avatar: conv.avatar,
      memberCount: isTeam ? store?.teamStore?.teams?.get(targetId)?.memberCount : undefined,
    };
  });
});

// 最近转发：数据来自 localStorage（recentForwardRaw），用 API 拉取到的 conversationList 匹配并补充名称
const recentForwards = computed(() => {
  const rawList = recentForwardRaw.value;
  return rawList.map((rf) => {
    const conv = conversationList.value.find((c: any) =>
      nim?.V2NIMConversationIdUtil.parseConversationTargetId(c.conversationId) === rf.id
    );
    return {
      id: rf.id,
      type: conv?.type != null
        ? (conv.type as number)
        : rf.type === "team"
          ? V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
          : (V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P as number),
      // 名称优先用最近会话列表里的（可能已被改名），本地存的只是兜底
      name: conv?.name || rf.name || "",
      avatar: conv?.avatar,
    };
  });
});

// 过滤后的列表
const filteredFriends = computed(() => {
  if (!searchText.value) return friendList.value;
  const kw = searchText.value.toLowerCase();
  return friendList.value.filter((f) => f.name?.toLowerCase().includes(kw));
});

const filteredTeams = computed(() => {
  if (!searchText.value) return teamList.value;
  const kw = searchText.value.toLowerCase();
  return teamList.value.filter((t) => t.name?.toLowerCase().includes(kw));
});

const filteredRecent = computed(() => {
  if (!searchText.value) return recentList.value;
  const kw = searchText.value.toLowerCase();
  return recentList.value.filter((r) => r.name?.toLowerCase().includes(kw));
});

// 监听 visible 变化，重置状态 & 主动加载会话列表（对齐 Android getConversationList）
// 根据配置选择云端或本地会话接口
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      searchText.value = "";
      currentTab.value = "recent";
      multiSelect.value = false;
      selectedIds.value = [];
      // 每次打开都重读最近转发，保证任何入口进来都能看到最新的最近转发列表
      syncRecentForwards();
      const loaderPromise = store?.sdkOptions?.enableV2CloudConversation
        ? store?.conversationStore?.getConversationListActive(0, 100)
        : store?.localConversationStore?.getConversationListActive?.(0, 100);
      if (loaderPromise) {
        loaderPromise.then((res: any) => {
          conversationList.value = res?.conversationList || [];
        });
      }
    }
  },
  { immediate: true }
);

const tabs = computed(() => [
  { key: "recent" as const, label: t("recentSessionText") },
  { key: "friend" as const, label: t("myFriendText") },
  { key: "team" as const, label: t("teamChooseText") },
]);

const forwardListRef = ref<HTMLElement | null>(null);

const switchTab = (tab: "recent" | "friend" | "team") => {
  currentTab.value = tab;
  forwardListRef.value?.scrollTo(0, 0);
};

const toggleMultiSelect = () => {
  multiSelect.value = !multiSelect.value;
  if (!multiSelect.value) {
    selectedIds.value = [];
  }
};

const handleItemClick = (item: ForwardTarget) => {
  if (multiSelect.value) {
    const next = [...selectedIds.value];
    const idx = next.indexOf(item.id);
    if (idx !== -1) {
      next.splice(idx, 1);
    } else {
      if (selectedIds.value.length >= 9) {
        toast.info(t("forwardMultiSelectLimitText"));
        return;
      }
      next.push(item.id);
    }
    selectedIds.value = next;
    return;
  }

  forwardTo.value = item.id;
  forwardConversationType.value = item.type as V2NIMConst.V2NIMConversationType;

  forwardMsg.value =
    props.msgs?.[0] ||
    props.msg ||
    store?.msgStore.getMsg(conversationId.value, [props.msgIdClient])?.[0];

  forwardModalVisible.value = true;

  if (item.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
    forwardToTeamInfo.value = store?.teamStore.teams.get(item.id);
  }
};

const handleForwardConfirm = (forwardComment: string) => {
  forwardModalVisible.value = false;

  const msgsToSend = props.msgs?.length
    ? props.msgs
    : forwardMsg.value
      ? [forwardMsg.value]
      : [];

  if (!msgsToSend.length) {
    toast.info(t("getForwardMessageFailed"));
    return;
  }

  if (!store || !conversationId.value) {
    toast.info(t("getForwardMessageFailed"));
    return;
  }

  // 多选模式：发送给多个目标
  if (forwardTargets.value.length > 0) {
    const targets = forwardTargets.value;
    const sendPromises = targets.map((target) => {
      const forwardConvId = nim.V2NIMConversationIdUtil[
        target.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
          ? "p2pConversationId"
          : "teamConversationId"
      ](target.id);

      if (props.forwardMode === "merged") {
        return sendMergedForwardMessage({
          store,
          nim,
          msgs: msgsToSend,
          conversationId: forwardConvId,
          sourceConversationId: conversationId.value,
          appVersion: "H5",
          chatHistoryText: t("chatHistoryText"),
          comment: forwardComment,
        });
      }
      return Promise.all(
        msgsToSend.map((msg: any) => store?.msgStore.forwardMsgActive(msg, forwardConvId)).concat(
          forwardComment
            ? [store?.msgStore.sendMessageActive({ msg: nim.V2NIMMessageCreator.createTextMessage(forwardComment), conversationId: forwardConvId })]
            : []
        )
      );
    });

    Promise.all(sendPromises)
      .then(() => {
        toast.info(t("forwardSuccessText"));
        emit("forwardSuccess");
        // 不主动滚到底部：转发到当前会话时，新消息由 message-list 的贴底跟随处理（用户在底部附近才贴底），
        // 这样查看历史消息时能保住原位置、只做新消息提示。react 侧同样不在这里滚动。
      })
      .catch(() => {
        toast.info(t("forwardFailedText"));
      })
      .finally(() => {
        // “最近转发”记录的是用户选过的转发目标，与发送成功与否无关：
        // 只写在成功分支里的话，转发失败（如会话被禁言）后再进选择器就找不到这个会话了
        targets.forEach((target) => {
          addRecentForward({
            id: target.id,
            type:
              target.type ===
              V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
                ? "p2p"
                : "team",
            name: target.name,
          }, myAccountId.value);
        });
        syncRecentForwards();
        forwardTargets.value = [];
        handleClose();
      });
    return;
  }

  // 单选模式
  const forwardConversationId = nim.V2NIMConversationIdUtil[
    forwardConversationType.value ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ? "p2pConversationId"
      : "teamConversationId"
  ](forwardTo.value);

  const forwardPromise =
    props.forwardMode === "merged"
      ? sendMergedForwardMessage({
          store,
          nim,
          msgs: msgsToSend,
          conversationId: forwardConversationId,
          sourceConversationId: conversationId.value,
          appVersion: "H5",
          chatHistoryText: t("chatHistoryText"),
          comment: forwardComment,
        })
      : Promise.all(
          msgsToSend.map((msg) =>
            store?.msgStore.forwardMsgActive(msg, forwardConversationId)
          ).concat(
            forwardComment
              ? [store?.msgStore.sendMessageActive({ msg: nim.V2NIMMessageCreator.createTextMessage(forwardComment), conversationId: forwardConversationId })]
              : []
          )
        );

  const isP2pTarget =
    forwardConversationType.value ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P;

  Promise.resolve(forwardPromise)
    .then(() => {
      toast.info(t("forwardSuccessText"));
      emit("forwardSuccess");
      // 不主动滚到底部：转发到当前会话时，新消息由 message-list 的贴底跟随处理（用户在底部附近才贴底），
      // 这样查看历史消息时能保住原位置、只做新消息提示。react 侧同样不在这里滚动。
    })
    .catch(() => {
      toast.info(t("forwardFailedText"));
    })
    .finally(() => {
      // “最近转发”记录的是用户选过的转发目标，与发送成功与否无关：
      // 只写在成功分支里的话，转发失败（如会话被禁言）后再进选择器就找不到这个会话了。
      // 名称一起存下来：群聊按名称展示，目标不在最近会话列表里时不能是空名字
      addRecentForward(
        {
          id: forwardTo.value,
          type: isP2pTarget ? "p2p" : "team",
          name: isP2pTarget
            ? store?.uiStore.getAppellation({ account: forwardTo.value }) || ""
            : store?.teamStore.teams.get(forwardTo.value)?.name || "",
        },
        myAccountId.value
      );
      syncRecentForwards();
      handleClose();
    });
};

const handleForwardCancel = () => {
  forwardModalVisible.value = false;
};

const handleClose = () => {
  emit("close");
};

// 多选已选头像列表（跨 tab 收集，按选择顺序排列）
const selectedAvatars = computed(() => {
  if (!multiSelect.value || selectedIds.value.length === 0) return [];
  const result: ForwardTarget[] = [];
  const allTargets = [...recentList.value, ...friendList.value, ...teamList.value];
  const targetMap = new Map(allTargets.map(t => [t.id, t]));
  selectedIds.value.forEach((id) => {
    const target = targetMap.get(id);
    if (target) result.push(target);
  });
  return result;
});

// 多选：从所有 tab 收集已选目标，弹出二次确认框
const handleMultiSend = () => {
  if (selectedIds.value.length === 0) return;

  // 从所有 tab 收集已选目标，按选择顺序排列
  const allTargets = [...recentList.value, ...friendList.value, ...teamList.value];
  const targetMap = new Map(allTargets.map(t => [t.id, t]));
  const seen = new Set<string>();
  const targets: ForwardTarget[] = [];
  selectedIds.value.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      const target = targetMap.get(id);
      if (target) targets.push(target);
    }
  });

  if (!targets.length) return;

  // 确保消息已获取
  const msg =
    props.msgs?.[0] ||
    props.msg ||
    store?.msgStore.getMsg(conversationId.value, [props.msgIdClient])?.[0];
  if (msg) {
    forwardMsg.value = msg;
  }

  forwardTargets.value = targets;
  forwardModalVisible.value = true;
};

onUnmounted(() => {
  friendListWatch();
  teamListWatch();
});
</script>

<style scoped>
.forward-fullscreen-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.forward-search-wrapper {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #fff;
}

.forward-search-box {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  background: #f5f6f8;
  border-radius: 18px;
  box-sizing: border-box;
}

.forward-search-icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  opacity: 0.5;
}

.forward-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333;
}

.forward-search-input::placeholder {
  color: #b3b7bc;
}

.forward-search-clear {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ccc;
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.forward-recent-bar {
  flex: 0 0 auto;
  padding: 12px 0 4px 16px;
  border-bottom: 4px solid #edf0f3;
}

.forward-recent-label {
  font-size: 12px;
  color: #b3b7bc;
  margin-bottom: 8px;
}

.forward-recent-scroll {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.forward-recent-scroll::-webkit-scrollbar {
  display: none;
}

.forward-recent-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  cursor: pointer;
  min-width: 52px;
}

/* 多选：最近转发用小号复选框 */
.forward-checkbox-small {
  width: 16px;
  height: 16px;
  margin-right: 0;
  margin-bottom: 2px;
}

.forward-recent-item-selected {
  opacity: 0.7;
}

.forward-recent-name {
  margin-top: 4px;
  font-size: 16px;
  color: rgb(0, 0, 0);
  max-width: 52px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.forward-tabs {
  flex: 0 0 auto;
  display: flex;
  border-bottom: 1px solid #edf0f3;
  background: #fff;
}

.forward-tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #656a72;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.forward-tab-active {
  color: #337eff;
  font-weight: 500;
}

.forward-tab-active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 1px;
  background-color: #337eff;
}

.forward-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.forward-list-section {
  padding: 8px 0;
}

.forward-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.forward-list-item:active {
  background-color: #f5f6f8;
}

.forward-list-item-selected {
  background-color: #ecf2fe;
}

.forward-item-name {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #1f2329;
}

.forward-item-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.forward-item-count {
  flex-shrink: 0;
  font-size: 13px;
  color: #b3b7bc;
  margin-left: 2px;
}

.forward-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #cdd1d6;
  border-radius: 50%;
  margin-right: 12px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s;
}

.forward-checkbox-checked {
  border-color: #337eff;
  background-color: #337eff;
}

.forward-checkbox-icon {
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.forward-empty {
  padding: 60px 0;
  text-align: center;
  color: #b3b7bc;
  font-size: 14px;
}

/* 搜索无结果 */
.forward-search-empty {
  padding: 75px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.forward-search-empty-img {
  width: 125px;
  height: 100px;
  display: block;
}

.forward-search-empty-text {
  margin-top: 10px;
  font-size: 14px;
  color: #a6adb6;
}

.forward-search-empty-keyword {
  color: #337eff;
}

/* 多选已选头像展示区 */
.forward-selected-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #edf0f3;
  background: #fff;
  cursor: pointer;
}

.forward-selected-bar:active {
  background-color: #f5f6f8;
}

.forward-selected-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
}

.forward-selected-scroll::-webkit-scrollbar {
  display: none;
}

.forward-selected-arrow {
  flex: 0 0 auto;
  margin-left: 8px;
  font-size: 20px;
  color: #b3b7bc;
  line-height: 1;
}

/* 已选详情弹窗 */
.forward-selected-detail-list {
  padding: 8px 0;
}

.forward-selected-detail-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.forward-selected-detail-name {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: #1f2329;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.forward-selected-detail-count {
  font-size: 13px;
  color: #b3b7bc;
  margin-left: 4px;
}

.forward-selected-detail-remove {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e8eaed;
  color: #656a72;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 12px;
}

.forward-selected-detail-remove:active {
  background: #cdd1d6;
}

.forward-multi-send-btn {
  border: none;
  background: transparent;
  color: #337eff;
  font-size: 14px;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
}

.forward-multi-send-btn:disabled {
  color: #b3cff7;
  cursor: not-allowed;
}

.forward-multi-select-btn {
  border: none;
  background: transparent;
  color: #337eff;
  font-size: 14px;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
}

.forward-cancel-btn {
  border: none;
  background: transparent;
  color: #1f2329;
  font-size: 14px;
  padding: 4px 0;
  cursor: pointer;
  white-space: nowrap;
}

</style>
