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
          <UIKitSwitch
            :checked="!!conversation?.stickTop"
            :disabled="stickTopPending"
            @change="changeStickTopInfo"
          />
        </div>
        <div class="team-set-item team-set-item-flex">
          <div>{{ t("sessionMuteText") }}</div>
          <UIKitSwitch
            :checked="
              team &&
              teamMuteMode !==
                V2NIMConst.V2NIMTeamMessageMuteMode
                  .V2NIM_TEAM_MESSAGE_MUTE_MODE_ON
            "
            :disabled="teamMutePending"
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
          <UIKitSwitch
            :checked="
              team &&
              team.chatBannedMode !==
                V2NIMConst.V2NIMTeamChatBannedMode
                  .V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN
            "
            :disabled="teamBannedPending"
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

<script>
import NavBar from "../../CommonComponents/NavBar.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { autorun } from "../../utils/store.js";
import { t } from "../../utils/i18n";
import { V2NIMConst } from "../../utils/sdk";
import UIKitSwitch from "../../CommonComponents/Switch.vue";
import { toast } from "../../utils/toast";
import { modal } from "../../utils/modal";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeamMembers } from "../../utils/team.js";

export default {
  name: "TeamSetting",
  components: {
    NavBar,
    Avatar,
    Icon,
    UIKitSwitch,
  },
  data() {
    return {
      teamId: "",
      teamMembers: [],
      conversation: null,
      team: null,
      teamMuteMode: null,
      stickTopPending: false,
      teamMutePending: false,
      teamBannedPending: false,
      uninstallTeamWatch: null,
      uninstallSessionsWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    enableV2CloudConversation() {
      return this.store?.sdkOptions?.enableV2CloudConversation;
    },
    isTeamOwner() {
      const myUser = this.store.userStore.myUserInfo;
      return (
        (this.team ? this.team.ownerAccountId : "") ===
        (myUser ? myUser.accountId : "")
      );
    },
    isTeamManager() {
      const myUser = this.store.userStore.myUserInfo;
      return this.teamMembers
        .filter(
          (item) =>
            item.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
        )
        .some((member) => member.accountId === (myUser ? myUser.accountId : ""));
    },
    canAddMember() {
      if (
        this.team?.inviteMode ===
        V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL
      ) {
        return true;
      }
      return this.isTeamOwner || this.isTeamManager;
    },
  },
  mounted() {
    this.teamId = this.$route.query.teamId || "";
    if (!this.teamId) {
      return;
    }
    const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(
      this.teamId
    );

    this.store.teamStore
      .getTeamMessageMuteModeActive(this.teamId, 1)
      .then((res) => {
        this.teamMuteMode = res;
      })
      .catch(() => {
        toast.info(t("networkError"));
      });

    this.uninstallTeamWatch = autorun(() => {
      if (this.teamId) {
        this.team = this.store.teamStore.teams.get(this.teamId);
        this.teamMembers = this.store.teamMemberStore.getTeamMember(this.teamId);
        ensureTeamMembers(this.store, this.teamId, this.team).catch(() => {
          toast.info(t("networkError"));
        });
      }
    });
    this.uninstallSessionsWatch = autorun(() => {
      this.conversation = this.enableV2CloudConversation
        ? this.store.conversationStore?.conversations.get(conversationId)
        : this.store.localConversationStore?.conversations.get(conversationId);
    });
  },
  beforeDestroy() {
    if (this.uninstallTeamWatch) {
      this.uninstallTeamWatch();
    }
    if (this.uninstallSessionsWatch) {
      this.uninstallSessionsWatch();
    }
  },
  methods: {
    handleInfoClick() {
      this.$router.push({
        path: neUiKitRouterPath.teamInfoEdit,
        query: {
          teamId: this.teamId,
        },
      });
    },
    goNickInTeam() {
      this.$router.push({
        path: neUiKitRouterPath.teamNick,
        query: {
          teamId: this.teamId,
        },
      });
    },
    addTeamMember() {
      this.$router.push({
        path: neUiKitRouterPath.teamAdd,
        query: {
          teamId: this.teamId,
        },
      });
    },
    gotoTeamMember() {
      this.$router.push({
        path: neUiKitRouterPath.teamMember,
        query: {
          teamId: this.teamId,
        },
      });
    },
    showDismissConfirm() {
      modal.confirm({
        title: t("dismissTeamText"),
        content: t("dismissTeamConfirmText"),
        onConfirm: () => {
          this.store.teamStore
            .dismissTeamActive(this.teamId)
            .then(() => {
              toast.info(t("dismissTeamSuccessText"));
              this.$router.push({
                path: neUiKitRouterPath.conversation,
              });
            })
            .catch(() => {
              toast.info(t("dismissTeamFailedText"));
            });
        },
      });
    },
    showLeaveConfirm() {
      modal.confirm({
        title: t("leaveTeamTitle"),
        content: t("leaveTeamConfirmText"),
        onConfirm: () => {
          this.store.teamStore
            .leaveTeamActive(this.teamId)
            .then(() => {
              toast.info(t("leaveTeamSuccessText"));
              this.$router.push({
                path: neUiKitRouterPath.conversation,
              });
            })
            .catch(() => {
              toast.info(t("leaveTeamFailedText"));
            });
        },
      });
    },
    async changeStickTopInfo(value) {
      if (this.stickTopPending) {
        return;
      }
      this.stickTopPending = true;
      const checked = value;
      const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(
        this.teamId
      );
      try {
        if (this.enableV2CloudConversation) {
          await this.store.conversationStore?.stickTopConversationActive(
            conversationId,
            checked
          );
        } else {
          await this.store.localConversationStore?.stickTopConversationActive(
            conversationId,
            checked
          );
        }
      } catch (error) {
        toast.info(
          checked ? t("addStickTopFailText") : t("deleteStickTopFailText")
        );
      } finally {
        this.stickTopPending = false;
      }
    },
    async changeTeamMute(value) {
      if (this.teamMutePending) {
        return;
      }
      this.teamMutePending = true;
      const checked = value;

      try {
        await this.store.teamStore.setTeamMessageMuteModeActive(
          this.teamId,
          V2NIMConst.V2NIMTeamType.V2NIM_TEAM_TYPE_ADVANCED,
          checked
            ? V2NIMConst.V2NIMTeamMessageMuteMode
                .V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF
            : V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON
        );
        this.teamMuteMode = checked
          ? V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF
          : V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON;
      } catch (error) {
        if (error?.code === 109432) {
          toast.info(t("noPermission"));
        } else {
          toast.info(
            checked ? t("sessionMuteFailText") : t("sessionUnMuteFailText")
          );
        }
      } finally {
        this.teamMutePending = false;
      }
    },
    async setTeamChatBanned(value) {
      if (this.teamBannedPending) {
        return;
      }
      this.teamBannedPending = true;
      const checked = value;
      try {
        await this.store.teamStore.setTeamChatBannedActive({
          teamId: this.teamId,
          chatBannedMode: checked
            ? V2NIMConst.V2NIMTeamChatBannedMode
                .V2NIM_TEAM_CHAT_BANNED_MODE_BANNED_NORMAL
            : V2NIMConst.V2NIMTeamChatBannedMode
                .V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN,
        });
      } catch (error) {
        switch (error?.code) {
          case 109432:
            toast.info(t("noPermission"));
            break;
          default:
            toast.info(
              checked ? t("muteAllTeamFailedText") : t("sessionUnMuteFailText")
            );
            break;
        }
      } finally {
        this.teamBannedPending = false;
      }
    },
  },
};
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
