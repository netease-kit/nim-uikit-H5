<template>
  <div class="friend-list-container">
    <div class="friend-group-list">
      <Empty v-if="friendGroupList.length === 0" :text="t('noFriendText')" />
      <div
        class="friend-group-item"
        v-for="friendGroup in friendGroupList"
        :key="friendGroup.key"
      >
        <div class="friend-group-title">
          {{ friendGroup.key }}
        </div>
        <div
          class="friend-item"
          v-for="friend in friendGroup.data"
          :key="friend.accountId"
          @click="handleFriendItemClick(friend)"
        >
          <Avatar :account="friend.accountId" />
          <div class="friend-name">{{ friend.appellation }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** 好友列表组件 */
import Avatar from "../../CommonComponents/Avatar.vue";
import { autorun } from "mobx";
import { onUnmounted, ref, getCurrentInstance } from "vue";
import { friendGroupByPy } from "../../utils/friend";
import Empty from "../../CommonComponents/Empty.vue";

import { t } from "../../utils/i18n";
import type { V2NIMFriend } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMFriendService";
import RootStore from "@xkit-yx/im-store-v2";
import { useRouter } from "vue-router";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
const router = useRouter();
const { proxy } = getCurrentInstance()!;

const store = proxy?.$UIKitStore as RootStore;

type FriendItem = V2NIMFriend & { appellation: string };

const friendGroupList = ref<
  { key: string; data: { accountId: string; appellation: string }[] }[]
>([]);

/** 点击跳转好友名片页 */
function handleFriendItemClick(friend) {
  router.push({
    path: neUiKitRouterPath.friendCard,
    query: {
      accountId: friend.accountId,
    },
  });
}

/** 好友列表监听 */
const friendListWatch = autorun(() => {
  const data = store?.uiStore.friends
    .filter((item) => !store?.relationStore.blacklist.includes(item.accountId))
    .map((item) => ({
      accountId: item.accountId,
      appellation: store?.uiStore.getAppellation({
        account: item.accountId,
      }),
    }));

  friendGroupList.value = friendGroupByPy(
    data,
    {
      firstKey: "appellation",
    },
    false
  );
});

onUnmounted(() => {
  friendListWatch();
});
</script>

<style scoped>
.friend-group-item {
  padding-left: 20px;
}

.friend-group-title {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: #b3b7bc;
  border-bottom: 1px solid #dbe0e8;
}

.friend-item {
  margin-top: 16px;
  display: flex;
  align-items: center;
}
.friend-name {
  margin-left: 12px;
  padding-right: 20px;
  color: #000;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
