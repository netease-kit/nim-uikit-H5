<template>
  <div class="p2p-set-container-wrapper">
    <NavBar :title="t('setText')" />
    <div class="p2p-set-container">
      <div class="p2p-set-card">
        <div class="p2p-set-item">
          <div class="p2p-set-my-info">
            <Avatar :account="account" />
            <div class="p2p-set-my-nick">{{ myNick }}</div>
          </div>
          <div class="member-add" @click="addTeamMember">
            <Icon type="icon-tianjiaanniu" />
          </div>
        </div>
      </div>
      <div class="p2p-set-card">
        <div class="p2p-set-item p2p-set-item-flex-sb">
          <div>{{ t("sessionMuteText") }}</div>
          <Switch :checked="!isMute" @change="changeSessionMute" />
        </div>
        <div class="p2p-set-item p2p-set-item-flex-sb">
          <div>{{ t("stickTopText") }}</div>
          <Switch :checked="isStickTop" @change="changeStickTopInfo" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**单聊设置组件 */

import NavBar from "../CommonComponents/NavBar.vue";
import Avatar from "../CommonComponents/Avatar.vue";
import Icon from "../CommonComponents/Icon.vue";

import { onUnmounted, ref, getCurrentInstance } from "vue";
import { autorun } from "mobx";
import { t } from "../utils/i18n";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import RootStore from "@xkit-yx/im-store-v2";
import { onMounted } from "vue";
import { toast } from "../utils/toast";
import { useRouter } from "vue-router";
import Switch from "../CommonComponents/Switch.vue";
import { neUiKitRouterPath } from "../utils/uikitRouter";

const router = useRouter();
const myNick = ref("");
const conversation = ref();
const isMute = ref(false);
const isStickTop = ref(false);
const account = ref("");
const conversationId = ref("");

let p2pSetWatch: () => void;

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;
const nim = proxy?.$NIM;

/**是否是云端会话 */
const enableV2CloudConversation = store?.sdkOptions?.enableV2CloudConversation;

onMounted(() => {
  const accountId = (router.currentRoute.value.query.accountId as string) || "";

  account.value = accountId;

  const _conversationId =
    nim.V2NIMConversationIdUtil.p2pConversationId(accountId);
  conversationId.value = _conversationId;

  p2pSetWatch = autorun(() => {
    conversation.value = enableV2CloudConversation
      ? store.conversationStore?.conversations.get(_conversationId)
      : store.localConversationStore?.conversations.get(_conversationId);

    myNick.value = store.uiStore.getAppellation({
      account: accountId,
    });

    isMute.value = store.relationStore.mutes.includes(accountId);

    isStickTop.value = !!conversation.value?.stickTop;
  });
});

/**添加群成员 */
const addTeamMember = () => {
  const to = nim.V2NIMConversationIdUtil.parseConversationTargetId(
    conversationId.value
  );
  router.push({
    path: neUiKitRouterPath.teamCreate,
    query: {
      p2pConversationId: to,
    },
  });
};

/**修改会话免打扰 */
const changeSessionMute = async (value) => {
  try {
    await store.relationStore.setP2PMessageMuteModeActive(
      account.value,
      !value
        ? V2NIMConst.V2NIMP2PMessageMuteMode.V2NIM_P2P_MESSAGE_MUTE_MODE_ON
        : V2NIMConst.V2NIMP2PMessageMuteMode.V2NIM_P2P_MESSAGE_MUTE_MODE_OFF
    );
  } catch (error) {
    toast.info(!value ? t("sessionMuteFailText") : t("sessionUnMuteFailText"));
  }
};

/**修改置顶 */
const changeStickTopInfo = async (value) => {
  const checked = value;
  try {
    if (enableV2CloudConversation) {
      await store.conversationStore?.stickTopConversationActive(
        conversationId.value,
        checked
      );
    } else {
      await store.localConversationStore?.stickTopConversationActive(
        conversationId.value,
        checked
      );
    }
  } catch (error) {
    toast.info(
      checked ? t("addStickTopFailText") : t("deleteStickTopFailText")
    );
  }
};

onUnmounted(() => {
  p2pSetWatch();
});
</script>

<style scoped>
.p2p-set-container-wrapper {
  height: 100vh;
  background-color: #fff;
}
.p2p-set-container {
  height: 100%;
  box-sizing: border-box;
  background-color: #eff1f4;
  padding: 10px 20px;
}

.p2p-set-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 0 8px 0 10px;
  margin-bottom: 10px;
}

.p2p-set-button {
  text-align: center;
  background: #ffffff;
  border-radius: 8px;
  color: #e6605c;
  height: 40px;
  line-height: 40px;
}

.p2p-set-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 10px 0;
  color: #000;
}

.p2p-set-item:not(:last-child) {
  border-bottom: 1px solid #f5f8fc;
}

.p2p-set-item-flex-sb {
  justify-content: space-between;
}

.p2p-set-my-info {
  margin-right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.p2p-set-my-nick {
  margin-top: 5px;
  color: #000;
  font-size: 12px;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-icon {
  margin: 0 16px;
  color: #999999;
}

.p2p-info-item {
  height: 70px;
  display: flex;
  align-items: center;
}

.p2p-info-title {
  font-size: 16px;
  margin-left: 10px;
  width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.p2p-members-item {
  height: 90px;
}

.p2p-members-info-item {
  display: flex;
  align-items: center;
}

.p2p-members-info {
  height: 40px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.p2p-info-subtitle {
  color: #999999;
}

.member-list {
  white-space: nowrap;
  overflow-x: hidden;
  margin-right: 30px;
  height: 50px;
  display: flex;
  align-items: center;
}

.member-add {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  border: 1px dashed #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-item {
  margin-right: 10px;
  display: inline-block;
  flex-shrink: 0;
}
</style>
