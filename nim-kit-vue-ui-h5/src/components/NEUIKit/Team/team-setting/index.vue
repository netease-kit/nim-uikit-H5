<template>
  <div class="team-set-container-wrapper">
    <NavBar :title="t('setText')" />
    <div class="team-set-container" v-if="team">
      <div class="team-set-card">
        <div class="team-set-item">
          <div class="team-info-item" @click="handleInfoClick">
            <Avatar
              :account="team && team.teamId"
              :avatar="team && team.avatar"
            />
            <div class="team-info-title team-title">
              {{ team && team.name }}
            </div>
            <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
          </div>
        </div>
        <div class="team-set-item">
          <div class="team-members-item">
            <div class="team-members-info-item" @click="gotoTeamMember">
              <div class="team-members-info">
                <div class="team-info-title">{{ t("teamMemberText") }}</div>
                <div class="team-info-subtitle">
                  {{ team && team.memberCount }}
                </div>
              </div>
              <Icon
                iconClassName="more-icon"
                color="#999"
                type="icon-jiantou"
              />
            </div>
            <div class="member-list">
              <div v-if="canAddMember" class="member-add">
                <div @click="addTeamMember" :style="{ display: 'flex' }">
                  <Icon type="icon-tianjiaanniu" />
                </div>
              </div>
              <div
                class="member-item"
                v-for="member in teamMembers"
                :key="member.accountId"
              >
                <Avatar
                  :account="member.accountId"
                  size="32"
                  :key="member.accountId"
                  font-size="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="team-set-card">
        <div class="team-set-item team-set-item-flex">
          <div>{{ t("stickTopText") }}</div>
          <Switch
            :checked="!!conversation?.stickTop"
            @change="changeStickTopInfo"
          />
        </div>
        <div class="team-set-item team-set-item-flex">
          <div>{{ t("sessionMuteText") }}</div>
          <Switch
            :checked="
              team &&
              teamMuteMode !==
                V2NIMConst.V2NIMTeamMessageMuteMode
                  .V2NIM_TEAM_MESSAGE_MUTE_MODE_ON
            "
            @change="changeTeamMute"
          />
        </div>
        <div class="team-set-item team-set-item-flex" @click="goNickInTeam">
          <div>{{ t("nickInTeam") }}</div>
          <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
        </div>
      </div>
      <div class="team-set-card" v-if="isTeamOwner || isTeamManager">
        <div class="team-set-item team-set-item-flex">
          <div>{{ t("teamBannedText") }}</div>
          <Switch
            :checked="
              team &&
              team.chatBannedMode !==
                V2NIMConst.V2NIMTeamChatBannedMode
                  .V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN
            "
            @change="setTeamChatBanned"
          />
        </div>
      </div>
      <div
        class="team-set-button"
        v-if="isTeamOwner"
        @click="showDismissConfirm"
      >
        {{ t("dismissTeamText") }}
      </div>
      <div class="team-set-button" v-else @click="showLeaveConfirm">
        {{ t("leaveTeamTitle") }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavBar from "../../CommonComponents/NavBar.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { ref, computed, onUnmounted, getCurrentInstance } from "vue";
import { autorun } from "mobx";
import { t } from "../../utils/i18n";

import type {
  V2NIMTeam,
  V2NIMTeamMember,
} from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import type {
  V2NIMConversationForUI,
  V2NIMLocalConversationForUI,
} from "@xkit-yx/im-store-v2/dist/types/types";
import { useRouter } from "vue-router";
import RootStore from "@xkit-yx/im-store-v2";
import { onMounted } from "vue";
import Switch from "../../CommonComponents/Switch.vue";
import { toast } from "../../utils/toast";
import { modal } from "../../utils/modal";
import { neUiKitRouterPath } from "../../utils/uikitRouter";

const router = useRouter();
const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;
const nim = proxy?.$NIM;
let teamId = "";
const teamMembers = ref<V2NIMTeamMember[]>([]);
const conversation = ref<
  V2NIMConversationForUI | V2NIMLocalConversationForUI
>();
const team = ref<V2NIMTeam>();
const teamMuteMode = ref<V2NIMConst.V2NIMTeamMessageMuteMode>();

/**是否是云端会话 */
const enableV2CloudConversation = store?.sdkOptions?.enableV2CloudConversation;

const isTeamOwner = computed(() => {
  const myUser = store.userStore.myUserInfo;
  return (
    (team.value ? team.value.ownerAccountId : "") ===
    (myUser ? myUser.accountId : "")
  );
});

const isTeamManager = computed(() => {
  const myUser = store.userStore.myUserInfo;
  return teamMembers.value
    .filter(
      (item) =>
        //@ts-ignore
        item.memberRole ===
        V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
    )
    .some((member) => member.accountId === (myUser ? myUser.accountId : ""));
});

const canAddMember = computed(() => {
  if (
    //@ts-ignore
    team.value?.inviteMode ===
    V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL
  ) {
    return true;
  }
  return isTeamOwner.value || isTeamManager.value;
});

const handleInfoClick = () => {
  router.push({
    path: neUiKitRouterPath.teamInfoEdit,
    query: {
      teamId,
    },
  });
};

const goNickInTeam = () => {
  router.push({
    path: neUiKitRouterPath.teamNick,
    query: {
      teamId,
    },
  });
};

const addTeamMember = () => {
  router.push({
    path: neUiKitRouterPath.teamAdd,
    query: {
      teamId,
    },
  });
};

const gotoTeamMember = () => {
  router.push({
    path: neUiKitRouterPath.teamMember,
    query: {
      teamId,
    },
  });
};

const showDismissConfirm = () => {
  modal.confirm({
    title: t("dismissTeamText"),
    content: t("dismissTeamConfirmText"),
    onConfirm: () => {
      store.teamStore
        .dismissTeamActive(teamId)
        .then(() => {
          toast.info(t("dismissTeamSuccessText"));
          router.push({
            path: neUiKitRouterPath.conversation,
          });
        })
        .catch(() => {
          toast.info(t("dismissTeamFailedText"));
        });
    },
  });
};

const showLeaveConfirm = () => {
  modal.confirm({
    title: t("leaveTeamTitle"),
    content: t("leaveTeamConfirmText"),
    onConfirm: () => {
      store.teamStore
        .leaveTeamActive(teamId)
        .then(() => {
          toast.info(t("leaveTeamSuccessText"));
          router.push({
            path: neUiKitRouterPath.conversation,
          });
        })
        .catch(() => {
          toast.info(t("leaveTeamFailedText"));
        });
    },
  });
};
let uninstallTeamWatch = () => {};
let uninstallSessionsWatch = () => {};

onMounted(() => {
  teamId = (router.currentRoute.value.query.teamId as string) || "";

  const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(teamId);

  // 查询当前群是否开启免打扰
  store.teamStore
    .getTeamMessageMuteModeActive(teamId, 1)
    .then((res: V2NIMConst.V2NIMTeamMessageMuteMode) => {
      teamMuteMode.value = res;
    });

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

const changeStickTopInfo = async (value) => {
  const checked = value;
  const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(teamId);
  try {
    if (enableV2CloudConversation) {
      await store.conversationStore?.stickTopConversationActive(
        conversationId,
        checked
      );
    } else {
      await store.localConversationStore?.stickTopConversationActive(
        conversationId,
        checked
      );
    }
  } catch (error) {
    toast.info(
      checked ? t("addStickTopFailText") : t("deleteStickTopFailText")
    );
  }
};

const changeTeamMute = (value) => {
  const checked = value;

  store.teamStore
    .setTeamMessageMuteModeActive(
      teamId,
      V2NIMConst.V2NIMTeamType.V2NIM_TEAM_TYPE_ADVANCED,
      checked
        ? V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF
        : V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON
    )
    .then(() => {
      teamMuteMode.value = checked
        ? V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF
        : V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON;
    })
    .catch((error: any) => {
      switch (error?.code) {
        // 无权限
        case 109432:
          toast.info(t("noPermission"));
          break;
        default:
          toast.info(
            checked ? t("sessionMuteFailText") : t("sessionUnMuteFailText")
          );
          break;
      }
    });
};

const setTeamChatBanned = async (value) => {
  const checked = value;
  try {
    await store.teamStore.setTeamChatBannedActive({
      teamId,
      chatBannedMode: checked
        ? V2NIMConst.V2NIMTeamChatBannedMode
            .V2NIM_TEAM_CHAT_BANNED_MODE_BANNED_NORMAL
        : V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN,
    });
  } catch (error: any) {
    switch (error?.code) {
      // 无权限
      case 109432:
        toast.info(t("noPermission"));
        break;
      default:
        toast.info(
          checked ? t("muteAllTeamFailedText") : t("sessionUnMuteFailText")
        );
        break;
    }
  }
};

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

.team-title {
  margin-left: 10px;
}

.team-set-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 0 16px;
  margin-bottom: 10px;
  color: #000;
}

.team-set-button {
  text-align: center;
  background: #ffffff;
  border-radius: 8px;
  color: #e6605c;
  height: 40px;
  line-height: 40px;
}

.team-set-item:not(:last-child) {
  border-bottom: 1px solid #f5f8fc;
}

.team-set-item-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.more-icon {
  color: #999999;
}

.team-info-item {
  height: 70px;
  display: flex;
  align-items: center;
}
.team-info-title {
  font-size: 16px;
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
}
.team-info-subtitle {
  color: #999999;
  margin-right: 10px;
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
</style>
