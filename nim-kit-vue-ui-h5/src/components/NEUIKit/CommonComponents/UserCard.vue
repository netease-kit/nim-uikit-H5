<template>
  <div class="user-wrapper">
    <div class="avatar-wrapper">
      <Avatar v-if="props.account" size="70" :account="props.account"></Avatar>
    </div>
    <div class="account-wrapper">
      <div v-if="alias">
        <div class="main">{{ alias }}</div>
        <div class="deputy">{{ t("name") }}:{{ nick || account }}</div>
      </div>
      <div v-else class="main">{{ nick || account }}</div>
      <div class="deputy">
        {{ t("accountText") }}:{{ props.account }}
        <div @click="copyAccount">
          <Icon
            class="copy-icon"
            type="icon-fuzhi1"
            color="#A6ADB6"
            :size="20"
          ></Icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Avatar from "./Avatar.vue";
import Icon from "./Icon.vue";
import { onUnmounted, ref, onMounted, getCurrentInstance, watch } from "vue";
import { autorun } from "mobx";
import { t } from "../utils/i18n";
import { showToast } from "../utils/toast";
import { copyText } from "../utils";
const props = withDefaults(
  defineProps<{
    account?: string;
    nick?: string;
  }>(),
  {
    account: "",
    nick: "",
  }
);

const alias = ref<string>();
let uninstallFriendsWatch = () => {};

const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;

onMounted(() => {
  const account = props.account;

  uninstallFriendsWatch = autorun(() => {
    const friend = { ...store?.friendStore.friends.get(account) };

    alias.value = friend ? friend.alias : "";
  });
});

watch(
  () => props.account,
  (newVal, _) => {
    const friend = { ...store?.friendStore.friends.get(newVal) };
    alias.value = friend ? friend.alias : "";
  }
);

onUnmounted(() => {
  uninstallFriendsWatch();
});

const copyAccount = (e) => {
  e.stopPropagation();
  try {
    copyText(props.account);
    showToast({
      message: t("copySuccessText"),
      type: "info",
      duration: 2000,
    });
  } catch (error) {
    showToast({
      message: t("copyFailText"),
      type: "info",
      duration: 2000,
    });
  }
};
</script>

<style scoped>
/* 用户卡片容器 */
.user-wrapper {
  background-color: #fff;
  display: flex;
  height: 140px;
  align-items: center;
}

/* 头像容器 */
.avatar-wrapper {
  margin: 0 15px;
  flex: 0 0 70px;
}

/* 账号信息容器 */
.account-wrapper {
  flex: 1;
  overflow: hidden;
  padding-right: 40px;
  color: #000;
}

/* 主要信息 */
.main {
  font-size: 20px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 500;
}

/* 副标题信息 */
.deputy {
  font-size: 14px;
  display: flex;
  align-items: center;
}

/* 复制图标 */
.copy-icon {
  margin-left: 2px;
}
</style>
