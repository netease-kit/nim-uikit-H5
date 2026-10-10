<template>
  <div class="team-member-container">
    <NavBar :title="t('teamMemberText')" />
    <div v-if="isShowAddBtn" class="add-item" @click="goAddMember">
      <span class="add-item-label">{{ t("addMemberText") }}</span>
      <Icon color="#999" type="icon-jiantou" />
    </div>
    <div v-if="teamMembers.length">
      <div class="team-item" v-for="item in teamMembers" :key="item.accountId">
        <div class="team-member">
          <Avatar
            :goto-user-card="true"
            :account="item.accountId"
            :team-id="item.teamId"
            size="40"
          />
          <Appellation
            class="user-name"
            :account="item.accountId"
            :team-id="item.teamId"
            :font-size="14"
          />
          <div
            v-if="
              item.memberRole ===
              V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER
            "
            class="user-tag"
          >
            {{ t("teamOwner") }}
          </div>
          <div
            v-else-if="
              item.memberRole ===
              V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
            "
            class="user-tag"
          >
            {{ t("manager") }}
          </div>
        </div>
        <div
          v-if="isShowRemoveBtn(item)"
          class="btn-remove"
          @click="
            () => {
              removeTeamMember(item.accountId);
            }
          "
        >
          {{ t("removeText") }}
        </div>
      </div>
    </div>
    <div v-else-if="memberLoading" class="member-loading">
      {{ t("loadingMoreText") }}
    </div>
    <Empty v-else :text="t('noTeamMember')" />
  </div>
</template>

<script>
import Avatar from "../../CommonComponents/Avatar.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { autorun } from "../../utils/store.js";
import { t } from "../../utils/i18n";
import Appellation from "../../CommonComponents/Appellation.vue";
import Icon from "../../CommonComponents/Icon.vue";
import Empty from "../../CommonComponents/Empty.vue";
import { V2NIMConst } from "../../utils/sdk";
import { showModal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeam } from "../../utils/team.js";
export default {
  name: "TeamMember",
  components: {
    Avatar,
    NavBar,
    Appellation,
    Icon,
    Empty,
  },
  data() {
    return {
      teamMembers: [],
      team: null,
      teamId: "",
      memberLoading: false,
      uninstallteamMembersWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    isteamOwner() {
      const myUser = this.store?.userStore.myUserInfo;
      return (
        (this.team ? this.team.ownerAccountId : "") ===
        (myUser ? myUser.accountId : "")
      );
    },
    isteamManager() {
      const myUser = this.store?.userStore.myUserInfo;
      return this.teamMembers
        .filter(
          (item) =>
            item.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
        )
        .some((member) => member.accountId === (myUser ? myUser.accountId : ""));
    },
    isShowAddBtn() {
      if (
        this.team?.inviteMode ===
        V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL
      ) {
        return true;
      }
      return this.isteamOwner || this.isteamManager;
    },
  },
  mounted() {
    this.teamId = this.$route.query.teamId || "";

    this.uninstallteamMembersWatch = autorun(() => {
      this.team = this.store?.teamStore.teams.get(this.teamId);

      const sortteamMembers = (members) => {
        const memberList = members || [];
        const owner = memberList.filter(
          (item) =>
            item.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER
        );
        const manager = memberList
          .filter(
            (item) =>
              item.memberRole ===
              V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
          )
          .sort((a, b) => a.joinTime - b.joinTime);
        const other = memberList
          .filter(
            (item) =>
              ![
                V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER,
                V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER,
              ].includes(item.memberRole)
          )
          .sort((a, b) => a.joinTime - b.joinTime);
        return [...owner, ...manager, ...other];
      };

      this.teamMembers = sortteamMembers(
        this.store?.teamMemberStore.getTeamMember(this.teamId)
      );
    });
    this.loadTeamMembers();
  },
  beforeDestroy() {
    if (this.uninstallteamMembersWatch) {
      this.uninstallteamMembersWatch();
    }
  },
  methods: {
    async loadTeamMembers() {
      if (!this.teamId || this.memberLoading) {
        return;
      }
      this.memberLoading = true;
      try {
        const team = await ensureTeam(this.store, this.teamId);
        if (team) {
          this.team = team;
        }
        await this.store?.teamMemberStore.getTeamMemberActive({
          teamId: this.teamId,
          queryOption: {
            limit: Math.max(this.team?.memberLimit || 0, 200),
            roleQueryType: 0,
          },
        });
      } catch (error) {
        showToast({
          message: t("networkError"),
          type: "info",
        });
      } finally {
        this.memberLoading = false;
      }
    },
    goAddMember() {
      this.$router.push({
        path: neUiKitRouterPath.teamAdd,
        query: {
          teamId: this.teamId,
        },
      });
    },
    removeTeamMember(account) {
      showModal({
        title: t("confirmRemoveText"),
        content: t("removeMemberExplain"),
        confirmText: t("removeText"),
        onConfirm: () => {
          this.store?.teamMemberStore
            .removeTeamMemberActive({
              teamId: this.teamId,
              accounts: [account],
            })
            .then(() => {
              showToast({
                message: t("removeSuccessText"),
                type: "info",
              });
            })
            .catch((error) => {
              switch (error?.code) {
                case 109306:
                  showToast({
                    message: t("noPermission"),
                    type: "info",
                  });
                  break;
                default:
                  showToast({
                    message: t("removeFailText"),
                    type: "info",
                  });
                  break;
              }
            });
        },
      });
    },
    isShowRemoveBtn(target) {
      if (target.accountId === this.store?.userStore.myUserInfo.accountId) {
        return false;
      }
      if (this.isteamOwner) {
        return true;
      }
      if (this.isteamManager) {
        return (
          target.memberRole !==
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER &&
          target.memberRole !==
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
        );
      }
      return false;
    },
  },
};
</script>

<style scoped>
.team-member-container {
  height: 100%;
  background-color: #fff;
  box-sizing: border-box;
  overflow: auto;
}

.add-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #f5f8fc;
}
.add-item-label {
  color: #000;
  font-size: 16px;
}

.member-loading {
  padding: 75px 20px;
  color: #a6adb6;
  font-size: 14px;
  text-align: center;
}

.team-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 20px;
  padding: 8px 0;
}
.user-tag {
  padding: 2px 4px;
  background: #f7f7f7;

  border: 1px solid #d6d8db;
  border-radius: 5px;
  color: #656a72;
  font-size: 12px;
  margin-left: 8px;
  white-space: nowrap;
  word-break: keep-all;
}

.team-member {
  display: flex;
  align-items: center;
  width: 70%;
}

.user-name {
  margin-left: 12px;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove {
  padding: 2px 8px;
  color: #e6605c;
  border-radius: 4px;
  border: 1px solid #e6605c;
  cursor: pointer;
  font-size: 14px;
}
</style>
