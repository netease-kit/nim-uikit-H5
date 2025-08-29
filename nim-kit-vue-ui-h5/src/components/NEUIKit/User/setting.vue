<template>
  <div class="wrapper">
    <NavBar :title="t('setText')" />
    <div class="setting-item-wrapper">
      <div class="setting-item">
        <div class="item-left">{{ t("enableV2CloudConversationText") }}</div>
        <div class="item-right">
          <Switch
            :checked="enableV2CloudConversation"
            @change="onChangeEnableV2CloudConversation"
          />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-left">{{ t("SwitchToEnglishText") }}</div>
        <div class="item-right">
          <Switch
            :checked="switchToEnglishFlag"
            @change="onChangeSwitchToEnglishFlag"
          />
        </div>
      </div>
    </div>
    <div class="logout-btn" @click="handleLogout">{{ t("logoutText") }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, getCurrentInstance } from "vue";
import NavBar from "../CommonComponents/NavBar.vue";
import Switch from "../CommonComponents/Switch.vue";
import { t } from "../utils/i18n";
import { showToast } from "../utils/toast";
import { useRouter } from "vue-router";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { showModal } from "../utils/modal";

const router = useRouter();
const enableV2CloudConversation = ref(false);
const switchToEnglishFlag = ref(false);
const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;

onMounted(() => {
  const storedCloudConv = localStorage.getItem("enableV2CloudConversation");
  const storedLanguage = localStorage.getItem("switchToEnglishFlag");
  enableV2CloudConversation.value = storedCloudConv === "on";
  switchToEnglishFlag.value = storedLanguage === "en";
});

const onChangeEnableV2CloudConversation = (value) => {
  enableV2CloudConversation.value = value;
  localStorage.setItem("enableV2CloudConversation", value ? "on" : "off");
  showToast({
    message: "切换后刷新页面生效",
    type: "info",
  });
};

const onChangeSwitchToEnglishFlag = (value) => {
  switchToEnglishFlag.value = value;
  localStorage.setItem("switchToEnglishFlag", value ? "en" : "zh");
  showToast({
    message: "切换后刷新页面生效",
    type: "info",
  });
};

const handleLogout = () => {
  showModal({
    content: t("logoutConfirmText"),
    title: t("tipText"),
    onCancel: () => {},
    onConfirm: () => {
      localStorage.removeItem("__yx_im_options__h5");
      store?.destroy();
      router.push(neUiKitRouterPath.login);
    },
  });
};
</script>

<style scoped>
.wrapper {
  background-color: rgb(245, 246, 247);
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
}

.setting-item-wrapper {
  margin: 12px;
  background: #fff;
  border-radius: 8px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  color: #000;
}

.item-left {
  font-size: 16px;
}

.box-shadow {
  height: 1px;
  background-color: #ebedf0;
  margin: 0 16px;
}

.logout-btn {
  margin: 12px;
  background-color: #fff;
  border-radius: 8px;
  height: 48px;
  line-height: 48px;
  text-align: center;
  color: #f56c6c;
  font-size: 16px;
}
</style>
