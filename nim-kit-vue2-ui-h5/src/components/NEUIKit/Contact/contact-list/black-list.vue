<template>
  <div class="black-list-container">
    <NavBar :title="t('blacklistText')" />
    <div class="black-list-content">
      <div class="black-list-subtitle">{{ t("blacklistSubTitle") }}</div>
      <Empty v-if="blacklist.length === 0" :text="t('blacklistEmptyText')" />
      <div v-else class="black-item" v-for="item in blacklist" :key="item">
        <div class="item-left">
          <Avatar :account="item" :gotoUserCard="true" />
          <Appellation class="black-name" :account="item" />
        </div>
        <div class="black-button" @click="() => handleClick(item)">
          {{ t("removeBlacklist") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/** 通讯录 黑名单列表组件 */
import { autorun } from "../../utils/store.js";
import Empty from "../../CommonComponents/Empty.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Appellation from "../../CommonComponents/Appellation.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import { toast } from "../../utils/toast";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Empty,
    Avatar,
    Appellation,
    NavBar,
  },
  data() {
    return {
      blacklist: [],
      users: null,
      blacklistWatch: null,
      usersWatch: null,
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
    this.blacklistWatch = autorun(() => {
      this.blacklist = this.store?.relationStore.blacklist || [];
    });
    this.usersWatch = autorun(() => {
      this.users = this.store?.userStore.users;
    });
  },
  beforeDestroy() {
    if (this.blacklistWatch) {
      this.blacklistWatch();
    }
    if (this.usersWatch) {
      this.usersWatch();
    }
  },
  methods: {
    async handleClick(account) {
      try {
        await this.store?.relationStore.removeUserFromBlockListActive(account);
        toast.info(t("removeBlackSuccessText"));
      } catch (error) {
        toast.info(t("removeBlackFailText"));
      }
    },
  },
};
</script>

<style scoped>
.black-list-container {
  height: 100vh;
  box-sizing: border-box;
  background-color: #fff;
  overflow-y: auto;
}

.black-list-subtitle {
  color: #b3b7bc;
  font-size: 14px;
  padding: 10px 20px;
  text-align: center;
}

.black-list-content {
  height: calc(100% - 60px - var(--status-bar-height));
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.black-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.item-left {
  display: flex;
  align-items: center;
  width: 70%;
}

.black-name {
  margin-left: 10px;
  font-size: 16px;
  padding-right: 20px;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.black-button {
  margin: 0;
  width: 60px;
  height: 32px;
  line-height: 32px;
  font-size: 14px;
  color: #337eef;
  border: 1px solid #337eef;
  text-align: center;
  border-radius: 3px;
}
</style>
