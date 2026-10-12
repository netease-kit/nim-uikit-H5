<template>
  <div class="wrapper">
    <NavBar :title="t(key)">
      <template v-slot:right>
        <div
          class="nav-bar-text"
          :class="{ disabled: savePending }"
          :aria-disabled="savePending"
          @click="onUserInfoConfirm"
        >
          {{ t("okText") }}
        </div>
      </template>
    </NavBar>
    <div class="userInfo-item-wrapper">
      <Input
        :maxlength="maxlengthMap[key]"
        @input="onInputChange"
        @focus="onInputFocus"
        :modelValue="inputValue"
      />
      <div @click="clearInputValue">
        <Icon
          v-show="showClearIcon"
          iconClassName="clear-icon"
          type="icon-shandiao"
        ></Icon>
      </div>
    </div>
  </div>
</template>

<script>
import { autorun } from "../utils/store.js";
import Icon from "../CommonComponents/Icon.vue";
import NavBar from "../CommonComponents/NavBar.vue";
import { t } from "../utils/i18n";
import Input from "../CommonComponents/Input.vue";
import { showToast } from "../utils/toast";
import { nim, uiKitStore } from "../utils/init.js";

export default {
  components: {
    Icon,
    NavBar,
    Input,
  },
  data() {
    return {
      key: "",
      inputValue: "",
      inputDirty: false,
      savePending: false,
      showClearIcon: false,
      myUserInfo: null,
      maxlengthMap: {
        name: 15,
        mobile: 11,
        sign: 50,
        email: 30,
      },
      uninstallMyUserInfoWatch: null,
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
    this.key = this.$route.query.key || "";
    this.uninstallMyUserInfoWatch = autorun(() => {
      this.myUserInfo = this.store?.userStore.myUserInfo || null;

      if (this.key && this.myUserInfo && !this.inputDirty) {
        const value = this.myUserInfo?.[this.key];
        this.inputValue = value == null ? "" : String(value);
        if (this.key === "name" && !value) {
          this.inputValue = this.myUserInfo?.accountId;
        }
      }
    });
  },
  beforeDestroy() {
    if (this.uninstallMyUserInfoWatch) {
      this.uninstallMyUserInfoWatch();
    }
  },
  methods: {
    onInputChange(event) {
      this.inputDirty = true;
      this.inputValue = event.target.value;
    },
    onInputFocus() {
      this.showClearIcon = true;
    },
    clearInputValue() {
      this.inputDirty = true;
      this.inputValue = "";
    },
    async onUserInfoConfirm() {
      if (this.savePending) {
        return;
      }
      const value =
        this.inputValue == null ? "" : String(this.inputValue);
      if (
        this.key === "mobile" &&
        !/^\d+$/.test(value) &&
        value.trim() !== ""
      ) {
        showToast({
          message: t("telErrorText"),
          type: "info",
        });
        return;
      }
      if (
        this.key === "email" &&
        !/^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*@[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$/.test(value) &&
        value.trim() !== ""
      ) {
        showToast({
          message: t("emailErrorText"),
          type: "info",
        });
        return;
      }

      this.inputValue = value;
      if (this.key) {
        this.savePending = true;
        try {
          await this.store.userStore.updateSelfUserProfileActive({
            ...this.myUserInfo,
            [this.key]: value,
          });
          this.$router.back();
        } catch (error) {
          showToast({
            message: t("saveText") + t(this.key || "") + t("failText"),
            type: "info",
          });
        } finally {
          this.savePending = false;
        }
      }
    },
  },
};
</script>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: rgb(245, 246, 247);
  background-color: rgb(245, 246, 247);
}

.userInfo-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  margin: 15px;
  border-radius: 5px;
}
.nav-bar-text {
  color: rgb(20, 146, 209);
}

.nav-bar-text.disabled {
  color: #a6adb6;
  pointer-events: none;
}
.input {
  display: inline-block;
  width: 85%;
  padding: 6px;
}

.clear-icon {
  margin-right: 5px;
  z-index: 999;
}
</style>
