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
    <Empty v-else :text="t('noTeamMember')" />
  </div>
</template>

<script lang="ts" setup>
import Avatar from "../../CommonComponents/Avatar.vue";
import { ref, computed, onUnmounted, onMounted, getCurrentInstance } from "vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { autorun } from "mobx";
import { t } from "../../utils/i18n";
import Appellation from "../../CommonComponents/Appellation.vue";
import Icon from "../../CommonComponents/Icon.vue";
import Empty from "../../CommonComponents/Empty.vue";
import type {
  V2NIMTeam,
  V2NIMTeamMember,
} from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { useRouter } from "vue-router";
import { showModal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
const router = useRouter();

const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;
const teamMembers = ref<V2NIMTeamMember[]>([]);
const team = ref<V2NIMTeam>();
let teamId = "";

const goAddMember = () => {
  router.push({
    path: neUiKitRouterPath.teamAdd,
    query: {
      teamId,
    },
  });
};

const removeTeamMember = (account: string) => {
  showModal({
    title: t("confirmRemoveText"),
    content: t("removeMemberExplain"),
    confirmText: t("removeText"),
    onConfirm: () => {
      store?.teamMemberStore
        .removeTeamMemberActive({
          teamId,
          accounts: [account],
        })
        .then(() => {
          showToast({
            message: t("removeSuccessText"),
            type: "info",
          });
        })
        .catch((error: any) => {
          switch (error?.code) {
            // 没权限
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
};

const isteamOwner = computed(() => {
  const myUser = store?.userStore.myUserInfo;
  return (
    (team.value ? team.value.ownerAccountId : "") ===
    (myUser ? myUser.accountId : "")
  );
});

const isteamManager = computed(() => {
  const myUser = store?.userStore.myUserInfo;
  return teamMembers.value
    .filter(
      (item) =>
        item.memberRole ===
        V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
    )
    .some((member) => member.accountId === (myUser ? myUser.accountId : ""));
});

const isShowAddBtn = computed(() => {
  if (
    team.value?.inviteMode ===
    V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL
  ) {
    return true;
  }
  return isteamOwner.value || isteamManager.value;
});

const isShowRemoveBtn = (target: V2NIMTeamMember) => {
  if (target.accountId === store?.userStore.myUserInfo.accountId) {
    return false;
  }
  if (isteamOwner.value) {
    return true;
  }
  if (isteamManager.value) {
    return (
      target.memberRole !==
        V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER &&
      target.memberRole !==
        V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
    );
  }
  return false;
};

let uninstallteamMembersWatch = () => {};

onMounted(() => {
  teamId = (router.currentRoute.value.query.teamId as string) || "";

  uninstallteamMembersWatch = autorun(() => {
    team.value = store?.teamStore.teams.get(teamId);

    // 对群成员进行排序，群主在前，管理员在后，其他成员按加入时间排序
    const sortteamMembers = (members: V2NIMTeamMember[]) => {
      const owner = members.filter(
        (item) =>
          item.memberRole ===
          V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER
      );
      const manager = members
        .filter(
          (item) =>
            item.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
        )
        .sort((a, b) => a.joinTime - b.joinTime);
      const other = members
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

    teamMembers.value = sortteamMembers(
      store?.teamMemberStore.getTeamMember(teamId) as V2NIMTeamMember[]
    );
  });
});

onUnmounted(() => {
  uninstallteamMembersWatch();
});
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
