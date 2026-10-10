<template>
  <div class="mention-member-list-wrapper">
    <div class="member-list-content">
      <div style="display: none">{{ teamExt }}</div>
      <div
        v-if="allowAtAll"
        class="member-item"
        @click="
          () =>
            handleItemClick({
              accountId: AT_ALL_ACCOUNT,
              appellation: t('teamAll'),
            })
        "
      >
        <Icon :size="36" type="icon-team2" color="#fff" />
        <span class="member-name">
          {{ t("teamAll") }}
        </span>
      </div>
      <div
        class="member-item"
        v-for="member in teamMembersWithoutSelf"
        :key="member.accountId"
        @click="() => handleItemClick(member)"
      >
        <Avatar :account="member.accountId" size="36" />
        <div class="member-name">
          <Appellation
            :account="member.accountId"
            :teamId="member.teamId"
          ></Appellation>
        </div>
        <div
          v-if="
            member.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER
          "
          class="owner"
        >
          {{ t("teamOwner") }}
        </div>
        <div
          v-else-if="
            member.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
          "
          class="manager"
        >
          {{ t("teamManager") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**@ 列表组件，用于在群里@ 成员列表 */
import { t } from "../../utils/i18n";
import { autorun } from "../../utils/store.js";
import Avatar from "../../CommonComponents/Avatar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { ALLOW_AT, AT_ALL_ACCOUNT } from "../../utils/constants";
import Appellation from "../../CommonComponents/Appellation.vue";

import { V2NIMConst } from "../../utils/sdk";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Avatar,
    Icon,
    Appellation,
  },
  props: {
    teamId: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      team: null,
      teamMembers: [],
      teamExt: "",
      teamMemberWatch: null,
      t,
      ALLOW_AT,
      AT_ALL_ACCOUNT,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    teamMembersWithoutSelf() {
      return this.teamMembers.filter(
        (item) => item.accountId !== this.store?.userStore.myUserInfo.accountId
      );
    },
    isGroupOwner() {
      const myUser = this.store?.userStore.myUserInfo;
      return (
        (this.team ? this.team.ownerAccountId : "") ===
        (myUser ? myUser.accountId : "")
      );
    },
    isGroupManager() {
      const myUser = this.store?.userStore.myUserInfo;
      return this.teamMembers
        .filter(
          (item) =>
            item.memberRole ===
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
        )
        .some((member) => member.accountId === (myUser ? myUser.accountId : ""));
    },
    allowAtAll() {
      let ext = {};
      try {
        ext = JSON.parse(this.teamExt || "{}");
      } catch (error) {
        //
      }
      if (ext[ALLOW_AT] === "manager") {
        return this.isGroupOwner || this.isGroupManager;
      }
      return true;
    },
  },
  mounted() {
    this.teamMemberWatch = autorun(() => {
      if (this.teamId) {
        this.teamMembers = this.sortGroupMembers(
          this.store?.teamMemberStore.getTeamMember(this.teamId) || []
        );
        const team = this.store?.teamStore.teams.get(this.teamId);
        if (team) {
          this.team = team;
          this.teamExt = team.serverExtension || "";
        }
      }
    });
  },
  beforeDestroy() {
    if (this.teamMemberWatch) {
      this.teamMemberWatch();
    }
  },
  methods: {
    sortGroupMembers(members) {
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
      return [...owner, ...manager, ...other].map((item) => {
        return {
          ...item,
          name: this.store?.uiStore.getAppellation({
            account: item.accountId,
            teamId: this.teamId,
          }),
        };
      });
    },
    handleItemClick(member) {
      const selectedMember =
        member.accountId === AT_ALL_ACCOUNT
          ? member
          : {
              accountId: member.accountId,
              appellation: this.store?.uiStore.getAppellation({
                account: member.accountId,
                teamId: member.teamId,
                ignoreAlias: true,
              }),
            };

      this.$emit("handleMemberClick", selectedMember);
    },
  },
};
</script>

<style scoped>
.mention-member-list-wrapper {
  z-index: 9999999;
  touch-action: none;
  max-height: 400px;
  overflow-y: auto;
}

.title {
  text-align: center;
  font-weight: 500;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  height: 60px;
}

.close {
  transform: rotate(90deg);
  margin-left: 15px;
}

.member-list-content {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 4px;
  cursor: pointer;
  font-size: 16px;
}

.member-name {
  margin-left: 10px;
  font-size: 16px;
  padding-right: 20px;
  color: #000000;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-item-icon {
  height: 42px;
  width: 42px;
  border-radius: 50%;
  text-align: center;
  line-height: 39px;
  font-size: 20px;
  color: #fff;
  background-color: #53c3f4;
}

.owner,
.manager {
  color: rgb(6, 155, 235);
  background-color: rgb(210, 229, 246);
  height: 24px;
  line-height: 24px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  padding: 2px 4px;
  position: relative;
  right: 10px;
}
</style>
