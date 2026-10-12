<template>
  <div class="wrapper">
    <NavBar :title="t('setText')" />
    <div class="setting-item-wrapper">
      <div class="setting-item">
        <div class="item-left">{{ t("enableV2CloudConversationText") }}</div>
        <div class="item-right">
        <UIKitSwitch
            :checked="enableV2CloudConversation"
            @change="onChangeEnableV2CloudConversation"
          />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-left">{{ t("SwitchToEnglishText") }}</div>
        <div class="item-right">
        <UIKitSwitch
            :checked="switchToEnglishFlag"
            @change="onChangeSwitchToEnglishFlag"
          />
        </div>
      </div>
    </div>
    <div class="logout-btn" @click="handleLogout">{{ t("logoutText") }}</div>
  </div>
</template>

<script>
import NavBar from "../CommonComponents/NavBar.vue";
import UIKitSwitch from "../CommonComponents/Switch.vue";
import { t } from "../utils/i18n";
import { showToast } from "../utils/toast";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { showModal } from "../utils/modal";
import {
  clearKickedOfflineHandler,
  nim,
  uiKitStore,
} from "../utils/init.js";

export default {
  name: "UserSetting",
  components: {
    NavBar,
    UIKitSwitch,
  },
  data() {
    return {
      enableV2CloudConversation: false,
      switchToEnglishFlag: false,
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
    const storedCloudConv = localStorage.getItem("enableV2CloudConversation");
    const storedLanguage = localStorage.getItem("switchToEnglishFlag");
    this.enableV2CloudConversation = storedCloudConv === "on";
    this.switchToEnglishFlag = storedLanguage === "en";
  },
  methods: {
    onChangeEnableV2CloudConversation(value) {
      this.enableV2CloudConversation = value;
      localStorage.setItem("enableV2CloudConversation", value ? "on" : "off");
      showToast({
        message: "切换后刷新页面生效",
        type: "info",
      });
    },
    onChangeSwitchToEnglishFlag(value) {
      this.switchToEnglishFlag = value;
      localStorage.setItem("switchToEnglishFlag", value ? "en" : "zh");
      showToast({
        message: "切换后刷新页面生效",
        type: "info",
      });
    },
    handleLogout() {
      showModal({
        content: t("logoutConfirmText"),
        title: t("tipText"),
        onCancel: () => {},
        onConfirm: async () => {
          try {
            if (nim?.V2NIMLoginService?.logout) {
              await nim.V2NIMLoginService.logout();
            }
          } finally {
            clearKickedOfflineHandler();
            localStorage.removeItem("__yx_im_options__h5");
            this.store?.destroy();
            this.$router.push(neUiKitRouterPath.login);
          }
        },
      });
    },
  },
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
