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

<script>
import NavBar from "../../CommonComponents/NavBar.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { autorun } from "../../utils/store.js";
import { t } from "../../utils/i18n";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeam } from "../../utils/team.js";

export default {
  components: {
    NavBar,
    Avatar,
    Icon,
  },
  data() {
    return {
      teamId: "",
      team: null,
      teamMembers: [],
      uninstallTeamWatch: null,
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
  },
  mounted() {
    this.teamId = this.$route.query.teamId || "";
    this.uninstallTeamWatch = autorun(() => {
      if (this.teamId) {
        this.team = this.store.teamStore.teams.get(this.teamId);
        this.teamMembers = this.store.teamMemberStore.getTeamMember(this.teamId);
      }
    });
    ensureTeam(this.store, this.teamId).catch(() => {});
  },
  beforeDestroy() {
    if (this.uninstallTeamWatch) {
      this.uninstallTeamWatch();
    }
  },
  methods: {
    handleAvatarClick() {
      this.$router.push({
        path: neUiKitRouterPath.teamAvatarEdit,
        query: {
          teamId: this.teamId,
        },
      });
    },
    handleTitleClick() {
      this.$router.push({
        path: neUiKitRouterPath.teamIntroduceEdit,
        query: {
          teamId: this.teamId,
          type: "name",
        },
      });
    },
    handleIntroClick() {
      this.$router.push({
        path: neUiKitRouterPath.teamIntroduceEdit,
        query: {
          teamId: this.teamId,
          type: "intro",
        },
      });
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
