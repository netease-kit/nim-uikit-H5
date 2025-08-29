<template>
  <div class="team-set-container-wrapper">
    <NavBar :title="t('teamInfoText')" />
    <div class="team-set-container" v-if="team">
      <div class="team-set-card">
        <div class="team-set-item-flex" @click="handleAvatarClick">
          <div>{{ t("teamAvatar") }}</div>
          <div class="team-set-item-flex">
            <Avatar
              :account="team && team.teamId"
              :avatar="team && team.avatar"
            />
            <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
          </div>
        </div>
        <div class="team-set-item-flex" @click="handleTitleClick">
          <div class="team-set-item-team-name">{{ t("teamTitle") }}</div>
          <div class="team-set-item-right">
            <span class="team-set-item-name">{{ team.name }}</span>
            <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
          </div>
        </div>
        <div class="team-set-item-flex" @click="handleIntroClick">
          <div class="team-set-item-team-intro">{{ t("teamIntro") }}</div>
          <div class="team-set-item-right">
            <span class="team-set-item-name">{{ team.intro }}</span>
            <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavBar from "../../CommonComponents/NavBar.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { ref, onUnmounted, getCurrentInstance, onMounted } from "vue";
import { autorun } from "mobx";
import { t } from "../../utils/i18n";
import { useRouter } from "vue-router";
import type {
  V2NIMTeam,
  V2NIMTeamMember,
} from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import type {
  V2NIMConversationForUI,
  V2NIMLocalConversationForUI,
} from "@xkit-yx/im-store-v2/dist/types/types";
import RootStore from "@xkit-yx/im-store-v2";
import { neUiKitRouterPath } from "../../utils/uikitRouter";

const router = useRouter();
let teamId = "";
const team = ref<V2NIMTeam>();
const teamMembers = ref<V2NIMTeamMember[]>([]);
const conversation = ref<
  V2NIMConversationForUI | V2NIMLocalConversationForUI
>();

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;
const nim = proxy?.$NIM;
/**是否是云端会话 */
const enableV2CloudConversation = store?.sdkOptions?.enableV2CloudConversation;

const handleAvatarClick = () => {
  router.push({
    path: neUiKitRouterPath.teamAvatarEdit,
    query: {
      teamId,
    },
  });
};

const handleTitleClick = () => {
  router.push({
    path: neUiKitRouterPath.teamIntroduceEdit,
    query: {
      teamId,
      type: "name",
    },
  });
};

const handleIntroClick = () => {
  router.push({
    path: neUiKitRouterPath.teamIntroduceEdit,
    query: {
      teamId,
      type: "intro",
    },
  });
};

let uninstallTeamWatch = () => {};
let uninstallSessionsWatch = () => {};

onMounted(() => {
  teamId = (router.currentRoute.value.query.teamId as string) || "";

  const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(teamId);
  uninstallTeamWatch = autorun(() => {
    if (teamId) {
      team.value = store.teamStore.teams.get(teamId);
      teamMembers.value = store.teamMemberStore.getTeamMember(teamId);
    }
  });

  uninstallSessionsWatch = autorun(() => {
    conversation.value = enableV2CloudConversation
      ? store.conversationStore?.conversations.get(conversationId)
      : store.localConversationStore?.conversations.get(conversationId);
  });
});

onUnmounted(() => {
  uninstallTeamWatch();
  uninstallSessionsWatch();
});
</script>

<style scoped>
.team-set-container-wrapper {
  height: 100vh;
  box-sizing: border-box;
  background-color: #eff1f4;
}
.team-set-container {
  height: 100%;
  box-sizing: border-box;
  background-color: #eff1f4;
  padding: 10px 20px;
}

.team-set-card {
  background: #ffffff;
  border-radius: 8px;
  padding-left: 16px;
  margin-bottom: 10px;
}

.team-set-button {
  text-align: center;
  background: #ffffff;
  border-radius: 8px;
  color: #e6605c;
  height: 40px;
  line-height: 40px;
}

.team-set-item-right {
  display: flex;
  align-items: center;
}

.team-set-item:not(:last-child) {
  border-bottom: 1px solid #f5f8fc;
}

.team-set-item-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  color: #000;
}

.more-icon {
  margin: 0 16px;
  color: #999999;
}

.team-info-item {
  height: 70px;
  display: flex;
  align-items: center;
}
.team-info-title {
  font-size: 16px;
  margin-left: 10px;
  width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-members-item {
  height: 90px;
}

.team-members-info-item {
  display: flex;
  align-items: center;
}

.team-members-info {
  height: 40px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;

  .team-info-subtitle {
    color: #999999;
  }
}

.member-list {
  white-space: nowrap;
  overflow-x: hidden;
  margin-right: 30px;
  height: 50px;
  display: flex;
  align-items: center;
}

.team-set-item-name {
  text-align: right;
  width: 200px;
  height: 36px;
  line-height: 36px;
  color: #999999;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-add {
  width: 32px;
  height: 32px;
  border-radius: 100%;
  border: 1px dashed #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.member-item {
  margin-right: 10px;
  display: inline-block;
  flex-shrink: 0;
}

.team-set-item-team-name {
  max-width: 100px;
  box-sizing: border-box;
  margin-right: 10px;
  white-space: nowrap;
}

.team-set-item-team-intro {
  max-width: 120px;
}
</style>
