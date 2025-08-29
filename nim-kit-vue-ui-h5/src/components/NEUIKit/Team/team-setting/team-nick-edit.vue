<template>
  <div class="wrapper">
    <NavBar :title="t('nickInTeam')">
      <template v-slot:left>
        <div class="nav-bar-text" @click="back">{{ t("cancelText") }}</div>
      </template>
      <template v-slot:right>
        <div @click="onOk">
          {{ t("okText") }}
        </div>
      </template>
    </NavBar>
    <div class="userInfo-item-wrapper">
      <Input
        class="input"
        :confirm-type="t('okText')"
        @focus="onInputFocus"
        :maxlength="15"
        @input="onInputChange"
        v-model="inputValue"
        :placeholder="t('nickInTeam')"
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
// 此组件用于修改群昵称
import { autorun } from "mobx";
import { onUnmounted, ref, getCurrentInstance } from "vue";
import Icon from "../../CommonComponents/Icon.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import type { V2NIMTeamMember } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService";
import { onMounted } from "vue";
import RootStore from "@xkit-yx/im-store-v2";
import Input from "../../CommonComponents/Input.vue";
import { useRouter } from "vue-router";
import { toast } from "../../utils/toast";

const router = useRouter();
const inputValue = ref("");
const showClearIcon = ref(false);
const myMemberInfo = ref<V2NIMTeamMember>();
let teamId = "";
let uninstallTeamMemberWatch = () => {};
const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;

onMounted(() => {
  teamId = (router.currentRoute.value.query.teamId as string) || "";
  uninstallTeamMemberWatch = autorun(() => {
    myMemberInfo.value = store?.teamMemberStore.getTeamMember(teamId, [
      store?.userStore.myUserInfo.accountId,
    ])[0];

    inputValue.value = myMemberInfo.value?.teamNick || "";
  });
});

const onInputChange = (value) => {
  inputValue.value = value;
};

const onInputFocus = () => {
  showClearIcon.value = true;
};

const clearInputValue = () => {
  inputValue.value = "";
};

const onOk = () => {
  store?.teamMemberStore
    .updateMyMemberInfoActive({
      teamId,
      memberInfo: {
        teamNick: inputValue.value.trim(),
      },
    })
    .then(() => {
      back();
    })
    .catch(() => {
      toast.info(t("saveFailedText"));
    });
};

const back = () => {
  router.back();
};

onUnmounted(() => {
  uninstallTeamMemberWatch();
});
</script>

<style>
.wrapper {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background-color: rgb(245, 246, 247);
}
.nav-bar-text {
  color: rgb(20, 146, 209);
}

.userInfo-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  margin: 15px;
  border-radius: 5px;
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
