<template>
  <div class="team-list-container">
    <NavBar :title="t('teamMenuText')" />
    <div class="team-list-content">
      <Empty v-if="teamList.length === 0" :text="t('teamEmptyText')" />
      <div
        v-else
        class="team-item"
        v-for="team in teamList"
        :key="team.teamId"
        @click="handleClick(team)"
      >
        <Avatar :account="team.teamId" :avatar="team.avatar" />
        <span class="team-name">{{ team.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
/** 群列表组件 */
import { autorun } from "../../utils/store.js";
import Empty from "../../CommonComponents/Empty.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Empty,
    Avatar,
    NavBar,
  },
  data() {
    return {
      teamList: [],
      teamListWatch: null,
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
    this.teamListWatch = autorun(() => {
      this.teamList = this.store?.uiStore.teamList || [];
    });
  },
  beforeDestroy() {
    if (this.teamListWatch) {
      this.teamListWatch();
    }
  },
  methods: {
    async handleClick(team) {
      await this.store?.uiStore.selectConversation(
        nim.V2NIMConversationIdUtil.teamConversationId(team.teamId)
      );
      this.$router.push(neUiKitRouterPath.chat);
    },
  },
};
</script>

<style scoped>
.team-list-container {
  height: 100vh;
  box-sizing: border-box;
  background-color: #fff;
  overflow-y: auto;
}

.team-list-content {
  height: calc(100% - 60px - var(--status-bar-height));
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.team-item {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.team-name {
  margin-left: 10px;
  font-size: 16px;
  padding-right: 20px;
  color: #000;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
