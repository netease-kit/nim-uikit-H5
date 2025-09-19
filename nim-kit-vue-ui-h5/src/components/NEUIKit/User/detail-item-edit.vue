<template>
  <div class="wrapper">
    <NavBar :title="t(key)">
      <template v-slot:right>
        <div class="nav-bar-text" @click="onUserInfoConfirm">
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

<script lang="ts" setup>
import { autorun } from "mobx";
import { onMounted, onUnmounted, ref, getCurrentInstance } from "vue";
import Icon from "../CommonComponents/Icon.vue";
import NavBar from "../CommonComponents/NavBar.vue";
import { t } from "../utils/i18n";
import type { V2NIMUser } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService";
import RootStore from "@xkit-yx/im-store-v2";
import { useRouter } from "vue-router";
import Input from "../CommonComponents/Input.vue";
import { showToast } from "../utils/toast";

const { proxy } = getCurrentInstance()!;
const router = useRouter();

const store = proxy?.$UIKitStore as RootStore;
const key = ref();
const inputValue = ref("");
const showClearIcon = ref(false);
const myUserInfo = ref<V2NIMUser>();
const maxlengthMap = {
  name: 15,
  mobile: 11,
  sign: 50,
  email: 30,
};

let uninstallMyUserInfoWatch = () => {};

onMounted(() => {
  key.value = (router.currentRoute.value.query.key as string) || "";

  uninstallMyUserInfoWatch = autorun(() => {
    myUserInfo.value = store.userStore.myUserInfo;

    if (key.value) {
      const _value = (myUserInfo.value as V2NIMUser)[key.value];
      inputValue.value = _value as string;
      // 如果昵称没有值，则默认显示账号
      if (key.value === "name" && !_value) {
        inputValue.value = myUserInfo.value?.accountId;
      }
    }
  });
});

const onInputChange = (event) => {
  const value = event.target.value;
  inputValue.value = value;
};

const onInputFocus = () => {
  showClearIcon.value = true;
};

const clearInputValue = () => {
  inputValue.value = "";
};

const onUserInfoConfirm = () => {
  const _value = inputValue.value;
  // 需要修改邮箱的正则，可在此处自定义
  if (
    key.value == "mobile" &&
    !/^\d+(\.\d+)?$/.test(_value) &&
    _value.trim() !== ""
  ) {
    showToast({
      message: t("telErrorText"),
      type: "info",
    });
    return;
  }
  // 需要修改邮箱的正则，可在此处自定义
  if (
    key.value == "email" &&
    !/[a-zA-Z0-9]+([-_.][A-Za-zd]+)*@([a-zA-Z0-9]+[-.])+[A-Za-zd]{2,5}$/.test(
      _value
    ) &&
    _value.trim() !== ""
  ) {
    showToast({
      message: t("emailErrorText"),
      type: "info",
    });
    return;
  }
  inputValue.value = _value;

  if (key.value) {
    store.userStore
      .updateSelfUserProfileActive({ ...myUserInfo.value, [key.value]: _value })
      .then(() => {
        router.back();
      })
      .catch(() => {
        showToast({
          message: t("saveText") + t(key.value || "") + t("failText"),
          type: "info",
        });
      });
  }
};

onUnmounted(() => {
  uninstallMyUserInfoWatch();
});
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
