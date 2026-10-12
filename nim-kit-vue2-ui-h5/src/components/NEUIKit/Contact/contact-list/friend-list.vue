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

<script>
/** 好友列表组件 */
import Avatar from "../../CommonComponents/Avatar.vue";
import { autorun } from "../../utils/store.js";
import { friendGroupByPy } from "../../utils/friend";
import Empty from "../../CommonComponents/Empty.vue";

import { t } from "../../utils/i18n";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Avatar,
    Empty,
  },
  data() {
    return {
      friendGroupList: [],
      friendListWatch: null,
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
    this.friendListWatch = autorun(() => {
      const data =
        this.store?.uiStore.friends
          .filter(
            (item) =>
              !this.store?.relationStore.blacklist.includes(item.accountId)
          )
          .map((item) => ({
            accountId: item.accountId,
            appellation: this.store?.uiStore.getAppellation({
              account: item.accountId,
            }),
          })) || [];

      this.friendGroupList = friendGroupByPy(
        data,
        {
          firstKey: "appellation",
        },
        false
      );
    });
  },
  beforeDestroy() {
    if (this.friendListWatch) {
      this.friendListWatch();
    }
  },
  methods: {
    handleFriendItemClick(friend) {
      this.$router.push({
        path: neUiKitRouterPath.friendCard,
        query: {
          accountId: friend.accountId,
        },
      });
    },
  },
};
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
