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

<script lang="ts" setup>
/** 群列表组件 */
import { autorun } from "mobx";
import { onUnmounted, ref, getCurrentInstance } from "vue";
import Empty from "../../CommonComponents/Empty.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import type { V2NIMTeam } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import { useRouter } from "vue-router";
import RootStore from "@xkit-yx/im-store-v2";
import { neUiKitRouterPath } from "../../utils/uikitRouter";

const teamList = ref<V2NIMTeam[]>([]);

const router = useRouter();

const { proxy } = getCurrentInstance()!;

const store = proxy?.$UIKitStore as RootStore;
const nim = proxy?.$NIM;

const handleClick = async (team: V2NIMTeam) => {
  await store?.uiStore.selectConversation(
    nim.V2NIMConversationIdUtil.teamConversationId(team.teamId)
  );
  router.push(neUiKitRouterPath.chat);
};

/** 群列表监听 */
const teamListWatch = autorun(() => {
  teamList.value = store?.uiStore.teamList;
});

onUnmounted(() => {
  teamListWatch();
});
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
